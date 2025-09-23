import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Company, CompanyFilters, SendTakeoffRequest, SendTakeoffResponse } from '../interfaces/company.interface';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private currentCompany$ = new BehaviorSubject<Company | null>(null);

  constructor(private http: HttpClient) { }

  getCompanies(filters?: CompanyFilters): Observable<Company[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.isActive !== undefined) {
        params = params.set('isActive', filters.isActive.toString());
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.province) {
        params = params.set('province', filters.province);
      }
      if (filters.industry) {
        params = params.set('industry', filters.industry);
      }
    }

    return this.http.get<Company[]>(`/api/company`, { params });
  }

  getCompanyById(id: string): Observable<Company> {
    return this.http.get<{success: boolean, data: Company}>(`/api/company/${id}`).pipe(
      tap(response => console.log('CompanyService: Raw API response:', response)),
      map(response => response.data),
      catchError(error => {
        console.error('CompanyService: HTTP error in getCompanyById:', error);
        throw error;
      })
    );
  }

  createCompany(company: Company): Observable<Company> {
    return this.http.post<Company>(`/api/company`, company);
  }

  updateCompany(id: string, company: Company): Observable<Company> {
    return this.http.put<Company>(`/api/company/${id}`, company);
  }

  deactivateCompany(id: string): Observable<Company> {
    return this.http.patch<Company>(`/api/company/${id}/deactivate`, {});
  }

  activateCompany(id: string): Observable<Company> {
    return this.http.patch<Company>(`/api/company/${id}/activate`, {});
  }

  sendTakeoffToCompanies(request: SendTakeoffRequest): Observable<SendTakeoffResponse> {
    return this.http.post<SendTakeoffResponse>(`/api/company/send-takeoff`, request);
  }

  // Methods for current company management
  getCurrentCompany(): Observable<Company | null> {
    return this.currentCompany$.asObservable();
  }

  loadCurrentUserCompany(companyId: string): Observable<Company | null> {
    return this.getCompanyById(companyId).pipe(
      tap(company => {
        this.currentCompany$.next(company);
      }),
      catchError(error => {
        console.error('CompanyService: Error loading company:', error);
        console.error('CompanyService: Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        this.currentCompany$.next(null);
        return of(null);
      })
    );
  }

  updateCurrentCompany(companyId: string, companyData: Partial<Company>): Observable<Company> {
    return this.updateCompany(companyId, companyData as Company).pipe(
      tap(company => this.currentCompany$.next(company))
    );
  }

  clearCurrentCompany(): void {
    this.currentCompany$.next(null);
  }
}