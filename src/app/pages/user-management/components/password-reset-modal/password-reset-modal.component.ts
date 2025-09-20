import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '@app/shared/services/notification.service';

@Component({
  selector: 'app-password-reset-modal',
  templateUrl: './password-reset-modal.component.html',
  styleUrls: ['./password-reset-modal.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class PasswordResetModalComponent {
  @Input() userName = '';
  @Input() temporaryPassword = '';

  passwordCopied = false;
  currentDateTime = new Date().toLocaleString();

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NotificationService
  ) {}

  copyPassword(): void {
    navigator.clipboard.writeText(this.temporaryPassword).then(() => {
      this.passwordCopied = true;
      this.notification.success('Password copied to clipboard', 'Copied');

      // Reset the copied state after 3 seconds
      setTimeout(() => {
        this.passwordCopied = false;
      }, 3000);
    }).catch(() => {
      this.notification.error('Failed to copy password', 'Error');
    });
  }

  close(): void {
    this.activeModal.close();
  }
}