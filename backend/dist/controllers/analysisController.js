"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analysisController = void 0;
const analysisService_1 = require("../services/analysisService");
const logger_1 = require("../utils/logger");
const database_1 = require("../config/database");
exports.analysisController = {
    /**
     * GET /api/analyses
     * Get all analyses with pagination and filtering
     */
    getAllAnalyses: async (req, res, next) => {
        try {
            const query = {
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10,
                status: req.query.status,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc',
                search: req.query.search
            };
            const result = await analysisService_1.analysisService.getAllAnalyses(query);
            res.json({
                success: true,
                data: result.analyses,
                pagination: {
                    currentPage: result.currentPage,
                    totalPages: result.totalPages,
                    totalCount: result.totalCount,
                    hasNextPage: result.hasNextPage,
                    hasPrevPage: result.hasPrevPage,
                    limit: query.limit
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error in getAllAnalyses:', error);
            next(error);
        }
    },
    /**
     * GET /api/analyses/:analysisId
     * Get specific analysis by ID
     */
    getAnalysisById: async (req, res, next) => {
        try {
            const { analysisId } = req.params;
            const analysis = await analysisService_1.analysisService.getAnalysisById(analysisId);
            if (!analysis) {
                res.status(404).json({
                    success: false,
                    error: 'Analysis not found',
                    message: `No analysis found with ID: ${analysisId}`
                });
                return;
            }
            res.json({
                success: true,
                data: analysis
            });
        }
        catch (error) {
            logger_1.logger.error('Error in getAnalysisById:', error);
            next(error);
        }
    },
    /**
     * GET /api/analyses/stats
     * Get analysis statistics
     */
    getAnalysisStats: async (req, res, next) => {
        try {
            const stats = await analysisService_1.analysisService.getAnalysisStats();
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            logger_1.logger.error('Error in getAnalysisStats:', error);
            next(error);
        }
    },
    /**
     * GET /api/analyses/top
     * Get top performing analyses
     */
    getTopAnalyses: async (req, res, next) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const topAnalyses = await analysisService_1.analysisService.getTopAnalyses(limit);
            res.json({
                success: true,
                data: topAnalyses
            });
        }
        catch (error) {
            logger_1.logger.error('Error in getTopAnalyses:', error);
            next(error);
        }
    },
    /**
     * DELETE /api/analyses/:analysisId
     * Delete analysis by ID
     */
    deleteAnalysis: async (req, res, next) => {
        try {
            const { analysisId } = req.params;
            const deleted = await analysisService_1.analysisService.deleteAnalysis(analysisId);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: 'Analysis not found',
                    message: `No analysis found with ID: ${analysisId}`
                });
                return;
            }
            res.json({
                success: true,
                message: 'Analysis deleted successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Error in deleteAnalysis:', error);
            next(error);
        }
    },
    /**
     * GET /api/analyses/health
     * Check database health
     */
    getDatabaseHealth: async (req, res, next) => {
        try {
            const health = await database_1.database.checkHealth();
            res.json({
                success: true,
                data: {
                    database: health,
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error in getDatabaseHealth:', error);
            next(error);
        }
    }
};
//# sourceMappingURL=analysisController.js.map