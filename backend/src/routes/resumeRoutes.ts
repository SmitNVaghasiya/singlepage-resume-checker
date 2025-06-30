import { Router } from 'express';
import { uploadFields, handleMulterError } from '../middleware/fileUpload';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { validateAnalysisRequest, validateAnalysisId } from '../middleware/validation';
import { resumeController } from '../controllers/resumeController';

const router = Router();

// Resume analysis endpoint
router.post(
  '/analyze',
  uploadRateLimiter,
  uploadFields,
  handleMulterError,
  validateAnalysisRequest,
  resumeController.analyzeResume
);

// Get analysis status (if using async processing)
router.get(
  '/status/:analysisId',
  validateAnalysisId,
  resumeController.getAnalysisStatus
);

// Get analysis result
router.get(
  '/result/:analysisId',
  validateAnalysisId,
  resumeController.getAnalysisResult
);

// Get analysis history (for dashboard)
router.get(
  '/history',
  resumeController.getAnalysisHistory
);

export default router; 