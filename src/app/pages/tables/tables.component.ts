import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { OrderService } from '@app/shared/services/order.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent implements OnInit {

  myOrders;
  user;

  constructor(
    private router: Router,
    private orderService: OrderService,
    private authService: AuthService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
  ) { }

  ngOnInit() {
    this.listMyOrders();
    this.authService.getUser().subscribe(user => this.user = user);
  }

  listMyOrders() {
    this.spinner.show();

    this.orderService.getOrdersFromUser()
      .subscribe((data) => {
        this.spinner.hide();

        if (data.errors) {
          this.toastr.error('Error get orders', 'Atenção');
        } else {
          this.myOrders = data;
        }

      }, err => {
        this.spinner.hide();
        this.toastr.error('Error get orders. ', 'Erro: ');
      });
  }

  get isCompany() {
    return this.user.roles.includes('company');
  }

  newOrder() {
    this.router.navigate(['/user-profile']);
  }

  detailOrder(idOrder) {
    this.router.navigate(['/user-profile', idOrder]);
  }

}
