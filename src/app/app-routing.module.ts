import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { AuthGuard } from './shared/guards';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('src/app/layouts/auth-layout/auth-layout.module').then(
            m => m.AuthLayoutModule
          ),
      },
    ],
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('src/app/layouts/admin-layout/admin-layout.module').then(
            m => m.AdminLayoutModule
          ),
      },
    ],
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];

@NgModule({
  imports: [CommonModule, BrowserModule, RouterModule.forRoot(routes, {})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
