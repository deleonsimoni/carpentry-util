import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TakeoffStatusService } from '../../services/takeoff-status.service';
import { TakeoffStatus, TakeoffStatusInfo, STATUS_CONSTANTS } from '../../interfaces/takeoff-status.interface';

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
  @Input() isManager: boolean = false; // New input to determine user type
  @Output() statusChanged = new EventEmitter<number>();

  constructor(private statusService: TakeoffStatusService) {}

  get statusInfo(): TakeoffStatusInfo {
    return this.statusService.getStatusInfo(this.currentStatus);
  }

  get nextStatuses(): TakeoffStatusInfo[] {
    if (!this.showActions || !this.canChange) {
      return [];
    }

    // CARPENTER: Only show buttons during TO_MEASURE status
    // MANAGER: Can see buttons for all valid status transitions
    if (!this.isManager && this.currentStatus !== TakeoffStatus.TO_MEASURE) {
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
    return STATUS_CONSTANTS.can.userAdvanceStatus(this.currentStatus, this.isManager);
  }

  /**
   * Get the appropriate action text based on user type and current status
   */
  getActionText(): string {
    if (this.isManager) {
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
    } else {
      // Carpenter actions - ONLY during measurement
      switch (this.currentStatus) {
        case TakeoffStatus.TO_MEASURE:
          return 'Complete Measurement';
        default:
          return 'No Action Available'; // Carpenter cannot advance other statuses
      }
    }
  }

  /**
   * Check if user can perform specific action at current status
   */
  canPerformAction(action: string): boolean {
    if (this.isManager) {
      switch (action) {
        case 'save_progress':
          return STATUS_CONSTANTS.permissions.company.canSaveProgress(this.currentStatus);
        case 'edit':
          return STATUS_CONSTANTS.permissions.company.canEdit(this.currentStatus);
        default:
          return false;
      }
    } else {
      switch (action) {
        case 'save_progress':
          return STATUS_CONSTANTS.permissions.carpenter.canSaveProgress(this.currentStatus);
        case 'edit':
          return STATUS_CONSTANTS.permissions.carpenter.canEdit(this.currentStatus);
        case 'complete_measurement':
          return STATUS_CONSTANTS.permissions.carpenter.canFinalizeMeasurement(this.currentStatus);
        case 'start_installation':
          return STATUS_CONSTANTS.permissions.carpenter.canStartInstallation(this.currentStatus);
        case 'complete_installation':
          return STATUS_CONSTANTS.permissions.carpenter.canCompleteInstallation(this.currentStatus);
        default:
          return false;
      }
    }
  }

  changeStatus(newStatus: TakeoffStatus): void {
    if (!this.statusService.canChangeStatus(this.currentStatus, newStatus)) {
      return;
    }

    // Show confirmation dialog when advancing to UNDER_REVIEW (before permission check)
    if (newStatus === TakeoffStatus.UNDER_REVIEW) {
      this.showUnderReviewConfirmation(newStatus);
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
   * Show confirmation dialog before advancing to Under Review
   */
  private showUnderReviewConfirmation(newStatus: TakeoffStatus): void {
    const confirmed = confirm(
      '⚠️ IMPORTANT NOTICE\n\n' +
      'Once you complete the measurement and advance to "Under Review", ' +
      'you will NO LONGER be able to edit or modify this takeoff form.\n\n' +
      'Please make sure all measurements and information are correct before proceeding.\n\n' +
      'Do you want to continue?'
    );

    if (confirmed) {
      // Validate permissions after confirmation
      if (!this.hasPermissionToAdvanceStatus()) {
        return;
      }
      this.statusChanged.emit(newStatus);
    }
  }
}
