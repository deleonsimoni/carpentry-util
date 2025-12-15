import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@app/shared/services';
import { UserService } from '@app/shared/services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '@app/shared/services/notification.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { take } from 'rxjs/operators';
import { UserRoles } from '@app/shared/constants/user-roles.constants';

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
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe(params => {
      if (params['verified']) {
        this.notification.success('Your account has been successfully verified. Please log in.', 'Welcome');
      }
    });

    this.loginForm = this.builder.group({
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
    this.authService.getUser().pipe(take(1)).subscribe(
      user => {
        if (user && user._id) {
          // Redirect super admin to superadmin dashboard
          if (UserRoles.isSuperAdmin(user.roles)) {
            this.router.navigate(['/superadmin/dashboard']);
          } else {
            this.router.navigate(['/home']);
          }
          this.notification.info('You are already logged in', 'Redirected');
        }
      }
    );
  }

  login(): void {
    if (!this.loginForm.valid) {
      this.notification.error('Please fill in all required fields', 'Form Invalid');
      return;
    }

    this.spinner.show();

    this.authService.login(this.loginForm.value).subscribe({
      next: (res: any) => {
        // Multi-company user: auto-select first active company
        if (res.needsCompanySelection && res.companies?.length > 0) {
          const activeCompany = res.companies.find((c: any) => c.status === 'active') || res.companies[0];
          this.selectCompanyAndProceed(activeCompany._id);
          return;
        }

        // Single company or no selection needed
        this.proceedAfterLogin(res.user);
      },
      error: (err) => {
        this.spinner.hide();
        if (err.status === 401) {
          this.notification.error('Invalid email or password', 'Error');
        } else if (err.status === 403) {
          this.notification.error('Account is inactive or blocked', 'Error');
        } else {
          this.notification.error(err.error?.message || 'Login error', 'Error');
        }
      }
    });
  }

  private selectCompanyAndProceed(companyId: string): void {
    this.authService.selectCompany(companyId).subscribe({
      next: (res: any) => {
        this.proceedAfterLogin(res.user);
      },
      error: (err) => {
        this.spinner.hide();
        this.notification.error(err.error?.message || 'Error selecting company', 'Error');
      }
    });
  }

  private proceedAfterLogin(user: any): void {
    // Super admin goes directly to superadmin dashboard
    if (UserRoles.isSuperAdmin(user?.roles)) {
      this.navigateToSuperAdmin();
      return;
    }

    this.userService.checkPasswordStatus().subscribe({
      next: (response) => {
        // Managers skip password change requirement
        if (user.roles?.includes('manager')) {
          this.navigateToHome();
          return;
        }

        if (response.data?.requirePasswordChange) {
          this.notification.info('You must change your temporary password', 'Password Change Required');
          this.router.navigate(['/change-password-required']);
          this.spinner.hide();
        } else {
          this.navigateToHome();
        }
      },
      error: () => {
        // On error, proceed to home
        this.navigateToHome();
      }
    });
  }

  private navigateToSuperAdmin(): void {
    this.notification.success('Welcome, Super Admin', 'System Access');
    this.router.navigate(['/superadmin/dashboard']);
    this.spinner.hide();
  }

  private navigateToHome(): void {
    this.notification.success('Nice to see you', 'Welcome');
    this.router.navigate(['/home']);
    this.spinner.hide();
  }

  ngOnDestroy() {}
}
