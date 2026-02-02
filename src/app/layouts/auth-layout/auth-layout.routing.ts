import { Routes } from '@angular/router';

import { LoginComponent } from '../../pages/login/login.component';
import { RegisterComponent } from '../../pages/register/register.component';
import { ChangePasswordRequiredComponent } from '../../pages/change-password-required/change-password-required.component';
import { LandingComponent } from '../../pages/landing/landing.component';
import { SubscriptionComponent } from '../../pages/subscription/subscription.component';
import { ForgotPasswordComponent } from '../../pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from '../../pages/reset-password/reset-password.component';

export const AuthLayoutRoutes: Routes = [
    { path: 'hero', component: LandingComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'subscription', component: SubscriptionComponent },
    { path: 'change-password-required', component: ChangePasswordRequiredComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'reset-password', component: ResetPasswordComponent }
];
