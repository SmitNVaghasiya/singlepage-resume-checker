import { Router } from 'express';
import { analysisController } from '../controllers/analysisController';
import { rateLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply rate limiting to all analysis routes
router.use(rateLimiter());

// GET /api/analyses - Get all analyses with pagination and filtering (admin only)
router.get('/', authenticateToken, analysisController.getAllAnalyses);

// GET /api/analyses/stats - Get analysis statistics (admin only)
router.get('/stats', authenticateToken, analysisController.getAnalysisStats);

// GET /api/analyses/top - Get top performing analyses (admin only)
router.get('/top', authenticateToken, analysisController.getTopAnalyses);

// GET /api/analyses/health - Check database health
router.get('/health', analysisController.getDatabaseHealth);

// POST /api/analyses/:analysisId/export - Export analysis report (requires authentication)
router.post('/:analysisId/export', authenticateToken, analysisController.exportAnalysisReport);

// GET /api/analyses/:analysisId - Get specific analysis by ID (requires authentication)
router.get('/:analysisId', authenticateToken, analysisController.getAnalysisById);

// DELETE /api/analyses/:analysisId - Delete analysis by ID (requires authentication)
router.delete('/:analysisId', authenticateToken, analysisController.deleteAnalysis);

export { router as analysisRoutes }; 