import { Component, OnInit, ElementRef, Input } from '@angular/core';
import { ROUTES } from '../sidebar/sidebar.component';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { Router } from '@angular/router';
import { User } from '@app/shared/interfaces';
import { AuthService } from '@app/shared/services';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  user;

  public focus;
  public listTitles: any[];
  public location: Location;

  constructor(
    location: Location,
    private element: ElementRef,
    private router: Router,
    private authService: AuthService) {
    this.location = location;
  }

  ngOnInit() {
    this.listTitles = ROUTES.filter(listTitle => listTitle);

    this.authService.getUser().subscribe(user => {
      this.user = user;
    });
  }

  getTitle() {
    /*var titlee = this.location.prepareExternalUrl(this.location.path());
    if (titlee.charAt(0) === '#') {
      titlee = titlee.slice(1);
    }

    for (var item = 0; item < this.listTitles.length; item++) {
      if (this.listTitles[item].path === titlee) {
        return this.listTitles[item].title;
      }
    }*/
    return 'Dashboard';
  }

}
