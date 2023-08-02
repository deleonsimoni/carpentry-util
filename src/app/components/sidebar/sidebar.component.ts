import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/shared/services';

declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
}
export const ROUTES: RouteInfo[] = [
  //{ path: '/dashboard', title: 'Dashboard', icon: 'ni-tv-2 text-primary', class: '' },
  //{ path: '/icons', title: 'Icons', icon: 'ni-planet text-blue', class: '' },
  //{ path: '/maps', title: 'Maps', icon: 'ni-pin-3 text-orange', class: '' },
  { path: '/tables', title: 'Home', icon: 'ni-building text-red', class: '' },
  { path: '/user-profile/new', title: 'New Order', icon: 'ni-single-02 text-yellow', class: '' }
  // { path: '/login', title: 'Login', icon: 'ni-key-25 text-info', class: '' },
  // { path: '/register', title: 'Register', icon: 'ni-circle-08 text-pink', class: '' }
];

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  public menuItems: any[];
  public isCollapsed = true;
  user;

  constructor(
    private router: Router,
    private authService: AuthService) { }

  ngOnInit() {

    this.authService.getUser().subscribe(user => {
      this.user = user;
    });

    this.menuItems = ROUTES.filter(menuItem => menuItem);
    this.router.events.subscribe((event) => {
      this.isCollapsed = true;
    });
  }

  logout() {
    this.authService.signOut();
    this.router.navigateByUrl('/login');
  }
}
