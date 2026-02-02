import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom, of, Subject } from 'rxjs';
import { tap, pluck, catchError, map } from 'rxjs/operators';
import { User, CompanyOption } from '@app/shared/interfaces';
import { TokenStorage } from './token.storage';
import { CompanyHeaderInterceptor } from '../../interceptors/company-header.interceptor';
import { environment } from '../../../../environments/environment';

interface AuthResponse {
  token: string;
  user: User;
  needsCompanySelection?: boolean;
  companies?: CompanyOption[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user$ = new BehaviorSubject<User | null>(null);
  private companySwitched$ = new Subject<string>();

  constructor(private http: HttpClient, private tokenStorage: TokenStorage) {}

  onCompanySwitch(): Observable<string> {
    return this.companySwitched$.asObservable();
  }

  login(form: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, form).pipe(
      tap((response) => {
        if (response.token) {
          this.tokenStorage.saveToken(response.token);
        }
        if (response.user) {
          this.setUser(response.user);
        }
      })
    );
  }

  selectCompany(companyId: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/select-company`, { companyId }).pipe(
      tap((response) => {
        if (response.token) {
          this.tokenStorage.saveToken(response.token);
        }
        if (response.user) {
          this.setUser(response.user);
          CompanyHeaderInterceptor.clearStoredUserData();
        }
        this.companySwitched$.next(companyId);
      })
    );
  }

  getMyCompanies(): Observable<{ companies: CompanyOption[]; activeCompany: string }> {
    return this.http.get<any>(`${environment.apiUrl}/auth/my-companies`).pipe(
      map(response => ({
        companies: response.companies || [],
        activeCompany: response.activeCompany
      }))
    );
  }

  register(form: any): Observable<User> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, form).pipe(
      tap(({ token, user }) => {
        this.setUser(user);
        this.tokenStorage.saveToken(token);
      }),
      pluck('user')
    );
  }

  setUser(user: User | null): void {
    if (user) {
      user.isAdmin = user.roles.includes('admin');
    }
    this.user$.next(user);
  }

  getUser(): Observable<User | null> {
    return this.user$.asObservable();
  }

  me(): Observable<User | null> {
    return this.http.get<AuthResponse>(`${environment.apiUrl}/auth/me`).pipe(
      tap(({ user }) => this.setUser(user)),
      pluck('user'),
      catchError(() => of(null))
    );
  }

  updateUser(form: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/me`, form);
  }

  updateImageUser(profilePicName: string, profilePic: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/user/updateProfilePic`, {
      name: profilePicName,
      content: profilePic,
    });
  }

  signOut(): void {
    this.tokenStorage.signOut();
    this.setUser(null);
    CompanyHeaderInterceptor.clearStoredUserData();
  }

  getAuthorizationHeaders(): Record<string, string> {
    const token = this.tokenStorage.getToken() || '';
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

    const currentUser = this.user$.value;
    const companyId = currentUser?.activeCompany || currentUser?.company;
    if (companyId) {
      headers['x-company-id'] = companyId;
    }

    return headers;
  }

  checkTheUserOnTheFirstLoad(): Promise<User | null> {
    return firstValueFrom(this.me());
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, { token, password });
  }

  makeRequest(method: string, url: string, body?: any): Observable<any> {
    const fullUrl = `${environment.apiUrl}${url}`;
    const headers = this.getAuthorizationHeaders();

    switch (method.toUpperCase()) {
      case 'GET':
        return this.http.get(fullUrl, { headers });
      case 'POST':
        return this.http.post(fullUrl, body, { headers });
      case 'PUT':
        return this.http.put(fullUrl, body, { headers });
      case 'PATCH':
        return this.http.patch(fullUrl, body, { headers });
      case 'DELETE':
        return this.http.delete(fullUrl, { headers });
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }
}
