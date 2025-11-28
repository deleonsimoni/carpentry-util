import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { UserRoles } from '@app/shared/constants/user-roles.constants';
import { NgxSpinnerService } from 'ngx-spinner';
import { NotificationService } from '@app/shared/services/notification.service';
import { MaterialRequestService } from '@app/shared/services/material-request.service';

@Component({
  selector: 'app-list-material-request',
  templateUrl: './list-material-request.component.html',
  styleUrls: ['./list-material-request.component.scss'],
})
export class ListMaterialRequestComponent implements OnInit {

  datas;
  user;
  searchTerm = '';
  filteredDatas;

  constructor(
    private router: Router,
    private materialRequestService: MaterialRequestService,
    private authService: AuthService,
    private notification: NotificationService,
    private spinner: NgxSpinnerService,
  ) { }

  ngOnInit() {
    this.listMyOrders();
    this.authService.getUser().subscribe(user => (this.user = user));
  }

  newData() {
    this.router.navigate(['/material-request', 'new']);
  }

  getEmptyStateMessage(): string {

    return 'No material request assigned to you yet.';
  }

  clearFilters() {
    this.searchTerm = '';
  }
  listMyOrders() {
    this.spinner.show();

    this.materialRequestService.getFromUser().subscribe(
      data => {
        this.spinner.hide();

        if (data.errors) {
          this.notification.error('Error get material request', 'Alert');
        } else {
          this.datas = data;
          this.filteredDatas = data;
        }
      },
      err => {
        this.spinner.hide();
        this.notification.error('Error get orders. ', 'Error: ');
      }
    );
  }

  detail(id) {
    this.router.navigate(['/material-request', id]);
  }

}
