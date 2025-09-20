import { Routes } from '@angular/router';

import { LoginComponent } from '../../pages/login/login.component';
import { RegisterComponent } from '../../pages/register/register.component';
import { ChangePasswordRequiredComponent } from '../../pages/change-password-required/change-password-required.component';
import { LandingComponent } from '../../pages/landing/landing.component';
import { SubscriptionComponent } from '../../pages/subscription/subscription.component';

export const AuthLayoutRoutes: Routes = [
    { path: '', component: LandingComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'subscription', component: SubscriptionComponent },
    { path: 'change-password-required', component: ChangePasswordRequiredComponent }
];
