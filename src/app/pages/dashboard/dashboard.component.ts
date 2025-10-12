import { Component, OnInit } from '@angular/core';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { DashboardService, DashboardData } from '../../shared/services/dashboard.service';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// core components
import {
  chartOptions,
  parseOptions,
  chartExample1,
  chartExample2
} from "../../variables/charts";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  public datasets: any;
  public data: any;
  public salesChart: any;
  public ordersChart: any;
  public clicked: boolean = true;
  public clicked1: boolean = false;

  // Dashboard data properties
  public dashboardData: DashboardData | null = null;
  public isLoading = true;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.dashboardService.getDashboardData().subscribe({
      next: (response) => {
        this.dashboardData = response.data;
        this.isLoading = false;
        this.initializeCharts();
      },
      error: (error) => {
        // Se for erro de autenticação (401), usar dados mock
        if (error.status === 401) {
          this.loadMockData();
        } else {
          this.isLoading = false;
          this.initializeFallbackCharts();
        }
      }
    });
  }

  initializeCharts(): void {
    if (!this.dashboardData) return;

    // Prepare monthly data for line chart
    const monthlyData = this.prepareMonthlyData();
    this.datasets = [monthlyData, monthlyData.map(val => val * 0.8)];
    this.data = this.datasets[0];

    // Initialize charts after data is loaded
    setTimeout(() => {
      this.setupCharts();
    }, 100);
  }

  initializeFallbackCharts(): void {
    // Fallback data if API fails
    this.datasets = [
      [0, 20, 10, 30, 15, 40, 20, 60, 60],
      [0, 20, 5, 25, 10, 30, 15, 40, 40]
    ];
    this.data = this.datasets[0];

    setTimeout(() => {
      this.setupCharts();
    }, 100);
  }

  setupCharts(): void {
    const chartOrders = document.getElementById('chart-orders') as HTMLCanvasElement;
    const chartSales = document.getElementById('chart-sales') as HTMLCanvasElement;

    if (!chartOrders || !chartSales) return;

    parseOptions(Chart, chartOptions());

    // Status distribution chart (bar chart)
    const statusData = this.dashboardData ? [
      this.dashboardData.statusStats.pending || 0,
      this.dashboardData.statusStats.inProgress || 0,
      this.dashboardData.statusStats.completed || 0,
      this.dashboardData.statusStats.other || 0
    ] : [15, 25, 35, 10];

    this.ordersChart = new Chart(chartOrders, {
      type: 'bar',
      options: {
        ...chartExample2.options,
        plugins: {
          ...chartExample2.options.plugins,
          legend: {
            display: false
          }
        }
      },
      data: {
        labels: ['Pending', 'In Progress', 'Completed', 'Other'],
        datasets: [{
          label: 'Takeoffs',
          data: statusData,
          backgroundColor: ['#fb6340', '#ffd600', '#2dce89', '#11cdef']
        }]
      }
    });

    // Monthly takeoffs chart (line chart)
    this.salesChart = new Chart(chartSales, {
      type: 'line',
      options: chartExample1.options,
      data: {
        ...chartExample1.data,
        datasets: [{
          ...chartExample1.data.datasets[0],
          data: this.data
        }]
      }
    });
  }

  prepareMonthlyData(): number[] {
    if (!this.dashboardData?.takeoffsByMonth) {
      return [0, 20, 10, 30, 15, 40, 20, 60, 60];
    }

    // Create array for last 6 months
    const monthlyData = new Array(6).fill(0);
    const currentDate = new Date();

    this.dashboardData.takeoffsByMonth.forEach(item => {
      const itemDate = new Date(item._id.year, item._id.month - 1);
      const monthsAgo = Math.floor((currentDate.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

      if (monthsAgo >= 0 && monthsAgo < 6) {
        monthlyData[5 - monthsAgo] = item.count;
      }
    });

    return monthlyData;
  }

  public updateOptions() {
    if (this.salesChart) {
      this.salesChart.data.datasets[0].data = this.data;
      this.salesChart.update();
    }
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 1: return 'Pending';
      case 2: return 'In Progress';
      case 3: return 'Completed';
      default: return 'Other';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 1: return 'badge-warning';
      case 2: return 'badge-info';
      case 3: return 'badge-success';
      default: return 'badge-secondary';
    }
  }

  getStatusPercentage(status: string): number {
    if (!this.dashboardData) return 0;

    const total = this.dashboardData.totalTakeoffs;
    if (total === 0) return 0;

    let count = 0;
    switch (status) {
      case 'pending':
        count = this.dashboardData.statusStats.pending || 0;
        break;
      case 'inProgress':
        count = this.dashboardData.statusStats.inProgress || 0;
        break;
      case 'completed':
        count = this.dashboardData.statusStats.completed || 0;
        break;
      case 'other':
        count = this.dashboardData.statusStats.other || 0;
        break;
    }

    return Math.round((count / total) * 100);
  }

  loadMockData(): void {
    // Mock data for development/testing when not authenticated
    this.dashboardData = {
      totalTakeoffs: 45,
      takeoffsThisMonth: 12,
      takeoffsThisWeek: 4,
      takeoffsToday: 1,
      activeUsers: 8,
      statusStats: {
        created: 8,
        toMeasure: 12,
        underReview: 7,
        readyToShip: 5,
        shipped: 3,
        trimmingCompleted: 6,
        backTrimCompleted: 2,
        closed: 15,
        pending: 8,
        inProgress: 27,
        completed: 15,
        other: 0
      },
      productivityStats: {
        avgDaysToComplete: 12.5,
        avgDaysInMeasurement: 3.2,
        avgDaysInReview: 2.1,
        completionRate: 78.5,
        onTimeDeliveryRate: 87.2
      },
      volumeStats: {
        totalValue: 125000,
        avgOrderValue: 2777.78,
        monthlyGrowth: 15.3,
        topPerformingCarpenter: 'John Smith'
      },
      userStats: {
        totalUsers: 12,
        activeUsers: 8,
        inactiveUsers: 4,
        requirePasswordChange: 2,
        managersCount: 2,
        carpentersCount: 6,
        supervisorsCount: 2,
        deliveryCount: 2
      },
      takeoffsByMonth: [
        { _id: { year: 2024, month: 4 }, count: 8 },
        { _id: { year: 2024, month: 5 }, count: 12 },
        { _id: { year: 2024, month: 6 }, count: 15 },
        { _id: { year: 2024, month: 7 }, count: 18 },
        { _id: { year: 2024, month: 8 }, count: 22 },
        { _id: { year: 2024, month: 9 }, count: 25 }
      ],
      statusDistribution: [
        { status: 'Created', count: 8, percentage: 17.8 },
        { status: 'To Measure', count: 12, percentage: 26.7 },
        { status: 'Under Review', count: 7, percentage: 15.6 },
        { status: 'Completed', count: 15, percentage: 33.3 },
        { status: 'Others', count: 3, percentage: 6.7 }
      ],
      performanceByUser: [
        { userId: '1', username: 'John Smith', completedTakeoffs: 8, avgCompletionTime: 10.5, rating: 4.8 },
        { userId: '2', username: 'Mary Johnson', completedTakeoffs: 6, avgCompletionTime: 12.2, rating: 4.6 },
        { userId: '3', username: 'Robert Brown', completedTakeoffs: 4, avgCompletionTime: 14.1, rating: 4.3 }
      ],
      recentTakeoffs: [
        {
          _id: '1',
          custumerName: 'ABC Construction',
          status: 3,
          createdAt: '2024-09-20T10:00:00Z',
          lot: 'LOT-001',
          shipTo: 'Main Office',
          user: { fullname: 'John Smith', email: 'john@example.com' },
          carpentry: { fullname: 'Mary Johnson', email: 'mary@example.com' }
        },
        {
          _id: '2',
          custumerName: 'XYZ Builders',
          status: 2,
          createdAt: '2024-09-19T14:30:00Z',
          lot: 'LOT-002',
          shipTo: 'Site A',
          user: { fullname: 'Robert Brown', email: 'robert@example.com' },
          carpentry: { fullname: 'John Smith', email: 'john@example.com' }
        }
      ]
    };

    this.isLoading = false;
    this.initializeCharts();
  }

}
