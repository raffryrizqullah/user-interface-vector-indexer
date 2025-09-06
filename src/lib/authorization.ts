import { AuthService, User } from '@/lib/auth';

export type UserRole = 'admin' | 'super_admin';

export interface Permission {
  action: string;
  resource: string;
}

// Role hierarchy - higher number = more permissions
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'admin': 1,
  'super_admin': 2,
};

// Permission definitions
export const PERMISSIONS = {
  // User management
  USER_CREATE: { action: 'create', resource: 'user' },
  USER_READ: { action: 'read', resource: 'user' },
  USER_UPDATE: { action: 'update', resource: 'user' },
  USER_DELETE: { action: 'delete', resource: 'user' },
  
  // System settings
  SETTINGS_READ: { action: 'read', resource: 'settings' },
  SETTINGS_UPDATE: { action: 'update', resource: 'settings' },
  
  // Activity logs
  ACTIVITY_READ: { action: 'read', resource: 'activity' },
  
  // Vector operations
  VECTOR_CREATE: { action: 'create', resource: 'vector' },
  VECTOR_READ: { action: 'read', resource: 'vector' },
  VECTOR_UPDATE: { action: 'update', resource: 'vector' },
  VECTOR_DELETE: { action: 'delete', resource: 'vector' },
  
  // Health checks
  HEALTH_READ: { action: 'read', resource: 'health' },
} as const;

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'admin': [
    PERMISSIONS.USER_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.ACTIVITY_READ,
    PERMISSIONS.VECTOR_CREATE,
    PERMISSIONS.VECTOR_READ,
    PERMISSIONS.VECTOR_UPDATE,
    PERMISSIONS.VECTOR_DELETE,
    PERMISSIONS.HEALTH_READ,
  ],
  'super_admin': [
    // Super admin has all permissions
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.ACTIVITY_READ,
    PERMISSIONS.VECTOR_CREATE,
    PERMISSIONS.VECTOR_READ,
    PERMISSIONS.VECTOR_UPDATE,
    PERMISSIONS.VECTOR_DELETE,
    PERMISSIONS.HEALTH_READ,
  ],
};

export class AuthorizationService {
  /**
   * Get current user from AuthService
   */
  static getCurrentUser(): User | null {
    return AuthService.getCurrentUser();
  }

  /**
   * Check if current user has specific role
   */
  static hasRole(requiredRole: UserRole): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    return user.role === requiredRole;
  }

  /**
   * Check if current user has at least the minimum required role
   */
  static hasMinimumRole(minimumRole: UserRole): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const userRoleLevel = ROLE_HIERARCHY[user.role];
    const requiredRoleLevel = ROLE_HIERARCHY[minimumRole];
    
    return userRoleLevel >= requiredRoleLevel;
  }

  /**
   * Check if current user has specific permission
   */
  static hasPermission(permission: Permission): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    
    return userPermissions.some(p => 
      p.action === permission.action && p.resource === permission.resource
    );
  }

  /**
   * Check if current user can access a specific resource
   */
  static canAccess(resource: string, action: string = 'read'): boolean {
    return this.hasPermission({ action, resource });
  }

  /**
   * Check if current user is super admin
   */
  static isSuperAdmin(): boolean {
    return this.hasRole('super_admin');
  }

  /**
   * Check if current user is admin (including super admin)
   */
  static isAdmin(): boolean {
    return this.hasMinimumRole('admin');
  }

  /**
   * Get user role display name
   */
  static getRoleDisplayName(role?: UserRole): string {
    const user = this.getCurrentUser();
    const userRole = role || user?.role;
    
    switch (userRole) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      default:
        return 'User';
    }
  }

  /**
   * Get user role badge classes for UI
   */
  static getRoleBadgeClasses(role?: UserRole): string {
    const user = this.getCurrentUser();
    const userRole = role || user?.role;
    
    switch (userRole) {
      case 'super_admin':
        return 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-400/10 dark:text-purple-400 dark:ring-purple-400/20';
      case 'admin':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20';
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20';
    }
  }

  /**
   * Guard function for components - throws if no access
   */
  static requirePermission(permission: Permission): void {
    if (!this.hasPermission(permission)) {
      const user = this.getCurrentUser();
      throw new Error(`Access denied. User ${user?.email || 'anonymous'} does not have permission to ${permission.action} ${permission.resource}`);
    }
  }

  /**
   * Guard function for minimum role - throws if insufficient role
   */
  static requireMinimumRole(minimumRole: UserRole): void {
    if (!this.hasMinimumRole(minimumRole)) {
      const user = this.getCurrentUser();
      throw new Error(`Access denied. User ${user?.email || 'anonymous'} needs at least ${minimumRole} role`);
    }
  }
}

// Utility functions for common checks
export const auth = {
  // Role checks
  isSuperAdmin: () => AuthorizationService.isSuperAdmin(),
  isAdmin: () => AuthorizationService.isAdmin(),
  hasRole: (role: UserRole) => AuthorizationService.hasRole(role),
  hasMinimumRole: (role: UserRole) => AuthorizationService.hasMinimumRole(role),
  
  // Permission checks
  canCreate: (resource: string) => AuthorizationService.canAccess(resource, 'create'),
  canRead: (resource: string) => AuthorizationService.canAccess(resource, 'read'),
  canUpdate: (resource: string) => AuthorizationService.canAccess(resource, 'update'),
  canDelete: (resource: string) => AuthorizationService.canAccess(resource, 'delete'),
  
  // User info
  getCurrentUser: () => AuthorizationService.getCurrentUser(),
  getRoleDisplayName: (role?: UserRole) => AuthorizationService.getRoleDisplayName(role),
  getRoleBadgeClasses: (role?: UserRole) => AuthorizationService.getRoleBadgeClasses(role),
};

export default AuthorizationService;