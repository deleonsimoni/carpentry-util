import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { NotificationService } from '@app/shared/services/notification.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  public registerForm: FormGroup;
  public carregando = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private builder: FormBuilder,
    private notification: NotificationService
  ) {
    this.createForm();
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
        // User not logged in, stay on register page
      }
    );
  }

  private createForm(): void {
    this.registerForm = this.builder.group({
      // Personal Info
      fullname: [null, [Validators.required]],
      email: [
        null,
        [
          Validators.required,
          Validators.pattern(
            /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          ),
        ],
      ],
      password: [null, [Validators.required, Validators.minLength(6)]],
      repeatPassword: [null, [Validators.required, Validators.minLength(6)]],
      // roles será definido automaticamente no backend

      // Company Info
      company: this.builder.group({
        name: [null, [Validators.required]],
        businessNumber: [null],
        phone: [null, [Validators.pattern(/^\(\d{3}\) \d{3}-\d{4}$/)]],
        companyEmail: [null],
        website: [null],
        address: this.builder.group({
          street: [null],
          city: [null],
          province: [null, [Validators.required]],
          postalCode: [null, [Validators.pattern(/^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/)]],
          country: ['Canada']
        })
      }),

      privacyAccepted: [false, [Validators.requiredTrue]]
    });
  }


  register(): void {
    const form = this.registerForm.value;

    if (form.password != form.repeatPassword) {
      this.notification.error('Senhas divergentes.', 'Atenção: ');
      return;
    }

    if (!this.registerForm.value.fullname) {
      this.notification.error('Digite o nome e sobrenome.', 'Atenção: ');
      return;
    }


    if (this.registerForm.valid && form != null) {
      this.carregando = true;
      this.registerForm.value.email = this.registerForm.value.email
        .toLowerCase()
        .trim();

      // Roles será definido automaticamente no backend baseado na presença de company

      // Remove campos desnecessários antes de enviar
      this.registerForm.removeControl('repeatPassword');

      this.authService.register(this.registerForm.value).subscribe(
        (res: any) => {
          this.notification.success('Cadastro realizado com sucesso.', 'Bem-vindo');
          this.router.navigate(['/home']);
        },
        err => {
          this.carregando = false;
          console.error('Registration error:', err);

          if (err.status === 500) {
            if (err.error && err.error.message) {
              if (err.error.message.match('email')) {
                this.notification.error('Email já registrado.', 'Erro: ');
              } else {
                this.notification.error(err.error.message, 'Erro: ');
              }
            } else {
              this.notification.error('Erro interno do servidor.', 'Erro: ');
            }
          } else if (err.status === 400) {
            const message = err.error?.message || 'Dados inválidos.';
            this.notification.error(message, 'Erro: ');
          } else {
            const message = err.error?.message || 'Erro no registro.';
            this.notification.error(message, 'Erro: ');
          }
        }
      );
    } else {
      this.notification.error(
        'Verifique os campos do formulário para checar o correto preenchimento.',
        'Erro: '
      );
    }
  }

  passwordMismatch(): boolean {
    const password = this.registerForm.get('password')?.value;
    const repeatPassword = this.registerForm.get('repeatPassword')?.value;
    return password !== repeatPassword && repeatPassword?.length > 0;
  }

  formatPhone(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length >= 3) {
      value = value.replace(/(\d{3})(\d{0,3})/, '($1) $2');
    }
    this.registerForm.get('company.phone')?.setValue(value);
  }

  formatPostalCode(event: any): void {
    let value = event.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (value.length >= 4) {
      value = value.replace(/([A-Za-z]\d[A-Za-z])(\d[A-Za-z]\d)/, '$1 $2');
    }
    this.registerForm.get('company.address.postalCode')?.setValue(value);
  }


}
