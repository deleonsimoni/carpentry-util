import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user.interface';

export interface UserProfile {
  _id: string;
  fullname: string;
  email: string;
  profile?: 'supervisor' | 'delivery' | 'manager' | 'carpinter';
  status: 'active' | 'inactive';
  requirePasswordChange: boolean;
  temporaryPassword: boolean;
  createdAt: string;
  lastLogin?: string;
  mobilePhone?: string;
  homePhone?: string;
}

export interface UserListResponse {
  success: boolean;
  data: UserProfile[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CreateUserRequest {
  fullname: string;
  email: string;
  profile?: 'supervisor' | 'delivery' | 'manager' | 'carpinter';
  mobilePhone?: string;
  homePhone?: string;
}

export interface CreateUserResponse {
  success: boolean;
  data: UserProfile;
  temporaryPassword: string;
  message: string;
}

export interface UpdateUserRequest {
  fullname?: string;
  profile?: 'supervisor' | 'carpinteiro' | 'entregador';
  status?: 'active' | 'inactive';
  mobilePhone?: string;
  homePhone?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordChangeResponse {
  success: boolean;
  user: User;
  token: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  // Listar usuários com paginação e filtros
  getUsers(
    page = 1,
    limit = 10,
    search = '',
    profile = '',
    status = ''
  ): Observable<UserListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) params = params.set('search', search);
    if (profile) params = params.set('profile', profile);
    if (status) params = params.set('status', status);

    return this.http.get<UserListResponse>('/api/user/management', { params });
  }

  // Criar novo usuário
  createUser(userData: CreateUserRequest): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>('/api/user/management', userData);
  }

  // Buscar usuário por ID
  getUserById(id: string): Observable<{ success: boolean; data: UserProfile }> {
    return this.http.get<{ success: boolean; data: UserProfile }>(`/api/user/management/${id}`);
  }

  // Atualizar usuário
  updateUser(id: string, updateData: UpdateUserRequest): Observable<{ success: boolean; data: UserProfile; message: string }> {
    return this.http.put<{ success: boolean; data: UserProfile; message: string }>(`/api/user/management/${id}`, updateData);
  }

  // Inativar usuário
  deleteUser(id: string): Observable<{ success: boolean; data: UserProfile; message: string }> {
    return this.http.delete<{ success: boolean; data: UserProfile; message: string }>(`/api/user/management/${id}`);
  }

  // Verificar status da senha
  checkPasswordStatus(): Observable<{ success: boolean; data: { requirePasswordChange: boolean; temporaryPassword: boolean } }> {
    return this.http.get<{ success: boolean; data: { requirePasswordChange: boolean; temporaryPassword: boolean } }>('/api/user/password-status');
  }

  // Alterar senha (usuários normais)
  changePassword(passwordData: PasswordChangeRequest): Observable<{ success: boolean; data: UserProfile; message: string }> {
    return this.http.post<{ success: boolean; data: UserProfile; message: string }>('/api/user/change-password', passwordData);
  }

  // Primeira troca de senha (via auth)
  firstPasswordChange(passwordData: PasswordChangeRequest): Observable<PasswordChangeResponse> {
    return this.http.post<PasswordChangeResponse>('/api/auth/first-password-change', passwordData);
  }

  // Reset de senha de usuário (admin/manager)
  resetUserPassword(id: string): Observable<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(`/api/user/reset-password/${id}`, {});
  }

  // Obter lista de perfis disponíveis
  getAvailableProfiles(): { value: string; label: string }[] {
    return [
      { value: 'supervisor', label: 'Supervisor' },
      { value: 'delivery', label: 'Delivery' },
      { value: 'manager', label: 'Manager' },
      { value: 'carpinter', label: 'Carpinter' }
    ];
  }

  // Obter lista de status disponíveis
  getAvailableStatuses(): { value: string; label: string }[] {
    return [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ];
  }

  // Helper para traduzir perfil
  getProfileLabel(profile: string): string {
    const profiles = this.getAvailableProfiles();
    return profiles.find(p => p.value === profile)?.label || profile;
  }

  // Helper para traduzir status
  getStatusLabel(status: string): string {
    const statuses = this.getAvailableStatuses();
    return statuses.find(s => s.value === status)?.label || status;
  }
}