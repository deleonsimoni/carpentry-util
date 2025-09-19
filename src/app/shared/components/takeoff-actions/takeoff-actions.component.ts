import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TakeoffStatus, STATUS_CONSTANTS } from '../../interfaces/takeoff-status.interface';

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
  @Input() takeoffId: string = '';
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

  /**
   * CARPENTER: Save Progress Button
   * Only show during TO_MEASURE status
   */
  shouldShowSaveProgress(): boolean {
    return !this.isManager && this.currentStatus === TakeoffStatus.TO_MEASURE;
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
   * MANAGER: Mark as Shipped Button
   * Show when takeoff is READY_TO_SHIP and needs to be marked as shipped
   */
  shouldShowMarkAsShipped(): boolean {
    return this.isManager && this.currentStatus === TakeoffStatus.READY_TO_SHIP;
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
      this.onMarkAsShipped.emit();
    }
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