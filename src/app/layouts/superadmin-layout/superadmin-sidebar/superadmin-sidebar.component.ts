import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NgbCollapseModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '@app/shared/services';
import { Subscription } from 'rxjs';

interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
}

const SUPERADMIN_ROUTES: RouteInfo[] = [
  { path: '/superadmin/dashboard', title: 'Dashboard', icon: 'ni-tv-2 text-primary', class: '' },
  { path: '/superadmin/users', title: 'All Users', icon: 'ni-single-02 text-blue', class: '' },
  { path: '/superadmin/companies', title: 'All Companies', icon: 'ni-building text-orange', class: '' },
];

@Component({
  selector: 'app-superadmin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbCollapseModule, NgbDropdownModule],
  template: `
    <nav class="navbar navbar-vertical navbar-expand-md navbar-light bg-white" id="sidenav-main">
      <div class="container-fluid">
        <!-- Toggler -->
        <button class="navbar-toggler" type="button" (click)="isCollapsed=!isCollapsed"
          aria-controls="sidenav-collapse-main">
          <span class="navbar-toggler-icon"></span>
        </button>
        <!-- Brand -->
        <a class="navbar-brand pt-0" routerLinkActive="active" [routerLink]="['/superadmin/dashboard']">
          <img src="./assets/img/brand/carpentryLogo2.png" style="height: 150px; max-height: none; padding-bottom: none !important;" class="navbar-brand-img" alt="...">
        </a>

        <!-- User Section -->
        <div class="user-section d-none d-md-block text-center my-3" *ngIf="user">
          <!-- Super Admin Badge -->
          <div class="super-admin-badge mb-2">
            <span class="badge badge-lg badge-danger">
              <i class="fas fa-crown mr-1"></i>
              Super Admin
            </span>
          </div>
          <small class="text-muted">System Administrator</small>
        </div>

        <!-- User -->
        <ul class="nav align-items-center d-md-none">
          <li class="nav-item" ngbDropdown placement="bottom-right">
            <a class="nav-link" role="button" ngbDropdownToggle>
              <div class="media align-items-center">
                <span class="avatar avatar-sm rounded-circle">
                  <img alt="Image placeholder" src="assets/img/theme/user_pic.png">
                </span>
              </div>
            </a>
            <div class="dropdown-menu-arrow dropdown-menu-right" ngbDropdownMenu>
              <div class=" dropdown-header noti-title">
                <h6 class="text-overflow m-0">Welcome {{user?.fullname}}!</h6>
              </div>
              <div class="dropdown-divider"></div>
              <a (click)="logout()" class="dropdown-item">
                <i class="ni ni-user-run"></i>
                <span>Logout</span>
              </a>
            </div>
          </li>
        </ul>

        <!-- Collapse -->
        <div class="collapse navbar-collapse" [ngbCollapse]="isCollapsed" id="sidenav-collapse-main">
          <!-- Collapse header -->
          <div class="navbar-collapse-header d-md-none">
            <div class="row">
              <div class="col-6 collapse-brand">
                <a routerLinkActive="active" [routerLink]="['/superadmin/dashboard']">
                  <img src="./assets/img/brand/carpentryLogo3.png">
                </a>
              </div>
              <div class="col-6 collapse-close">
                <button type="button" class="navbar-toggler" (click)="isCollapsed=!isCollapsed">
                  <span></span>
                  <span></span>
                </button>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <ul class="navbar-nav">
            <li *ngFor="let menuItem of menuItems" class="{{menuItem.class}} nav-item">
              <a routerLinkActive="active" [routerLink]="[menuItem.path]" class="nav-link">
                <i class="ni {{menuItem.icon}}"></i>
                {{menuItem.title}}
              </a>
            </li>
          </ul>

          <!-- Divider -->
          <hr class="my-3">

          <!-- Back to Regular App -->
          <ul class="navbar-nav">
            <li class="nav-item">
              <a [routerLink]="['/home']" class="nav-link text-muted">
                <i class="ni ni-curved-next text-primary"></i>
                Back to Regular App
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    :host ::ng-deep #sidenav-main {
      background: linear-gradient(180deg, #6f42c1 0%, #5a32a3 100%) !important;
    }
    :host ::ng-deep #sidenav-main .navbar-brand-img {
      filter: brightness(0) invert(1);
    }
    :host ::ng-deep #sidenav-main .nav-link {
      color: rgba(255, 255, 255, 0.8) !important;
    }
    :host ::ng-deep #sidenav-main .nav-link:hover {
      color: #fff !important;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.375rem;
    }
    :host ::ng-deep #sidenav-main .nav-link.active {
      color: #fff !important;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 0.375rem;
    }
    :host ::ng-deep #sidenav-main .nav-link i {
      color: rgba(255, 255, 255, 0.7) !important;
    }
    :host ::ng-deep #sidenav-main hr {
      border-color: rgba(255, 255, 255, 0.2);
    }
    :host ::ng-deep #sidenav-main .text-muted {
      color: rgba(255, 255, 255, 0.6) !important;
    }
    .super-admin-badge .badge {
      font-size: 0.9rem;
      padding: 0.5rem 1rem;
    }
    :host ::ng-deep .user-section small {
      color: rgba(255, 255, 255, 0.7) !important;
    }
  `]
})
export class SuperAdminSidebarComponent implements OnInit, OnDestroy {
  menuItems: RouteInfo[] = SUPERADMIN_ROUTES;
  isCollapsed = true;
  user: any;

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const userSub = this.authService.getUser().subscribe(user => {
      this.user = user;
    });
    this.subscriptions.push(userSub);

    const routerSub = this.router.events.subscribe(() => {
      this.isCollapsed = true;
    });
    this.subscriptions.push(routerSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  logout() {
    this.authService.signOut();
    this.router.navigateByUrl('/login');
  }
}
