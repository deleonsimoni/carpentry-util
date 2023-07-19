import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@app/shared/services';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  public loginForm: FormGroup;

  constructor(
    private router: Router,
    private authService: AuthService,
    private builder: FormBuilder,
    private toastr: ToastrService,

  ) {
    this.loginForm = this.builder.group({
      // tslint:disable-next-line: max-line-length
      email: [null, [Validators.required, Validators.pattern(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)]],
      password: [null, [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
  }

  login(): void {

    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value)
        .subscribe((res: any) => {
          this.toastr.success('Bom te ver de novo', 'Bem-vindo :)');
          this.router.navigateByUrl('/');

        }, err => {
          if (err.status === 401) {
            this.toastr.error('Email ou senha inválidos', 'Erro: ');
          }
        });
    }
  }

  ngOnDestroy() {
  }

}
