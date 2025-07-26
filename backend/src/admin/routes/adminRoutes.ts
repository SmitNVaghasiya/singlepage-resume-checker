import express from 'express';
import { authenticateAdmin, requirePermission } from '../middleware/adminAuth';
import * as adminController from '../controllers/adminController';
import { rateLimiter } from '../../middleware/rateLimiter';

const router = express.Router();

// Admin authentication
router.post('/login', rateLimiter, adminController.adminLogin);
router.get('/me', authenticateAdmin, adminController.getCurrentAdmin);

// User management (requires view_users permission)
router.get('/users', authenticateAdmin, requirePermission('view_users'), adminController.getAllUsers);
router.get('/users/:userId', authenticateAdmin, requirePermission('view_users'), adminController.getUserById);
router.put('/users/:userId/status', authenticateAdmin, requirePermission('manage_users'), adminController.updateUserStatus);

// Bulk operations (requires manage_users permission)
router.put('/users/bulk', authenticateAdmin, requirePermission('manage_users'), adminController.bulkUpdateUsers);

// Analytics and statistics (requires view_analytics permission)
router.get('/stats/dashboard', authenticateAdmin, requirePermission('view_analytics'), adminController.getDashboardStats);
router.get('/stats/analyses', authenticateAdmin, requirePermission('view_analytics'), adminController.getAnalysesStats);
router.get('/stats/enhanced', authenticateAdmin, requirePermission('view_analytics'), adminController.getEnhancedAnalytics);
router.get('/analyses/:analysisId', authenticateAdmin, requirePermission('view_analyses'), adminController.getAnalysisById);

// Data export (requires view_analytics permission)
router.get('/export', authenticateAdmin, requirePermission('view_analytics'), adminController.exportData);

// System health (requires view_logs permission)
router.get('/health', authenticateAdmin, requirePermission('view_logs'), adminController.getSystemHealth);
router.get('/health/enhanced', authenticateAdmin, requirePermission('view_logs'), adminController.getEnhancedSystemHealth);

// Audit Trail Management (requires audit_trail permission)
router.get('/audit-logs', authenticateAdmin, requirePermission('audit_trail'), adminController.getAuditLogs);

// Notification Management (requires view_logs permission)
router.get('/notifications', authenticateAdmin, requirePermission('view_logs'), adminController.getNotifications);
router.put('/notifications/:notificationId/read', authenticateAdmin, requirePermission('view_logs'), adminController.markNotificationAsRead);
router.put('/notifications/:notificationId/archive', authenticateAdmin, requirePermission('view_logs'), adminController.archiveNotification);

// System Configuration Management (requires system_config permission)
router.get('/configs', authenticateAdmin, requirePermission('system_config'), adminController.getSystemConfigs);
router.put('/configs/:key', authenticateAdmin, requirePermission('system_config'), adminController.updateSystemConfig);

// Data Management (requires manage_system permission)
router.post('/data/cleanup', authenticateAdmin, requirePermission('manage_system'), adminController.cleanupData);

export default router; 