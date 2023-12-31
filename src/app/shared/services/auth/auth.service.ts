import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { tap, pluck, catchError } from 'rxjs/operators';

import { User } from '@app/shared/interfaces';

import { TokenStorage } from './token.storage';

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user$ = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient, private tokenStorage: TokenStorage) {}

  login(form: any): Observable<User> {
    return this.http.post<AuthResponse>('/api/auth/login', form).pipe(
      tap(({ token, user }) => {
        this.setUser(user);
        this.tokenStorage.saveToken(token);
      }),
      pluck('user')
    );
  }

  register(form: any): Observable<User> {
    return this.http.post<AuthResponse>('/api/auth/register', form).pipe(
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

  me(): Observable<any | null> {
    return this.http.get<AuthResponse>('/api/auth/me').pipe(
      tap(({ user }) => this.setUser(user)),
      pluck('user'),
      catchError(() => of(null))
    );
  }

  updateUser(form): Observable<any | null> {
    return this.http.post<any>(`/api/auth/me`, form);
  }

  updateImageUser(profilePicName: any, profilePic: any) {
    return this.http.put<any>(`/api/user/updateProfilePic`, {
      name: profilePicName,
      content: profilePic,
    });
  }

  signOut(): void {
    this.tokenStorage.signOut();
    this.setUser(null);
  }

  getAuthorizationHeaders() {
    const token: string | null = this.tokenStorage.getToken() || '';
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Let's try to get user's information if he was logged in previously,
   * thus we can ensure that the user is able to access the `/` (home) page.
   */
  checkTheUserOnTheFirstLoad(): Promise<User | null> {
    return firstValueFrom(this.me());
  }
}
