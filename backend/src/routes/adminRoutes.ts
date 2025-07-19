import express from 'express';
import { authenticateAdmin, requirePermission } from '../middleware/adminAuth';
import * as adminController from '../controllers/adminController';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Admin authentication
router.post('/login', rateLimiter(), adminController.adminLogin);
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
router.get('/analyses/:analysisId', authenticateAdmin, requirePermission('view_analyses'), adminController.getAnalysisById);

// Data export (requires view_analytics permission)
router.get('/export', authenticateAdmin, requirePermission('view_analytics'), adminController.exportData);

// System health (requires view_logs permission)
router.get('/health', authenticateAdmin, requirePermission('view_logs'), adminController.getSystemHealth);

export default router; 