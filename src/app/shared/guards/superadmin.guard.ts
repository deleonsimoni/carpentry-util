import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services';
import { UserRoles } from '../constants/user-roles.constants';

@Injectable({ providedIn: 'root' })
export class SuperAdminGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(): Observable<boolean> {
    return this.authService.getUser().pipe(
      map(user => {
        if (user && UserRoles.isSuperAdmin(user.roles)) {
          return true;
        }

        // Redirect to regular home if not super admin
        this.router.navigateByUrl('/home');
        return false;
      })
    );
  }
}
