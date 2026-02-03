import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TakeoffStatusService } from '../../services/takeoff-status.service';
import { TakeoffService } from '../../services/takeoff.service';
import { TakeoffStatus, TakeoffStatusInfo, STATUS_CONSTANTS } from '../../interfaces/takeoff-status.interface';
import { DeliveryPhotoModalComponent } from '../delivery-photo-modal/delivery-photo-modal.component';
import { CompleteMeasurementModalComponent } from '../complete-measurement-modal/complete-measurement-modal.component';
import { NotificationService } from '@app/shared/services/notification.service';

@Component({
  selector: 'app-takeoff-status',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule],
  templateUrl: './takeoff-status.component.html',
  styleUrl: './takeoff-status.component.scss'
})
export class TakeoffStatusComponent {
  @Input() currentStatus: number = 1;
  @Input() takeoffId: string = '';
  @Input() canChange: boolean = true;
  @Input() showActions: boolean = true;
  @Input() isManager: boolean = false; // Kept for backward compatibility
  @Input() userRole: string = ''; // New input for user role (manager, carpenter, delivery)
  @Input() customerName: string = ''; // For delivery photo modal
  @Output() statusChanged = new EventEmitter<number>();

  constructor(
    private statusService: TakeoffStatusService,
    private takeoffService: TakeoffService,
    private modalService: NgbModal,
    private notification: NotificationService
  ) {}

  get statusInfo(): TakeoffStatusInfo {
    return this.statusService.getStatusInfo(this.currentStatus);
  }

  get currentUserRole(): string {
    // Use userRole if provided, otherwise fall back to isManager for backward compatibility
    if (this.userRole) {
      return this.userRole;
    }
    return this.isManager ? 'manager' : 'carpenter';
  }

  get nextStatuses(): TakeoffStatusInfo[] {
    if (!this.showActions || !this.canChange) {
      return [];
    }

    // Check role-based permissions
    const userRole = this.currentUserRole;

    // CARPENTER: Only show buttons during TO_MEASURE, SHIPPED (trim), and TRIMMING_COMPLETED (back trim)
    if (userRole === 'carpenter' &&
        this.currentStatus !== TakeoffStatus.TO_MEASURE &&
        this.currentStatus !== TakeoffStatus.SHIPPED &&
        this.currentStatus !== TakeoffStatus.TRIMMING_COMPLETED) {
      return [];
    }

    // DELIVERY: Only show buttons during READY_TO_SHIP status
    if (userRole === 'delivery' && this.currentStatus !== TakeoffStatus.READY_TO_SHIP) {
      return [];
    }

    if (!this.hasPermissionToAdvanceStatus()) {
      return [];
    }

    return this.statusService.getNextStatuses(this.currentStatus);
  }

  get hasNextStatuses(): boolean {
    return this.nextStatuses.length > 0;
  }

  /**
   * Check if current user has permission to advance status from current state
   */
  hasPermissionToAdvanceStatus(): boolean {
    return STATUS_CONSTANTS.can.userAdvanceStatus(this.currentStatus, this.currentUserRole);
  }

  /**
   * Get the appropriate action text based on user type and current status
   */
  getActionText(): string {
    const userRole = this.currentUserRole;

    if (userRole === 'manager' || userRole === 'company') {
      switch (this.currentStatus) {
        case TakeoffStatus.CREATED:
          return 'Send to Carpenter';
        case TakeoffStatus.UNDER_REVIEW:
          return 'Approve for Shipping';
        case TakeoffStatus.READY_TO_SHIP:
          return 'Mark as Shipped';
        case TakeoffStatus.SHIPPED:
          return 'Confirm Installation Started';
        case TakeoffStatus.TRIMMING_COMPLETED:
          return 'Confirm Back Trim';
        case TakeoffStatus.BACK_TRIM_COMPLETED:
          return 'Close Service';
        default:
          return 'Advance Status';
      }
    } else if (userRole === 'carpenter') {
      switch (this.currentStatus) {
        case TakeoffStatus.TO_MEASURE:
          return 'Complete Measurement';
        case TakeoffStatus.SHIPPED:
          return 'Mark Trimming Completed';
        case TakeoffStatus.TRIMMING_COMPLETED:
          return 'Mark Back Trim Completed';
        default:
          return 'No Action Available';
      }
    } else if (userRole === 'delivery') {
      // Delivery actions - ONLY when ready to ship
      switch (this.currentStatus) {
        case TakeoffStatus.READY_TO_SHIP:
          return 'Mark as Shipped & Upload Photo';
        default:
          return 'No Action Available'; // Delivery cannot advance other statuses
      }
    }

    return 'No Action Available';
  }

