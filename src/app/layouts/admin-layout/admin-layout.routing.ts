import { Routes } from '@angular/router';

import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { IconsComponent } from '../../pages/icons/icons.component';
import { MapsComponent } from '../../pages/maps/maps.component';
import { UserProfileComponent } from '../../pages/user-profile/user-profile.component';
import { HomeComponent } from '../../pages/home/home.component';

export const AdminLayoutRoutes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'user-profile/:id', component: UserProfileComponent },
  { path: 'home', component: HomeComponent },
  { path: 'icons', component: IconsComponent },
  { path: 'maps', component: MapsComponent },
];
