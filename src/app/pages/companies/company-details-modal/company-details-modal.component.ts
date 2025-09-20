import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface CompanyDetailsData {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  businessNumber?: string;
  status: string;
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };
  createdAt: string;
  createdBy?: {
    fullname: string;
    email: string;
  };
}

@Component({
  selector: 'app-company-details-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="company-details-modal">
      <div mat-dialog-title class="modal-header">
        <h3 class="mb-0">
          <i class="ni ni-building text-primary"></i>
          Detalhes da Empresa
        </h3>
      </div>

      <div mat-dialog-content class="modal-content">
        <div class="row">
          <div class="col-12">
            <div class="company-header mb-4">
              <h4 class="company-name">{{ data.name }}</h4>
              <span class="badge" [ngClass]="{
                'badge-success': data.status === 'active',
                'badge-secondary': data.status === 'inactive'
              }">
                {{ data.status | titlecase }}
              </span>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <div class="info-section">
              <h6 class="section-title">Informações de Contato</h6>

              <div class="info-item" *ngIf="data.email">
                <i class="fas fa-envelope text-muted"></i>
                <span class="label">Email:</span>
                <span class="value">{{ data.email }}</span>
              </div>

              <div class="info-item" *ngIf="data.phone">
                <i class="fas fa-phone text-muted"></i>
                <span class="label">Telefone:</span>
                <span class="value">{{ data.phone }}</span>
              </div>

              <div class="info-item" *ngIf="data.website">
                <i class="fas fa-globe text-muted"></i>
                <span class="label">Website:</span>
                <span class="value">
                  <a [href]="data.website" target="_blank">{{ data.website }}</a>
                </span>
              </div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="info-section">
              <h6 class="section-title">Informações Comerciais</h6>

              <div class="info-item" *ngIf="data.industry">
                <i class="fas fa-industry text-muted"></i>
                <span class="label">Setor:</span>
                <span class="value">{{ data.industry }}</span>
              </div>

              <div class="info-item" *ngIf="data.businessNumber">
                <i class="fas fa-id-card text-muted"></i>
                <span class="label">Número de Negócio:</span>
                <span class="value">{{ data.businessNumber }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="row" *ngIf="data.address">
          <div class="col-12">
            <div class="info-section">
              <h6 class="section-title">Endereço</h6>

              <div class="address-block">
                <div *ngIf="data.address.street">{{ data.address.street }}</div>
                <div *ngIf="data.address.city || data.address.province">
                  {{ data.address.city }}<span *ngIf="data.address.city && data.address.province">, </span>{{ data.address.province }}
                </div>
                <div *ngIf="data.address.postalCode">{{ data.address.postalCode }}</div>
                <div *ngIf="data.address.country">{{ data.address.country }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="row" *ngIf="data.createdBy">
          <div class="col-12">
            <div class="info-section">
              <h6 class="section-title">Informações de Criação</h6>

              <div class="info-item">
                <i class="fas fa-user text-muted"></i>
                <span class="label">Criado por:</span>
                <span class="value">{{ data.createdBy.fullname }} ({{ data.createdBy.email }})</span>
              </div>

              <div class="info-item">
                <i class="fas fa-calendar text-muted"></i>
                <span class="label">Data de criação:</span>
                <span class="value">{{ formatDate(data.createdAt) }}</span>
              </div>
            </div>
          </div>
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
    .company-details-modal {
      min-width: 600px;
      max-width: 800px;
    }

    .modal-header {
      border-bottom: 1px solid #e9ecef;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
    }

    .company-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 0.5rem;
    }

    .company-name {
      margin: 0;
      color: #495057;
    }

    .badge {
      font-size: 0.8rem;
      padding: 0.375rem 0.75rem;
      border-radius: 0.375rem;
    }

    .badge-success {
      background-color: #28a745;
      color: white;
    }

    .badge-secondary {
      background-color: #6c757d;
      color: white;
    }

    .info-section {
      margin-bottom: 2rem;
    }

    .section-title {
      color: #495057;
      font-weight: 600;
      border-bottom: 2px solid #007bff;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      margin-bottom: 0.75rem;
      padding: 0.5rem 0;
    }

    .info-item i {
      width: 20px;
      margin-right: 0.75rem;
    }

    .info-item .label {
      font-weight: 600;
      color: #6c757d;
      min-width: 120px;
      margin-right: 0.5rem;
    }

    .info-item .value {
      color: #495057;
    }

    .info-item .value a {
      color: #007bff;
      text-decoration: none;
    }

    .info-item .value a:hover {
      text-decoration: underline;
    }

    .address-block {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 0.375rem;
      border-left: 4px solid #007bff;
    }

    .address-block div {
      margin-bottom: 0.25rem;
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
      .company-details-modal {
        min-width: auto;
        width: 95vw;
      }

      .company-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class CompanyDetailsModalComponent {
  constructor(
    public dialogRef: MatDialogRef<CompanyDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CompanyDetailsData
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}