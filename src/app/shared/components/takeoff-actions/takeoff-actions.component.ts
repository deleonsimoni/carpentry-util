import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '@app/shared/services/notification.service';
import { TakeoffService } from '../../services/takeoff.service';
import { TakeoffStatus, STATUS_CONSTANTS } from '../../interfaces/takeoff-status.interface';
import { DeliveryPhotoModalComponent } from '../delivery-photo-modal/delivery-photo-modal.component';

@Component({
  selector: 'app-takeoff-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './takeoff-actions.component.html',
  styleUrl: './takeoff-actions.component.scss'
})
export class TakeoffActionsComponent {
  @Input() currentStatus: number = 1;
  @Input() isManager: boolean = false;
  @Input() userRole: string = ''; // New input for user role
  @Input() takeoffId: string = '';
  @Input() customerName: string = ''; // For delivery photo modal
  @Input() isFormValid: boolean = true;
  @Input() isLoading: boolean = false;

  @Output() onSaveProgress = new EventEmitter<void>();
  @Output() onCompleteMeasurement = new EventEmitter<void>();
  @Output() onApproveForShipping = new EventEmitter<void>();
  @Output() onBackToMeasurement = new EventEmitter<void>();
  @Output() onMarkAsShipped = new EventEmitter<void>();
  @Output() onSendToCarpenter = new EventEmitter<void>();
  @Output() onMarkTrimmingCompleted = new EventEmitter<void>();
  @Output() onMarkBackTrimCompleted = new EventEmitter<void>();
  @Output() onCloseService = new EventEmitter<void>();

  constructor(
    private modalService: NgbModal,
    private notification: NotificationService,
    private takeoffService: TakeoffService
  ) {}

  get currentUserRole(): string {
    // Use userRole if provided, otherwise fall back to isManager for backward compatibility
    if (this.userRole) {
      return this.userRole;
    }
    return this.isManager ? 'manager' : 'carpenter';
  }

  /**
   * CARPENTER: Save Progress Button
   * Only show during TO_MEASURE status
   */
  shouldShowSaveProgress(): boolean {
    return this.currentStatus === TakeoffStatus.TO_MEASURE;
  }

  /**
   * CARPENTER: Complete Measurement Button
   * Only show during TO_MEASURE status
   */
  shouldShowCompleteMeasurement(): boolean {
    return !this.isManager && this.currentStatus === TakeoffStatus.TO_MEASURE;
  }

  /**
   * MANAGER: Approve for Shipping Button
   * Show when takeoff is UNDER_REVIEW and needs approval
   */
  shouldShowApproveForShipping(): boolean {
    return this.isManager && this.currentStatus === TakeoffStatus.UNDER_REVIEW;
  }

  /**
   * MANAGER: Back to Measurement Button
   * Show when manager can send back to carpenter for re-measurement
   */
  shouldShowBackToMeasurement(): boolean {
    return this.isManager && this.currentStatus === TakeoffStatus.UNDER_REVIEW;
  }

  /**
   * MANAGER/DELIVERY: Mark as Shipped Button
   * Show when takeoff is READY_TO_SHIP and needs to be marked as shipped
   */
  shouldShowMarkAsShipped(): boolean {
    const userRole = this.currentUserRole;
    return (userRole === 'manager' || userRole === 'delivery') && this.currentStatus === TakeoffStatus.READY_TO_SHIP;
  }

  /**
   * MANAGER: Send to Carpenter Button
   * Show when takeoff is CREATED and needs to be sent to carpenter
   */
  shouldShowSendToCarpenter(): boolean {
    return this.isManager && this.currentStatus === TakeoffStatus.CREATED;
  }

  /**
   * MANAGER: Mark Trimming Completed Button
   * Show when takeoff is SHIPPED and trimming is completed
   */
  shouldShowMarkTrimmingCompleted(): boolean {
    return this.isManager && this.currentStatus === TakeoffStatus.SHIPPED;
  }

