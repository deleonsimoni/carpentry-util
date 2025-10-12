import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StatusConfig {
  _id?: string;
  statusId: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  allowedRoles: string[];
  canTransitionTo: number[];
  order: number;
  companyId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatusConfigService {
  private baseUrl = `${environment.apiUrl}/status-config`;

  constructor(private http: HttpClient) {}

  getAllStatusConfigs(): Observable<ApiResponse<StatusConfig[]>> {
    return this.http.get<ApiResponse<StatusConfig[]>>(this.baseUrl);
  }

  createStatusConfig(config: Partial<StatusConfig>): Observable<ApiResponse<StatusConfig>> {
    return this.http.post<ApiResponse<StatusConfig>>(this.baseUrl, config);
  }

  updateStatusConfig(id: string, config: Partial<StatusConfig>): Observable<ApiResponse<StatusConfig>> {
    return this.http.put<ApiResponse<StatusConfig>>(`${this.baseUrl}/${id}`, config);
  }

  deleteStatusConfig(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${id}`);
  }

  getStatusConfigByRole(): Observable<ApiResponse<StatusConfig[]>> {
    return this.http.get<ApiResponse<StatusConfig[]>>(`${this.baseUrl}/by-role`);
  }

  getAvailableTransitions(currentStatusId: number): Observable<ApiResponse<StatusConfig[]>> {
    return this.http.get<ApiResponse<StatusConfig[]>>(`${this.baseUrl}/transitions/${currentStatusId}`);
  }

  getStatusName(statusId: number): string {
    const statusNames: { [key: number]: string } = {
      1: 'Created',
      2: 'To Measure',
      3: 'Under Review',
      4: 'Ready to Ship',
      5: 'Shipped',
      6: 'Trimming Completed',
      7: 'Back Trim Completed',
      8: 'Closed'
    };
    return statusNames[statusId] || 'Unknown';
  }

  getStatusColor(statusId: number): string {
    const statusColors: { [key: number]: string } = {
      1: '#dc3545',
      2: '#fd7e14',
      3: '#ffc107',
      4: '#20c997',
      5: '#17a2b8',
      6: '#6f42c1',
      7: '#e83e8c',
      8: '#28a745'
    };
    return statusColors[statusId] || '#6c757d';
  }

  getStatusIcon(statusId: number): string {
    const statusIcons: { [key: number]: string } = {
      1: 'fas fa-plus-circle',
      2: 'fas fa-ruler',
      3: 'fas fa-eye',
      4: 'fas fa-shipping-fast',
      5: 'fas fa-truck',
      6: 'fas fa-cut',
      7: 'fas fa-hammer',
      8: 'fas fa-check-circle'
    };
    return statusIcons[statusId] || 'fas fa-circle';
  }
}