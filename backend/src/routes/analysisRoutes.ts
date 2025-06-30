import { Router } from 'express';
import { analysisController } from '../controllers/analysisController';
import { rateLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply rate limiting to all analysis routes
router.use(rateLimiter);

// GET /api/analyses - Get all analyses with pagination and filtering
router.get('/', analysisController.getAllAnalyses);

// GET /api/analyses/stats - Get analysis statistics
router.get('/stats', analysisController.getAnalysisStats);

// GET /api/analyses/top - Get top performing analyses
router.get('/top', analysisController.getTopAnalyses);

// GET /api/analyses/health - Check database health
router.get('/health', analysisController.getDatabaseHealth);

// POST /api/analyses/:analysisId/export - Export analysis report (requires authentication)
router.post('/:analysisId/export', authenticateToken, analysisController.exportAnalysisReport);

// GET /api/analyses/:analysisId - Get specific analysis by ID
router.get('/:analysisId', analysisController.getAnalysisById);

// DELETE /api/analyses/:analysisId - Delete analysis by ID
router.delete('/:analysisId', analysisController.deleteAnalysis);

export { router as analysisRoutes }; 