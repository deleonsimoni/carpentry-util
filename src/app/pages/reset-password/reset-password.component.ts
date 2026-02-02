import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { NotificationService } from '@app/shared/services/notification.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {

  public resetForm: FormGroup;
  public token: string = '';
  public success = false;
  public invalidToken = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private builder: FormBuilder,
    private notification: NotificationService,
    private spinner: NgxSpinnerService
  ) {
    this.resetForm = this.builder.group({
      password: [null, [Validators.required, Validators.minLength(6)]],
      confirmPassword: [null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.invalidToken = true;
      }
    });
  }

  get passwordMismatch(): boolean {
    const { password, confirmPassword } = this.resetForm.value;
    return password && confirmPassword && password !== confirmPassword;
  }

  submit(): void {
    if (!this.resetForm.valid) {
      this.notification.error('Please fill in all required fields', 'Form Invalid');
      return;
    }

    const { password, confirmPassword } = this.resetForm.value;

    if (password !== confirmPassword) {
      this.notification.error('Passwords do not match', 'Error');
      return;
    }

    this.spinner.show();

    this.authService.resetPassword(this.token, password).subscribe({
      next: () => {
        this.spinner.hide();
        this.success = true;
        this.notification.success('Your password has been reset successfully.', 'Success');
      },
      error: (err) => {
        this.spinner.hide();
        const message = err.error?.message || 'Invalid or expired reset link. Please request a new one.';
        this.notification.error(message, 'Error');
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
