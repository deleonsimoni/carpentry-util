import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '@app/shared/services';
import { TakeoffService } from '@app/shared/services/takeoff.service';
import { TakeoffStatusService } from '@app/shared/services/takeoff-status.service';
import { DashboardService, DashboardData } from '@app/shared/services/dashboard.service';
import { TakeoffStatus } from '@app/shared/interfaces/takeoff-status.interface';
import { UserRoles } from '@app/shared/constants/user-roles.constants';
import { NgxSpinnerService } from 'ngx-spinner';
import { NotificationService } from '@app/shared/services/notification.service';
import { TakeoffStatusComponent } from '@app/shared/components/takeoff-status/takeoff-status.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: [],
  imports: [CommonModule, FormsModule, NgbDropdownModule, TakeoffStatusComponent],
  standalone: true
})
export class HomeComponent implements OnInit {
  myOrders;
  filteredOrders;
  user;
  searchTerm = '';
  selectedStatus = '';

  // Dashboard data properties
  public dashboardData: DashboardData | null = null;
  public isLoadingStats = true;

  // Status constants for template
  readonly TakeoffStatus = TakeoffStatus;
  readonly UserRoles = UserRoles;

  constructor(
    private router: Router,
    private takeoffService: TakeoffService,
    private authService: AuthService,
    private notification: NotificationService,
    private spinner: NgxSpinnerService,
    private statusService: TakeoffStatusService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    this.listMyOrders();
    this.loadDashboardStats();
    this.authService.getUser().subscribe(user => (this.user = user));
  }

  loadDashboardStats(): void {
    this.isLoadingStats = true;
    this.dashboardService.getDashboardData().subscribe({
      next: (response) => {
        this.dashboardData = response.data;
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.isLoadingStats = false;
      }
    });
  }

  listMyOrders() {
    this.spinner.show();

    this.takeoffService.getOrdersFromUser().subscribe(
      data => {
        this.spinner.hide();

        if (data.errors) {
          this.notification.error('Error get orders', 'Atenção');
        } else {
          this.myOrders = data;
          this.filteredOrders = data;
        }
      },
      err => {
        this.spinner.hide();
        this.notification.error('Error get orders. ', 'Erro: ');
      }
    );
  }

  geratePDF(idOrder, custumerName) {
    this.spinner.show();

    this.takeoffService.generatePDF(idOrder).subscribe(
      data => {
        if (data.errors) {
          this.spinner.hide();
          this.notification.error('Error generate PDF', 'Atenção');
        } else {
          const link = document.createElement('a');
          link.href = data;
          link.download = `${custumerName}.pdf`;
          link.click();

          this.spinner.hide();
        }
      },
      err => {
        this.spinner.hide();
        this.notification.error('Error generate PDF', 'Erro: ');
      }
    );
  }

  get isManager() {
    return UserRoles.isManager(this.user?.roles || []);
  }

  get isDelivery() {
    return UserRoles.isDelivery(this.user?.roles || []);
  }

  get userRole() {
    if (!this.user?.roles) return UserRoles.CARPENTER;

    if (UserRoles.isManager(this.user.roles)) {
      return UserRoles.MANAGER;
    } else if (UserRoles.isDelivery(this.user.roles)) {
      return UserRoles.DELIVERY;
    } else if (UserRoles.isCarpenter(this.user.roles)) {
      return UserRoles.CARPENTER;
    }
    return UserRoles.CARPENTER; // Default fallback
  }

  newOrder() {
    this.router.navigate(['/take-off', 'new']);
  }

  detailOrder(idOrder) {
    this.router.navigate(['/take-off', idOrder]);
  }

  openMeasurements(idOrder) {
    this.router.navigate(['/measurements', idOrder]);
  }

  onSearchChange() {
    this.applyFilters();
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    if (!this.myOrders) {
      this.filteredOrders = [];
      return;
    }

    let filtered = [...this.myOrders];

    // Apply search filter
    if (this.searchTerm?.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.custumerName?.toLowerCase().includes(searchLower) ||
        order.shipTo?.toLowerCase().includes(searchLower) ||
        order.lot?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (this.selectedStatus !== '') {
      const statusValue = parseInt(this.selectedStatus);
      filtered = filtered.filter(order => order.status === statusValue);
    }

    this.filteredOrders = filtered;
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.filteredOrders = this.myOrders || [];
  }

  getEmptyStateMessage(): string {
    if (this.searchTerm || this.selectedStatus) {
      return 'Try adjusting your filters to see more results.';
    }
    if (this.isManager) {
      return 'Create your first takeoff to get started.';
    }
    return 'No takeoffs assigned to you yet.';
  }

  onStatusChanged(orderId: string, newStatus: number): void {
    this.spinner.show();

    this.statusService.updateTakeoffStatus(orderId, newStatus).subscribe(
      () => {
        this.spinner.hide();
        this.notification.success('Status updated successfully', 'Success');
        this.listMyOrders(); // Refresh the list
      },
      (error) => {
        this.spinner.hide();
        this.notification.error('Error updating status', 'Error');
        console.error('Error updating status:', error);
      }
    );
  }

}
