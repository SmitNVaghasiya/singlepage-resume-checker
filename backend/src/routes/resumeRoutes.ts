import { Router } from 'express';
import { uploadFields, handleMulterError } from '../middleware/fileUpload';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { validateAnalysisRequest, validateAnalysisId } from '../middleware/validation';
import { resumeController } from '../controllers/resumeController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Temporary file upload endpoint removed - frontend only approach

// Resume analysis endpoint (temporarily without authentication for testing)
router.post(
  '/analyze',
  uploadRateLimiter,
  optionalAuth, // Make authentication optional for now
  uploadFields,
  handleMulterError,
  validateAnalysisRequest,
  resumeController.analyzeResume
);

// Get analysis status
router.get(
  '/analysis/:analysisId/status',
  validateAnalysisId,
  resumeController.getAnalysisStatus
);

// Get analysis result
router.get(
  '/analysis/:analysisId/result',
  validateAnalysisId,
  resumeController.getAnalysisResult
);

// Get user's analysis history (requires authentication)
router.get(
  '/history',
  authenticateToken,
  resumeController.getAnalysisHistory
);

export default router; 