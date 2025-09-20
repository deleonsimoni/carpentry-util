/**
 * User Role Constants
 * Centraliza todas as roles de usuário para evitar inconsistências
 */

export class UserRoles {
  // Role constants
  static readonly SUPER_ADMIN = 'super_admin';
  static readonly MANAGER = 'manager';
  static readonly CARPENTER = 'carpenter'; // Padronizado como 'carpenter'
  static readonly DELIVERY = 'delivery';
  static readonly SUPERVISOR = 'supervisor';

  // Get all valid roles
  static getAllRoles(): string[] {
    return [
      this.SUPER_ADMIN,
      this.MANAGER,
      this.CARPENTER,
      this.DELIVERY,
      this.SUPERVISOR
    ];
  }

  // Check if role is valid
  static isValidRole(role: string): boolean {
    return this.getAllRoles().includes(role);
  }

  // Role validation methods
  static isSuperAdmin(roles: string[]): boolean {
    return Array.isArray(roles) && roles.includes(this.SUPER_ADMIN);
  }

  static isManager(roles: string[]): boolean {
    return Array.isArray(roles) && roles.includes(this.MANAGER);
  }

  static isCarpenter(roles: string[]): boolean {
    return Array.isArray(roles) && roles.includes(this.CARPENTER);
  }

  static isDelivery(roles: string[]): boolean {
    return Array.isArray(roles) && roles.includes(this.DELIVERY);
  }

  static isSupervisor(roles: string[]): boolean {
    return Array.isArray(roles) && roles.includes(this.SUPERVISOR);
  }

  // Check if user has any management role
  static hasManagementRole(roles: string[]): boolean {
    return this.isSuperAdmin(roles) || this.isManager(roles);
  }

  // Check if user has any operational role
  static hasOperationalRole(roles: string[]): boolean {
    return this.isCarpenter(roles) || this.isDelivery(roles) || this.isSupervisor(roles);
  }

  // Get role display name
  static getDisplayName(role: string): string {
    const displayNames: { [key: string]: string } = {
      [this.SUPER_ADMIN]: 'Super Admin',
      [this.MANAGER]: 'Manager',
      [this.CARPENTER]: 'Carpenter',
      [this.DELIVERY]: 'Delivery',
      [this.SUPERVISOR]: 'Supervisor'
    };
    return displayNames[role] || role;
  }

  // Get role priority (higher number = higher priority)
  static getRolePriority(role: string): number {
    const priorities: { [key: string]: number } = {
      [this.SUPER_ADMIN]: 100,
      [this.MANAGER]: 80,
      [this.SUPERVISOR]: 60,
      [this.CARPENTER]: 40,
      [this.DELIVERY]: 40
    };
    return priorities[role] || 0;
  }

  // Get highest priority role from user's roles array
  static getHighestRole(roles: string[]): string | null {
    if (!Array.isArray(roles) || roles.length === 0) {
      return null;
    }

    return roles.reduce((highest, current) => {
      const currentPriority = this.getRolePriority(current);
      const highestPriority = this.getRolePriority(highest);
      return currentPriority > highestPriority ? current : highest;
    });
  }

  // Get role badge class for UI
  static getRoleBadgeClass(role: string): string {
    const badgeClasses: { [key: string]: string } = {
      [this.SUPER_ADMIN]: 'badge-danger',
      [this.MANAGER]: 'badge-warning',
      [this.SUPERVISOR]: 'badge-info',
      [this.CARPENTER]: 'badge-warning',
      [this.DELIVERY]: 'badge-success'
    };
    return badgeClasses[role] || 'badge-secondary';
  }

  // Get role icon for UI
  static getRoleIcon(role: string): string {
    const roleIcons: { [key: string]: string } = {
      [this.SUPER_ADMIN]: 'fa-crown',
      [this.MANAGER]: 'fa-user-tie',
      [this.SUPERVISOR]: 'fa-user-tie',
      [this.CARPENTER]: 'fa-hammer',
      [this.DELIVERY]: 'fa-truck'
    };
    return roleIcons[role] || 'fa-user';
  }
}