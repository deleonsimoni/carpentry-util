import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  NgModule,
  APP_INITIALIZER,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { SharedModule } from './shared/shared.module';

import { AppComponent } from './app.component';
import { AuthHeaderInterceptor } from './interceptors/header.interceptor';
import { CatchErrorInterceptor } from './interceptors/http-error.interceptor';
import { CompanyHeaderInterceptor } from './shared/interceptors/company-header.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { HeaderComponent } from './header/header.component';
import { AuthService } from './shared/services';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from './components/components.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MaterialRequestComponent } from './pages/material-request/material-request.component';
import { ListMaterialRequestComponent } from './pages/list-material-request/list-material-request.component';

export function appInitializerFactory(authService: AuthService) {
  return () => authService.checkTheUserOnTheFirstLoad();
}

@NgModule({
  imports: [
    BrowserAnimationsModule,
    HttpClientModule,
    SharedModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    ComponentsModule,
    NgbModule,
    RouterModule,
    AppRoutingModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    NgxSpinnerModule,
  ],
  exports: [NgxSpinnerModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    AppComponent,
    HeaderComponent,
    AdminLayoutComponent,
    AuthLayoutComponent,
    MaterialRequestComponent,
    ListMaterialRequestComponent,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthHeaderInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CompanyHeaderInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CatchErrorInterceptor,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFactory,
      multi: true,
      deps: [AuthService],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
