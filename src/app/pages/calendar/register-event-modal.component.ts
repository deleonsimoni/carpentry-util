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
  ScheduleEventFormData,
  SCHEDULE_EVENT_TYPE_CONFIG
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
  selectedTakeoffs: TakeoffOrder[] = [];
  isLoading = false;
  isEditMode = false;

  eventTypes = Object.values(ScheduleEventType);
  typeConfig = SCHEDULE_EVENT_TYPE_CONFIG;

  formData: ScheduleEventFormData = {
    takeoffIds: [],
    type: ScheduleEventType.FIRST_TRIM,
    title: '',
    scheduledDate: '',
    assignedTo: ''
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
        takeoffIds: this.event.takeoffIds || [],
        type: this.event.type,
        title: this.event.title,
        scheduledDate: this.formatDateForInput(this.event.scheduledDate),
        assignedTo: this.event.assignedTo || ''
      };
    } else {
      if (this.date) {
        this.formData.scheduledDate = this.formatDateForInput(this.date.toISOString());
      }
    }
  }

  private formatDateForInput(isoString: string): string {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getFormattedDate(): string {
    if (!this.formData.scheduledDate) return '';
    const date = new Date(this.formData.scheduledDate + 'T00:00:00');
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
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

          if (this.isEditMode && this.formData.takeoffIds.length > 0) {
            this.selectedTakeoffs = this.takeoffs.filter(t =>
              t._id && this.formData.takeoffIds.includes(t._id)
            );
            this.updateTitle();
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

  onTakeoffSelect(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedId = selectElement.value;

    if (!selectedId) return;

    const takeoff = this.takeoffs.find(t => t._id === selectedId);
    if (takeoff && !this.selectedTakeoffs.find(t => t._id === selectedId)) {
      this.selectedTakeoffs.push(takeoff);
      this.formData.takeoffIds.push(selectedId);
      this.updateTitle();
    }

    selectElement.value = '';
  }

  removeTakeoff(takeoffId: string): void {
    this.selectedTakeoffs = this.selectedTakeoffs.filter(t => t._id !== takeoffId);
    this.formData.takeoffIds = this.formData.takeoffIds.filter(id => id !== takeoffId);
    this.updateTitle();
  }

  selectEventType(type: ScheduleEventType): void {
    this.formData.type = type;
    this.updateTitle();

    if (type === ScheduleEventType.DELIVERY) {
      this.formData.assignedTo = '';
    }
  }

  private updateTitle(): void {
    if (this.selectedTakeoffs.length === 0) {
      this.formData.title = '';
      return;
    }

    const takeoffNames = this.selectedTakeoffs.map(t => {
      const lot = t.lot ? ` - Lot ${t.lot}` : '';
      return `${t.custumerName}${lot}`;
    });

    this.formData.title = takeoffNames.join(', ');
  }

  getTypeLabel(type: ScheduleEventType): string {
    return this.typeConfig[type]?.label || type;
  }

  getTypeIcon(type: ScheduleEventType): string {
    return this.typeConfig[type]?.icon || 'fas fa-calendar';
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

  getAvailableTakeoffs(): TakeoffOrder[] {
    return this.takeoffs.filter(t => t._id && !this.formData.takeoffIds.includes(t._id));
  }

  isDelivery(): boolean {
    return this.formData.type === ScheduleEventType.DELIVERY;
  }

  isFormValid(): boolean {
    return !!(
      this.formData.takeoffIds.length > 0 &&
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
      scheduledDate: new Date(this.formData.scheduledDate + 'T00:00:00').toISOString()
    };

    if (this.isDelivery()) {
      delete eventData.assignedTo;
    }

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
