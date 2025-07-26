// Admin Module Index
// This file exports all admin-related components for easy importing

// Controllers
export * from './adminController';

// Routes
export { default as adminRoutes } from './adminRoutes';

// Middleware
export { authenticateAdmin, requirePermission, requireRole } from './adminAuth';

// Models
export { Admin, IAdmin } from './Admin';

// Services
export { AdminAnalyticsService } from './adminAnalyticsService';
export { AdminUserService } from './adminUserService';

// Types
export * from './types';

// Configuration
export { ADMIN_CONFIG, ADMIN_ROUTES } from './config';

// Utilities
export * from './utils'; 