import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { take } from 'rxjs/operators';
import { TakeoffService } from '@app/shared/services/takeoff.service';
import { UserService, UserProfile } from '@app/shared/services/user.service';
import { TakeoffOrder } from '@app/shared/interfaces/takeoff.interface';
import {
  ScheduleEvent,
  ScheduleEventType,
  ScheduleEventStatus,
  ScheduleEventFormData,
  SCHEDULE_EVENT_TYPE_CONFIG,
  SCHEDULE_EVENT_STATUS_CONFIG
} from '@app/shared/interfaces/schedule.interface';

@Component({
  selector: 'app-register-event-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-event-modal.component.html',
  styleUrls: ['./register-event-modal.component.scss']
})
export class RegisterEventModalComponent implements OnInit {
  @Input() date!: Date;
  @Input() event: ScheduleEvent | null = null;

  takeoffs: TakeoffOrder[] = [];
  teamMembers: UserProfile[] = [];
  selectedTakeoff: TakeoffOrder | null = null;
  isLoading = false;
  isEditMode = false;

  eventTypes = Object.values(ScheduleEventType);
  eventStatuses = Object.values(ScheduleEventStatus);
  typeConfig = SCHEDULE_EVENT_TYPE_CONFIG;
  statusConfig = SCHEDULE_EVENT_STATUS_CONFIG;

  formData: ScheduleEventFormData = {
    takeoffId: '',
    type: ScheduleEventType.TAKEOFF,
    title: '',
    scheduledDate: '',
    endDate: '',
    assignedTo: '',
    status: ScheduleEventStatus.SCHEDULED,
    notes: '',
    location: ''
  };

  constructor(
    public activeModal: NgbActiveModal,
    private takeoffService: TakeoffService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.event;
    this.loadTakeoffs();
    this.loadTeamMembers();
    this.initializeForm();
  }

  private initializeForm(): void {
    if (this.isEditMode && this.event) {
      this.formData = {
        takeoffId: this.event.takeoffId,
        type: this.event.type,
        title: this.event.title,
        scheduledDate: this.formatDateTimeForInput(this.event.scheduledDate),
        endDate: this.event.endDate ? this.formatDateTimeForInput(this.event.endDate) : '',
        assignedTo: this.event.assignedTo || '',
        status: this.event.status,
        notes: this.event.notes || '',
        location: this.event.location || ''
      };
    } else {
      this.formData.title = this.getTypeLabel(this.formData.type);
      if (this.date) {
        const startDate = new Date(this.date);
        startDate.setHours(9, 0, 0, 0);
        this.formData.scheduledDate = this.formatDateTimeForInput(startDate.toISOString());
        this.formData.endDate = this.calculateEndDate(this.formData.scheduledDate);
      }
    }
  }

  private formatDateTimeForInput(isoString: string): string {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private calculateEndDate(startDateStr: string): string {
    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    return this.formatDateTimeForInput(endDate.toISOString());
  }

  onStartDateChange(): void {
    if (this.formData.scheduledDate) {
      this.formData.endDate = this.calculateEndDate(this.formData.scheduledDate);
    }
  }

  private loadTakeoffs(): void {
    this.isLoading = true;
    this.takeoffService.getOrdersFromUser()
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (Array.isArray(response)) {
            this.takeoffs = response;
          } else if (response?.data && Array.isArray(response.data)) {
            this.takeoffs = response.data;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading takeoffs:', error);
          this.isLoading = false;
        }
      });
  }

  private loadTeamMembers(): void {
    this.userService.getUsers(1, 100)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (response.success && Array.isArray(response.data)) {
            this.teamMembers = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading team members:', error);
        }
      });
  }

  onTakeoffChange(): void {
    this.selectedTakeoff = this.takeoffs.find(t => t._id === this.formData.takeoffId) || null;
    if (this.selectedTakeoff) {
      this.formData.location = this.selectedTakeoff.shipTo || this.selectedTakeoff.streetName || '';
      if (!this.formData.title) {
        this.formData.title = this.generateTitle(this.selectedTakeoff);
      }
    }
  }

  private generateTitle(takeoff: TakeoffOrder): string {
    const typeLabel = this.typeConfig[this.formData.type]?.label || this.formData.type;
    return `${typeLabel} - ${takeoff.custumerName}`;
  }

  selectEventType(type: ScheduleEventType): void {
    this.formData.type = type;
    this.onTypeChange();
  }

  onTypeChange(): void {
    if (this.selectedTakeoff) {
      this.formData.title = this.generateTitle(this.selectedTakeoff);
    } else {
      this.formData.title = this.getTypeLabel(this.formData.type);
    }
  }

  getTypeLabel(type: ScheduleEventType): string {
    return this.typeConfig[type]?.label || type;
  }

  getStatusLabel(status: ScheduleEventStatus): string {
    return this.statusConfig[status]?.label || status;
  }

  getStatusIcon(status: ScheduleEventStatus): string {
    const icons: Record<ScheduleEventStatus, string> = {
      [ScheduleEventStatus.SCHEDULED]: 'fas fa-clock',
      [ScheduleEventStatus.IN_PROGRESS]: 'fas fa-spinner',
      [ScheduleEventStatus.COMPLETED]: 'fas fa-check-circle',
      [ScheduleEventStatus.CANCELLED]: 'fas fa-times-circle'
    };
    return icons[status] || 'fas fa-circle';
  }

  getTakeoffDisplayName(takeoff: TakeoffOrder): string {
    const parts = [takeoff.custumerName];
    if (takeoff.lot) {
      parts.push(`Lot ${takeoff.lot}`);
    }
    if (takeoff.streetName) {
      parts.push(takeoff.streetName);
    }
    return parts.join(' - ');
  }

  isFormValid(): boolean {
    return !!(
      this.formData.takeoffId &&
      this.formData.type &&
      this.formData.title &&
      this.formData.scheduledDate
    );
  }

  save(): void {
    if (!this.isFormValid()) {
      return;
    }

    const eventData: ScheduleEventFormData = {
      ...this.formData,
      scheduledDate: new Date(this.formData.scheduledDate).toISOString(),
      endDate: this.formData.endDate ? new Date(this.formData.endDate).toISOString() : undefined
    };

    const result = {
      ...eventData,
      _id: this.event?._id,
      isEditMode: this.isEditMode
    };

    this.activeModal.close(result);
  }

  cancel(): void {
    this.activeModal.dismiss();
  }

  delete(): void {
    if (this.isEditMode && this.event?._id) {
      this.activeModal.close({ _id: this.event._id, isDelete: true });
    }
  }
}
