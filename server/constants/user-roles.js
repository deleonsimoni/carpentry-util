/**
 * User Role Constants
 * Centraliza todas as roles de usuário para evitar inconsistências
 */

class UserRoles {
  // Role constants
  static SUPER_ADMIN = 'super_admin';
  static MANAGER = 'manager';
  static CARPENTER = 'carpenter'; // Padronizado como 'carpenter'
  static DELIVERY = 'delivery';
  static SUPERVISOR = 'supervisor';

  // Get all valid roles
  static getAllRoles() {
    return [
      this.SUPER_ADMIN,
      this.MANAGER,
      this.CARPENTER,
      this.DELIVERY,
      this.SUPERVISOR
    ];
  }

  // Check if role is valid
  static isValidRole(role) {
    return this.getAllRoles().includes(role);
  }

  // Role validation methods
  static isSuperAdmin(roles) {
    return Array.isArray(roles) && roles.includes(this.SUPER_ADMIN);
  }

  static isManager(roles) {
    return Array.isArray(roles) && roles.includes(this.MANAGER);
  }

  static isCarpenter(roles) {
    return Array.isArray(roles) && roles.includes(this.CARPENTER);
  }

  static isDelivery(roles) {
    return Array.isArray(roles) && roles.includes(this.DELIVERY);
  }

  static isSupervisor(roles) {
    return Array.isArray(roles) && roles.includes(this.SUPERVISOR);
  }

  // Check if user has any management role
  static hasManagementRole(roles) {
    return this.isSuperAdmin(roles) || this.isManager(roles);
  }

  // Check if user has any operational role
  static hasOperationalRole(roles) {
    return this.isCarpenter(roles) || this.isDelivery(roles) || this.isSupervisor(roles);
  }

  // Get role display name
  static getDisplayName(role) {
    const displayNames = {
      [this.SUPER_ADMIN]: 'Super Admin',
      [this.MANAGER]: 'Manager',
      [this.CARPENTER]: 'Carpenter',
      [this.DELIVERY]: 'Delivery',
      [this.SUPERVISOR]: 'Supervisor'
    };
    return displayNames[role] || role;
  }

  // Get role priority (higher number = higher priority)
  static getRolePriority(role) {
    const priorities = {
      [this.SUPER_ADMIN]: 100,
      [this.MANAGER]: 80,
      [this.SUPERVISOR]: 60,
      [this.CARPENTER]: 40,
      [this.DELIVERY]: 40
    };
    return priorities[role] || 0;
  }

  // Get highest priority role from user's roles array
  static getHighestRole(roles) {
    if (!Array.isArray(roles) || roles.length === 0) {
      return null;
    }

    return roles.reduce((highest, current) => {
      const currentPriority = this.getRolePriority(current);
      const highestPriority = this.getRolePriority(highest);
      return currentPriority > highestPriority ? current : highest;
    });
  }
}

module.exports = UserRoles;