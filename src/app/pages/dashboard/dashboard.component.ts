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
import { DashboardService, DashboardData } from '@app/shared/services/dashboard.service';

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
        console.error('Error loading dashboard data:', error);
        this.isLoading = false;
        this.initializeFallbackCharts();
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

}
