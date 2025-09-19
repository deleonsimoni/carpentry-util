import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

import { UserService } from '@app/shared/services/user.service';
import { AuthService } from '@app/shared/services';
import { TokenStorage } from '@app/shared/services/auth/token.storage';

@Component({
  selector: 'app-change-password-required',
  templateUrl: './change-password-required.component.html',
  styleUrls: ['./change-password-required.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class ChangePasswordRequiredComponent implements OnInit {
  passwordForm: FormGroup;
  isSubmitting = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private tokenStorage: TokenStorage,
    private router: Router,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService
  ) {
    this.passwordForm = this.createForm();
  }

  ngOnInit(): void {
    // Verificar se realmente precisa trocar senha
    this.checkPasswordStatus();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  private checkPasswordStatus(): void {
    this.userService.checkPasswordStatus().subscribe({
      next: (response) => {
        if (!response.data.requirePasswordChange) {
          // Usuário não precisa trocar senha, redirecionar
          this.router.navigate(['/home']);
        }
      },
      error: (error) => {
        console.error('Error checking password status:', error);
        // Em caso de erro, permitir continuar na tela
      }
    });
  }

  onSubmit(): void {
    if (this.passwordForm.valid) {
      this.isSubmitting = true;
      this.spinner.show();

      const formValue = this.passwordForm.value;

      this.userService.firstPasswordChange({
        currentPassword: formValue.currentPassword,
        newPassword: formValue.newPassword,
        confirmPassword: formValue.confirmPassword
      }).subscribe({
        next: (response) => {
          // Atualizar token com dados do usuário atualizado
          this.tokenStorage.saveToken(response.token);
          this.authService.setUser(response.user);

          this.toastr.success(response.message, 'Success');
          this.isSubmitting = false;
          this.spinner.hide();

          // Redirecionar para home após sucesso
          this.router.navigate(['/home']);
        },
        error: (error) => {
          console.error('Error changing password:', error);
          this.toastr.error(error.error?.message || 'Error changing password', 'Error');
          this.isSubmitting = false;
          this.spinner.hide();
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.passwordForm.controls).forEach(key => {
      const control = this.passwordForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper para verificar se campo tem erro
  hasError(fieldName: string): boolean {
    const field = this.passwordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Helper para obter mensagem de erro
  getErrorMessage(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['passwordMismatch']) return 'Passwords do not match';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      currentPassword: 'Current password',
      newPassword: 'New password',
      confirmPassword: 'Confirm password'
    };
    return labels[fieldName] || fieldName;
  }

  // Toggle visibility das senhas
  togglePasswordVisibility(field: string): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  // Fazer logout (cancelar troca de senha)
  logout(): void {
    if (confirm('Are you sure you want to cancel? You will be logged out of the system.')) {
      this.tokenStorage.signOut();
      this.authService.setUser(null);
      this.router.navigate(['/login']);
    }
  }

}