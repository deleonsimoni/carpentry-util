import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../services';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) { }

  canActivate(): Observable<boolean> {
    console.log('🔍 AUTH_GUARD - Verificando autenticação...');
    return this.authService.getUser().pipe(
      map(user => {
        console.log('🔍 AUTH_GUARD - Usuário obtido:', user);
        if (user !== null) {
          console.log('✅ AUTH_GUARD - Usuário autenticado, permitindo acesso');
          return true;
        }

        console.log('❌ AUTH_GUARD - Usuário não autenticado, redirecionando para /hero');
        this.router.navigateByUrl('/hero');
        return false;
      })
    );
  }
}
