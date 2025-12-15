import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SuperAdminService, CompanyWithStats } from '@app/shared/services/superadmin.service';
import { NotificationService } from '@app/shared/services/notification.service';

@Component({
  selector: 'app-superadmin-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="header bg-gradient-danger pb-8 pt-5 pt-md-8">
      <div class="container-fluid">
        <div class="header-body">
          <h2 class="text-white mb-0">All Companies</h2>
          <p class="text-white-50">Manage all companies in the system</p>
        </div>
      </div>
    </div>

    <div class="container-fluid mt--7">
      <div class="card shadow">
        <div class="card-header border-0">
          <div class="row align-items-center">
            <div class="col">
              <h3 class="mb-0">Companies List</h3>
            </div>
            <div class="col-auto">
              <span class="badge badge-warning">Total: {{ pagination.total }}</span>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="card-body border-bottom">
          <div class="row">
            <div class="col-md-5 mb-2">
              <input type="text"
                     class="form-control"
                     placeholder="Search by company name or email..."
                     [(ngModel)]="filters.search"
                     (keyup.enter)="loadCompanies()">
            </div>
            <div class="col-md-3 mb-2">
              <select class="form-control" [(ngModel)]="filters.status" (change)="loadCompanies()">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div class="col-md-2 mb-2">
              <button class="btn btn-primary btn-block" (click)="loadCompanies()">
                <i class="fas fa-search mr-1"></i> Search
              </button>
            </div>
            <div class="col-md-2 mb-2">
              <button class="btn btn-outline-secondary btn-block" (click)="clearFilters()">
                <i class="fas fa-times mr-1"></i> Clear
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

        <!-- Companies Table -->
        <div class="table-responsive" *ngIf="!isLoading">
          <table class="table align-items-center table-flush">
            <thead class="thead-light">
              <tr>
                <th>Company</th>
                <th>Email</th>
                <th>Users</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let company of companies">
                <td>
                  <div class="media align-items-center">
                    <div class="icon icon-shape bg-warning text-white rounded-circle shadow-sm mr-3"
                         style="width: 36px; height: 36px;">
                      <i class="fas fa-building" style="font-size: 14px;"></i>
                    </div>
                    <span class="name mb-0 text-sm font-weight-bold">{{ company.name }}</span>
                  </div>
                </td>
                <td>{{ company.email || '-' }}</td>
                <td>
                  <span class="badge badge-primary">{{ company.userCount }} users</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="company.status === 'active' ? 'badge-success' : 'badge-danger'">
                    {{ company.status }}
                  </span>
                </td>
                <td>
                  <span *ngIf="company.createdBy">{{ company.createdBy.fullname }}</span>
                  <span *ngIf="!company.createdBy" class="text-muted">-</span>
                </td>
                <td>{{ company.createdAt | date:'MMM d, yyyy' }}</td>
                <td>
                  <div class="dropdown">
                    <button class="btn btn-sm btn-outline-primary dropdown-toggle"
                            type="button"
                            (click)="toggleDropdown(company._id)">
                      Actions
                    </button>
                    <div class="dropdown-menu" [class.show]="openDropdownId === company._id">
                      <a class="dropdown-item" href="javascript:void(0)"
                         [routerLink]="['/superadmin/users']"
                         [queryParams]="{companyId: company._id}">
                        <i class="fas fa-users text-primary"></i>
                        View Users
                      </a>
                      <div class="dropdown-divider"></div>
                      <a class="dropdown-item" href="javascript:void(0)"
                         (click)="toggleStatus(company)">
                        <i class="fas" [ngClass]="company.status === 'active' ? 'fa-ban text-danger' : 'fa-check text-success'"></i>
                        {{ company.status === 'active' ? 'Deactivate' : 'Activate' }}
                      </a>
                    </div>
                  </div>
                </td>
              </tr>
              <tr *ngIf="companies.length === 0">
                <td colspan="7" class="text-center text-muted py-4">
                  No companies found
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
    .icon-shape {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class SuperAdminCompaniesComponent implements OnInit {
  companies: CompanyWithStats[] = [];
  isLoading = true;
  openDropdownId: string | null = null;

  filters = {
    search: '',
    status: ''
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
  }

  loadCompanies() {
    this.isLoading = true;
    this.openDropdownId = null;

    this.superAdminService.getAllCompanies({
      page: this.pagination.page,
      limit: this.pagination.limit,
      ...this.filters
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.companies = response.data;
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

  clearFilters() {
    this.filters = { search: '', status: '' };
    this.pagination.page = 1;
    this.loadCompanies();
  }

  toggleDropdown(companyId: string) {
    this.openDropdownId = this.openDropdownId === companyId ? null : companyId;
  }

  toggleStatus(company: CompanyWithStats) {
    const newStatus = company.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';

    if (company.userCount > 0 && newStatus === 'inactive') {
      if (!confirm(`This company has ${company.userCount} users. Deactivating will also deactivate all users. Continue?`)) {
        this.openDropdownId = null;
        return;
      }
    }

    this.superAdminService.updateCompanyStatus(company._id, newStatus).subscribe({
      next: (response) => {
        if (response.success) {
          company.status = newStatus;
          this.notification.success(`Company ${action}d successfully`);
        }
        this.openDropdownId = null;
      },
      error: (error) => {
        this.notification.error(error.error?.message || `Error ${action}ing company`);
        this.openDropdownId = null;
      }
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.pagination.pages) return;
    this.pagination.page = page;
    this.loadCompanies();
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
}
