import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserRoles } from '@app/shared/constants/user-roles.constants';

export interface CompanyStatsData {
  companyName: string;
  totalTakeoffs: number;
  users: Array<{
    _id: string;
    count: number;
  }>;
  takeoffsByStatus: Array<{
    _id: string;
    count: number;
  }>;
}

@Component({
  selector: 'app-company-stats-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="company-stats-modal">
      <div mat-dialog-title class="modal-header">
        <h3 class="mb-0">
          <i class="fas fa-chart-bar text-info"></i>
          Estatísticas - {{ data.companyName }}
        </h3>
      </div>

      <div mat-dialog-content class="modal-content">
        <!-- Total Takeoffs -->
        <div class="stats-overview mb-4">
          <div class="overview-card">
            <div class="card-icon">
              <i class="fas fa-clipboard-list"></i>
            </div>
            <div class="card-content">
              <h4>{{ data.totalTakeoffs || 0 }}</h4>
              <p>Total de Takeoffs</p>
            </div>
          </div>
        </div>

        <div class="row">
          <!-- Users by Role -->
          <div class="col-md-6" *ngIf="data.users && data.users.length > 0">
            <div class="stats-section">
              <h6 class="section-title">
                <i class="fas fa-users text-primary"></i>
                Usuários por Perfil
              </h6>
              <div class="stats-list">
                <div class="stats-item" *ngFor="let user of data.users">
                  <div class="stats-item-header">
                    <span class="stats-label">{{ getRoleDisplayName(user._id) }}</span>
                    <span class="stats-value">{{ user.count }}</span>
                  </div>
                  <div class="stats-bar">
                    <div class="stats-fill" [style.width.%]="getPercentage(user.count, getTotalUsers())"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Takeoffs by Status -->
          <div class="col-md-6" *ngIf="data.takeoffsByStatus && data.takeoffsByStatus.length > 0">
            <div class="stats-section">
              <h6 class="section-title">
                <i class="fas fa-tasks text-success"></i>
                Takeoffs por Status
              </h6>
              <div class="stats-list">
                <div class="stats-item" *ngFor="let status of data.takeoffsByStatus">
                  <div class="stats-item-header">
                    <span class="stats-label">{{ getStatusDisplayName(status._id) }}</span>
                    <span class="stats-value">{{ status.count }}</span>
                  </div>
                  <div class="stats-bar">
                    <div class="stats-fill"
                         [style.width.%]="getPercentage(status.count, data.totalTakeoffs)"
                         [style.background-color]="getStatusColor(status._id)"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="(!data.users || data.users.length === 0) && (!data.takeoffsByStatus || data.takeoffsByStatus.length === 0)">
          <div class="empty-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <h5>Nenhuma estatística disponível</h5>
          <p>Esta empresa ainda não possui dados suficientes para gerar estatísticas.</p>
        </div>
      </div>

      <div mat-dialog-actions class="modal-actions">
        <button mat-button (click)="close()" class="btn btn-secondary">
          <i class="fas fa-times"></i>
          Fechar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .company-stats-modal {
      min-width: 700px;
      max-width: 900px;
    }

    .modal-header {
      border-bottom: 1px solid #e9ecef;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
    }

    .stats-overview {
      display: flex;
      justify-content: center;
    }

    .overview-card {
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      min-width: 200px;
    }

    .card-icon {
      font-size: 3rem;
      margin-right: 1.5rem;
      opacity: 0.8;
    }

    .card-content h4 {
      font-size: 3rem;
      font-weight: bold;
      margin: 0;
      line-height: 1;
    }

    .card-content p {
      margin: 0;
      opacity: 0.9;
      font-size: 1.1rem;
    }

    .stats-section {
      background: #f8f9fa;
      border-radius: 0.5rem;
      padding: 1.5rem;
      height: 100%;
    }

    .section-title {
      color: #495057;
      font-weight: 600;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stats-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .stats-item {
      background: white;
      padding: 1rem;
      border-radius: 0.375rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stats-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .stats-label {
      font-weight: 500;
      color: #495057;
      text-transform: capitalize;
    }

    .stats-value {
      font-weight: bold;
      color: #007bff;
      font-size: 1.1rem;
    }

    .stats-bar {
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }

    .stats-fill {
      height: 100%;
      background: #007bff;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
      color: #6c757d;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      color: #dee2e6;
    }

    .empty-state h5 {
      margin-bottom: 0.5rem;
      color: #495057;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.9rem;
    }

    .modal-actions {
      border-top: 1px solid #e9ecef;
      padding-top: 1rem;
      margin-top: 1rem;
      display: flex;
      justify-content: flex-end;
    }

    .btn {
      padding: 0.5rem 1.5rem;
      border-radius: 0.375rem;
      font-weight: 500;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }

    @media (max-width: 768px) {
      .company-stats-modal {
        min-width: auto;
        width: 95vw;
      }

      .overview-card {
        flex-direction: column;
        text-align: center;
      }

      .card-icon {
        margin-right: 0;
        margin-bottom: 1rem;
      }
    }
  `]
})
export class CompanyStatsModalComponent {
  constructor(
    public dialogRef: MatDialogRef<CompanyStatsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CompanyStatsData
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  getRoleDisplayName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'manager': 'Gerentes',
      'supervisor': 'Supervisores',
      [UserRoles.CARPENTER]: 'Carpinteiros',
      'delivery': 'Entregadores',
      'super_admin': 'Super Admins'
    };
    return roleNames[role] || role;
  }

  getStatusDisplayName(status: string): string {
    const statusNames: { [key: string]: string } = {
      'pending': 'Pendente',
      'in_progress': 'Em Andamento',
      'completed': 'Concluído',
      'shipped': 'Enviado',
      'delivered': 'Entregue',
      'cancelled': 'Cancelado'
    };
    return statusNames[status] || status;
  }

  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'pending': '#ffc107',
      'in_progress': '#17a2b8',
      'completed': '#28a745',
      'shipped': '#007bff',
      'delivered': '#6f42c1',
      'cancelled': '#dc3545'
    };
    return statusColors[status] || '#007bff';
  }

  getTotalUsers(): number {
    return this.data.users?.reduce((total, user) => total + user.count, 0) || 0;
  }

  getPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }
}