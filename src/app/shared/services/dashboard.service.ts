import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardData {
  totalTakeoffs: number;
  activeUsers: number;
  takeoffsThisMonth: number;
  statusStats: {
    pending: number;
    inProgress: number;
    completed: number;
    other: number;
  };
  takeoffsByMonth: Array<{
    _id: { year: number; month: number };
    count: number;
  }>;
  recentTakeoffs: Array<{
    _id: string;
    custumerName: string;
    status: number;
    createdAt: string;
    lot?: string;
    shipTo?: string;
    user?: { fullname: string; email: string };
    carpentry?: { fullname: string; email: string };
  }>;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private http: HttpClient) { }

  getDashboardData(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>('/api/dashboard/data');
  }
}