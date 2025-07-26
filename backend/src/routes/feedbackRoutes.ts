import { Router } from 'express';
import {
  submitFeedback,
  getFeedbackByAnalysis,
  getAllFeedback,
  getFeedbackStats,
  updateFeedback,
  getFeedbackById,
  exportFeedback
} from '../controllers/feedbackController';
import { authenticateToken } from '../middleware/auth';
import { authenticateAdmin } from '../admin/middleware/adminAuth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// User routes (require authentication)
router.post('/submit', authenticateToken, rateLimiter, submitFeedback);
router.get('/analysis/:analysisId', authenticateToken, getFeedbackByAnalysis);

// Admin routes (require admin authentication)
router.get('/admin/all', authenticateAdmin, getAllFeedback);
router.get('/admin/stats', authenticateAdmin, getFeedbackStats);
router.get('/admin/export', authenticateAdmin, exportFeedback);
router.get('/admin/:feedbackId', authenticateAdmin, getFeedbackById);
router.put('/admin/:feedbackId', authenticateAdmin, updateFeedback);

export default router; 