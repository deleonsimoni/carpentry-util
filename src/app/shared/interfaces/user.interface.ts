import { UserRoles } from '../constants/user-roles.constants';

export type UserProfileType = typeof UserRoles.SUPERVISOR | typeof UserRoles.DELIVERY | typeof UserRoles.MANAGER | typeof UserRoles.CARPENTER;
export type UserStatusType = 'active' | 'inactive';

export interface User {
  _id: string;
  fullname: string;
  email: string;
  createdAt: string;
  roles: string[];
  isAdmin: boolean;
  profile?: UserProfileType;
  status?: UserStatusType;
  requirePasswordChange?: boolean;
  temporaryPassword?: boolean;
  lastLogin?: string;
  mobilePhone?: string;
  homePhone?: string;
  company?: string;
}

export interface UserProfile {
  _id: string;
  fullname: string;
  email: string;
  profile?: UserProfileType;
  status: UserStatusType;
  createdAt: string;
  lastLogin?: string;
  mobilePhone?: string;
  homePhone?: string;
  requirePasswordChange?: boolean;
  temporaryPassword?: boolean;
  roles: string[];
  isAdmin: boolean;
  company?: string;
}
