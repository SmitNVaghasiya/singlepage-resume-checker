import { IAdmin } from './Admin';
import { ADMIN_CONFIG } from './config';

/**
 * Check if admin has specific permission
 */
export const hasPermission = (admin: IAdmin, permission: string): boolean => {
  return admin.permissions.includes(permission);
};

/**
 * Check if admin has any of the specified permissions
 */
export const hasAnyPermission = (admin: IAdmin, permissions: string[]): boolean => {
  return permissions.some(permission => admin.permissions.includes(permission));
};

/**
 * Check if admin has all of the specified permissions
 */
export const hasAllPermissions = (admin: IAdmin, permissions: string[]): boolean => {
  return permissions.every(permission => admin.permissions.includes(permission));
};

/**
 * Validate admin permissions
 */
export const validatePermissions = (permissions: string[]): boolean => {
  const validPermissions = Object.values(ADMIN_CONFIG.permissions);
  return permissions.every(permission => validPermissions.includes(permission));
};

/**
 * Sanitize admin data for API responses
 */
export const sanitizeAdminData = (admin: IAdmin) => {
  return {
    id: (admin._id as any).toString(),
    username: admin.username,
    email: admin.email,
    fullName: admin.fullName,
    permissions: admin.permissions,
    isActive: admin.isActive,
    lastLogin: admin.lastLogin,
    twoFactorEnabled: admin.twoFactorEnabled,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
};

/**
 * Generate admin audit log data
 */
export const generateAuditData = (
  admin: IAdmin,
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, any>
) => {
  return {
    adminId: (admin._id as any).toString(),
    adminUsername: admin.username,
    action,
    resource,
    resourceId,
    details: {
      ...details,
      adminEmail: admin.email,
      adminFullName: admin.fullName,
    },
    ipAddress: 'unknown', // Will be set by the request context
    userAgent: 'unknown', // Will be set by the request context
    severity: 'low' as const,
    status: 'success' as const,
  };
};

/**
 * Check if admin account is locked
 */
export const isAccountLocked = (admin: IAdmin): boolean => {
  return !!(admin.lockUntil && admin.lockUntil > new Date());
};

/**
 * Check if admin password is expired
 */
export const isPasswordExpired = (admin: IAdmin): boolean => {
  if (!admin.passwordExpiryDate) return false;
  return new Date() > admin.passwordExpiryDate;
};

/**
 * Calculate remaining login attempts
 */
export const getRemainingLoginAttempts = (admin: IAdmin): number => {
  return Math.max(0, ADMIN_CONFIG.auth.maxLoginAttempts - admin.loginAttempts);
};

/**
 * Format admin permissions for display
 */
export const formatPermissions = (permissions: string[]): string[] => {
  return permissions.map(permission => 
    permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  );
};

/**
 * Get admin role based on permissions
 */
export const getAdminRole = (admin: IAdmin): string => {
  if (hasAllPermissions(admin, ADMIN_CONFIG.defaultPermissions)) {
    return 'Super Admin';
  }
  
  if (hasPermission(admin, 'manage_system')) {
    return 'System Admin';
  }
  
  if (hasPermission(admin, 'manage_users')) {
    return 'User Admin';
  }
  
  if (hasPermission(admin, 'view_analytics')) {
    return 'Analytics Admin';
  }
  
  return 'Viewer';
}; 