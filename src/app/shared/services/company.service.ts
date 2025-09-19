import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Company, CompanyFilters, SendTakeoffRequest, SendTakeoffResponse } from '../interfaces/company.interface';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {

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
    return this.http.get<Company>(`/api/company/${id}`);
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
}