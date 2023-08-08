import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { ToastrService } from 'ngx-toastr';

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
    private toastr: ToastrService
  ) {
    this.createForm();
  }

  ngOnInit() {}

  private createForm(): void {
    this.registerForm = this.builder.group({
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
      roles: ['company'],

      /*address: this.builder.group({
        street: [null, [Validators.required]],
        num: [null, [Validators.required]],
        complement: [null],
        zip: [null, [Validators.required]],
        city: [null, [Validators.required]],
        district: [null, [Validators.required]],
        country: [null, [Validators.required]],
        state: [null, [Validators.required]]
      }),
      phones: this.builder.group({
        telephone: [null],
        cellphone: [null, [Validators.required]],
      }),
      icAcceptTerms: [false, [Validators.requiredTrue]]*/
    });
  }

  register(): void {
    const form = this.registerForm.value;

    if (form.password != form.repeatPassword) {
      this.toastr.error('Senhas divergentes.', 'Atenção: ');
      return;
    }

    if (!this.registerForm.value.fullname) {
      this.toastr.error('Digite o nome e sobrenome.', 'Atenção: ');
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
          this.toastr.success('Cadastro realizado com sucesso.', 'Bem-vindo');
          this.router.navigate(['/home']);
        },
        err => {
          this.carregando = false;
          if (err.status === 500) {
            if (err.error.message.match('email')) {
              this.toastr.error('Email já registrado.', 'Erro: ');
            }
          }
        }
      );
    } else {
      this.toastr.error(
        'Verifique os campos do formulário para checar o correto preenchimento.',
        'Erro: '
      );
    }
  }
}
