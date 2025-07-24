// Admin Module Index
// This file exports all admin-related components for easy importing

import { Request } from 'express';

// Controllers
export * from './controllers/adminController';

// Routes
export { default as adminRoutes } from './routes/adminRoutes';

// Middleware
export { authenticateAdmin, requirePermission, requireRole } from './middleware/adminAuth';

// Models
export { Admin, IAdmin } from './models/Admin';

// Services
export { AdminAnalyticsService } from './services/adminAnalyticsService';
export { AdminUserService } from './services/adminUserService';

// Types
export interface AdminRequest extends Request {
  admin?: any; // Simplified for now
} 