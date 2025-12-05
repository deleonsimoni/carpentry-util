import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { AuthService } from '@app/shared/services';
import { UserService, UserProfile } from '../../shared/services/user.service';
import { UserRoles } from '../../shared/constants/user-roles.constants';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RegisterEventModalComponent } from './register-event-modal.component';
import { ScheduleReportModalComponent } from './schedule-report-modal.component';
import { ScheduleService } from '@app/shared/services/schedule.service';
import {
  ScheduleEvent,
  ScheduleEventType,
  SCHEDULE_EVENT_TYPE_CONFIG
} from '@app/shared/interfaces/schedule.interface';

interface CalendarEvent {
  id: string;
  title: string;
  type: ScheduleEventType;
  start: string;
  assignedTo: string;
  takeoffIds?: string[];
  originalEvent?: ScheduleEvent;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  status: string;
}

interface WeekDay {
  label: string;
  date: Date;
  display: string;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  activeView: 'week' | 'month' = 'month';
  referenceDate = new Date();
  teamFilter = 'todos';
  typeFilter = 'all';
  today = new Date();
  hasAccess = false;
  teamMembers: TeamMember[] = [];
  teamLoading = false;
  eventsLoading = false;

  weekDays: WeekDay[] = [];
  monthMatrix: WeekDay[][] = [];

  events: CalendarEvent[] = [];
  eventTypes = Object.values(ScheduleEventType);
  typeConfig = SCHEDULE_EVENT_TYPE_CONFIG;
  ScheduleEventType = ScheduleEventType;

  productivitySnapshot = {
    weekEvents: 0,
    pendingEvents: 0,
    nextOpenSlot: '-',
    busiestDay: '-'
  };

