import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { TakeoffService } from '@app/shared/services/takeoff.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  myOrders;
  user;

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
}
