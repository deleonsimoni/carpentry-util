import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  ScheduleEventType,
  SCHEDULE_EVENT_TYPE_CONFIG
} from '@app/shared/interfaces/schedule.interface';

interface TakeoffInfo {
  id: string;
  name: string;
  lot?: string;
}

interface ReportEvent {
  id: string;
  title: string;
  type: ScheduleEventType;
  start: string;
  assignedTo: string;
  takeoffs: TakeoffInfo[];
}

interface DaySummary {
  date: Date;
  dateFormatted: string;
  weekday: string;
  events: ReportEvent[];
  firstTrimCount: number;
  backtrimCount: number;
  deliveryCount: number;
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  events: ReportEvent[];
}

interface TypeSummary {
  type: ScheduleEventType;
  label: string;
  color: string;
  count: number;
  percentage: number;
}

interface WeekDayReport {
  date: Date;
  weekdayShort: string;
  dateFormatted: string;
  events: ReportEvent[];
}

interface AssigneeSummary {
  name: string;
  eventCount: number;
  firstTrimCount: number;
  backtrimCount: number;
  deliveryCount: number;
}

@Component({
  selector: 'app-schedule-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-report-modal.component.html',
  styleUrls: ['./schedule-report-modal.component.scss']
})
export class ScheduleReportModalComponent implements OnInit {
  @Input() events: ReportEvent[] = [];
  @Input() reportType: 'week' | 'month' = 'week';
  @Input() eventTypeFilter?: ScheduleEventType;
  @Input() startDate!: Date;
  @Input() endDate!: Date;

  typeConfig = SCHEDULE_EVENT_TYPE_CONFIG;

  reportTitle = '';
  periodLabel = '';
  generatedAt = '';
  eventTypeLabel = '';
  eventTypeIcon = '';
  eventTypeColor = '';

  totalEvents = 0;
  daySummaries: DaySummary[] = [];
  typeSummaries: TypeSummary[] = [];
  assigneeSummaries: AssigneeSummary[] = [];
  calendarWeeks: CalendarDay[][] = [];
  weekDayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Week selector for Delivery reports
  availableWeeks: { label: string; startDate: Date; endDate: Date }[] = [];
  selectedWeekIndex = 0;
  allDeliveryEvents: ReportEvent[] = [];
  weekDaysReport: WeekDayReport[] = [];

  isTrimReport(): boolean {
    return this.eventTypeFilter === ScheduleEventType.FIRST_TRIM ||
           this.eventTypeFilter === ScheduleEventType.BACKTRIM;
  }

