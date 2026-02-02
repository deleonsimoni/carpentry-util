import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Invoice, TakeoffForInvoice, InvoiceGroup } from '../interfaces/invoice.interface';
import { InvoiceCalculationResponse } from '../interfaces/invoice-calculation.interface';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}/invoices`;

  constructor(private http: HttpClient) { }

  // Get takeoffs ready for invoice (status >= 3 - UNDER_REVIEW or higher)
  getTakeoffsForInvoice(): Observable<any> {
    const url = `${environment.apiUrl}/takeoff/for-invoice`;
    console.log('🔍 Fetching takeoffs for invoice from:', url);
    return this.http.get(url);
  }

  // Get current invoices (draft/generated)
  getCurrentInvoices(): Observable<any> {
    const mockCurrentInvoices: Invoice[] = [
      {
        _id: 'inv1',
        invoiceNumber: 'INV-2024-001',
        carpenterId: 'carpenter1',
        companyId: 'company1',
        takeoffs: [
          {
            takeoffId: '1',
            takeoffNumber: 'TO-2024-001',
            customerName: 'João Silva',
            amount: 2500.00,
            description: 'Cozinha completa',
            completedDate: new Date('2024-01-15'),
            role: 'trim'
          }
        ],
        totalAmount: 2500.00,
        status: 'draft',
        createdAt: new Date('2024-01-25')
      },
      {
        _id: 'inv2',
        invoiceNumber: 'INV-2024-002',
        carpenterId: 'carpenter1',
        companyId: 'company1',
        takeoffs: [
          {
            takeoffId: '2',
            takeoffNumber: 'TO-2024-002',
            customerName: 'Maria Santos',
            amount: 1800.50,
            description: 'Móveis sala',
            completedDate: new Date('2024-01-18'),
            role: 'measure'
          },
          {
            takeoffId: '3',
            takeoffNumber: 'TO-2024-003',
            customerName: 'Pedro Costa',
            amount: 3200.75,
            description: 'Escritório corporativo',
            completedDate: new Date('2024-01-20'),
            role: 'trim'
          }
        ],
        totalAmount: 5001.25,
        status: 'issued',
        generatedDate: new Date('2024-01-26'),
        createdAt: new Date('2024-01-24')
      }
    ];

    return of({ success: true, data: mockCurrentInvoices });
  }

  // Get invoice history (sent/paid) - Groups de invoices gerados
  getInvoiceHistory(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/invoice/history`);

    /* OLD MOCK DATA - REMOVED
    const mockHistory: InvoiceGroup[] = [
      {
        _id: 'invgrp_001',
        invoiceNumber: 'INV-2024-001',
        carpenterId: 'carpenter1',
        companyId: 'company1',
        takeoffs: [
          {
            takeoffId: '101',
            takeoffNumber: 'TO-2023-045',
            customerName: 'Carlos Mendes',
            amount: 4200.00,
            description: 'Cozinha premium',
            completedDate: new Date('2023-12-15'),
            role: 'trim'
          },
          {
            takeoffId: '102',
            takeoffNumber: 'TO-2023-046',
            customerName: 'Ana Silva',
            amount: 1800.50,
            description: 'Sala de estar',
            completedDate: new Date('2023-12-16'),
            role: 'measure'
          }
        ],
        totalAmount: 6000.50,
        status: 'issued',
        generatedDate: new Date('2023-12-20'),
        createdAt: new Date('2023-12-18')
      },
      {
        _id: 'invgrp_002',
        invoiceNumber: 'INV-2024-002',
        carpenterId: 'carpenter1',
        companyId: 'company1',
        takeoffs: [
          {
            takeoffId: '103',
            takeoffNumber: 'TO-2023-047',
            customerName: 'Luciana Ferreira',
            amount: 2800.50,
            description: 'Armários embutidos',
            completedDate: new Date('2023-12-10'),
            role: 'trim'
          },
          {
            takeoffId: '104',
            takeoffNumber: 'TO-2023-048',
            customerName: 'Roberto Lima',
            amount: 1650.75,
            description: 'Mesa de jantar',
            completedDate: new Date('2023-12-12'),
            role: 'measure'
          },
          {
            takeoffId: '105',
            takeoffNumber: 'TO-2023-049',
            customerName: 'Maria Santos',
            amount: 3200.00,
            description: 'Quarto completo',
            completedDate: new Date('2023-12-14'),
            role: 'trim'
          }
        ],
        totalAmount: 7651.25,
        status: 'issued',
        generatedDate: new Date('2023-12-22'),
        createdAt: new Date('2023-12-20')
      },
      {
        _id: 'invgrp_003',
        invoiceNumber: 'INV-2024-003',
        carpenterId: 'carpenter1',
        companyId: 'company1',
        takeoffs: [
          {
            takeoffId: '106',
            takeoffNumber: 'TO-2024-001',
            customerName: 'Pedro Costa',
            amount: 4500.00,
            description: 'Escritório corporativo',
            completedDate: new Date('2024-01-10'),
            role: 'trim'
          }
        ],
        totalAmount: 4500.00,
        status: 'draft',
        generatedDate: new Date('2024-01-12'),
        createdAt: new Date('2024-01-11')
      }
    ];

    return of({ success: true, data: mockHistory }); */
  }

  // Generate new invoice
  generateInvoice(takeoffIds: string[]): Observable<any> {
    const newInvoice = {
      _id: 'inv_new_' + Date.now(),
      invoiceNumber: 'INV-2024-' + String(Date.now()).slice(-3),
      status: 'draft',
      takeoffIds: takeoffIds
    };

    return of({
      success: true,
      data: newInvoice,
      Message: 'Invoice generated successfully!'
    });
  }

  // Get invoice details
  getInvoiceById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Update invoice status
  updateInvoiceStatus(id: string, status: string): Observable<any> {
    return of({ success: true, message: 'Status updated successfully!' });
  }

  // Delete draft invoice
  deleteInvoice(id: string): Observable<any> {
    return of({ success: true, message: 'Invoice successfully deleted!' });
  }

  // Calculate invoice preview for a takeoff
  calculateInvoicePreview(takeoffId: string): Observable<InvoiceCalculationResponse> {
    return this.http.get<InvoiceCalculationResponse>(`${environment.apiUrl}/invoice/${takeoffId}/preview`);
  }

  // Generate invoice PDF for a takeoff
  generateInvoicePDF(takeoffId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/invoice/${takeoffId}/generate-pdf`);
  }

  // Generate multi-takeoff invoice PDF (up to 5 takeoffs)
  generateMultiTakeoffInvoicePDF(takeoffIds: string[]): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/invoice/generate-multi-takeoff-pdf`, { takeoffIds });
  }

  // Download invoice PDF by invoice ID
  downloadInvoiceById(invoiceId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/invoice/${invoiceId}/download`);
  }
}