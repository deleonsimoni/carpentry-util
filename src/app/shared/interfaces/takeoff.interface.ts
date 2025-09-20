import { User } from './user.interface';

export interface Carpenter {
  _id: string;
  fullname: string;
  email: string;
}

export interface CarpenterData {
  carpenter: Carpenter | null;
  email: string;
  name: string;
  isFound: boolean;
}

export interface TakeoffOrder {
  _id?: string;
  custumerName: string;
  foremen?: string;
  extrasChecked?: string;
  carpInvoice?: string;
  shipTo?: string;
  lot?: string;
  type?: string;
  elev?: string;
  sqFootage?: string;
  streetName?: string;
  doorsStyle?: string;
  status: number;
  carpentry: Carpenter;
  trimCarpentry?: Carpenter;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TakeoffFormData {
  carpentry: string;
  trimCarpentry?: string;
  custumerName: string;
  foremen?: string;
  extrasChecked?: string;
  carpInvoice?: string;
  shipTo?: string;
  lot?: string;
  type?: string;
  elev?: string;
  sqFootage?: string;
  streetName?: string;
  doorsStyle?: string;
  status?: number;
  carpentryEmail?: string;
  comment?: string;
  cantinaDoors: any[];
  singleDoors: any[];
  frenchDoors: any[];
  doubleDoors: any[];
  arches: any[];
  trim: any[];
  hardware: any[];
  labour: any[];
  shelves: any[];
  closetRods: any[];
  rodSupport: any[];
  roundWindow: any[];
}