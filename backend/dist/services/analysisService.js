"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analysisService = void 0;
const Analysis_1 = require("../models/Analysis");
const logger_1 = require("../utils/logger");
class AnalysisService {
    /**
     * Save a new analysis to the database
     */
    async createAnalysis(analysisData) {
        try {
            const analysis = new Analysis_1.Analysis({
                ...analysisData,
                status: 'processing',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            const savedAnalysis = await analysis.save();
            logger_1.logger.info(`Analysis created with ID: ${savedAnalysis.analysisId}`);
            return savedAnalysis;
        }
        catch (error) {
            logger_1.logger.error('Error creating analysis:', error);
            throw new Error('Failed to create analysis record');
        }
    }
    /**
     * Update analysis with results
     */
    async updateAnalysisResult(analysisId, result) {
        try {
            const updatedAnalysis = await Analysis_1.Analysis.findOneAndUpdate({ analysisId }, {
                result,
                status: 'completed',
                completedAt: new Date(),
                updatedAt: new Date()
            }, { new: true, runValidators: true });
            if (!updatedAnalysis) {
                logger_1.logger.warn(`Analysis not found for update: ${analysisId}`);
                return null;
            }
            logger_1.logger.info(`Analysis updated successfully: ${analysisId}`);
            return updatedAnalysis;
        }
        catch (error) {
            logger_1.logger.error('Error updating analysis result:', error);
            throw new Error('Failed to update analysis result');
        }
    }
    /**
     * Update analysis status
     */
    async updateAnalysisStatus(analysisId, status, error) {
        try {
            const updateData = {
                status,
                updatedAt: new Date()
            };
            if (error) {
                updateData.error = error;
            }
            if (status === 'completed') {
                updateData.completedAt = new Date();
            }
            const updatedAnalysis = await Analysis_1.Analysis.findOneAndUpdate({ analysisId }, updateData, { new: true, runValidators: true });
            if (!updatedAnalysis) {
                logger_1.logger.warn(`Analysis not found for status update: ${analysisId}`);
                return null;
            }
            logger_1.logger.info(`Analysis status updated: ${analysisId} -> ${status}`);
            return updatedAnalysis;
        }
        catch (error) {
            logger_1.logger.error('Error updating analysis status:', error);
            throw new Error('Failed to update analysis status');
        }
    }
    /**
     * Mark analysis as failed
     */
    async markAnalysisAsFailed(analysisId, error) {
        return this.updateAnalysisStatus(analysisId, 'failed', error);
    }
    /**
     * Get analysis by analysis ID
     */
    async getAnalysisByAnalysisId(analysisId) {
        try {
            const analysis = await Analysis_1.Analysis.findOne({ analysisId });
            return analysis;
        }
        catch (error) {
            logger_1.logger.error('Error fetching analysis by analysis ID:', error);
            throw new Error('Failed to fetch analysis');
        }
    }
    /**
     * Get analysis by ID (alias for compatibility)
     */
    async getAnalysisById(analysisId) {
        return this.getAnalysisByAnalysisId(analysisId);
    }
    /**
     * Get analyses with pagination
     */
    async getAnalysesWithPagination(options) {
        try {
            const { page, limit, sortBy, sortOrder } = options;
            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
            // Calculate pagination
            const skip = (page - 1) * limit;
            // Execute queries
            const [analyses, totalCount] = await Promise.all([
                Analysis_1.Analysis.find({ status: 'completed' }) // Only show completed analyses
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Analysis_1.Analysis.countDocuments({ status: 'completed' })
            ]);
            const totalPages = Math.ceil(totalCount / limit);
            return {
                analyses: analyses,
                totalCount,
                currentPage: page,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching analyses with pagination:', error);
            throw new Error('Failed to fetch analyses');
        }
    }
    /**
     * Get all analyses with pagination and filtering
     */
    async getAllAnalyses(query = {}) {
        try {
            const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc', search } = query;
            // Build filter object
            const filter = {};
            if (status) {
                filter.status = status;
            }
            if (search) {
                filter.$or = [
                    { resumeFilename: { $regex: search, $options: 'i' } },
                    { jobDescriptionFilename: { $regex: search, $options: 'i' } },
                    { analysisId: { $regex: search, $options: 'i' } }
                ];
            }
            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
            // Calculate pagination
            const skip = (page - 1) * limit;
            // Execute queries
            const [analyses, totalCount] = await Promise.all([
                Analysis_1.Analysis.find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Analysis_1.Analysis.countDocuments(filter)
            ]);
            const totalPages = Math.ceil(totalCount / limit);
            return {
                analyses: analyses,
                totalCount,
                currentPage: page,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching analyses:', error);
            throw new Error('Failed to fetch analyses');
        }
    }
    /**
     * Get analysis statistics
     */
    async getAnalysisStats() {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const [stats] = await Analysis_1.Analysis.aggregate([
                {
                    $facet: {
                        statusCounts: [
                            {
                                $group: {
                                    _id: '$status',
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        averageScore: [
                            {
                                $match: { 'result.overallScore': { $exists: true } }
                            },
                            {
                                $group: {
                                    _id: null,
                                    avgScore: { $avg: '$result.overallScore' }
                                }
                            }
                        ],
                        recentCount: [
                            {
                                $match: { createdAt: { $gte: yesterday } }
                            },
                            {
                                $count: 'recent'
                            }
                        ],
                        totalCount: [
                            {
                                $count: 'total'
                            }
                        ]
                    }
                }
            ]);
            // Process results
            const statusCounts = stats.statusCounts.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {});
            return {
                totalAnalyses: stats.totalCount[0]?.total || 0,
                completedAnalyses: statusCounts.completed || 0,
                processingAnalyses: statusCounts.processing || 0,
                failedAnalyses: statusCounts.failed || 0,
                averageScore: stats.averageScore[0]?.avgScore || 0,
                recentAnalyses: stats.recentCount[0]?.recent || 0
            };
        }
        catch (error) {
            logger_1.logger.error('Error fetching analysis stats:', error);
            throw new Error('Failed to fetch analysis statistics');
        }
    }
    /**
     * Delete analysis by ID
     */
    async deleteAnalysis(analysisId) {
        try {
            const result = await Analysis_1.Analysis.deleteOne({ analysisId });
            if (result.deletedCount === 0) {
                logger_1.logger.warn(`Analysis not found for deletion: ${analysisId}`);
                return false;
            }
            logger_1.logger.info(`Analysis deleted: ${analysisId}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error deleting analysis:', error);
            throw new Error('Failed to delete analysis');
        }
    }
    /**
     * Get top performing analyses
     */
    async getTopAnalyses(limit = 10) {
        try {
            const topAnalyses = await Analysis_1.Analysis.find({
                status: 'completed',
                'result.overallScore': { $exists: true }
            })
                .sort({ 'result.overallScore': -1 })
                .limit(limit)
                .lean();
            return topAnalyses;
        }
        catch (error) {
            logger_1.logger.error('Error fetching top analyses:', error);
            throw new Error('Failed to fetch top analyses');
        }
    }
}
exports.analysisService = new AnalysisService();
//# sourceMappingURL=analysisService.js.map