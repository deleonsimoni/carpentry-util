export interface User {
  _id: string;
  fullname: string;
  email: string;
  createdAt: string;
  roles: string[];
  isAdmin: boolean;
  profile?: 'supervisor' | 'delivery' | 'manager' | 'carpinter';
  status?: 'active' | 'inactive';
  requirePasswordChange?: boolean;
  temporaryPassword?: boolean;
  lastLogin?: string;
  mobilePhone?: string;
  homePhone?: string;
}

export interface UserProfile {
  _id: string;
  fullname: string;
  email: string;
  profile?: 'supervisor' | 'delivery' | 'manager' | 'carpinter';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
  mobilePhone?: string;
  homePhone?: string;
  requirePasswordChange?: boolean;
  temporaryPassword?: boolean;
  roles: string[];
  isAdmin: boolean;
}
