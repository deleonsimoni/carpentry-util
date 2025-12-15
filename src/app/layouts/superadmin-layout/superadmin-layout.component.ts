import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SuperAdminSidebarComponent } from './superadmin-sidebar/superadmin-sidebar.component';
import { ComponentsModule } from '@app/components/components.module';

@Component({
  selector: 'app-superadmin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SuperAdminSidebarComponent,
    ComponentsModule
  ],
  template: `
    <!-- Sidenav -->
    <app-superadmin-sidebar></app-superadmin-sidebar>
    <div class="main-content d-flex flex-column min-vh-100">
      <!-- Top navbar positioned absolutely to overlay on page content -->
      <div class="navbar-fixed-top">
        <app-navbar></app-navbar>
      </div>
      <!-- Pages -->
      <div class="flex-grow-1">
        <router-outlet></router-outlet>
      </div>
      <div class="container-fluid mt-auto">
        <app-footer></app-footer>
      </div>
    </div>
  `,
  styles: []
})
export class SuperAdminLayoutComponent {}
