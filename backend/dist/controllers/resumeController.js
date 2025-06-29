"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumeController = void 0;
const pythonApiService_1 = require("../services/pythonApiService");
const cacheService_1 = require("../services/cacheService");
const logger_1 = require("../utils/logger");
const helpers_1 = require("../utils/helpers");
exports.resumeController = {
    // Analyze resume against job description
    analyzeResume: async (req, res, next) => {
        try {
            const files = req.files;
            if (!files.resume || !files.jobDescription) {
                res.status(400).json({
                    error: 'Missing files',
                    message: 'Both resume and job description are required',
                });
                return;
            }
            const resumeFile = files.resume[0];
            const jobDescriptionFile = files.jobDescription[0];
            // Generate unique analysis ID
            const analysisId = (0, helpers_1.generateAnalysisId)();
            // Log analysis request
            logger_1.logger.info({
                message: 'Starting resume analysis',
                analysisId,
                resumeSize: resumeFile.size,
                jobDescriptionSize: jobDescriptionFile.size,
            });
            // Start analysis (async processing for better performance)
            processAnalysisAsync(analysisId, resumeFile, jobDescriptionFile);
            // Return immediate response
            res.status(202).json({
                message: 'Analysis started',
                analysisId,
                status: 'processing',
                estimatedTime: '10-30 seconds',
            });
        }
        catch (error) {
            logger_1.logger.error('Error in analyzeResume:', error);
            next(error);
        }
    },
    // Get analysis status
    getAnalysisStatus: async (req, res, next) => {
        try {
            const { analysisId } = req.params;
            // Check cache for status
            const status = await cacheService_1.cacheService.getAnalysisStatus(analysisId);
            if (!status) {
                res.status(404).json({
                    error: 'Not found',
                    message: 'Analysis not found or expired',
                });
                return;
            }
            res.json(status);
        }
        catch (error) {
            logger_1.logger.error('Error in getAnalysisStatus:', error);
            next(error);
        }
    },
    // Get analysis result
    getAnalysisResult: async (req, res, next) => {
        try {
            const { analysisId } = req.params;
            // Check cache for result
            const result = await cacheService_1.cacheService.getAnalysisResult(analysisId);
            if (!result) {
                // Check if analysis is still processing
                const status = await cacheService_1.cacheService.getAnalysisStatus(analysisId);
                if (status && status.status === 'processing') {
                    res.status(202).json({
                        message: 'Analysis still in progress',
                        status: 'processing',
                    });
                    return;
                }
                res.status(404).json({
                    error: 'Not found',
                    message: 'Analysis result not found or expired',
                });
                return;
            }
            res.json(result);
        }
        catch (error) {
            logger_1.logger.error('Error in getAnalysisResult:', error);
            next(error);
        }
    },
};
// Async function to process analysis
async function processAnalysisAsync(analysisId, resumeFile, jobDescriptionFile) {
    try {
        // Update status to processing
        await cacheService_1.cacheService.setAnalysisStatus(analysisId, {
            status: 'processing',
            startedAt: new Date().toISOString(),
        });
        // Call Python API
        const result = await pythonApiService_1.pythonApiService.analyzeResume(resumeFile, jobDescriptionFile);
        // Store result in cache
        await cacheService_1.cacheService.setAnalysisResult(analysisId, {
            ...result,
            completedAt: new Date().toISOString(),
        });
        // Update status to completed
        await cacheService_1.cacheService.setAnalysisStatus(analysisId, {
            status: 'completed',
            completedAt: new Date().toISOString(),
        });
        logger_1.logger.info({
            message: 'Analysis completed successfully',
            analysisId,
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Analysis failed',
            analysisId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Update status to failed
        await cacheService_1.cacheService.setAnalysisStatus(analysisId, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Analysis failed',
            failedAt: new Date().toISOString(),
        });
    }
}
//# sourceMappingURL=resumeController.js.map