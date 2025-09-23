import { Routes } from '@angular/router';

import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { IconsComponent } from '../../pages/icons/icons.component';
import { MapsComponent } from '../../pages/maps/maps.component';
import { TakeOffComponent } from '../../pages/new-takeoff/new-takeoff.component';
import { TakeoffMeasurementsComponent } from '../../pages/takeoff-measurements/takeoff-measurements.component';
import { HomeComponent } from '../../pages/home/home.component';
import { TakeoffComponent } from '../../pages/takeoff/takeoff.component';
import { ProfileUserComponent } from '@app/pages/profile-user/profile-user.component';
import { MaterialRequestComponent } from '@app/pages/material-request/material-request.component';
import { ListMaterialRequestComponent } from '@app/pages/list-material-request/list-material-request.component';
import { PasswordChangeGuard } from '../../shared/guards/password-change.guard';

export const AdminLayoutRoutes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [PasswordChangeGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [PasswordChangeGuard] },
  { path: 'take-off/:id', component: TakeOffComponent, canActivate: [PasswordChangeGuard] },
  { path: 'measurements/:id', component: TakeoffMeasurementsComponent, canActivate: [PasswordChangeGuard] },
  { path: 'material-request/:id', component: MaterialRequestComponent, canActivate: [PasswordChangeGuard] },
  { path: 'list-material-request', component: ListMaterialRequestComponent, canActivate: [PasswordChangeGuard] },
  { path: 'user-profile', component: ProfileUserComponent, canActivate: [PasswordChangeGuard] },
  {
    path: 'user-management',
    loadComponent: () => import('../../pages/user-management/user-management.component').then(c => c.UserManagementComponent),
    canActivate: [PasswordChangeGuard]
  },
  {
    path: 'companies',
    loadComponent: () => import('../../pages/companies/companies.component').then(c => c.CompaniesComponent),
    canActivate: [PasswordChangeGuard]
  },
  {
    path: 'company/:id',
    loadComponent: () => import('../../pages/company-detail/company-detail.component').then(c => c.CompanyDetailComponent),
    canActivate: [PasswordChangeGuard]
  },
  { path: 'takeoff', component: TakeoffComponent, canActivate: [PasswordChangeGuard] },
  { path: 'icons', component: IconsComponent, canActivate: [PasswordChangeGuard] },
  { path: 'maps', component: MapsComponent, canActivate: [PasswordChangeGuard] },
];
