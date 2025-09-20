import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, take, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';

interface StoredUserData {
  company?: string;
  roles?: string[];
  timestamp: number;
}

@Injectable()
export class CompanyHeaderInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip adding company header for auth endpoints
    if (req.url.includes('/api/auth') || req.url.includes('/api/user/password-status')) {
      return next.handle(req);
    }

    // Try to get company data from localStorage first
    const storedData = this.getStoredUserData();
    if (storedData && storedData.company && !this.isSuperAdmin(storedData.roles)) {
      const modifiedReq = req.clone({
        setHeaders: {
          'x-company-id': storedData.company
        }
      });
      return next.handle(modifiedReq);
    }

    // Fallback to AuthService if no stored data
    return this.authService.getUser().pipe(
      take(1),
      switchMap(user => {
        if (user) {
          // Store user data for future requests
          this.storeUserData(user);

          if (user.company && !user.roles?.includes('super_admin')) {
            const modifiedReq = req.clone({
              setHeaders: {
                'x-company-id': user.company
              }
            });
            return next.handle(modifiedReq);
          }
        }

        // For super_admin or users without company, proceed without header
        return next.handle(req);
      }),
      catchError(() => {
        // If AuthService fails, proceed without header
        return next.handle(req);
      })
    );
  }

  private storeUserData(user: any): void {
    if (!user) return;

    const userData: StoredUserData = {
      company: user.company,
      roles: user.roles,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem('user_company_data', JSON.stringify(userData));
    } catch (error) {
      console.warn('Failed to store user data in localStorage:', error);
    }
  }

  private getStoredUserData(): StoredUserData | null {
    try {
      const stored = localStorage.getItem('user_company_data');
      if (!stored) return null;

      const data: StoredUserData = JSON.parse(stored);

      // Check if data is not older than 24 hours
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (Date.now() - data.timestamp > maxAge) {
        localStorage.removeItem('user_company_data');
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Failed to retrieve user data from localStorage:', error);
      localStorage.removeItem('user_company_data');
      return null;
    }
  }

  private isSuperAdmin(roles?: string[]): boolean {
    return roles?.includes('super_admin') || false;
  }

  // Method to clear stored data (useful for logout)
  static clearStoredUserData(): void {
    try {
      localStorage.removeItem('user_company_data');
    } catch (error) {
      console.warn('Failed to clear user data from localStorage:', error);
    }
  }
}