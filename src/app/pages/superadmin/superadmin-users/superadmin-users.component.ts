import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SuperAdminService, CompanyWithStats } from '@app/shared/services/superadmin.service';
import { UserRoles } from '@app/shared/constants/user-roles.constants';
import { NotificationService } from '@app/shared/services/notification.service';

@Component({
  selector: 'app-superadmin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="header bg-gradient-danger pb-8 pt-5 pt-md-8">
      <div class="container-fluid">
        <div class="header-body">
          <h2 class="text-white mb-0">All Users</h2>
          <p class="text-white-50">Manage users across all companies</p>
        </div>
      </div>
    </div>

    <div class="container-fluid mt--7">
      <div class="card shadow">
        <div class="card-header border-0">
          <div class="row align-items-center">
            <div class="col">
              <h3 class="mb-0">Users List</h3>
            </div>
            <div class="col-auto">
              <span class="badge badge-primary">Total: {{ pagination.total }}</span>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="card-body border-bottom">
          <div class="row">
            <div class="col-md-3 mb-2">
              <input type="text"
                     class="form-control"
                     placeholder="Search by name or email..."
                     [(ngModel)]="filters.search"
                     (keyup.enter)="loadUsers()">
            </div>
            <div class="col-md-2 mb-2">
              <select class="form-control" [(ngModel)]="filters.profile" (change)="loadUsers()">
                <option value="">All Profiles</option>
                <option *ngFor="let role of allRoles" [value]="role">{{ getProfileDisplayName(role) }}</option>
              </select>
            </div>
            <div class="col-md-2 mb-2">
              <select class="form-control" [(ngModel)]="filters.status" (change)="loadUsers()">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div class="col-md-3 mb-2">
              <select class="form-control" [(ngModel)]="filters.companyId" (change)="loadUsers()">
                <option value="">All Companies</option>
                <option *ngFor="let company of companies" [value]="company._id">{{ company.name }}</option>
              </select>
            </div>
            <div class="col-md-2 mb-2">
              <button class="btn btn-primary btn-block" (click)="loadUsers()">
                <i class="fas fa-search mr-1"></i> Search
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <!-- Users Table -->
        <div class="table-responsive" *ngIf="!isLoading">
          <table class="table align-items-center table-flush">
            <thead class="thead-light">
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Profile</th>
                <th>Company</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users">
                <td>
                  <div class="media align-items-center">
                    <span class="avatar avatar-sm rounded-circle mr-3 bg-primary text-white">
                      {{ getInitials(user.fullname) }}
                    </span>
                    <span class="name mb-0 text-sm">{{ user.fullname }}</span>
                  </div>
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="badge" [ngClass]="getProfileBadgeClass(user.profile)">
                    <i class="fas mr-1" [ngClass]="getProfileIcon(user.profile)"></i>
                    {{ getProfileDisplayName(user.profile) }}
                  </span>
                </td>
                <td>
                  <span *ngIf="user.company?.name">{{ user.company.name }}</span>
                  <span *ngIf="!user.company?.name" class="text-muted">-</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="user.status === 'active' ? 'badge-success' : 'badge-danger'">
                    {{ user.status }}
                  </span>
                </td>
                <td>{{ user.createdAt | date:'MMM d, yyyy' }}</td>
                <td>
                  <div class="dropdown">
                    <button class="btn btn-sm btn-outline-primary dropdown-toggle"
                            type="button"
                            data-toggle="dropdown"
                            (click)="toggleDropdown(user._id)">
                      Actions
                    </button>
                    <div class="dropdown-menu" [class.show]="openDropdownId === user._id">
                      <a class="dropdown-item" href="javascript:void(0)"
                         (click)="toggleStatus(user)">
                        <i class="fas" [ngClass]="user.status === 'active' ? 'fa-ban text-danger' : 'fa-check text-success'"></i>
                        {{ user.status === 'active' ? 'Deactivate' : 'Activate' }}
                      </a>
                    </div>
                  </div>
                </td>
              </tr>
              <tr *ngIf="users.length === 0">
                <td colspan="7" class="text-center text-muted py-4">
                  No users found
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="card-footer" *ngIf="!isLoading && pagination.pages > 1">
          <nav>
            <ul class="pagination justify-content-center mb-0">
              <li class="page-item" [class.disabled]="pagination.page === 1">
                <a class="page-link" href="javascript:void(0)" (click)="goToPage(pagination.page - 1)">
                  <i class="fas fa-angle-left"></i>
                </a>
              </li>
              <li class="page-item" *ngFor="let p of getPageNumbers()" [class.active]="p === pagination.page">
                <a class="page-link" href="javascript:void(0)" (click)="goToPage(p)">{{ p }}</a>
              </li>
              <li class="page-item" [class.disabled]="pagination.page === pagination.pages">
                <a class="page-link" href="javascript:void(0)" (click)="goToPage(pagination.page + 1)">
                  <i class="fas fa-angle-right"></i>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dropdown-menu.show {
      display: block;
    }
  `]
})
export class SuperAdminUsersComponent implements OnInit {
  users: any[] = [];
  companies: CompanyWithStats[] = [];
  isLoading = true;
  openDropdownId: string | null = null;

  allRoles = UserRoles.getAllRoles();

  filters = {
    search: '',
    profile: '',
    status: '',
    companyId: ''
  };

  pagination = {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  };

  constructor(
    private superAdminService: SuperAdminService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.loadCompanies();
    this.loadUsers();
  }

  loadCompanies() {
    this.superAdminService.getAllCompanies({ limit: 100 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.companies = response.data;
        }
      }
    });
  }

  loadUsers() {
    this.isLoading = true;
    this.openDropdownId = null;

    this.superAdminService.getAllUsers({
      page: this.pagination.page,
      limit: this.pagination.limit,
      ...this.filters
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.data;
          this.pagination = {
            ...this.pagination,
            ...response.pagination
          };
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggleDropdown(userId: string) {
    this.openDropdownId = this.openDropdownId === userId ? null : userId;
  }

  toggleStatus(user: any) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    this.superAdminService.updateUserStatus(user._id, newStatus).subscribe({
      next: (response) => {
        if (response.success) {
          user.status = newStatus;
          this.notification.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        }
        this.openDropdownId = null;
      },
      error: (error) => {
        this.notification.error(error.error?.message || 'Error updating user status');
        this.openDropdownId = null;
      }
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.pagination.pages) return;
    this.pagination.page = page;
    this.loadUsers();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.pagination.page - 2);
    const end = Math.min(this.pagination.pages, start + 4);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getProfileDisplayName(profile: string): string {
    return UserRoles.getDisplayName(profile);
  }

  getProfileBadgeClass(profile: string): string {
    return UserRoles.getRoleBadgeClass(profile);
  }

  getProfileIcon(profile: string): string {
    return UserRoles.getRoleIcon(profile);
  }
}
