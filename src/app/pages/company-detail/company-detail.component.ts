import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/shared/services';
import { NotificationService } from '@app/shared/services/notification.service';

interface Company {
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

interface Takeoff {
  _id: string;
  projectName: string;
  status: string;
  createdAt: string;
  user: {
    fullname: string;
    email: string;
  };
  location?: string;
  priority?: string;
}

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header bg-gradient-primary pb-8 pt-5 pt-md-8">
      <div class="container-fluid">
        <div class="header-body">
          <div class="row align-items-center py-4">
            <div class="col-lg-6 col-7">
              <h6 class="h2 text-white d-inline-block mb-0">Detalhes da Empresa</h6>
              <nav aria-label="breadcrumb" class="mb-3">
                <ol class="breadcrumb bg-transparent p-0 mb-2">
                  <li class="breadcrumb-item">
                    <a (click)="goBack()" class="text-white" style="cursor: pointer;">
                      <i class="fas fa-arrow-left mr-2"></i>Back to Companies
                    </a>
                  </li>
                  <li class="breadcrumb-item active text-white-50" aria-current="page">
                    {{ company?.name || 'Company Details' }}
                  </li>
                </ol>
              </nav>
            </div>
            <div class="col-lg-6 col-5 text-right">
              <button class="btn btn-sm btn-neutral" (click)="goBack()">
                <i class="fas fa-arrow-left"></i> Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container-fluid mt--7">
      <!-- Company Information Card -->
      <div class="row">
        <div class="col">
          <div class="card shadow" *ngIf="company">
            <div class="card-header border-0">
              <div class="row align-items-center">
                <div class="col">
                  <h3 class="mb-0">
                    <i class="ni ni-building text-primary"></i>
                    {{ company.name }}
                  </h3>
                </div>
                <div class="col text-right">
                  <span class="badge badge-lg" [ngClass]="{
                    'badge-success': company.status === 'active',
                    'badge-secondary': company.status === 'inactive'
                  }">
                    {{ company.status | titlecase }}
                  </span>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4">
                  <div class="company-info-section">
                    <h5 class="section-title">
                      <i class="fas fa-address-card text-primary"></i>
                      Informações de Contato
                    </h5>
                    <div class="info-list">
                      <div class="info-item" *ngIf="company.email">
                        <strong>Email:</strong>
                        <span>{{ company.email }}</span>
                      </div>
                      <div class="info-item" *ngIf="company.phone">
                        <strong>Telefone:</strong>
                        <span>{{ company.phone }}</span>
                      </div>
                      <div class="info-item" *ngIf="company.website">
                        <strong>Website:</strong>
                        <span>
                          <a [href]="company.website" target="_blank">{{ company.website }}</a>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="company-info-section">
                    <h5 class="section-title">
                      <i class="fas fa-industry text-success"></i>
                      Informações Comerciais
                    </h5>
                    <div class="info-list">
                      <div class="info-item" *ngIf="company.industry">
                        <strong>Setor:</strong>
                        <span>{{ company.industry }}</span>
                      </div>
                      <div class="info-item" *ngIf="company.businessNumber">
                        <strong>Número de Negócio:</strong>
                        <span>{{ company.businessNumber }}</span>
                      </div>
                      <div class="info-item">
                        <strong>Data de Criação:</strong>
                        <span>{{ formatDate(company.createdAt) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="company-info-section" *ngIf="company.address">
                    <h5 class="section-title">
                      <i class="fas fa-map-marker-alt text-info"></i>
                      Endereço
                    </h5>
                    <div class="address-block">
                      <div *ngIf="company.address.street">{{ company.address.street }}</div>
                      <div *ngIf="company.address.city || company.address.province">
                        {{ company.address.city }}<span *ngIf="company.address.city && company.address.province">, </span>{{ company.address.province }}
                      </div>
                      <div *ngIf="company.address.postalCode">{{ company.address.postalCode }}</div>
                      <div *ngIf="company.address.country">{{ company.address.country }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Takeoffs Table -->
      <div class="row mt-4">
        <div class="col">
          <div class="card shadow">
            <div class="card-header border-0">
              <div class="row align-items-center">
                <div class="col">
                  <h3 class="mb-0">
                    <i class="fas fa-clipboard-list text-warning"></i>
                    Takeoffs da Empresa
                  </h3>
                </div>
                <div class="col text-right">
                  <span class="text-muted">
                    Total: {{ takeoffs.length }} takeoff{{ takeoffs.length !== 1 ? 's' : '' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="card-body">
              <!-- Loading -->
              <div *ngIf="loadingTakeoffs" class="text-center p-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="sr-only">Carregando...</span>
                </div>
              </div>

              <!-- Takeoffs Table -->
              <div *ngIf="!loadingTakeoffs" class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="thead-dark">
                    <tr>
                      <th>Projeto</th>
                      <th>Status</th>
                      <th>Localização</th>
                      <th>Responsável</th>
                      <th>Data de Criação</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let takeoff of takeoffs">
                      <td>
                        <strong>{{ takeoff.projectName }}</strong>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="getStatusBadgeClass(takeoff.status)">
                          {{ getStatusDisplayName(takeoff.status) }}
                        </span>
                      </td>
                      <td>{{ takeoff.location || '-' }}</td>
                      <td>
                        <div>
                          <strong>{{ takeoff.user.fullname }}</strong>
                          <br>
                          <small class="text-muted">{{ takeoff.user.email }}</small>
                        </div>
                      </td>
                      <td>{{ formatDate(takeoff.createdAt) }}</td>
                      <td>
                        <button class="btn btn-sm btn-outline-primary" (click)="viewTakeoff(takeoff._id)">
                          <i class="fas fa-eye"></i> Ver
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="takeoffs.length === 0">
                      <td colspan="6" class="text-center text-muted p-4">
                        <i class="fas fa-inbox fa-2x mb-3"></i>
                        <br>
                        Nenhum takeoff encontrado para esta empresa
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./company-detail.component.scss']
})
export class CompanyDetailComponent implements OnInit {
  company: Company | null = null;
  takeoffs: Takeoff[] = [];
  loading = false;
  loadingTakeoffs = false;
  companyId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.companyId = this.route.snapshot.params['id'];
    this.loadCompanyDetails();
    this.loadCompanyTakeoffs();
  }

  loadCompanyDetails() {
    this.loading = true;
    this.authService.makeRequest('GET', `/company/${this.companyId}`).subscribe(
      (response: any) => {
        if (response.success) {
          this.company = response.data;
        }
        this.loading = false;
      },
      err => {
        this.notification.error('Erro ao carregar dados da empresa', 'Erro');
        this.loading = false;
        this.goBack();
      }
    );
  }

  loadCompanyTakeoffs() {
    this.loadingTakeoffs = true;
    this.authService.makeRequest('GET', `/takeoff?companyId=${this.companyId}`).subscribe(
      (response: any) => {
        this.takeoffs = response.data || response || [];
        this.loadingTakeoffs = false;
      },
      err => {
        this.notification.error('Erro ao carregar takeoffs da empresa', 'Erro');
        this.loadingTakeoffs = false;
      }
    );
  }

  viewTakeoff(takeoffId: string) {
    this.router.navigate(['/take-off', takeoffId]);
  }

  goBack() {
    this.router.navigate(['/companies']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'badge-warning',
      'in_progress': 'badge-info',
      'completed': 'badge-success',
      'shipped': 'badge-primary',
      'delivered': 'badge-success',
      'cancelled': 'badge-danger'
    };
    return statusClasses[status] || 'badge-secondary';
  }
}