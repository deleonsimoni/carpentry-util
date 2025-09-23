import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardData {
  totalTakeoffs: number;
  takeoffsThisMonth: number;
  takeoffsThisWeek: number;
  takeoffsToday: number;

  // Backward compatibility
  activeUsers?: number;

  // Estatísticas detalhadas por status
  statusStats: {
    created: number;           // Status 1
    toMeasure: number;        // Status 2
    underReview: number;      // Status 3
    readyToShip: number;      // Status 4
    shipped: number;          // Status 5
    trimmingCompleted: number; // Status 6
    backTrimCompleted: number; // Status 7
    closed: number;           // Status 8
    // Backward compatibility properties
    pending?: number;
    inProgress?: number;
    completed?: number;
    other?: number;
  };

  // Estatísticas de produtividade
  productivityStats: {
    avgDaysToComplete: number;
    avgDaysInMeasurement: number;
    avgDaysInReview: number;
    completionRate: number; // Percentage
    onTimeDeliveryRate: number; // Percentage
  };

  // Estatísticas financeiras/volume
  volumeStats: {
    totalValue: number;
    avgOrderValue: number;
    monthlyGrowth: number; // Percentage
    topPerformingCarpenter: string;
  };

  // Estatísticas de usuários
  userStats: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    requirePasswordChange: number;
    managersCount: number;
    carpentersCount: number;
    supervisorsCount: number;
    deliveryCount: number;
  };

  // Dados de gráficos e relatórios
  takeoffsByMonth: Array<{
    _id: { year: number; month: number };
    count: number;
  }>;

  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;

  performanceByUser: Array<{
    userId: string;
    username: string;
    completedTakeoffs: number;
    avgCompletionTime: number;
    rating: number;
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