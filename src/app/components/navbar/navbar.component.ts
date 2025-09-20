import { Component, OnInit, ElementRef, Input } from '@angular/core';
import { ROUTES } from '../sidebar/sidebar.component';
import {
  Location,
  LocationStrategy,
  PathLocationStrategy,
} from '@angular/common';
import { Router } from '@angular/router';
import { User } from '@app/shared/interfaces';
import { AuthService } from '@app/shared/services';
import { CompanyService } from '@app/shared/services/company.service';
import { Company } from '@app/shared/interfaces/company.interface';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  user;
  currentCompany: Company | null = null;

  public focus;
  public listTitles: any[];
  public location: Location;

  constructor(
    location: Location,
    private element: ElementRef,
    private router: Router,
    private authService: AuthService,
    private companyService: CompanyService
  ) {
    this.location = location;
  }

  ngOnInit() {
    this.listTitles = ROUTES.filter(listTitle => listTitle);

    this.authService.getUser().subscribe(user => {
      this.user = user;
    });

    // Subscribe to company changes
    this.companyService.getCurrentCompany().subscribe(company => {
      this.currentCompany = company;
    });
  }

  getTitle() {
    var titlee = this.location.prepareExternalUrl(this.location.path());
    if (titlee.charAt(0) === '#') {
      titlee = titlee.slice(1);
    }

    for (var item = 0; item < this.listTitles.length; item++) {
      if (this.listTitles[item].path === titlee) {
        return this.listTitles[item].title;
      }
    }
  }

  get isManager() {
    return this.user && this.user.roles && this.user.roles.includes('manager');
  }

  get isSuperAdmin() {
    return this.user && this.user.roles && this.user.roles.includes('super_admin');
  }

  get userRole() {
    return {
      name: this.isManager ? 'Manager' : 'Carpenter',
      icon: this.isManager ? 'fa-user-tie' : 'fa-hammer',
      badgeClass: this.isManager ? 'badge-primary' : 'badge-success'
    };
  }

  navigateToCompany() {
    if (this.currentCompany) {
      this.router.navigate(['/company', this.currentCompany._id]);
    }
  }

  logout() {
    this.authService.signOut();
    this.router.navigateByUrl('/login');
  }
}