  /**
   * MANAGER: Mark Back Trim Completed Button
   * Show when takeoff is TRIMMING_COMPLETED and back trim is completed
   */
  shouldShowMarkBackTrimCompleted(): boolean {
    return this.isManager && this.currentStatus === TakeoffStatus.TRIMMING_COMPLETED;
  }

  /**
   * MANAGER: Close Service Button
   * Show when takeoff is BACK_TRIM_COMPLETED and service can be closed
   */
  shouldShowCloseService(): boolean {
    return this.isManager && this.currentStatus === TakeoffStatus.BACK_TRIM_COMPLETED;
  }


  /**
   * Get current status info
   */
  getCurrentStatusLabel(): string {
    const statusMap = {
      [TakeoffStatus.CREATED]: 'Created',
      [TakeoffStatus.TO_MEASURE]: 'To Measure',
      [TakeoffStatus.UNDER_REVIEW]: 'Under Review',
      [TakeoffStatus.READY_TO_SHIP]: 'Ready to Ship',
      [TakeoffStatus.SHIPPED]: 'Shipped',
      [TakeoffStatus.TRIMMING_COMPLETED]: 'Trimming Completed',
      [TakeoffStatus.BACK_TRIM_COMPLETED]: 'Back Trim Completed',
      [TakeoffStatus.CLOSED]: 'Closed'
    };

    return statusMap[this.currentStatus] || 'Unknown';
  }

  // Event handlers
  saveProgress() {
    if (this.shouldShowSaveProgress() && this.isFormValid) {
      this.onSaveProgress.emit();
    }
  }

  completeMeasurement() {
    if (this.shouldShowCompleteMeasurement()) {
      this.onCompleteMeasurement.emit();
    }
  }

  approveForShipping() {
    if (this.shouldShowApproveForShipping()) {
      this.onApproveForShipping.emit();
    }
  }

  backToMeasurement() {
    if (this.shouldShowBackToMeasurement()) {
      this.onBackToMeasurement.emit();
    }
  }

  markAsShipped() {
    if (this.shouldShowMarkAsShipped()) {
      const userRole = this.currentUserRole;

      // If delivery user, show photo upload modal
      if (userRole === 'delivery') {
        this.showDeliveryPhotoModal();
      } else {
        // Manager can mark as shipped directly (or also with photo modal)
        this.onMarkAsShipped.emit();
      }
    }
  }

  /**
   * Show delivery photo modal for delivery users
   */
  private showDeliveryPhotoModal(): void {
    const modalRef = this.modalService.open(DeliveryPhotoModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.takeoffId = this.takeoffId;
    modalRef.componentInstance.customerName = this.customerName;

    modalRef.componentInstance.photoUploaded.subscribe((photo: File) => {
      this.handleDeliveryPhotoUpload(photo, modalRef);
    });
  }

  /**
   * Handle the delivery photo upload and status change
   */
  private handleDeliveryPhotoUpload(photo: File, modalRef: any): void {
    this.takeoffService.uploadDeliveryPhoto(this.takeoffId, photo).subscribe({
      next: (response) => {
        if (response.success) {
          this.notification.success('Delivery photo uploaded successfully', 'Photo Uploaded');
          modalRef.componentInstance.completeUpload();
          this.onMarkAsShipped.emit();
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

  sendToCarpenter() {
    if (this.shouldShowSendToCarpenter()) {
      this.onSendToCarpenter.emit();
    }
  }

  markTrimmingCompleted() {
    if (this.shouldShowMarkTrimmingCompleted()) {
      this.onMarkTrimmingCompleted.emit();
    }
  }

  markBackTrimCompleted() {
    if (this.shouldShowMarkBackTrimCompleted()) {
      this.onMarkBackTrimCompleted.emit();
    }
  }

  closeService() {
    if (this.shouldShowCloseService()) {
      this.onCloseService.emit();
    }
  }
}