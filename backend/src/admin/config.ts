// Admin Module Configuration

export const ADMIN_CONFIG = {
  // Authentication settings
  auth: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    passwordExpiryDays: 90,
  },

  // Permissions
  permissions: {
    view_users: 'view_users',
    manage_users: 'manage_users',
    view_analytics: 'view_analytics',
    view_analyses: 'view_analyses',
    view_logs: 'view_logs',
    manage_system: 'manage_system',
    export_data: 'export_data',
    bulk_operations: 'bulk_operations',
    audit_trail: 'audit_trail',
    system_config: 'system_config',
  },

  // Default admin permissions
  defaultPermissions: [
    'view_users',
    'manage_users',
    'view_analytics',
    'view_analyses',
    'view_logs',
    'manage_system',
    'export_data',
    'bulk_operations',
    'audit_trail',
    'system_config',
  ],

  // Pagination defaults
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
  },

  // Export settings
  export: {
    maxRecords: 10000,
    supportedFormats: ['csv', 'json', 'xlsx'],
    defaultFormat: 'csv',
  },

  // Analytics settings
  analytics: {
    defaultTimeRange: '30d',
    maxDataPoints: 1000,
    cacheDuration: 5 * 60 * 1000, // 5 minutes
  },

  // System health settings
  health: {
    checkInterval: 60 * 1000, // 1 minute
    alertThresholds: {
      cpu: 80,
      memory: 85,
      disk: 90,
      responseTime: 5000,
    },
  },
};

// Admin route paths
export const ADMIN_ROUTES = {
  auth: {
    login: '/login',
    logout: '/logout',
    me: '/me',
  },
  users: {
    list: '/users',
    detail: '/users/:userId',
    updateStatus: '/users/:userId/status',
    bulkUpdate: '/users/bulk',
  },
  analytics: {
    dashboard: '/stats/dashboard',
    analyses: '/stats/analyses',
    enhanced: '/stats/enhanced',
  },
  system: {
    health: '/health',
    enhancedHealth: '/health/enhanced',
    configs: '/configs',
    updateConfig: '/configs/:key',
    cleanup: '/data/cleanup',
  },
  audit: {
    logs: '/audit-logs',
    notifications: '/notifications',
    markRead: '/notifications/:notificationId/read',
    archive: '/notifications/:notificationId/archive',
  },
  export: {
    data: '/export',
  },
}; 