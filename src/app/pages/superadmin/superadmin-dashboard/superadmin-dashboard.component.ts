import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SuperAdminService, SystemStats } from '@app/shared/services/superadmin.service';
import { UserRoles } from '@app/shared/constants/user-roles.constants';

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="header bg-gradient-danger pb-8 pt-5 pt-md-8">
      <div class="container-fluid">
        <div class="header-body">
          <h2 class="text-white mb-0">Super Admin Dashboard</h2>
          <p class="text-white-50">System-wide overview and statistics</p>
        </div>
      </div>
    </div>

    <div class="container-fluid mt--7">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row" *ngIf="!isLoading && stats">
        <!-- Total Users -->
        <div class="col-xl-3 col-lg-6">
          <div class="card card-stats mb-4 mb-xl-0">
            <div class="card-body">
              <div class="row">
                <div class="col">
                  <h5 class="card-title text-uppercase text-muted mb-0">Total Users</h5>
                  <span class="h2 font-weight-bold mb-0">{{ stats.totals.users }}</span>
                </div>
                <div class="col-auto">
                  <div class="icon icon-shape bg-primary text-white rounded-circle shadow">
                    <i class="fas fa-users"></i>
                  </div>
                </div>
              </div>
              <p class="mt-3 mb-0 text-muted text-sm">
                <span class="text-success mr-2"><i class="fa fa-check"></i> {{ stats.active.users }} active</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Total Companies -->
        <div class="col-xl-3 col-lg-6">
          <div class="card card-stats mb-4 mb-xl-0">
            <div class="card-body">
              <div class="row">
                <div class="col">
                  <h5 class="card-title text-uppercase text-muted mb-0">Total Companies</h5>
                  <span class="h2 font-weight-bold mb-0">{{ stats.totals.companies }}</span>
                </div>
                <div class="col-auto">
                  <div class="icon icon-shape bg-warning text-white rounded-circle shadow">
                    <i class="fas fa-building"></i>
                  </div>
                </div>
              </div>
              <p class="mt-3 mb-0 text-muted text-sm">
                <span class="text-success mr-2"><i class="fa fa-check"></i> {{ stats.active.companies }} active</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Total Takeoffs -->
        <div class="col-xl-3 col-lg-6">
          <div class="card card-stats mb-4 mb-xl-0">
            <div class="card-body">
              <div class="row">
                <div class="col">
                  <h5 class="card-title text-uppercase text-muted mb-0">Total Takeoffs</h5>
                  <span class="h2 font-weight-bold mb-0">{{ stats.totals.takeoffs }}</span>
                </div>
                <div class="col-auto">
                  <div class="icon icon-shape bg-info text-white rounded-circle shadow">
                    <i class="fas fa-clipboard-list"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="col-xl-3 col-lg-6">
          <div class="card card-stats mb-4 mb-xl-0">
            <div class="card-body">
              <div class="row">
                <div class="col">
                  <h5 class="card-title text-uppercase text-muted mb-0">New (30 days)</h5>
                  <span class="h2 font-weight-bold mb-0">{{ stats.recent.users + stats.recent.companies }}</span>
                </div>
                <div class="col-auto">
                  <div class="icon icon-shape bg-success text-white rounded-circle shadow">
                    <i class="fas fa-chart-line"></i>
                  </div>
                </div>
              </div>
              <p class="mt-3 mb-0 text-muted text-sm">
                <span class="text-primary mr-2">{{ stats.recent.users }} users</span>
                <span class="text-warning">{{ stats.recent.companies }} companies</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Details Row -->
      <div class="row mt-4" *ngIf="!isLoading && stats">
        <!-- Users by Profile -->
        <div class="col-xl-6">
          <div class="card shadow">
            <div class="card-header bg-transparent">
              <h3 class="mb-0">Users by Profile</h3>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table align-items-center table-flush">
                  <thead class="thead-light">
                    <tr>
                      <th>Profile</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let profile of stats.usersByProfile">
                      <td>
                        <span class="badge" [ngClass]="getProfileBadgeClass(profile._id)">
                          <i class="fas mr-1" [ngClass]="getProfileIcon(profile._id)"></i>
                          {{ getProfileDisplayName(profile._id) }}
                        </span>
                      </td>
                      <td>{{ profile.count }}</td>
                      <td>
                        <div class="d-flex align-items-center">
                          <span class="mr-2">{{ getPercentage(profile.count) }}%</span>
                          <div class="progress" style="width: 100px; height: 8px;">
                            <div class="progress-bar bg-primary"
                                 role="progressbar"
                                 [style.width.%]="getPercentage(profile.count)">
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Companies -->
        <div class="col-xl-6">
          <div class="card shadow">
            <div class="card-header bg-transparent">
              <h3 class="mb-0">Top Companies by Users</h3>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table align-items-center table-flush">
                  <thead class="thead-light">
                    <tr>
                      <th>Company</th>
                      <th>Users</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let company of stats.topCompanies">
                      <td>
                        <i class="ni ni-building text-primary mr-2"></i>
                        {{ company.name }}
                      </td>
                      <td>
                        <span class="badge badge-primary">{{ company.userCount }}</span>
                      </td>
                    </tr>
                    <tr *ngIf="stats.topCompanies.length === 0">
                      <td colspan="2" class="text-center text-muted">No companies found</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="row mt-4" *ngIf="!isLoading">
        <div class="col-12">
          <div class="card shadow">
            <div class="card-header bg-transparent">
              <h3 class="mb-0">Quick Actions</h3>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4 mb-3">
                  <a [routerLink]="['/superadmin/users']" class="btn btn-primary btn-lg btn-block">
                    <i class="fas fa-users mr-2"></i>
                    Manage All Users
                  </a>
                </div>
                <div class="col-md-4 mb-3">
                  <a [routerLink]="['/superadmin/companies']" class="btn btn-warning btn-lg btn-block">
                    <i class="fas fa-building mr-2"></i>
                    Manage All Companies
                  </a>
                </div>
                <div class="col-md-4 mb-3">
                  <a [routerLink]="['/home']" class="btn btn-outline-secondary btn-lg btn-block">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Back to Regular App
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SuperAdminDashboardComponent implements OnInit {
  stats: SystemStats | null = null;
  isLoading = true;

  constructor(private superAdminService: SuperAdminService) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading = true;
    this.superAdminService.getSystemStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getPercentage(count: number): number {
    if (!this.stats) return 0;
    return Math.round((count / this.stats.totals.users) * 100);
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
