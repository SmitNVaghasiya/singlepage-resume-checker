import { Router } from 'express';
import { uploadFields, handleMulterError } from '../middleware/fileUpload';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { validateAnalysisRequest, validateAnalysisId } from '../middleware/validation';
import { resumeController } from '../controllers/resumeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Temporary file upload endpoint (no auth required) - for preserving files through login
router.post(
  '/upload-temp',
  uploadRateLimiter,
  uploadFields,
  handleMulterError,
  resumeController.uploadTempFiles
);

// Resume analysis endpoint (authentication required)
router.post(
  '/analyze',
  uploadRateLimiter,
  authenticateToken, // Require authentication
  uploadFields,
  handleMulterError,
  validateAnalysisRequest,
  resumeController.analyzeResume
);

// Get analysis status (authentication required)
router.get(
  '/status/:analysisId',
  authenticateToken, // Require authentication
  validateAnalysisId,
  resumeController.getAnalysisStatus
);

// Get analysis result (authentication required)
router.get(
  '/result/:analysisId',
  authenticateToken, // Require authentication
  validateAnalysisId,
  resumeController.getAnalysisResult
);

// Get analysis history (authentication required)
router.get(
  '/history',
  authenticateToken, // Require authentication
  resumeController.getAnalysisHistory
);

export default router; 