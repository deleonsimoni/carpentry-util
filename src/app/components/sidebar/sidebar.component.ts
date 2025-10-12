import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { CompanyService } from '@app/shared/services/company.service';
import { Company } from '@app/shared/interfaces/company.interface';
import { UserRoles } from '@app/shared/constants/user-roles.constants';

declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
  superAdminOnly?: boolean;
  carpenterOnly?: boolean;
  managerOnly?: boolean;
  managementOnly?: boolean;
}
export const ROUTES: RouteInfo[] = [
  { path: '/home', title: 'Dashboard', icon: 'ni-tv-2 text-primary', class: '' },
  { path: '/takeoff', title: 'Takeoff', icon: 'ni-building text-red', class: '' },
  {
    path: '/list-material-request',
    title: 'Material Request',
    icon: 'ni-delivery-fast text-blue',
    class: '',
  },
  {
    path: '/calendar',
    title: 'Agenda',
    icon: 'ni-calendar-grid-58 text-info',
    class: '',
    managementOnly: true,
  },
  {
    path: '/invoice',
    title: 'Invoice',
    icon: 'ni-money-coins text-success',
    class: '',
    carpenterOnly: true,
  },
  {
    path: '/user-management',
    title: 'Gestão de Usuários',
    icon: 'ni-single-02 text-green',
    class: '',
  },
  {
    path: '/status-management',
    title: 'Gerenciar Status',
    icon: 'ni-settings text-purple',
    class: '',
    managerOnly: true,
  },
  {
    path: '/companies',
    title: 'Companies',
    icon: 'ni-building text-orange',
    class: '',
    superAdminOnly: true,
  },
  // {
  //   path: '/user-profile',
  //   title: 'Your Profile',
  //   icon: 'ni-single-02 text-yellow',
  //   class: '',
  // },

  //{ path: '/user-profile/new', title: 'New Order', icon: 'ni-single-02 text-yellow', class: '' }
  // { path: '/login', title: 'Login', icon: 'ni-key-25 text-info', class: '' },
  // { path: '/register', title: 'Register', icon: 'ni-circle-08 text-pink', class: '' }
];


@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  public menuItems: any[] = []; // Initialize as empty array
  public isCollapsed = true;
  user;
  currentCompany: Company | null = null;

  constructor(private router: Router, private authService: AuthService, private companyService: CompanyService) {}

  ngOnInit() {
    this.authService.getUser().subscribe(user => {
      this.user = user;
      this.updateMenuItems();

      // Load company information if user has a company
      if (user && user.company) {
        console.log('🔍 Sidebar: User has company, loading company data for ID:', user.company);
        this.companyService.loadCurrentUserCompany(user.company).subscribe(
          company => {
            console.log('✅ Sidebar: Company loaded successfully:', company);
            this.currentCompany = company;
          },
          error => {
            console.error('❌ Sidebar: Error loading company:', error);
            this.currentCompany = null;
          }
        );
      } else {
        console.log('⚠️ Sidebar: User has no company associated');
        this.currentCompany = null;
      }
    });

    // Subscribe to company changes
    this.companyService.getCurrentCompany().subscribe(company => {
      this.currentCompany = company;
    });

    this.router.events.subscribe(event => {
      this.isCollapsed = true;
    });
  }

  private updateMenuItems() {
    if (!this.user) {
      this.menuItems = [];
      return;
    }

    // Start with basic routes
    this.menuItems = [...ROUTES];

    // Remove user management for users who are not admin or manager
    if (!this.isAdmin && !this.isManager) {
      this.menuItems = this.menuItems.filter(item => item.path !== '/user-management');
    }

    // Remove super admin only routes for non-super admin users
    if (!this.isSuperAdmin) {
      this.menuItems = this.menuItems.filter(item => !item.superAdminOnly);
    }

    // Remove carpenter only routes for non-carpenter users
    if (!this.isCarpenter) {
      this.menuItems = this.menuItems.filter(item => !item.carpenterOnly);
    }

    // Remove manager only routes for non-manager users
    if (!this.isManager) {
      this.menuItems = this.menuItems.filter(item => !item.managerOnly);
    }

    // Remove management-only rotas para quem não é manager, supervisor ou admin
    if (!this.canAccessManagementArea) {
      this.menuItems = this.menuItems.filter(item => !item.managementOnly);
    }
  }

  get isManager() {
    return this.user && this.user.roles && UserRoles.isManager(this.user.roles);
  }

  get isSupervisor() {
    return this.user && this.user.roles && UserRoles.isSupervisor(this.user.roles);
  }

  get isAdmin() {
    return this.user && this.user.isAdmin;
  }

  get isSuperAdmin() {
    return this.user && this.user.roles && UserRoles.isSuperAdmin(this.user.roles);
  }

  get isCarpenter() {
    return this.user && this.user.roles && UserRoles.isCarpenter(this.user.roles);
  }

  get canAccessManagementArea() {
    return this.isManager || this.isSupervisor || this.isAdmin || this.isSuperAdmin;
  }

  get userRole() {
    if (this.isSuperAdmin) {
      return {
        name: 'Super Admin',
        icon: 'fa-crown',
        badgeClass: 'badge-danger'
      };
    }

    if (this.user?.isAdmin) {
      return {
        name: 'Admin Global',
        icon: 'fa-crown',
        badgeClass: 'badge-warning'
      };
    }

    if (this.isManager) {
      return {
        name: 'Manager',
        icon: 'fa-user-tie',
        badgeClass: 'badge-primary'
      };
    }

    // Para perfis de funcionários
    const profile = this.user?.profile;
    if (profile === 'manager') {
      return {
        name: 'Manager',
        icon: 'fa-user-tie',
        badgeClass: 'badge-primary'
      };
    }

    if (profile === 'supervisor') {
      return {
        name: 'Supervisor',
        icon: 'fa-user-tie',
        badgeClass: 'badge-info'
      };
    }

    if (profile === 'delivery') {
      return {
        name: 'Delivery',
        icon: 'fa-truck',
        badgeClass: 'badge-success'
      };
    }

    if (profile === UserRoles.CARPENTER) {
      return {
        name: 'Carpenter',
        icon: 'fa-hammer',
        badgeClass: 'badge-warning'
      };
    }

    return {
      name: 'Usuário',
      icon: 'fa-user',
      badgeClass: 'badge-secondary'
    };
  }

  logout() {
    this.authService.signOut();
    this.router.navigateByUrl('/login');
  }
}
