import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap, take, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';

interface StoredUserData {
  company?: string;
  activeCompany?: string;
  roles?: string[];
  timestamp: number;
}

@Injectable()
export class CompanyHeaderInterceptor implements HttpInterceptor {
  private static readonly STORAGE_KEY = 'user_company_data';
  private static readonly MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.shouldSkipHeader(req.url)) {
      return next.handle(req);
    }

    const storedData = this.getStoredUserData();
    const companyId = storedData?.activeCompany || storedData?.company;

    if (storedData && companyId && !this.isSuperAdmin(storedData.roles)) {
      return next.handle(this.addCompanyHeader(req, companyId));
    }

    return this.authService.getUser().pipe(
      take(1),
      switchMap(user => {
        if (user) {
          this.storeUserData(user);
          const userCompanyId = user.activeCompany || user.company;

          if (userCompanyId && !user.roles?.includes('super_admin')) {
            return next.handle(this.addCompanyHeader(req, userCompanyId));
          }
        }
        return next.handle(req);
      }),
      catchError(() => next.handle(req))
    );
  }

  private shouldSkipHeader(url: string): boolean {
    return url.includes('/api/auth') || url.includes('/api/user/password-status');
  }

  private addCompanyHeader(req: HttpRequest<any>, companyId: string): HttpRequest<any> {
    return req.clone({ setHeaders: { 'x-company-id': companyId } });
  }

  private storeUserData(user: any): void {
    if (!user) return;

    try {
      const userData: StoredUserData = {
        company: user.company,
        activeCompany: user.activeCompany,
        roles: user.roles,
        timestamp: Date.now()
      };
      localStorage.setItem(CompanyHeaderInterceptor.STORAGE_KEY, JSON.stringify(userData));
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  private getStoredUserData(): StoredUserData | null {
    try {
      const stored = localStorage.getItem(CompanyHeaderInterceptor.STORAGE_KEY);
      if (!stored) return null;

      const data: StoredUserData = JSON.parse(stored);

      if (Date.now() - data.timestamp > CompanyHeaderInterceptor.MAX_AGE_MS) {
        localStorage.removeItem(CompanyHeaderInterceptor.STORAGE_KEY);
        return null;
      }

      return data;
    } catch {
      localStorage.removeItem(CompanyHeaderInterceptor.STORAGE_KEY);
      return null;
    }
  }

  private isSuperAdmin(roles?: string[]): boolean {
    return roles?.includes('super_admin') || false;
  }

  static clearStoredUserData(): void {
    try {
      localStorage.removeItem(CompanyHeaderInterceptor.STORAGE_KEY);
    } catch {
      // Silently fail
    }
  }
}
