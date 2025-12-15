import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SystemStats {
  totals: {
    users: number;
    companies: number;
    takeoffs: number;
  };
  active: {
    users: number;
    companies: number;
  };
  usersByProfile: Array<{ _id: string; count: number }>;
  topCompanies: Array<{ name: string; userCount: number }>;
  recent: {
    users: number;
    companies: number;
  };
}

export interface CompanyWithStats {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  createdAt: string;
  createdBy?: {
    fullname: string;
    email: string;
  };
  userCount: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class SuperAdminService {
  private baseUrl = '/api/superadmin';

  constructor(private http: HttpClient) {}

  getSystemStats(): Observable<{ success: boolean; data: SystemStats }> {
    return this.http.get<{ success: boolean; data: SystemStats }>(`${this.baseUrl}/stats`);
  }

  getAllUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    profile?: string;
    status?: string;
    companyId?: string;
  } = {}): Observable<PaginatedResponse<any>> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.profile) httpParams = httpParams.set('profile', params.profile);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.companyId) httpParams = httpParams.set('companyId', params.companyId);

    return this.http.get<PaginatedResponse<any>>(`${this.baseUrl}/users`, { params: httpParams });
  }

  getAllCompanies(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}): Observable<PaginatedResponse<CompanyWithStats>> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);

    return this.http.get<PaginatedResponse<CompanyWithStats>>(`${this.baseUrl}/companies`, { params: httpParams });
  }

  getUsersByCompany(companyId: string, params: {
    page?: number;
    limit?: number;
  } = {}): Observable<PaginatedResponse<any>> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<PaginatedResponse<any>>(`${this.baseUrl}/users/company/${companyId}`, { params: httpParams });
  }

  updateUserStatus(userId: string, status: 'active' | 'inactive'): Observable<any> {
    return this.http.patch(`${this.baseUrl}/users/${userId}/status`, { status });
  }

  updateCompanyStatus(companyId: string, status: 'active' | 'inactive'): Observable<any> {
    return this.http.patch(`${this.baseUrl}/companies/${companyId}/status`, { status });
  }
}
