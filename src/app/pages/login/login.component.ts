import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@app/shared/services';
import { UserService } from '@app/shared/services/user.service';
import { Router } from '@angular/router';
import { NotificationService } from '@app/shared/services/notification.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  public loginForm: FormGroup;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private builder: FormBuilder,
    private notification: NotificationService,
    private spinner: NgxSpinnerService
  ) {
    this.loginForm = this.builder.group({
      // tslint:disable-next-line: max-line-length
      email: [
        null,
        [
          Validators.required,
          Validators.pattern(
            /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          ),
        ],
      ],
      password: [null, [Validators.required, Validators.minLength(3)]],
    });
  }

  ngOnInit() {
    // Check if user is already logged in
    this.authService.getUser().subscribe(
      user => {
        if (user && user._id) {
          // User is already logged in, redirect to home
          this.router.navigate(['/home']);
          this.notification.info('You are already logged in', 'Redirected');
        }
      },
      err => {
        // User not logged in, stay on login page
        console.log('User not logged in');
      }
    );
  }

  login(): void {
    if (this.loginForm.valid) {
      this.spinner.show();

      this.authService.login(this.loginForm.value).subscribe(
        (res: any) => {
          // Check if user needs to change password (except managers)
          this.userService.checkPasswordStatus().subscribe({
            next: (response) => {
              // Managers are not required to change password
              if (res.roles && res.roles.includes('manager')) {
                this.notification.success('Nice to see you', 'Welcome :)');
                this.router.navigate(['/home']);
                this.spinner.hide();
                return;
              }

              if (response.data.requirePasswordChange) {
                // Redirect to password change page
                this.notification.info('You must change your temporary password', 'Password Change Required');
                this.router.navigate(['/change-password-required']);
              } else {
                // Normal login flow
                this.notification.success('Nice to see you', 'Welcome :)');
                this.router.navigate(['/home']);
              }
              this.spinner.hide();
            },
            error: (error) => {
              console.error('Error checking password status:', error);
              // In case of error, proceed with normal flow
              this.notification.success('Nice to see you', 'Welcome :)');
              this.router.navigate(['/home']);
              this.spinner.hide();
            }
          });
        },
        err => {
          this.spinner.hide();

          if (err.status === 401) {
            this.notification.error('Invalid email or password', 'Error: ');
          }
        }
      );
    }
  }

  ngOnDestroy() {}
}
