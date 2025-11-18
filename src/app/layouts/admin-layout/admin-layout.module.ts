import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ClipboardModule } from '@angular/cdk/clipboard';

import { AdminLayoutRoutes } from './admin-layout.routing';
import { DashboardComponent } from '../../pages/dashboard/dashboard.component';
import { IconsComponent } from '../../pages/icons/icons.component';
import { MapsComponent } from '../../pages/maps/maps.component';
import { TakeOffComponent } from '../../pages/new-takeoff/new-takeoff.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from '@app/shared/shared.module';
import { ProfileUserComponent } from '@app/pages/profile-user/profile-user.component';
import { CarpenterAutocompleteComponent } from '@app/shared/components/carpenter-autocomplete/carpenter-autocomplete.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AdminLayoutRoutes),
    FormsModule,
    HttpClientModule,
    NgbModule,
    ReactiveFormsModule,
    ClipboardModule,
    SharedModule,
    CarpenterAutocompleteComponent,
  ],
  declarations: [
    DashboardComponent,
    TakeOffComponent,
    ProfileUserComponent,
    IconsComponent,
    MapsComponent,
  ],
})
export class AdminLayoutModule {}
