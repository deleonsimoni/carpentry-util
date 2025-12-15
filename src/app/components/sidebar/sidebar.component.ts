import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { CompanyService } from '@app/shared/services/company.service';
import { NotificationService } from '@app/shared/services/notification.service';
import { Company } from '@app/shared/interfaces/company.interface';
import { CompanyOption } from '@app/shared/interfaces';
import { UserRoles } from '@app/shared/constants/user-roles.constants';
import { Subscription } from 'rxjs';

declare interface SubRouteInfo {
  path: string;
  title: string;
  icon: string;
}

declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
  superAdminOnly?: boolean;
  carpenterOnly?: boolean;
  managerOnly?: boolean;
  managementOnly?: boolean;
  children?: SubRouteInfo[];
}

export const ROUTES: RouteInfo[] = [
  { path: '/home', title: 'Dashboard', icon: 'ni-tv-2 text-primary', class: '' },
  { path: '/takeoff', title: 'Takeoff', icon: 'ni-building text-red', class: '' },
  { path: '/list-material-request', title: 'Material Request', icon: 'ni-delivery-fast text-blue', class: '' },
  {
    path: '/schedule',
    title: 'Schedule',
    icon: 'ni-calendar-grid-58 text-info',
    class: '',
    managementOnly: true,
    children: [
      { path: '/schedule/production', title: 'Production', icon: 'ni-settings text-primary' },
      { path: '/schedule/shipping', title: 'Shipping', icon: 'ni-send text-warning' },
      { path: '/schedule/first-trim', title: 'First Trim', icon: 'ni-shop text-info' },
      { path: '/schedule/second-trim', title: 'Second Trim', icon: 'ni-check-bold text-success' },
    ]
  },
  { path: '/invoice', title: 'Invoice', icon: 'ni-money-coins text-success', class: '', carpenterOnly: true },
  { path: '/status-management', title: 'Status Management', icon: 'ni-settings text-purple', class: '', managerOnly: true },
  { path: '/companies', title: 'Companies', icon: 'ni-building text-orange', class: '', superAdminOnly: true },
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  menuItems: RouteInfo[] = [];
  isCollapsed = true;
  expandedMenus: { [key: string]: boolean } = {};
  user: any;
  currentCompany: Company | null = null;

  userCompanies: CompanyOption[] = [];
  showCompanyDropdown = false;
  isSwitchingCompany = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private companyService: CompanyService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    const userSub = this.authService.getUser().subscribe(user => {
      this.user = user;
      this.updateMenuItems();

      if (!user) {
        this.currentCompany = null;
        return;
      }

      const companyId = user.activeCompany || user.company;
      if (companyId) {
        this.loadCompanyData(companyId);
      }
      this.loadUserCompanies();
    });
    this.subscriptions.push(userSub);

    const companySub = this.companyService.getCurrentCompany().subscribe(company => {
      this.currentCompany = company;
    });
    this.subscriptions.push(companySub);

    const routerSub = this.router.events.subscribe(() => {
      this.isCollapsed = true;
      this.showCompanyDropdown = false;
    });
    this.subscriptions.push(routerSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadCompanyData(companyId: string): void {
    this.companyService.loadCurrentUserCompany(companyId).subscribe({
      next: (company) => this.currentCompany = company,
      error: () => this.currentCompany = null
    });
  }

  private loadUserCompanies(): void {
    if (this.isSuperAdmin) return;

    this.authService.getMyCompanies().subscribe({
      next: (response) => this.userCompanies = response.companies || [],
      error: () => this.userCompanies = []
    });
  }

  toggleSubmenu(menuPath: string): void {
    this.expandedMenus[menuPath] = !this.expandedMenus[menuPath];
  }

  isSubmenuExpanded(menuPath: string): boolean {
    return this.expandedMenus[menuPath] || false;
  }

  isChildActive(menuItem: RouteInfo): boolean {
    return menuItem.children?.some(child => this.router.url === child.path) || false;
  }

  toggleCompanyDropdown(): void {
    if (!this.hasMultipleCompanies) return;
    this.showCompanyDropdown = !this.showCompanyDropdown;
  }

  switchCompany(companyId: string): void {
    const currentId = this.user?.activeCompany || this.user?.company;
    if (!companyId || companyId === currentId) {
      this.showCompanyDropdown = false;
      return;
    }

    this.isSwitchingCompany = true;
    this.authService.selectCompany(companyId).subscribe({
      next: (response: any) => {
        this.isSwitchingCompany = false;
        this.showCompanyDropdown = false;

        if (response.user?.company) {
          this.loadCompanyData(response.user.company);
        }

        const companyName = this.userCompanies.find(c => c._id === companyId)?.name || 'Company';
        this.notification.success(`Switched to ${companyName}`, 'Company Changed');

        // Reload current page to refresh data
        window.location.reload();
      },
      error: (error) => {
        this.isSwitchingCompany = false;
        this.notification.error(error.error?.message || 'Error switching company', 'Error');
      }
    });
  }

  get hasMultipleCompanies(): boolean {
    return this.userCompanies.length > 1;
  }

  get otherCompanies(): CompanyOption[] {
    const currentId = this.user?.activeCompany || this.user?.company;
    return this.userCompanies.filter(c => c._id !== currentId);
  }

  private updateMenuItems() {
    if (!this.user) {
      this.menuItems = [];
      return;
    }

    this.menuItems = ROUTES.filter(item => {
      if (item.superAdminOnly && !this.isSuperAdmin) return false;
      if (item.carpenterOnly && !this.isCarpenter) return false;
      if (item.managerOnly && !this.isManager) return false;
      if (item.managementOnly && !this.canAccessManagementArea) return false;
      return true;
    });
  }

  get isManager() {
    return this.user?.roles && UserRoles.isManager(this.user.roles);
  }

  get isSupervisor() {
    return this.user?.roles && UserRoles.isSupervisor(this.user.roles);
  }

  get isAdmin() {
    return this.user?.isAdmin;
  }

  get isSuperAdmin() {
    return this.user?.roles && UserRoles.isSuperAdmin(this.user.roles);
  }

  get isCarpenter() {
    return this.user?.roles && UserRoles.isCarpenter(this.user.roles);
  }

  get canAccessManagementArea() {
    return this.isManager || this.isSupervisor || this.isAdmin || this.isSuperAdmin;
  }

  get userRole() {
    if (this.isSuperAdmin) return { name: 'Super Admin', icon: 'fa-crown', badgeClass: 'badge-danger' };
    if (this.user?.isAdmin) return { name: 'Admin Global', icon: 'fa-crown', badgeClass: 'badge-warning' };
    if (this.isManager) return { name: 'Manager', icon: 'fa-user-tie', badgeClass: 'badge-primary' };

    const profile = this.user?.profile;
    if (profile === 'manager') return { name: 'Manager', icon: 'fa-user-tie', badgeClass: 'badge-primary' };
    if (profile === 'supervisor') return { name: 'Supervisor', icon: 'fa-user-tie', badgeClass: 'badge-info' };
    if (profile === 'delivery') return { name: 'Delivery', icon: 'fa-truck', badgeClass: 'badge-success' };
    if (profile === UserRoles.CARPENTER) return { name: 'Carpenter', icon: 'fa-hammer', badgeClass: 'badge-warning' };

    return { name: 'User', icon: 'fa-user', badgeClass: 'badge-secondary' };
  }

  logout() {
    this.authService.signOut();
    this.router.navigateByUrl('/login');
  }
}
