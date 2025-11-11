import { Component, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { AuthService } from '@app/shared/services';
import { UserService, UserProfile } from '../../shared/services/user.service';
import { UserRoles } from '../../shared/constants/user-roles.constants';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RegisterEventModalComponent } from './register-event-modal.component';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'measurement' | 'production' | 'delivery' | 'follow-up';
  start: string; // ISO string
  end: string;
  location: string;
  assignedTo: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'delayed';
  notes?: string;
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
  activeView: 'week' | 'month' = 'week';
  referenceDate = new Date();
  teamFilter = 'todos';
  today = new Date();
  hasAccess = false;
  teamMembers: TeamMember[] = [];
  teamLoading = false;


  weekDays: WeekDay[] = [];
  monthMatrix: WeekDay[][] = [];
  newEvent: any = {};
  takeoffs = ['Morning', 'Afternoon', 'Evening']; // exemplo

  events: CalendarEvent[] = [
    {
      id: 'evt-001',
      title: 'Medição Residencial - Alves',
      type: 'measurement',
      start: '2024-03-18T09:00:00',
      end: '2024-03-18T11:00:00',
      location: 'Rua das Palmeiras, 123',
      assignedTo: 'João Mendes',
      status: 'scheduled',
      notes: 'Confirmar presença com o cliente até 17h do dia anterior.'
    },
    {
      id: 'evt-002',
      title: 'Instalação de Armário - Costa',
      type: 'production',
      start: '2024-03-18T13:30:00',
      end: '2024-03-18T17:00:00',
      location: 'Av. Brasil, 890',
      assignedTo: 'Equipe Trim',
      status: 'in-progress',
      notes: 'Levar acabamento extra para gavetas.'
    },
    {
      id: 'evt-003',
      title: 'Entrega planejada - Lote 45',
      type: 'delivery',
      start: '2024-03-19T10:00:00',
      end: '2024-03-19T12:00:00',
      location: 'Condomínio Vista Verde',
      assignedTo: 'Marcos Lima',
      status: 'scheduled'
    },
    {
      id: 'evt-004',
      title: 'Reunião de aprovação',
      type: 'follow-up',
      start: '2024-03-20T16:00:00',
      end: '2024-03-20T17:00:00',
      location: 'Virtual',
      assignedTo: 'Equipe Gestora',
      status: 'scheduled',
      notes: 'Revisar alterações de layout antes da reunião.'
    },
    {
      id: 'evt-005',
      title: 'Medição Comercial - Silva',
      type: 'measurement',
      start: '2024-03-21T08:30:00',
      end: '2024-03-21T10:30:00',
      location: 'Rua Xavier, 44',
      assignedTo: 'Ana Clara',
      status: 'delayed',
      notes: 'Cliente pediu reagendamento para o período da tarde.'
    },
    {
      id: 'evt-006',
      title: 'Entrega Final - Projeto Borges',
      type: 'delivery',
      start: '2024-03-22T14:00:00',
      end: '2024-03-22T18:00:00',
      location: 'Rua Augusta, 300',
      assignedTo: 'Equipe Logística',
      status: 'scheduled'
    }
  ];

  productivitySnapshot = {
    weekUtilization: 78,
    delayedAppointments: 1,
    nextOpenSlot: '21/03 às 14h',
    busiestDay: 'Quarta-feira'
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    public modalService: NgbModal
  ) { }

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
      });
  }

  openRegisterDialog(date: Date) {
    const modalRef = this.modalService.open(RegisterEventModalComponent, {
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.date = date;

    modalRef.result.then(
      result => {
        if (result) {
          console.log('Evento salvo:', result);
          this.events.push(result);
          // aqui você pode atualizar o calendário
        }
      },
      () => {
        // Modal fechado sem salvar
      }
    );
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

            if (this.teamMembers.length > 0) {
              this.events = this.events.map((event, index) => ({
                ...event,
                assignedTo: this.teamMembers[index % this.teamMembers.length].name
              }));
            }
          }
          this.teamLoading = false;
        },
        error: error => {
          console.error('Erro ao carregar equipe:', error);
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
  }

  previousPeriod(): void {
    if (this.activeView === 'week') {
      this.referenceDate = this.addDays(this.referenceDate, -7);
      this.buildWeekDays();
    } else {
      this.referenceDate = new Date(this.referenceDate.getFullYear(), this.referenceDate.getMonth() - 1, 1);
      this.buildMonthMatrix();
    }
  }

  nextPeriod(): void {
    if (this.activeView === 'week') {
      this.referenceDate = this.addDays(this.referenceDate, 7);
      this.buildWeekDays();
    } else {
      this.referenceDate = new Date(this.referenceDate.getFullYear(), this.referenceDate.getMonth() + 1, 1);
      this.buildMonthMatrix();
    }
  }

  resetToToday(): void {
    this.referenceDate = new Date();
    this.today = new Date();
    if (this.activeView === 'week') {
      this.buildWeekDays();
    } else {
      this.buildMonthMatrix();
    }
  }

  filteredEvents(): CalendarEvent[] {
    if (this.teamFilter === 'todos') {
      return this.events;
    }
    return this.events.filter(event => event.assignedTo === this.teamFilter);
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
      .filter(event => new Date(event.end) >= new Date())
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, limit);
  }

  getUniqueAssignees(): string[] {
    const names = new Set(this.events.map(event => event.assignedTo));
    this.teamMembers.forEach(member => names.add(member.name));
    return ['todos', ...Array.from(names)];
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
    if (status === 'active') return 'Ativo';
    if (status === 'inactive') return 'Inativo';
    return status || 'Desconhecido';
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
    const diff = day === 0 ? -6 : 1 - day; // Segunda como início
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
}
