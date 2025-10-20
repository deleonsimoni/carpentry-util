export interface Invoice {
  _id?: string;
  invoiceNumber: string;
  carpenterId: string;
  companyId: string;
  takeoffs: InvoiceTakeoff[];
  totalAmount: number;
  status: 'draft' | 'issued';
  generatedDate?: Date;
  sentDate?: Date;
  paidDate?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InvoiceTakeoff {
  takeoffId: string;
  takeoffNumber: string;
  customerName: string;
  lot?: string;
  amount: number;
  description?: string;
  completedDate: Date;
  role: 'measure' | 'trim'; // Role do carpinteiro neste takeoff
}

export interface InvoiceGroup {
  _id: string;
  invoiceNumber: string;
  carpenterId: string;
  companyId: string;
  takeoffs: InvoiceTakeoff[];
  totalAmount: number;
  status: 'draft' | 'issued';
  generatedDate: Date;
  sentDate?: Date;
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TakeoffForInvoice {
  _id: string;
  takeoffNumber: string;
  lot?: string;
  customer: {
    name: string;
    email?: string;
  };
  totalValue: number;
  status: number;
  completedDate: Date;
  description?: string;
  role: 'measure' | 'trim'; // Role do carpinteiro neste takeoff
  selected?: boolean;
}