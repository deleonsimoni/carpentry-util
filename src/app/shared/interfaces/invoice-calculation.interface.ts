/**
 * Invoice Calculation Interfaces
 * For displaying invoice pre-calculation modal
 */

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit?: string;
  unitPrice?: number;
  amount: number;
}

export interface InvoiceCalculation {
  lineItems: InvoiceLineItem[];
  subtotal: number;
  hst: number;
  total: number;
}

export interface InvoiceCalculationPreview {
  takeoffInfo: {
    id: string;
    customerName: string;
    lot: string;
    shipTo: string;
    foremen: string;
    carpInvoice: string;
    status: number;
    carpenter: string;
    manager: string;
    hstRegistrationNumber?: string;
    companyName?: string;
  };
  calculation: InvoiceCalculation;
}

export interface InvoiceCalculationResponse {
  success: boolean;
  message: string;
  data: InvoiceCalculationPreview;
}
