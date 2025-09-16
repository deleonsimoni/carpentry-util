import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { TakeoffService } from '@app/shared/services/takeoff.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: [],
})
export class HomeComponent implements OnInit {
  myOrders;
  filteredOrders;
  user;
  searchTerm = '';
  selectedStatus = '';

  constructor(
    private router: Router,
    private takeoffService: TakeoffService,
    private authService: AuthService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit() {
    this.listMyOrders();
    this.authService.getUser().subscribe(user => (this.user = user));
  }

  listMyOrders() {
    this.spinner.show();

    this.takeoffService.getOrdersFromUser().subscribe(
      data => {
        this.spinner.hide();

        if (data.errors) {
          this.toastr.error('Error get orders', 'Atenção');
        } else {
          this.myOrders = data;
          this.filteredOrders = data;
        }
      },
      err => {
        this.spinner.hide();
        this.toastr.error('Error get orders. ', 'Erro: ');
      }
    );
  }

  geratePDF(idOrder, custumerName) {
    this.spinner.show();

    this.takeoffService.generatePDF(idOrder).subscribe(
      data => {
        if (data.errors) {
          this.spinner.hide();
          this.toastr.error('Error generate PDF', 'Atenção');
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
        this.toastr.error('Error generate PDF', 'Erro: ');
      }
    );
  }

  get isCompany() {
    return this.user.roles.includes('company');
  }

  newOrder() {
    this.router.navigate(['/take-off', 'new']);
  }

  detailOrder(idOrder) {
    this.router.navigate(['/take-off', idOrder]);
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
      filtered = filtered.filter(order => {
        if (statusValue >= 3) {
          return order.status >= 3; // Completed includes status 3 and above
        }
        return order.status === statusValue;
      });
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
    if (this.isCompany) {
      return 'Create your first takeoff to get started.';
    }
    return 'No takeoffs assigned to you yet.';
  }
}
