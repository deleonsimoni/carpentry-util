import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { NotificationService } from '@app/shared/services/notification.service';

interface Company {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  industry?: string;
  address?: {
    city?: string;
    province?: string;
    country?: string;
  };
  status: string;
  createdAt: string;
  createdBy?: {
    fullname: string;
    email: string;
  };
}

interface CompanyResponse {
  success: boolean;
  data: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Header with stats -->
    <div class="header bg-gradient-primary pb-8 pt-5 pt-md-8">
      <div class="container-fluid">
        <div class="header-body">
          <!-- Card stats -->
          <div class="row">
            <div class="col-xl-3 col-lg-6">
              <div class="card card-stats mb-4 mb-xl-0">
                <div class="card-body">
                  <div class="row">
                    <div class="col">
                      <h5 class="card-title text-uppercase text-muted mb-0">
                        Total Companies
                      </h5>
                      <span class="h2 font-weight-bold mb-0">
                        {{ pagination.total || 0 }}
                      </span>
                    </div>
                    <div class="col-auto">
                      <div class="icon icon-shape bg-primary text-white rounded-circle shadow">
                        <i class="ni ni-building"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-xl-3 col-lg-6">
              <div class="card card-stats mb-4 mb-xl-0">
                <div class="card-body">
                  <div class="row">
                    <div class="col">
                      <h5 class="card-title text-uppercase text-muted mb-0">
                        Active Companies
                      </h5>
                      <span class="h2 font-weight-bold mb-0">
                        {{ getActiveCompaniesCount() }}
                      </span>
                    </div>
                    <div class="col-auto">
                      <div class="icon icon-shape bg-success text-white rounded-circle shadow">
                        <i class="fas fa-check-circle"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-xl-3 col-lg-6">
              <div class="card card-stats mb-4 mb-xl-0">
                <div class="card-body">
                  <div class="row">
                    <div class="col">
                      <h5 class="card-title text-uppercase text-muted mb-0">
                        This Month
                      </h5>
                      <span class="h2 font-weight-bold mb-0">
                        {{ getThisMonthCount() }}
                      </span>
                    </div>
                    <div class="col-auto">
                      <div class="icon icon-shape bg-info text-white rounded-circle shadow">
                        <i class="fas fa-calendar"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-xl-3 col-lg-6">
              <div class="card card-stats mb-4 mb-xl-0">
                <div class="card-body">
                  <div class="row">
                    <div class="col">
                      <h5 class="card-title text-uppercase text-muted mb-0">
                        Industries
                      </h5>
                      <span class="h2 font-weight-bold mb-0">
                        {{ getUniqueIndustries() }}
                      </span>
                    </div>
                    <div class="col-auto">
                      <div class="icon icon-shape bg-warning text-white rounded-circle shadow">
                        <i class="fas fa-industry"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="container-fluid mt--7">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="text-white mb-0">Companies Management</h2>
        <button class="btn btn-primary" (click)="createCompany()">
          <i class="fas fa-plus"></i> New Company
        </button>
      </div>

      <!-- Search and Filters -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row">
            <div class="col-md-4">
              <div class="form-group">
                <label>Search</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="searchTerm"
                  (input)="onSearch()"
                  placeholder="Search by name, email, or city..."
                >
              </div>
            </div>
            <div class="col-md-3">
              <div class="form-group">
                <label>Status</label>
                <select class="form-control" [(ngModel)]="statusFilter" (change)="onFilterChange()">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div class="col-md-3">
              <div class="form-group">
                <label>Items per page</label>
                <select class="form-control" [(ngModel)]="itemsPerPage" (change)="onItemsPerPageChange()">
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
            <div class="col-md-2">
              <div class="form-group">
                <label>&nbsp;</label>
                <button class="btn btn-secondary btn-block" (click)="clearFilters()">
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center p-4">
        <div class="spinner-border" role="status">
          <span class="sr-only">Loading...</span>
        </div>
      </div>

