"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumeController = void 0;
const pythonApiService_1 = require("../services/pythonApiService");
const cacheService_1 = require("../services/cacheService");
const analysisService_1 = require("../services/analysisService");
const logger_1 = require("../utils/logger");
const helpers_1 = require("../utils/helpers");
exports.resumeController = {
    // Analyze resume against job description
    analyzeResume: async (req, res, next) => {
        const startTime = Date.now();
        try {
            const files = req.files;
            const { jobDescriptionText } = req.body;
            if (!files.resume) {
                res.status(400).json({
                    error: 'Missing file',
                    message: 'Resume file is required',
                });
                return;
            }
            const resumeFile = files.resume[0];
            const jobDescriptionFile = files.jobDescription?.[0];
            // Validate that either job description file or text is provided
            if (!jobDescriptionFile && !jobDescriptionText) {
                res.status(400).json({
                    error: 'Missing job description',
                    message: 'Either job description file or text is required',
                });
                return;
            }
            // Generate unique analysis ID
            const analysisId = (0, helpers_1.generateAnalysisId)();
            // Log analysis request
            logger_1.logger.info({
                message: 'Starting comprehensive resume analysis',
                analysisId,
                resumeSize: resumeFile.size,
                resumeFilename: resumeFile.originalname,
                jobDescriptionSize: jobDescriptionFile?.size || 0,
                jobDescriptionFilename: jobDescriptionFile?.originalname,
                hasJobDescriptionText: !!jobDescriptionText,
                hasJobDescriptionFile: !!jobDescriptionFile,
            });
            // Start analysis (async processing for better performance)
            processAnalysisAsync(analysisId, resumeFile, jobDescriptionFile, jobDescriptionText, startTime);
            // Return immediate response
            res.status(202).json({
                message: 'Comprehensive analysis started',
                analysisId,
                status: 'processing',
                estimatedTime: '15-45 seconds',
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
            // Try cache first
            let result = await cacheService_1.cacheService.getAnalysisResult(analysisId);
            if (!result) {
                // Fallback to database
                try {
                    const dbResult = await analysisService_1.analysisService.getAnalysisByAnalysisId(analysisId);
                    if (dbResult && dbResult.status === 'completed') {
                        result = dbResult.result;
                    }
                }
                catch (dbError) {
                    logger_1.logger.warn('Database fallback failed:', dbError);
                }
            }
            if (!result) {
                res.status(404).json({
                    error: 'Not found',
                    message: 'Analysis result not found or expired',
                });
                return;
            }
            res.json({
                analysisId,
                status: 'completed',
                result,
            });
        }
        catch (error) {
            logger_1.logger.error('Error in getAnalysisResult:', error);
            next(error);
        }
    },
    // Get user's analysis history (if authenticated)
    getAnalysisHistory: async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const sortBy = req.query.sortBy || 'createdAt';
            const sortOrder = req.query.sortOrder || 'desc';
            // For now, get all analyses (later filter by user when auth is implemented)
            const analyses = await analysisService_1.analysisService.getAnalysesWithPagination({
                page,
                limit,
                sortBy,
                sortOrder: sortOrder,
            });
            res.json(analyses);
        }
        catch (error) {
            logger_1.logger.error('Error in getAnalysisHistory:', error);
            next(error);
        }
    },
};
// Async function to process analysis
async function processAnalysisAsync(analysisId, resumeFile, jobDescriptionFile, jobDescriptionText, startTime) {
    try {
        // Update status to processing in cache
        await cacheService_1.cacheService.setAnalysisStatus(analysisId, {
            status: 'processing',
            startedAt: new Date().toISOString(),
            progress: 10,
            currentStage: 'Extracting resume content...',
        });
        // Extract basic text for initial storage (will be properly processed by Python service)
        let resumeTextPreview = '';
        let jobDescriptionTextPreview = '';
        try {
            resumeTextPreview = resumeFile.buffer.toString('utf-8').substring(0, 1000);
        }
        catch {
            resumeTextPreview = 'Binary file - will be processed by AI service';
        }
        if (jobDescriptionFile) {
            try {
                jobDescriptionTextPreview = jobDescriptionFile.buffer.toString('utf-8').substring(0, 1000);
            }
            catch {
                jobDescriptionTextPreview = 'Binary file - will be processed by AI service';
            }
        }
        else {
            jobDescriptionTextPreview = jobDescriptionText || '';
        }
        // Save initial analysis record to MongoDB
        try {
            await analysisService_1.analysisService.createAnalysis({
                analysisId,
                resumeFilename: resumeFile.originalname,
                jobDescriptionFilename: jobDescriptionFile?.originalname || 'Text Input',
                resumeText: resumeTextPreview,
                jobDescriptionText: jobDescriptionTextPreview,
            });
        }
        catch (dbError) {
            logger_1.logger.warn('Failed to save initial record to MongoDB, continuing with cache only:', dbError);
        }
        // Update progress
        await cacheService_1.cacheService.setAnalysisStatus(analysisId, {
            status: 'processing',
            progress: 25,
            currentStage: 'Analyzing job requirements...',
        });
        // Call Python API for comprehensive analysis
        const result = await pythonApiService_1.pythonApiService.analyzeResume(resumeFile, jobDescriptionFile, jobDescriptionText);
        // Calculate processing time
        const processingTime = startTime ? Date.now() - startTime : undefined;
        if (processingTime && result.result) {
            result.result.processingTime = processingTime;
        }
        // Update progress
        await cacheService_1.cacheService.setAnalysisStatus(analysisId, {
            status: 'processing',
            progress: 90,
            currentStage: 'Finalizing analysis report...',
        });
        // Store result in cache
        await cacheService_1.cacheService.setAnalysisResult(analysisId, {
            ...result.result,
            completedAt: new Date().toISOString(),
        });
        // Update status to completed in cache
        await cacheService_1.cacheService.setAnalysisStatus(analysisId, {
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
        });
        // Update MongoDB with comprehensive results
        try {
            await analysisService_1.analysisService.updateAnalysisResult(analysisId, result.result);
        }
        catch (dbError) {
            logger_1.logger.warn('Failed to update MongoDB with results, cache updated successfully:', dbError);
        }
        logger_1.logger.info({
            message: 'Comprehensive analysis completed successfully',
            analysisId,
            overallScore: result.result?.overallScore,
            processingTime,
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Comprehensive analysis failed',
            analysisId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Update status to failed
        await cacheService_1.cacheService.setAnalysisStatus(analysisId, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Analysis failed',
            failedAt: new Date().toISOString(),
        });
        // Update database status
        try {
            await analysisService_1.analysisService.updateAnalysisStatus(analysisId, 'failed', error instanceof Error ? error.message : 'Analysis failed');
        }
        catch (dbError) {
            logger_1.logger.warn('Failed to update database status:', dbError);
        }
    }
}
//# sourceMappingURL=resumeController.js.map