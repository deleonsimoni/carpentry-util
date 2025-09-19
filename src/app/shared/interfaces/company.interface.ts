export interface Company {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  businessNumber?: string;
  website?: string;
  contactPerson?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  industry?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompanyFilters {
  isActive?: boolean;
  search?: string;
  province?: string;
  industry?: string;
}

export interface SendTakeoffRequest {
  takeoffId: string;
  companyIds: string[];
}

export interface SendTakeoffResponse {
  success: boolean;
  message: string;
  takeoffId: string;
  companyIds: string[];
  sentBy: string;
  sentAt: Date;
}

export const CANADIAN_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'YT', name: 'Yukon' },
];

export const COMMON_INDUSTRIES = [
  'Construction',
  'Home Building',
  'Renovation',
  'Commercial Construction',
  'Residential Development',
  'Property Management',
  'Real Estate',
  'Architecture',
  'Engineering',
  'Other',
];