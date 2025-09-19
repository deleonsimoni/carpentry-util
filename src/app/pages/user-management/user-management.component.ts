import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { UserService, UserProfile } from '@app/shared/services/user.service';
import { UserFormModalComponent } from './components/user-form-modal/user-form-modal.component';
import { PasswordResetModalComponent } from './components/password-reset-modal/password-reset-modal.component';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    NgbPaginationModule,
    UserFormModalComponent
  ]
})
export class UserManagementComponent implements OnInit {
  users: UserProfile[] = [];

  // Paginação
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalUsers = 0;

  // Filtros
  searchTerm = '';
  selectedProfile = '';
  selectedStatus = '';

  // Loading
  isLoading = false;

  // Dropdown state
  openDropdownIndex: number | null = null;

  // Debounce para busca
  private searchSubject = new Subject<string>();

  // Opções de filtros
  profileOptions = this.userService.getAvailableProfiles();
  statusOptions = this.userService.getAvailableStatuses();

  constructor(
    public userService: UserService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService
  ) {
    // Setup debounce para busca
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.loadUsers();
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  // Carregar lista de usuários
  loadUsers(): void {
    this.isLoading = true;
    this.spinner.show();

    this.userService.getUsers(
      this.currentPage,
      this.pageSize,
      this.searchTerm,
      this.selectedProfile,
      this.selectedStatus
    ).subscribe({
      next: (response) => {
        this.users = response.data;
        this.totalPages = response.pagination.totalPages;
        this.totalUsers = response.pagination.totalUsers;
        this.isLoading = false;
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Erro ao carregar usuários:', error);
        this.toastr.error('Erro ao carregar usuários', 'Error');
        this.isLoading = false;
        this.spinner.hide();
      }
    });
  }

  // Busca com debounce
  onSearchChange(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  // Filtrar por perfil
  onProfileFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  // Filtrar por status
  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  // Mudança de página
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  // Abrir modal de criação de usuário
  openCreateUserModal(): void {
    const modalRef = this.modalService.open(UserFormModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'user-form-modal'
    });

    modalRef.componentInstance.isEditMode = false;
    modalRef.componentInstance.userData = null;

    modalRef.result.then((result) => {
      if (result === 'created') {
        this.loadUsers();
      }
    }).catch(() => {
      // Modal fechado sem ação
    });
  }

  // Abrir modal de edição de usuário
  openEditUserModal(user: UserProfile): void {
    const modalRef = this.modalService.open(UserFormModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
      windowClass: 'user-form-modal'
    });

    modalRef.componentInstance.isEditMode = true;
    modalRef.componentInstance.userData = { ...user };

    modalRef.result.then((result) => {
      if (result === 'updated') {
        this.loadUsers();
      }
    }).catch(() => {
      // Modal fechado sem ação
    });
  }

  // Inativar/Ativar usuário
  toggleUserStatus(user: UserProfile): void {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'ativar' : 'inativar';

    if (confirm(`Are you sure you want to ${action} user ${user.fullname}?`)) {
      this.spinner.show();

      this.userService.updateUser(user._id, { status: newStatus }).subscribe({
        next: (response) => {
          this.toastr.success(response.message, 'Success');
          this.loadUsers();
        },
        error: (error) => {
          console.error('Erro ao alterar status duser:', error);
          this.toastr.error(error.error?.message || 'Erro ao alterar status', 'Error');
          this.spinner.hide();
        }
      });
    }
  }


  // Limpar filtros
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedProfile = '';
    this.selectedStatus = '';
    this.currentPage = 1;
    this.loadUsers();
  }

  // Helper para obter classe CSS do status
  getStatusClass(status: string): string {
    return status === 'active' ? 'badge-success' : 'badge-secondary';
  }

  // Helper para obter classe CSS do perfil
  getProfileClass(profile: string): string {
    switch (profile) {
      case 'supervisor': return 'badge-primary';
      case 'carpinteiro': return 'badge-warning';
      case 'entregador': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  // Formatar data
  formatDate(dateString: string): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US');
  }

  // Controlar estado do dropdown
  onDropdownToggle(isOpen: boolean, index: number): void {
    if (isOpen) {
      this.openDropdownIndex = index;
    } else {
      this.openDropdownIndex = null;
    }
  }

  // Reset de senha duser
  resetUserPassword(user: UserProfile): void {
    if (confirm(`Are you sure you want to reset the password for ${user.fullname}? A new temporary password will be generated and the user will need to change it on their next login.`)) {
      this.spinner.show();

      this.userService.resetUserPassword(user._id).subscribe({
        next: (response) => {
          this.spinner.hide();

          // Abrir modal com a nova senha temporária
          const modalRef = this.modalService.open(PasswordResetModalComponent, {
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
            centered: true,
            windowClass: 'password-reset-modal'
          });

          modalRef.componentInstance.userName = user.fullname;
          modalRef.componentInstance.temporaryPassword = response.temporaryPassword;

          modalRef.result.then(() => {
            this.loadUsers();
          }).catch(() => {
            this.loadUsers();
          });
        },
        error: (error) => {
          console.error('Error resetting password:', error);
          this.toastr.error(error.error?.message || 'Error resetting password', 'Error');
          this.spinner.hide();
        }
      });
    }
  }
}