      <!-- Companies Table -->
      <div *ngIf="!loading" class="card">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="thead-dark">
                <tr>
                  <th>Company Name</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Industry</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let company of companies">
                  <td>
                    <strong>{{company.name}}</strong>
                  </td>
                  <td>
                    <div *ngIf="company.email">
                      <i class="fas fa-envelope text-muted"></i> {{company.email}}
                    </div>
                    <div *ngIf="company.phone">
                      <i class="fas fa-phone text-muted"></i> {{company.phone}}
                    </div>
                  </td>
                  <td>
                    <div *ngIf="company.address?.city || company.address?.province">
                      {{company.address?.city}}<span *ngIf="company.address?.city && company.address?.province">, </span>{{company.address?.province}}
                    </div>
                    <div *ngIf="company.address?.country">
                      {{company.address?.country}}
                    </div>
                  </td>
                  <td>{{company.industry || '-'}}</td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'badge-success': company.status === 'active',
                      'badge-secondary': company.status === 'inactive'
                    }">
                      {{company.status | titlecase}}
                    </span>
                  </td>
                  <td>
                    <div *ngIf="company.createdBy">
                      <strong>{{company.createdBy.fullname}}</strong>
                      <br>
                      <small class="text-muted">{{company.createdBy.email}}</small>
                    </div>
                  </td>
                  <td>
                    {{formatDate(company.createdAt)}}
                  </td>
                  <td>
                    <div class="btn-group" role="group">
                      <button class="btn btn-sm btn-outline-primary" (click)="viewCompany(company._id)">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-secondary" (click)="editCompany(company._id)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button
                        class="btn btn-sm"
                        [ngClass]="{
                          'btn-outline-success': company.status === 'inactive',
                          'btn-outline-warning': company.status === 'active'
                        }"
                        (click)="toggleCompanyStatus(company._id, company.status, company.name)"
                        [disabled]="updating === company._id">
                        <i class="fas fa-power-off" *ngIf="updating !== company._id"></i>
                        <i class="fas fa-spinner fa-spin" *ngIf="updating === company._id"></i>
                        {{ company.status === 'active' ? 'Disable' : 'Enable' }}
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="companies.length === 0">
                  <td colspan="8" class="text-center text-muted p-4">
                    No companies found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <nav *ngIf="pagination.pages > 1" aria-label="Companies pagination">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                Showing {{(pagination.page - 1) * pagination.limit + 1}} to
                {{Math.min(pagination.page * pagination.limit, pagination.total)}} of
                {{pagination.total}} companies
              </div>
              <ul class="pagination mb-0">
                <li class="page-item" [class.disabled]="pagination.page === 1">
                  <button class="page-link" (click)="goToPage(pagination.page - 1)" [disabled]="pagination.page === 1">
                    Previous
                  </button>
                </li>
                <li
                  class="page-item"
                  *ngFor="let page of getPageNumbers()"
                  [class.active]="page === pagination.page">
                  <button class="page-link" (click)="goToPage(page)">{{page}}</button>
                </li>
                <li class="page-item" [class.disabled]="pagination.page === pagination.pages">
                  <button class="page-link" (click)="goToPage(pagination.page + 1)" [disabled]="pagination.page === pagination.pages">
                    Next
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./companies.component.scss']
})
export class CompaniesComponent implements OnInit {
  companies: Company[] = [];
  loading = false;
  updating: string | null = null;

  // Pagination
  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  };

  // Filters
  searchTerm = '';
  statusFilter = '';
  itemsPerPage = 10;

  // Search timeout
  private searchTimeout: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.checkAdminAccess();
    this.loadCompanies();
  }

  checkAdminAccess() {
    this.authService.getUser().subscribe(
      user => {
        if (!user || !user.roles?.includes('super_admin')) {
          this.router.navigate(['/home']);
          this.notification.error('Access denied. Super admin role required.', 'Unauthorized');
        }
      },
      err => {
        this.router.navigate(['/login']);
      }
    );
  }

  loadCompanies() {
    this.loading = true;

    const params = new URLSearchParams({
      page: this.pagination.page.toString(),
      limit: this.itemsPerPage.toString()
    });

    if (this.searchTerm.trim()) {
      params.append('search', this.searchTerm.trim());
    }

    if (this.statusFilter) {
      params.append('status', this.statusFilter);
    }

    this.authService.makeRequest('GET', `/company?${params.toString()}`).subscribe(
      (response: CompanyResponse) => {
        this.companies = response.data;
        this.pagination = response.pagination;
        this.loading = false;
      },
      err => {
        console.error('Error loading companies:', err);
        this.notification.error('Error loading companies', 'Error');
        this.loading = false;
      }
    );
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.pagination.page = 1;
      this.loadCompanies();
    }, 500);
  }

  onFilterChange() {
    this.pagination.page = 1;
    this.loadCompanies();
  }

  onItemsPerPageChange() {
    this.pagination.limit = parseInt(this.itemsPerPage.toString());
    this.pagination.page = 1;
    this.loadCompanies();
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '';
    this.itemsPerPage = 10;
    this.pagination.page = 1;
    this.loadCompanies();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.pagination.pages) {
      this.pagination.page = page;
      this.loadCompanies();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const current = this.pagination.page;
    const total = this.pagination.pages;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  createCompany() {
    // Para criar uma nova empresa, vamos para a tela de registro
    this.router.navigate(['/register']);
  }

  viewCompany(id: string) {
    this.router.navigate(['/company', id]);
  }

  editCompany(id: string) {
    this.router.navigate(['/company', id]);
  }

  toggleCompanyStatus(id: string, currentStatus: string, companyName: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'enable' : 'disable';

    if (confirm(`Are you sure you want to ${action} "${companyName}"?`)) {
      this.updating = id;

      this.authService.makeRequest('PATCH', `/company/${id}`, { status: newStatus }).subscribe(
        (response: any) => {
          this.notification.success(`Company ${action}d successfully`, 'Success');
          this.loadCompanies();
          this.updating = null;
        },
        err => {
          console.error('Error updating company status:', err);
          this.notification.error(
            err.error?.message || `Error ${action.slice(0, -1)}ing company`,
            'Error'
          );
          this.updating = null;
        }
      );
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  Math = Math;

  getActiveCompaniesCount(): number {
    return this.companies.filter(company => company.status === 'active').length;
  }

  getThisMonthCount(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return this.companies.filter(company => {
      const createdDate = new Date(company.createdAt);
      return createdDate.getMonth() === currentMonth &&
             createdDate.getFullYear() === currentYear;
    }).length;
  }

  getUniqueIndustries(): number {
    const industries = new Set(
      this.companies
        .filter(company => company.industry)
        .map(company => company.industry)
    );
    return industries.size;
  }
}