import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

import { AuthService } from '../services';
import { UserService } from '../services/user.service';

@Injectable({ providedIn: 'root' })
export class PasswordChangeGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.getUser().pipe(
      switchMap(user => {
        if (!user) {
          this.router.navigateByUrl('/login');
          return of(false);
        }

        // Verificar se o usuário precisa trocar senha (exceto managers)
        return this.userService.checkPasswordStatus().pipe(
          map(response => {
            // Managers não são obrigados a trocar senha
            if (user.roles && user.roles.includes('manager')) {
              return true;
            }

            if (response.data.requirePasswordChange) {
              this.router.navigateByUrl('/change-password-required');
              return false;
            }
            return true;
          }),
          catchError(() => {
            // Em caso de erro, permitir continuar
            return of(true);
          })
        );
      }),
      catchError(() => {
        this.router.navigateByUrl('/login');
        return of(false);
      })
    );
  }
}