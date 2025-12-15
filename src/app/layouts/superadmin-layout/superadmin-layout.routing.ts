import { Routes } from '@angular/router';

export const SuperAdminLayoutRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('../../pages/superadmin/superadmin-dashboard/superadmin-dashboard.component')
      .then(c => c.SuperAdminDashboardComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('../../pages/superadmin/superadmin-users/superadmin-users.component')
      .then(c => c.SuperAdminUsersComponent)
  },
  {
    path: 'companies',
    loadComponent: () => import('../../pages/superadmin/superadmin-companies/superadmin-companies.component')
      .then(c => c.SuperAdminCompaniesComponent)
  }
];
