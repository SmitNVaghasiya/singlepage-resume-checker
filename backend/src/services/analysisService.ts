import { Analysis, IAnalysis } from '../models/Analysis';
import { logger } from '../utils/logger';

export interface AnalysisQuery {
  page?: number;
  limit?: number;
  status?: 'processing' | 'completed' | 'failed';
  sortBy?: 'createdAt' | 'score' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedAnalysisResult {
  analyses: IAnalysis[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

class AnalysisService {
  
  /**
   * Save a new analysis to the database
   */
  async createAnalysis(analysisData: {
    analysisId: string;
    resumeFilename: string;
    jobDescriptionFilename?: string;
    resumeText: string;
    jobDescriptionText?: string;
  }): Promise<IAnalysis> {
    try {
      const analysis = new Analysis({
        ...analysisData,
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedAnalysis = await analysis.save();
      logger.info(`Analysis created with ID: ${savedAnalysis.analysisId}`);
      
      return savedAnalysis;
    } catch (error) {
      logger.error('Error creating analysis:', error);
      throw new Error('Failed to create analysis record');
    }
  }

  /**
   * Update analysis with results
   */
  async updateAnalysisResult(analysisId: string, result: any): Promise<IAnalysis | null> {
    try {
      const updatedAnalysis = await Analysis.findOneAndUpdate(
        { analysisId },
        {
          result,
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!updatedAnalysis) {
        logger.warn(`Analysis not found for update: ${analysisId}`);
        return null;
      }

      logger.info(`Analysis updated successfully: ${analysisId}`);
      return updatedAnalysis;
    } catch (error) {
      logger.error('Error updating analysis result:', error);
      throw new Error('Failed to update analysis result');
    }
  }

  /**
   * Mark analysis as failed
   */
  async markAnalysisAsFailed(analysisId: string, error: string): Promise<IAnalysis | null> {
    try {
      const updatedAnalysis = await Analysis.findOneAndUpdate(
        { analysisId },
        {
          status: 'failed',
          error,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!updatedAnalysis) {
        logger.warn(`Analysis not found for failure update: ${analysisId}`);
        return null;
      }

      logger.info(`Analysis marked as failed: ${analysisId}`);
      return updatedAnalysis;
    } catch (error) {
      logger.error('Error marking analysis as failed:', error);
      throw new Error('Failed to update analysis status');
    }
  }

  /**
   * Get analysis by ID
   */
  async getAnalysisById(analysisId: string): Promise<IAnalysis | null> {
    try {
      const analysis = await Analysis.findOne({ analysisId });
      return analysis;
    } catch (error) {
      logger.error('Error fetching analysis by ID:', error);
      throw new Error('Failed to fetch analysis');
    }
  }

  /**
   * Get all analyses with pagination and filtering
   */
  async getAllAnalyses(query: AnalysisQuery = {}): Promise<PaginatedAnalysisResult> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search
      } = query;

      // Build filter object
      const filter: any = {};
      
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
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries
      const [analyses, totalCount] = await Promise.all([
        Analysis.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Analysis.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        analyses: analyses as IAnalysis[],
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };
    } catch (error) {
      logger.error('Error fetching analyses:', error);
      throw new Error('Failed to fetch analyses');
    }
  }

  /**
   * Get analysis statistics
   */
  async getAnalysisStats(): Promise<{
    totalAnalyses: number;
    completedAnalyses: number;
    processingAnalyses: number;
    failedAnalyses: number;
    averageScore: number;
    recentAnalyses: number; // Last 24 hours
  }> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const [stats] = await Analysis.aggregate([
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
                $match: { 'result.score': { $exists: true } }
              },
              {
                $group: {
                  _id: null,
                  avgScore: { $avg: '$result.score' }
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
      const statusCounts = stats.statusCounts.reduce((acc: any, item: any) => {
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
    } catch (error) {
      logger.error('Error fetching analysis stats:', error);
      throw new Error('Failed to fetch analysis statistics');
    }
  }

  /**
   * Delete analysis by ID
   */
  async deleteAnalysis(analysisId: string): Promise<boolean> {
    try {
      const result = await Analysis.deleteOne({ analysisId });
      
      if (result.deletedCount === 0) {
        logger.warn(`Analysis not found for deletion: ${analysisId}`);
        return false;
      }

      logger.info(`Analysis deleted: ${analysisId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting analysis:', error);
      throw new Error('Failed to delete analysis');
    }
  }

  /**
   * Get top performing analyses
   */
  async getTopAnalyses(limit: number = 10): Promise<IAnalysis[]> {
    try {
      const topAnalyses = await Analysis.find({ 
        status: 'completed',
        'result.score': { $exists: true }
      })
        .sort({ 'result.score': -1 })
        .limit(limit)
        .lean();

      return topAnalyses as IAnalysis[];
    } catch (error) {
      logger.error('Error fetching top analyses:', error);
      throw new Error('Failed to fetch top analyses');
    }
  }
}

export const analysisService = new AnalysisService(); 