  /**
   * Check if user can perform specific action at current status
   */
  canPerformAction(action: string): boolean {
    const userRole = this.currentUserRole;

    if (userRole === 'manager' || userRole === 'company') {
      switch (action) {
        case 'save_progress':
          return STATUS_CONSTANTS.permissions.manager.canSaveProgress(this.currentStatus);
        case 'edit':
          return STATUS_CONSTANTS.permissions.manager.canEdit(this.currentStatus);
        case 'upload_delivery_photo':
          return STATUS_CONSTANTS.permissions.manager.canMarkAsShipped(this.currentStatus);
        default:
          return false;
      }
    } else if (userRole === 'carpenter') {
      switch (action) {
        case 'save_progress':
          return STATUS_CONSTANTS.permissions.carpenter.canSaveProgress(this.currentStatus);
        case 'edit':
          return STATUS_CONSTANTS.permissions.carpenter.canEdit(this.currentStatus);
        case 'complete_measurement':
          return STATUS_CONSTANTS.permissions.carpenter.canFinalizeMeasurement(this.currentStatus);
        case 'mark_trimming_completed':
          return STATUS_CONSTANTS.permissions.carpenter.canMarkTrimmingCompleted(this.currentStatus);
        case 'mark_back_trim_completed':
          return STATUS_CONSTANTS.permissions.carpenter.canMarkBackTrimCompleted(this.currentStatus);
        case 'start_installation':
          return STATUS_CONSTANTS.permissions.carpenter.canStartInstallation(this.currentStatus);
        case 'complete_installation':
          return STATUS_CONSTANTS.permissions.carpenter.canCompleteInstallation(this.currentStatus);
        default:
          return false;
      }
    } else if (userRole === 'delivery') {
      switch (action) {
        case 'mark_as_shipped':
          return STATUS_CONSTANTS.permissions.delivery.canMarkAsShipped(this.currentStatus);
        case 'upload_delivery_photo':
          return STATUS_CONSTANTS.permissions.delivery.canUploadDeliveryPhoto(this.currentStatus);
        default:
          return false;
      }
    }

    return false;
  }

  changeStatus(newStatus: TakeoffStatus): void {
    if (!this.statusService.canChangeStatus(this.currentStatus, newStatus)) {
      return;
    }

    // Show confirmation dialog when advancing to UNDER_REVIEW (before permission check)
    if (newStatus === TakeoffStatus.UNDER_REVIEW) {
      this.showUnderReviewConfirmation(newStatus);
    } else if (newStatus === TakeoffStatus.SHIPPED) {
      // Show delivery photo modal when changing to SHIPPED
      this.showDeliveryPhotoModal(newStatus);
    } else {
      // Check permissions for other status changes
      if (!this.hasPermissionToAdvanceStatus()) {
        return;
      }
      this.statusChanged.emit(newStatus);
    }
  }

  /**
   * Advance to the next status (for carpenter direct action button)
   */
  advanceToNextStatus(): void {
    const nextStatuses = this.nextStatuses;
    if (nextStatuses.length > 0) {
      this.changeStatus(nextStatuses[0].id);
    }
  }

  /**
   * Show confirmation modal before advancing to Under Review
   */
  private showUnderReviewConfirmation(newStatus: TakeoffStatus): void {
    if (!this.hasPermissionToAdvanceStatus()) {
      return;
    }

    const modalRef = this.modalService.open(CompleteMeasurementModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.takeoffId = this.takeoffId;
    modalRef.componentInstance.customerName = this.customerName;

    modalRef.componentInstance.measurementCompleted.subscribe(() => {
      // Validate permissions one more time before emitting
      if (this.hasPermissionToAdvanceStatus()) {
        this.statusChanged.emit(newStatus);
      }
      modalRef.close();
    });
  }

  /**
   * Show delivery photo modal when changing to SHIPPED status
   */
  private showDeliveryPhotoModal(newStatus: TakeoffStatus): void {
    if (!this.hasPermissionToAdvanceStatus()) {
      return;
    }

    const modalRef = this.modalService.open(DeliveryPhotoModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.takeoffId = this.takeoffId;
    modalRef.componentInstance.customerName = this.customerName;

    modalRef.componentInstance.photoUploaded.subscribe((photo: File) => {
      this.handleDeliveryPhotoUpload(photo, newStatus, modalRef);
    });

    modalRef.componentInstance.skipPhoto.subscribe(() => {
      this.handleSkipPhoto(newStatus, modalRef);
    });
  }

  /**
   * Handle the delivery photo upload and status change
   */
  private handleDeliveryPhotoUpload(photo: File, newStatus: TakeoffStatus, modalRef: any): void {
    this.takeoffService.uploadDeliveryPhoto(this.takeoffId, photo).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success('Delivery photo uploaded successfully', 'Photo Uploaded');
          modalRef.componentInstance.completeUpload();
          this.statusChanged.emit(newStatus);
        } else {
          this.notification.error('Failed to upload delivery photo', 'Upload Error');
          modalRef.componentInstance.uploadError();
        }
      },
      error: (error) => {
        console.error('Error uploading delivery photo:', error);
        this.notification.error('Error uploading delivery photo', 'Upload Error');
        modalRef.componentInstance.uploadError();
      }
    });
  }

  /**
   * Handle skipping photo upload and proceed with status change
   */
  private handleSkipPhoto(newStatus: TakeoffStatus, modalRef: any): void {
    this.notification.info('Delivery status updated without photo', 'Status Updated');
    modalRef.close();
    this.statusChanged.emit(newStatus);
  }
}
