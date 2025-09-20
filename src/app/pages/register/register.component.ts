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
        console.log('User not logged in');
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
      roles: ['manager'], // Sempre manager

      // Company Info
      company: this.builder.group({
        name: [null, [Validators.required]],
        businessNumber: [null],
        industry: [null],
        phone: [null, [Validators.pattern(/^\(\d{3}\) \d{3}-\d{4}$/)]],
        email: [null],
        website: [null],
        address: this.builder.group({
          street: [null],
          city: [null],
          province: [null],
          postalCode: [null, [Validators.pattern(/^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/)]],
          country: ['Canada']
        })
      }),

      privacyAccepted: [false, [Validators.requiredTrue]]
    });
  }

  // Canadian provinces
  get canadianProvinces() {
    return [
      { code: 'AB', name: 'Alberta' },
      { code: 'BC', name: 'British Columbia' },
      { code: 'MB', name: 'Manitoba' },
      { code: 'NB', name: 'New Brunswick' },
      { code: 'NL', name: 'Newfoundland and Labrador' },
      { code: 'NS', name: 'Nova Scotia' },
      { code: 'NT', name: 'Northwest Territories' },
      { code: 'NU', name: 'Nunavut' },
      { code: 'ON', name: 'Ontario' },
      { code: 'PE', name: 'Prince Edward Island' },
      { code: 'QC', name: 'Quebec' },
      { code: 'SK', name: 'Saskatchewan' },
      { code: 'YT', name: 'Yukon' }
    ];
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
      this.registerForm.removeControl('cf-password');

      this.authService.register(this.registerForm.value).subscribe(
        (res: any) => {
          this.notification.success('Cadastro realizado com sucesso.', 'Bem-vindo');
          this.router.navigate(['/home']);
        },
        err => {
          this.carregando = false;
          if (err.status === 500) {
            if (err.error.message.match('email')) {
              this.notification.error('Email já registrado.', 'Erro: ');
            }
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
