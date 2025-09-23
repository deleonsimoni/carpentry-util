import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { DashboardService, DashboardData } from '../../shared/services/dashboard.service';

Chart.register(...registerables);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statusChart', { static: false }) statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendsChart', { static: false }) trendsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('performanceChart', { static: false }) performanceChartRef!: ElementRef<HTMLCanvasElement>;

  dashboardData: DashboardData | null = null;
  lastUpdated: Date = new Date();
  isLoading = false;


  private statusChart: Chart | null = null;
  private trendsChart: Chart | null = null;
  private performanceChart: Chart | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  loadDashboardData(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboardData = response.data;
          this.lastUpdated = new Date();
          this.updateCharts();
        }
      },
      error: (error) => {
        this.loadMockData();
      }
    });
  }

  private loadMockData(): void {
    this.dashboardData = {
      totalTakeoffs: 1247,
      takeoffsThisMonth: 89,
      takeoffsThisWeek: 23,
      takeoffsToday: 5,
      statusStats: {
        created: 45,
        toMeasure: 32,
        underReview: 18,
        readyToShip: 12,
        shipped: 8,
        trimmingCompleted: 15,
        backTrimCompleted: 6,
        closed: 156
      },
      productivityStats: {
        avgDaysToComplete: 12.5,
        avgDaysInMeasurement: 3.2,
        avgDaysInReview: 2.1,
        completionRate: 94.2,
        onTimeDeliveryRate: 87.5
      },
      volumeStats: {
        totalValue: 2847593,
        avgOrderValue: 18750,
        monthlyGrowth: 12.3,
        topPerformingCarpenter: 'John Silva'
      },
      userStats: {
        totalUsers: 45,
        activeUsers: 38,
        inactiveUsers: 7,
        requirePasswordChange: 3,
        managersCount: 8,
        carpentersCount: 25,
        supervisorsCount: 7,
        deliveryCount: 5
      },
      takeoffsByMonth: [
        { _id: { year: 2024, month: 8 }, count: 95 },
        { _id: { year: 2024, month: 9 }, count: 87 },
        { _id: { year: 2024, month: 10 }, count: 103 },
        { _id: { year: 2024, month: 11 }, count: 89 },
        { _id: { year: 2024, month: 12 }, count: 78 },
        { _id: { year: 2025, month: 1 }, count: 92 }
      ],
      statusDistribution: [
        { status: 'Created', count: 45, percentage: 15.2 },
        { status: 'To Measure', count: 32, percentage: 10.8 },
        { status: 'Under Review', count: 18, percentage: 6.1 },
        { status: 'Ready to Ship', count: 12, percentage: 4.1 },
        { status: 'Completed', count: 156, percentage: 52.7 },
        { status: 'Others', count: 33, percentage: 11.1 }
      ],
      performanceByUser: [
        { userId: '1', username: 'John Silva', completedTakeoffs: 45, avgCompletionTime: 11.2, rating: 4.8 },
        { userId: '2', username: 'Maria Santos', completedTakeoffs: 38, avgCompletionTime: 13.1, rating: 4.6 },
        { userId: '3', username: 'Carlos Oliveira', completedTakeoffs: 32, avgCompletionTime: 14.5, rating: 4.4 },
        { userId: '4', username: 'Ana Costa', completedTakeoffs: 28, avgCompletionTime: 12.8, rating: 4.7 },
        { userId: '5', username: 'Pedro Lima', completedTakeoffs: 25, avgCompletionTime: 15.2, rating: 4.3 }
      ],
      recentTakeoffs: [
        { _id: '1', custumerName: 'ABC Construction', status: 2, createdAt: '2025-01-15T10:30:00Z', lot: 'Lot 45A', shipTo: 'Downtown' },
        { _id: '2', custumerName: 'XYZ Builders', status: 3, createdAt: '2025-01-15T09:15:00Z', lot: 'Lot 23B', shipTo: 'Uptown' },
        { _id: '3', custumerName: 'MegaCorp Inc', status: 1, createdAt: '2025-01-15T08:45:00Z', lot: 'Lot 12C', shipTo: 'Industrial' },
        { _id: '4', custumerName: 'Small Business Co', status: 4, createdAt: '2025-01-14T16:20:00Z', lot: 'Lot 67D', shipTo: 'Suburb' },
        { _id: '5', custumerName: 'Enterprise LLC', status: 8, createdAt: '2025-01-14T14:10:00Z', lot: 'Lot 89E', shipTo: 'Metro' }
      ]
    };
    this.updateCharts();
  }

  private initializeCharts(): void {
    if (this.statusChartRef && this.trendsChartRef && this.performanceChartRef) {
      this.createStatusChart();
      this.createTrendsChart();
      this.createPerformanceChart();
    }
  }

  private updateCharts(): void {
    if (this.dashboardData) {
      this.updateStatusChart();
      this.updateTrendsChart();
      this.updatePerformanceChart();
    }
  }

  private createStatusChart(): void {
    if (!this.statusChartRef || !this.dashboardData) return;

    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut' as ChartType,
      data: {
        labels: this.dashboardData.statusDistribution.map(item => item.status),
        datasets: [{
          data: this.dashboardData.statusDistribution.map(item => item.count),
          backgroundColor: [
            '#17a2b8',
            '#ffc107',
            '#fd7e14',
            '#6f42c1',
            '#28a745',
            '#6c757d'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          }
        }
      }
    };

    this.statusChart = new Chart(ctx, config);
  }

  private createTrendsChart(): void {
    if (!this.trendsChartRef || !this.dashboardData) return;

    const ctx = this.trendsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.dashboardData.takeoffsByMonth.map(item =>
      `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`
    );

    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels: labels,
        datasets: [{
          label: 'Takeoffs Created',
          data: this.dashboardData.takeoffsByMonth.map(item => item.count),
          borderColor: '#4facfe',
          backgroundColor: 'rgba(79, 172, 254, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          }
        }
      }
    };

    this.trendsChart = new Chart(ctx, config);
  }

  private createPerformanceChart(): void {
    if (!this.performanceChartRef || !this.dashboardData) return;

    const ctx = this.performanceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels: this.dashboardData.performanceByUser.map(user => user.username),
        datasets: [{
          label: 'Completed Takeoffs',
          data: this.dashboardData.performanceByUser.map(user => user.completedTakeoffs),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          }
        }
      }
    };

    this.performanceChart = new Chart(ctx, config);
  }

  private updateStatusChart(): void {
    if (this.statusChart && this.dashboardData) {
      this.statusChart.data.labels = this.dashboardData.statusDistribution.map(item => item.status);
      this.statusChart.data.datasets[0].data = this.dashboardData.statusDistribution.map(item => item.count);
      this.statusChart.update();
    }
  }

  private updateTrendsChart(): void {
    if (this.trendsChart && this.dashboardData) {
      const labels = this.dashboardData.takeoffsByMonth.map(item =>
        `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`
      );
      this.trendsChart.data.labels = labels;
      this.trendsChart.data.datasets[0].data = this.dashboardData.takeoffsByMonth.map(item => item.count);
      this.trendsChart.update();
    }
  }

  private updatePerformanceChart(): void {
    if (this.performanceChart && this.dashboardData) {
      this.performanceChart.data.labels = this.dashboardData.performanceByUser.map(user => user.username);
      this.performanceChart.data.datasets[0].data = this.dashboardData.performanceByUser.map(user => user.completedTakeoffs);
      this.performanceChart.update();
    }
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    if (this.statusChart) {
      this.statusChart.destroy();
    }
    if (this.trendsChart) {
      this.trendsChart.destroy();
    }
    if (this.performanceChart) {
      this.performanceChart.destroy();
    }
  }
}