  reportDropdownOpen = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private scheduleService: ScheduleService,
    private router: Router,
    public modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.authService
      .getUser()
      .pipe(take(1))
      .subscribe(user => {
        if (!user) {
          this.router.navigate(['/home']);
          return;
        }

        const roles: string[] = user.roles || [];
        const isAdmin = !!user.isAdmin;
        const canAccess =
          isAdmin ||
          roles.includes('manager') ||
          roles.includes('supervisor') ||
          roles.includes('super_admin');

        if (!canAccess) {
          this.router.navigate(['/home']);
          return;
        }

        this.hasAccess = true;
        this.buildWeekDays();
        this.buildMonthMatrix();
        this.loadTeamMembers();
        this.loadEvents();
      });
  }

  openRegisterDialog(date: Date): void {
    const modalRef = this.modalService.open(RegisterEventModalComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });
    modalRef.componentInstance.date = date;

    modalRef.result.then(
      result => {
        if (result) {
          this.handleEventSave(result);
        }
      },
      () => {}
    );
  }

  openEditDialog(event: CalendarEvent): void {
    if (!event.originalEvent) {
      return;
    }

    const modalRef = this.modalService.open(RegisterEventModalComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });
    modalRef.componentInstance.event = event.originalEvent;

    modalRef.result.then(
      result => {
        if (result) {
          if (result.isDelete) {
            this.handleEventDelete(result._id);
          } else {
            this.handleEventSave(result);
          }
        }
      },
      () => {}
    );
  }

  private handleEventSave(eventData: any): void {
    if (eventData.isEditMode && eventData._id) {
      this.scheduleService.updateEvent(eventData._id, eventData)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.loadEvents();
          },
          error: (error) => {
            console.error('Error updating event:', error);
          }
        });
    } else {
      this.scheduleService.createEvent(eventData)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.loadEvents();
          },
          error: (error) => {
            console.error('Error creating event:', error);
          }
        });
    }
  }

  private handleEventDelete(eventId: string): void {
    this.scheduleService.deleteEvent(eventId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.loadEvents();
        },
        error: (error) => {
          console.error('Error deleting event:', error);
        }
      });
  }

  private loadEvents(): void {
    this.eventsLoading = true;
    const startDate = this.getStartOfWeek(this.referenceDate);
    const endDate = this.addDays(startDate, this.activeView === 'week' ? 7 : 42);

    this.scheduleService.getEvents(startDate.toISOString(), endDate.toISOString())
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success && Array.isArray(response.data)) {
            this.events = response.data.map(event => this.mapScheduleEventToCalendarEvent(event));
            this.updateProductivitySnapshot();
          } else {
            this.events = [];
          }
          this.eventsLoading = false;
        },
        error: (error) => {
          console.error('Error loading events:', error);
          this.events = [];
          this.eventsLoading = false;
        }
      });
  }

  private mapScheduleEventToCalendarEvent(event: ScheduleEvent): CalendarEvent {
    return {
      id: event._id || '',
      title: event.title,
      type: event.type,
      start: event.scheduledDate,
      assignedTo: event.assignedToName || '',
      takeoffIds: event.takeoffIds,
      originalEvent: event
    };
  }

  private updateProductivitySnapshot(): void {
    const now = new Date();
    const weekStart = this.getStartOfWeek(now);
    const weekEnd = this.addDays(weekStart, 7);

    const weekEvents = this.events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= weekStart && eventDate < weekEnd;
    });

    this.productivitySnapshot.weekEvents = weekEvents.length;

    this.productivitySnapshot.pendingEvents = this.events.filter(
      event => new Date(event.start) >= now
    ).length;

    const dayCounts: Record<string, number> = {};
    weekEvents.forEach(event => {
      const day = new Date(event.start).toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    let busiestDay = '-';
    let maxCount = 0;
    Object.entries(dayCounts).forEach(([day, count]) => {
      if (count > maxCount) {
        maxCount = count;
        busiestDay = day;
      }
    });
    this.productivitySnapshot.busiestDay = busiestDay;

    this.productivitySnapshot.nextOpenSlot = this.findNextOpenSlot();
  }

  private findNextOpenSlot(): string {
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const checkDate = this.addDays(now, i);
      const dayEvents = this.events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === checkDate.toDateString();
      });

      if (dayEvents.length < 8) {
        const formatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit' });
        return formatter.format(checkDate);
      }
    }
    return 'No availability';
  }

  private loadTeamMembers(): void {
    this.teamLoading = true;
    this.userService
      .getUsers(1, 100)
      .pipe(take(1))
      .subscribe({
        next: response => {
          if (response.success && Array.isArray(response.data)) {
            this.teamMembers = response.data.map(user => this.mapUserToTeamMember(user));
          }
          this.teamLoading = false;
        },
        error: error => {
          console.error('Error loading team:', error);
          this.teamLoading = false;
        }
      });
  }

  changeView(view: 'week' | 'month'): void {
    this.activeView = view;
    if (view === 'week') {
      this.buildWeekDays();
    } else {
      this.buildMonthMatrix();
    }
    this.loadEvents();
  }

  previousPeriod(): void {
    if (this.activeView === 'week') {
      this.referenceDate = this.addDays(this.referenceDate, -7);
      this.buildWeekDays();
    } else {
      this.referenceDate = new Date(this.referenceDate.getFullYear(), this.referenceDate.getMonth() - 1, 1);
      this.buildMonthMatrix();
    }
    this.loadEvents();
  }

  nextPeriod(): void {
    if (this.activeView === 'week') {
      this.referenceDate = this.addDays(this.referenceDate, 7);
      this.buildWeekDays();
    } else {
      this.referenceDate = new Date(this.referenceDate.getFullYear(), this.referenceDate.getMonth() + 1, 1);
      this.buildMonthMatrix();
    }
    this.loadEvents();
  }

  resetToToday(): void {
    this.referenceDate = new Date();
    this.today = new Date();
    if (this.activeView === 'week') {
      this.buildWeekDays();
    } else {
      this.buildMonthMatrix();
    }
    this.loadEvents();
  }

  filteredEvents(): CalendarEvent[] {
    let filtered = this.events;

    if (this.teamFilter !== 'todos') {
      filtered = filtered.filter(event => event.assignedTo === this.teamFilter);
    }

    if (this.typeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === this.typeFilter);
    }

    return filtered;
  }

  eventsForDay(day: WeekDay): CalendarEvent[] {
    const target = day.date.toDateString();
    return this.filteredEvents().filter(event => new Date(event.start).toDateString() === target);
  }

  eventsCountForDay(day: WeekDay): number {
    return this.eventsForDay(day).length;
  }

  getUpcomingEvents(limit = 4): CalendarEvent[] {
    return this.filteredEvents()
      .filter(event => new Date(event.start) >= new Date())
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, limit);
  }

  getUniqueAssignees(): string[] {
    const names = new Set(this.events.map(event => event.assignedTo).filter(Boolean));
    this.teamMembers.forEach(member => names.add(member.name));
    return ['todos', ...Array.from(names)];
  }

  getEventTypeOptions(): { value: string; label: string }[] {
    return [
      { value: 'all', label: 'All Types' },
      ...this.eventTypes.map(type => ({
        value: type,
        label: this.typeConfig[type]?.label || type
      }))
    ];
  }

  getEventTypeColor(type: ScheduleEventType): string {
    return this.typeConfig[type]?.color || 'secondary';
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  }

  getStatusBadgeClass(status: string): string {
    return status === 'active' ? 'badge-success' : 'badge-secondary';
  }

  getStatusLabel(status: string): string {
    if (status === 'active') return 'Active';
    if (status === 'inactive') return 'Inactive';
    return status || 'Unknown';
  }

  private mapUserToTeamMember(user: UserProfile): TeamMember {
    const role = user.profile || UserRoles.CARPENTER;
    return {
      id: user._id,
      name: user.fullname,
      role,
      roleLabel: UserRoles.getDisplayName(role),
      status: user.status
    };
  }

  private buildWeekDays(): void {
    const startOfWeek = this.getStartOfWeek(this.referenceDate);
    this.weekDays = Array.from({ length: 7 }).map((_, index) => {
      const date = this.addDays(startOfWeek, index);
      const formatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short' });
      return {
        label: this.getWeekdayLabel(date),
        date,
        display: formatter.format(date)
      };
    });
  }

  private buildMonthMatrix(): void {
    const firstDayOfMonth = new Date(this.referenceDate.getFullYear(), this.referenceDate.getMonth(), 1);
    const startMatrix = this.getStartOfWeek(firstDayOfMonth);
    this.monthMatrix = [];

    let current = new Date(startMatrix);
    for (let week = 0; week < 6; week++) {
      const row: WeekDay[] = [];
      for (let day = 0; day < 7; day++) {
        row.push({
          label: this.getWeekdayLabel(current),
          date: new Date(current),
          display: current.getDate().toString().padStart(2, '0')
        });
        current = this.addDays(current, 1);
      }
      this.monthMatrix.push(row);
      const lastRowHasCurrentMonth = row.some(cell => cell.date.getMonth() === this.referenceDate.getMonth());
      if (!lastRowHasCurrentMonth && week > 2) {
        break;
      }
    }
  }

  private getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private getWeekdayLabel(date: Date): string {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  }

  private addDays(date: Date, days: number): Date {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  }

  isToday(date: Date): boolean {
    return date.toDateString() === this.today.toDateString();
  }

  toggleReportDropdown(): void {
    this.reportDropdownOpen = !this.reportDropdownOpen;
  }

  generateReport(eventType: ScheduleEventType): void {
    this.reportDropdownOpen = false;

    let startDate: Date;
    let endDate: Date;
    let reportPeriod: 'week' | 'month';

    if (eventType === ScheduleEventType.DELIVERY) {
      // Delivery: weekly report
      startDate = this.getStartOfWeek(this.referenceDate);
      endDate = this.addDays(startDate, 6);
      reportPeriod = 'week';
    } else {
      // First Trim and Backtrim: monthly report
      startDate = new Date(this.referenceDate.getFullYear(), this.referenceDate.getMonth(), 1);
      endDate = new Date(this.referenceDate.getFullYear(), this.referenceDate.getMonth() + 1, 0);
      reportPeriod = 'month';
    }

    // Filter events by type
    const filteredByType = this.events.filter(event => event.type === eventType);

    const modalRef = this.modalService.open(ScheduleReportModalComponent, {
      centered: true,
      size: 'xl',
      scrollable: true
    });

    modalRef.componentInstance.events = filteredByType.map(event => ({
      id: event.id,
      title: event.title,
      type: event.type,
      start: event.start,
      assignedTo: event.assignedTo,
      takeoffs: (event.originalEvent?.takeoffs || []).map(t => ({
        id: t._id || '',
        name: t.custumerName || '',
        lot: t.lot
      }))
    }));
    modalRef.componentInstance.reportType = reportPeriod;
    modalRef.componentInstance.eventTypeFilter = eventType;
    modalRef.componentInstance.startDate = startDate;
    modalRef.componentInstance.endDate = endDate;
  }
}
