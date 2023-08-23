import { Routes } from '@angular/router';

import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { IconsComponent } from '../../pages/icons/icons.component';
import { MapsComponent } from '../../pages/maps/maps.component';
import { TakeOffComponent } from '../../pages/new-takeoff/new-takeoff.component';
import { HomeComponent } from '../../pages/home/home.component';
import { ProfileUserComponent } from '@app/pages/profile-user/profile-user.component';
import { MaterialRequestComponent } from '@app/pages/material-request/material-request.component';
import { ListMaterialRequestComponent } from '@app/pages/list-material-request/list-material-request.component';

export const AdminLayoutRoutes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'take-off/:id', component: TakeOffComponent },
  { path: 'material-request/:id', component: MaterialRequestComponent },
  { path: 'list-material-request', component: ListMaterialRequestComponent },
  { path: 'user-profile', component: ProfileUserComponent },
  { path: 'home', component: HomeComponent },
  { path: 'icons', component: IconsComponent },
  { path: 'maps', component: MapsComponent },
];
