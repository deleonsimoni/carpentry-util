import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

import { UserService, UserProfile, CreateUserRequest, UpdateUserRequest } from '@app/shared/services/user.service';

@Component({
  selector: 'app-user-form-modal',
  templateUrl: './user-form-modal.component.html',
  styleUrls: ['./user-form-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgbModule
  ]
})
export class UserFormModalComponent implements OnInit {
  @Input() isEditMode = false;
  @Input() userData: UserProfile | null = null;

  userForm: FormGroup;
  isSubmitting = false;
  generatedPassword = '';

  profileOptions = this.userService.getAvailableProfiles();
  statusOptions = this.userService.getAvailableStatuses();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    public activeModal: NgbActiveModal,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.isEditMode && this.userData) {
      this.populateForm();
    }
  }

  // Máscara de telefone canadense
  onPhoneInput(event: any, fieldName: string): void {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length <= 10) {
      if (value.length >= 6) {
        value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
      } else if (value.length >= 3) {
        value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
      }

      this.userForm.patchValue({ [fieldName]: value });
      event.target.value = value;
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      fullname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      profile: ['', Validators.required],
      status: ['active'],
      mobilePhone: ['', [Validators.pattern(/^[\d\s\(\)\-\+]+$/)]],
      homePhone: ['', [Validators.pattern(/^[\d\s\(\)\-\+]+$/)]]
    });
  }

  private populateForm(): void {
    if (this.userData) {
      this.userForm.patchValue({
        fullname: this.userData.fullname,
        email: this.userData.email,
        profile: this.userData.profile,
        status: this.userData.status,
        mobilePhone: this.userData.mobilePhone || '',
        homePhone: this.userData.homePhone || ''
      });

      // Email não deve ser editável em modo de edição
      this.userForm.get('email')?.disable();
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isSubmitting = true;

      if (this.isEditMode) {
        this.updateUser();
      } else {
        this.createUser();
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private createUser(): void {
    const formValue = this.userForm.value as CreateUserRequest;

    // Remover campos vazios opcionais e status (não permitido na criação)
    if (!formValue.mobilePhone) delete formValue.mobilePhone;
    if (!formValue.homePhone) delete formValue.homePhone;
    delete (formValue as any).status; // Status não é permitido na criação

    this.userService.createUser(formValue).subscribe({
      next: (response) => {
        this.generatedPassword = response.temporaryPassword;
        this.toastr.success(response.message, 'Sucesso');
        this.isSubmitting = false;

        // Mostrar senha gerada por alguns segundos antes de fechar
        setTimeout(() => {
          this.activeModal.close('created');
        }, 5000);
      },
      error: (error) => {
        console.error('Erro ao criar usuário:', error);
        this.toastr.error(error.error?.message || 'Erro ao criar usuário', 'Erro');
        this.isSubmitting = false;
      }
    });
  }

  private updateUser(): void {
    if (!this.userData) return;

    const formValue = this.userForm.getRawValue();

    // Construir objeto de atualização apenas com campos alterados
    const updateData: UpdateUserRequest = {};

    if (formValue.fullname !== this.userData.fullname) {
      updateData.fullname = formValue.fullname;
    }
    if (formValue.profile !== this.userData.profile) {
      updateData.profile = formValue.profile;
    }
    if (formValue.status !== this.userData.status) {
      updateData.status = formValue.status;
    }
    if (formValue.mobilePhone !== (this.userData.mobilePhone || '')) {
      updateData.mobilePhone = formValue.mobilePhone || undefined;
    }
    if (formValue.homePhone !== (this.userData.homePhone || '')) {
      updateData.homePhone = formValue.homePhone || undefined;
    }

    // Se não há mudanças, fechar modal
    if (Object.keys(updateData).length === 0) {
      this.toastr.info('Nenhuma alteração foi feita', 'Info');
      this.activeModal.dismiss();
      return;
    }

    this.userService.updateUser(this.userData._id, updateData).subscribe({
      next: (response) => {
        this.toastr.success(response.message, 'Sucesso');
        this.activeModal.close('updated');
      },
      error: (error) => {
        console.error('Erro ao atualizar usuário:', error);
        this.toastr.error(error.error?.message || 'Erro ao atualizar usuário', 'Erro');
        this.isSubmitting = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper para verificar se campo tem erro
  hasError(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Helper para obter mensagem de erro
  getErrorMessage(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} é obrigatório`;
      if (field.errors['email']) return 'Email inválido';
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} deve ter pelo menos ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `${this.getFieldLabel(fieldName)} deve ter no máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      if (field.errors['pattern']) return `${this.getFieldLabel(fieldName)} tem formato inválido`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      fullname: 'Nome completo',
      email: 'Email',
      profile: 'Perfil',
      mobilePhone: 'Celular',
      homePhone: 'Telefone'
    };
    return labels[fieldName] || fieldName;
  }

  // Fechar modal
  onCancel(): void {
    this.activeModal.dismiss();
  }

  // Copiar senha para clipboard
  copyPassword(): void {
    navigator.clipboard.writeText(this.generatedPassword).then(() => {
      this.toastr.success('Senha copiada para a área de transferência', 'Copiado');
    });
  }

  // Obter título do modal
  getModalTitle(): string {
    return this.isEditMode ? 'Edit User' : 'New User';
  }

  // Obter texto do botão de submit
  getSubmitButtonText(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Updating...' : 'Creating...';
    }
    return this.isEditMode ? 'Update' : 'Create';
  }
}