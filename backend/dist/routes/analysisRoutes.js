"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analysisRoutes = void 0;
const express_1 = require("express");
const analysisController_1 = require("../controllers/analysisController");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
exports.analysisRoutes = router;
// Apply rate limiting to all analysis routes
router.use(rateLimiter_1.rateLimiter);
// GET /api/analyses - Get all analyses with pagination and filtering
router.get('/', analysisController_1.analysisController.getAllAnalyses);
// GET /api/analyses/stats - Get analysis statistics
router.get('/stats', analysisController_1.analysisController.getAnalysisStats);
// GET /api/analyses/top - Get top performing analyses
router.get('/top', analysisController_1.analysisController.getTopAnalyses);
// GET /api/analyses/health - Check database health
router.get('/health', analysisController_1.analysisController.getDatabaseHealth);
// GET /api/analyses/:analysisId - Get specific analysis by ID
router.get('/:analysisId', analysisController_1.analysisController.getAnalysisById);
// DELETE /api/analyses/:analysisId - Delete analysis by ID
router.delete('/:analysisId', analysisController_1.analysisController.deleteAnalysis);
//# sourceMappingURL=analysisRoutes.js.map