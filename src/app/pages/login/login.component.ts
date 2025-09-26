import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@app/shared/services';
import { UserService } from '@app/shared/services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '@app/shared/services/notification.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {

  public loginForm: FormGroup;

  mensagem: string | null = null;


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
        this.notification.success('✅ Your account has been successfully verified. Please log in.', 'Welcome :)');
      }
    });

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
      }
    );
  }

  login(): void {
    if (this.loginForm.valid) {
      this.spinner.show();
      console.log('🔍 LOGIN - Iniciando processo de login');

      this.authService.login(this.loginForm.value).subscribe(
        (res: any) => {
          console.log('✅ LOGIN - Login realizado com sucesso:', res);

          // Check if user needs to change password (except managers)
          this.userService.checkPasswordStatus().subscribe({
            next: (response) => {
              console.log('✅ LOGIN - Status da senha obtido:', response);

              // Managers are not required to change password
              if (res.roles && res.roles.includes('manager')) {
                console.log('✅ LOGIN - Usuário é manager, redirecionando para /takeoff');
                this.notification.success('Nice to see you', 'Welcome :)');
                this.router.navigate(['/home']);
                this.spinner.hide();
                return;
              }

              if (response.data.requirePasswordChange) {
                console.log('⚠️ LOGIN - Usuário precisa trocar senha, redirecionando para /change-password-required');
                // Redirect to password change page
                this.notification.info('You must change your temporary password', 'Password Change Required');
                this.router.navigate(['/change-password-required']);
              } else {
                console.log('✅ LOGIN - Login normal, redirecionando para /takeoff');
                // Normal login flow - redirect to takeoff list
                this.notification.success('Nice to see you', 'Welcome :)');
                this.router.navigate(['/home']);
              }
              this.spinner.hide();
            },
            error: (error) => {
              console.error('❌ LOGIN - Erro ao verificar status da senha:', error);
              // In case of error, proceed with normal flow
              this.notification.success('Nice to see you', 'Welcome :)');
              this.router.navigate(['/home']);
              this.spinner.hide();
            }
          });
        },
        err => {
          console.error('❌ LOGIN - Erro no login:', err);
          this.spinner.hide();

          if (err.status === 401) {
            this.notification.error('Invalid email or password', 'Error: ');
          } else {
            this.notification.error('Login error: ' + (err.message || 'Unknown error'), 'Error: ');
          }
        }
      );
    } else {
      console.log('⚠️ LOGIN - Formulário inválido');
      this.notification.error('Please fill in all required fields', 'Form Invalid');
    }
  }

  ngOnDestroy() {}
}
