"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fileUpload_1 = require("../middleware/fileUpload");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validation_1 = require("../middleware/validation");
const resumeController_1 = require("../controllers/resumeController");
const router = (0, express_1.Router)();
// Resume analysis endpoint
router.post('/analyze', rateLimiter_1.uploadRateLimiter, fileUpload_1.uploadFields, fileUpload_1.handleMulterError, validation_1.validateAnalysisRequest, resumeController_1.resumeController.analyzeResume);
// Get analysis status (if using async processing)
router.get('/status/:analysisId', validation_1.validateAnalysisId, resumeController_1.resumeController.getAnalysisStatus);
// Get analysis result
router.get('/result/:analysisId', validation_1.validateAnalysisId, resumeController_1.resumeController.getAnalysisResult);
// Get analysis history (for dashboard)
router.get('/history', resumeController_1.resumeController.getAnalysisHistory);
exports.default = router;
//# sourceMappingURL=resumeRoutes.js.map