  isDeliveryReport(): boolean {
    return this.eventTypeFilter === ScheduleEventType.DELIVERY;
  }

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    this.generateReport();
  }

  private generateReport(): void {
    this.generatedAt = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    this.totalEvents = this.events.length;

    // Set event type info if filtering by type
    if (this.eventTypeFilter) {
      const config = this.typeConfig[this.eventTypeFilter];
      this.eventTypeLabel = config?.label || this.eventTypeFilter;
      this.eventTypeIcon = config?.icon || 'fas fa-calendar';
      this.eventTypeColor = config?.color || 'primary';
    }

    if (this.reportType === 'week') {
      this.reportTitle = this.eventTypeFilter
        ? `${this.eventTypeLabel} - Weekly Report`
        : 'Weekly Schedule Report';
      this.periodLabel = this.formatPeriod(this.startDate, this.endDate);
    } else {
      this.reportTitle = this.eventTypeFilter
        ? `${this.eventTypeLabel} - Monthly Report`
        : 'Monthly Schedule Report';
      this.periodLabel = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric'
      }).format(this.startDate);
    }

    // For delivery reports, generate week options and week view
    if (this.isDeliveryReport()) {
      this.allDeliveryEvents = [...this.events];
      this.generateWeekOptions();
      this.generateWeekDaysReport();
    }

    this.generateDaySummaries();
    this.generateTypeSummaries();
    this.generateAssigneeSummaries();

    if (this.isTrimReport()) {
      this.generateCalendarGrid();
    }
  }

  private generateWeekOptions(): void {
    const year = this.startDate.getFullYear();
    const month = this.startDate.getMonth();

    // Get first day of month
    const firstDayOfMonth = new Date(year, month, 1);
    // Get last day of month
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Find the Monday of the week containing the first day
    let currentDate = new Date(firstDayOfMonth);
    const dayOfWeek = currentDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentDate.setDate(currentDate.getDate() + diff);

    this.availableWeeks = [];
    let weekNumber = 1;

    while (currentDate <= lastDayOfMonth) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
      this.availableWeeks.push({
        label: `Week ${weekNumber}: ${formatter.format(weekStart)} - ${formatter.format(weekEnd)}`,
        startDate: weekStart,
        endDate: weekEnd
      });

      currentDate.setDate(currentDate.getDate() + 7);
      weekNumber++;
    }

    // Find which week contains the current startDate
    this.selectedWeekIndex = this.availableWeeks.findIndex(week =>
      this.startDate >= week.startDate && this.startDate <= week.endDate
    );
    if (this.selectedWeekIndex === -1) this.selectedWeekIndex = 0;
  }

  onWeekChange(index: number): void {
    this.selectedWeekIndex = index;
    const selectedWeek = this.availableWeeks[index];

    this.startDate = selectedWeek.startDate;
    this.endDate = selectedWeek.endDate;
    this.periodLabel = this.formatPeriod(this.startDate, this.endDate);

    // Filter events for selected week
    this.events = this.allDeliveryEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= selectedWeek.startDate && eventDate <= selectedWeek.endDate;
    });

    this.totalEvents = this.events.length;
    this.generateWeekDaysReport();
    this.generateDaySummaries();
    this.generateAssigneeSummaries();
  }

  private generateWeekDaysReport(): void {
    this.weekDaysReport = [];

    let currentDate = new Date(this.startDate);
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      const dayEvents = this.events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === date.toDateString();
      });

      this.weekDaysReport.push({
        date,
        weekdayShort: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date).toUpperCase(),
        dateFormatted: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date),
        events: dayEvents
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  private formatPeriod(start: Date, end: Date): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    });
    const yearFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric' });
    return `${formatter.format(start)} - ${formatter.format(end)}, ${yearFormatter.format(end)}`;
  }

  private generateDaySummaries(): void {
    const dayMap = new Map<string, DaySummary>();

    let currentDate = new Date(this.startDate);
    while (currentDate <= this.endDate) {
      const dateKey = currentDate.toDateString();
      dayMap.set(dateKey, {
        date: new Date(currentDate),
        dateFormatted: new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }).format(currentDate),
        weekday: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(currentDate),
        events: [],
        firstTrimCount: 0,
        backtrimCount: 0,
        deliveryCount: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.events.forEach(event => {
      const eventDate = new Date(event.start);
      const dateKey = eventDate.toDateString();
      const daySummary = dayMap.get(dateKey);

      if (daySummary) {
        daySummary.events.push(event);
        if (event.type === ScheduleEventType.FIRST_TRIM) daySummary.firstTrimCount++;
        if (event.type === ScheduleEventType.BACKTRIM) daySummary.backtrimCount++;
        if (event.type === ScheduleEventType.DELIVERY) daySummary.deliveryCount++;
      }
    });

    this.daySummaries = Array.from(dayMap.values())
      .filter(day => day.events.length > 0)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private generateTypeSummaries(): void {
    const typeCounts: Record<string, number> = {};

    this.events.forEach(event => {
      typeCounts[event.type] = (typeCounts[event.type] || 0) + 1;
    });

    this.typeSummaries = Object.values(ScheduleEventType).map(type => ({
      type,
      label: this.typeConfig[type]?.label || type,
      color: this.typeConfig[type]?.color || 'secondary',
      count: typeCounts[type] || 0,
      percentage: this.totalEvents > 0
        ? Math.round(((typeCounts[type] || 0) / this.totalEvents) * 100)
        : 0
    }));
  }

  private generateAssigneeSummaries(): void {
    const assigneeMap = new Map<string, AssigneeSummary>();

    this.events.forEach(event => {
      const name = event.assignedTo || 'Unassigned';
      if (!assigneeMap.has(name)) {
        assigneeMap.set(name, {
          name,
          eventCount: 0,
          firstTrimCount: 0,
          backtrimCount: 0,
          deliveryCount: 0
        });
      }

      const summary = assigneeMap.get(name)!;
      summary.eventCount++;
      if (event.type === ScheduleEventType.FIRST_TRIM) summary.firstTrimCount++;
      if (event.type === ScheduleEventType.BACKTRIM) summary.backtrimCount++;
      if (event.type === ScheduleEventType.DELIVERY) summary.deliveryCount++;
    });

    this.assigneeSummaries = Array.from(assigneeMap.values())
      .sort((a, b) => b.eventCount - a.eventCount);
  }

  getTypeBadgeClass(type: ScheduleEventType): string {
    const classes: Record<ScheduleEventType, string> = {
      [ScheduleEventType.FIRST_TRIM]: 'badge-info',
      [ScheduleEventType.BACKTRIM]: 'badge-success',
      [ScheduleEventType.DELIVERY]: 'badge-warning'
    };
    return classes[type] || 'badge-secondary';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  private generateCalendarGrid(): void {
    const year = this.startDate.getFullYear();
    const month = this.startDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of week for first day (0=Sunday, we want Monday=0)
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    // Create event map for quick lookup
    const eventMap = new Map<string, ReportEvent[]>();
    this.events.forEach(event => {
      const dateKey = new Date(event.start).toDateString();
      if (!eventMap.has(dateKey)) {
        eventMap.set(dateKey, []);
      }
      eventMap.get(dateKey)!.push(event);
    });

    this.calendarWeeks = [];
    let currentWeek: CalendarDay[] = [];

    // Add days from previous month to fill first week
    const prevMonthLastDay = new Date(year, month, 0);
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay.getDate() - i);
      currentWeek.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: false,
        events: eventMap.get(date.toDateString()) || []
      });
    }

    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      currentWeek.push({
        date,
        dayNumber: day,
        isCurrentMonth: true,
        events: eventMap.get(date.toDateString()) || []
      });

      if (currentWeek.length === 7) {
        this.calendarWeeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add days from next month to fill last week
    if (currentWeek.length > 0) {
      let nextMonthDay = 1;
      while (currentWeek.length < 7) {
        const date = new Date(year, month + 1, nextMonthDay);
        currentWeek.push({
          date,
          dayNumber: nextMonthDay,
          isCurrentMonth: false,
          events: eventMap.get(date.toDateString()) || []
        });
        nextMonthDay++;
      }
      this.calendarWeeks.push(currentWeek);
    }
  }

  getEventsByAssignee(events: ReportEvent[]): Map<string, ReportEvent[]> {
    const grouped = new Map<string, ReportEvent[]>();
    events.forEach(event => {
      const assignee = event.assignedTo || 'Unassigned';
      if (!grouped.has(assignee)) {
        grouped.set(assignee, []);
      }
      grouped.get(assignee)!.push(event);
    });
    return grouped;
  }

  getTakeoffsByBuilder(takeoffs: TakeoffInfo[]): Map<string, TakeoffInfo[]> {
    const grouped = new Map<string, TakeoffInfo[]>();
    takeoffs.forEach(takeoff => {
      const builder = takeoff.name || 'Unknown';
      if (!grouped.has(builder)) {
        grouped.set(builder, []);
      }
      grouped.get(builder)!.push(takeoff);
    });
    return grouped;
  }

  print(): void {
    const printContent = document.querySelector('.week-view-report') || document.querySelector('.report-calendar');
    if (!printContent) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    const styles = `
      <style>
        @page {
          size: landscape;
          margin: 0.5cm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          padding: 8px;
        }
        .print-header {
          text-align: center;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e9ecef;
        }
        .print-header h2 {
          font-size: 16px;
          color: #32325d;
          margin-bottom: 3px;
        }
        .print-header p {
          font-size: 11px;
          color: #8898aa;
        }

        /* Week View Styles */
        .week-view-report {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-top: 15px;
        }
        .week-day-card-report {
          background: #fff;
          border-radius: 4px;
          border: 1px solid #dee2e6;
          overflow: hidden;
          min-height: 180px;
        }
        .week-day-header-report {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          background: #f8f9fe;
          border-bottom: 1px solid #e9ecef;
        }
        .day-info-report {
          display: flex;
          flex-direction: column;
        }
        .weekday-label-report {
          font-size: 8px;
          font-weight: 600;
          color: #8898aa;
          letter-spacing: 0.5px;
        }
        .weekday-date-report {
          font-size: 11px;
          font-weight: 700;
          color: #32325d;
        }
        .event-count-report {
          background: #5e72e4;
          color: #fff;
          font-size: 9px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 8px;
        }
        .week-day-content-report {
          padding: 6px;
        }
        .events-list-report {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .event-item-report {
          background: #fff;
          border-radius: 3px;
          padding: 4px 6px;
          border: 1px solid #e9ecef;
          border-left: 3px solid #fb6340;
        }
        .event-title-report {
          font-size: 9px;
          font-weight: 600;
          color: #32325d;
          line-height: 1.2;
          margin-bottom: 2px;
        }
        .event-assigned-report {
          font-size: 8px;
          color: #8898aa;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .empty-day-report {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 80px;
          color: #c0c8d0;
          font-size: 9px;
        }
        .empty-day-report i {
          font-size: 14px;
          margin-bottom: 4px;
          opacity: 0.5;
        }
        .builder-group-report {
          margin-bottom: 4px;
        }
        .builder-name-report {
          font-size: 10px;
          font-weight: 600;
          color: #32325d;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lot-item-report {
          font-size: 9px;
          color: #8898aa;
          line-height: 1.3;
          padding-left: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lot-item-report::before {
          content: '•';
          margin-right: 3px;
          color: #adb5bd;
        }

        /* Monthly Calendar Styles */
        .report-calendar {
          border: 1px solid #dee2e6;
          border-radius: 4px;
          overflow: hidden;
        }
        .calendar-header-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #f8f9fe;
          border-bottom: 1px solid #e9ecef;
        }
        .calendar-header-cell {
          padding: 6px 4px;
          text-align: center;
          font-weight: 600;
          font-size: 9px;
          text-transform: uppercase;
          color: #8898aa;
        }
        .calendar-week {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          border-bottom: 1px solid #e9ecef;
        }
        .calendar-week:last-child {
          border-bottom: none;
        }
        .calendar-day {
          min-height: 80px;
          padding: 4px;
          border-right: 1px solid #e9ecef;
          background: #fff;
          overflow: hidden;
        }
        .calendar-day:last-child {
          border-right: none;
        }
        .calendar-day.out-month {
          background: #f8f9fe;
          opacity: 0.4;
        }
        .calendar-day-number {
          font-size: 10px;
          font-weight: 600;
          color: #32325d;
          margin-bottom: 3px;
        }
        .calendar-day-events {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .event-group {
          background: #f8f9fe;
          border-radius: 2px;
          padding: 3px 4px;
          border-left: 2px solid #5e72e4;
          margin-bottom: 3px;
        }
        .event-group:last-child {
          margin-bottom: 0;
        }
        .event-assignee {
          font-size: 8px;
          font-weight: 700;
          color: #5e72e4;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .event-title-small {
          font-size: 7px;
          color: #525f7f;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .event-takeoff {
          font-size: 6px;
          color: #525f7f;
          line-height: 1.2;
          padding-left: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .event-takeoff::before {
          content: '•';
          margin-right: 2px;
          color: #8898aa;
        }
        .builder-group {
          margin-top: 3px;
        }
        .builder-name {
          font-size: 7px;
          font-weight: 600;
          color: #32325d;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lot-item {
          font-size: 6px;
          color: #8898aa;
          line-height: 1.3;
          padding-left: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lot-item::before {
          content: '•';
          margin-right: 2px;
          color: #adb5bd;
        }
        .assignee-group {
          background: #f8f9fe;
          border-radius: 2px;
          padding: 3px 4px;
          border-left: 2px solid #5e72e4;
        }
        .assignee-name {
          font-size: 8px;
          font-weight: 700;
          color: #5e72e4;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .event-item-small {
          font-size: 7px;
          color: #525f7f;
          padding-left: 6px;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .event-item-small::before {
          content: '•';
          margin-right: 3px;
          color: #8898aa;
        }

        /* Icon replacements */
        .fa-user:before { content: "👤"; font-style: normal; }
        .fa-calendar-day:before { content: "📅"; font-style: normal; }
        .fas { font-style: normal; }
        i.fas.fa-user { font-style: normal; }
        i.fas.fa-user:before { content: ""; }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${this.reportTitle} - ${this.periodLabel}</title>
          ${styles}
        </head>
        <body>
          <div class="print-header">
            <h2>${this.reportTitle}</h2>
            <p>${this.periodLabel}</p>
          </div>
          ${printContent.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  close(): void {
    this.activeModal.dismiss();
  }
}
