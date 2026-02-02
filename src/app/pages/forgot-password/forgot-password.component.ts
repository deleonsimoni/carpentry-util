import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { NotificationService } from '@app/shared/services/notification.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {

  public forgotForm: FormGroup;
  public submitted = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private builder: FormBuilder,
    private notification: NotificationService,
    private spinner: NgxSpinnerService
  ) {
    this.forgotForm = this.builder.group({
      email: [
        null,
        [
          Validators.required,
          Validators.pattern(
            /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          ),
        ],
      ],
    });
  }

  submit(): void {
    if (!this.forgotForm.valid) {
      this.notification.error('Please enter a valid email address', 'Form Invalid');
      return;
    }

    this.spinner.show();

    this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
      next: () => {
        this.spinner.hide();
        this.submitted = true;
        this.notification.success(
          'If an account with that email exists, a reset link has been sent.',
          'Check your email'
        );
      },
      error: () => {
        this.spinner.hide();
        // Don't reveal whether the email exists or not
        this.submitted = true;
        this.notification.success(
          'If an account with that email exists, a reset link has been sent.',
          'Check your email'
        );
      }
    });
  }
}
