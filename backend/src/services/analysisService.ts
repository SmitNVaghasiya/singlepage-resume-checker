import { Analysis, IAnalysis } from '../models/Analysis';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Custom error class for better error handling
export class AnalysisServiceError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'AnalysisServiceError';
  }
}

// status enum for better type safety
export enum AnalysisStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Valid sort fields
const VALID_SORT_FIELDS = ['createdAt', 'score', 'updatedAt'] as const;
type ValidSortField = typeof VALID_SORT_FIELDS[number];

// Input validation schemas
const createAnalysisSchema = z.object({
  analysisId: z.string().min(1, 'Analysis ID is required'),
  resumeFilename: z.string().min(1, 'Resume filename is required'),
  jobDescriptionFilename: z.string().optional(),
  resumeText: z.string().min(1, 'Resume text is required'),
  jobDescriptionText: z.string().optional(),
});

const updateAnalysisResultSchema = z.object({
  analysisId: z.string().min(1, 'Analysis ID is required'),
  result: z.object({
    // Support both old and new format fields
    overallScore: z.number().min(0).max(100).optional(),
    matchPercentage: z.number().min(0).max(100).optional(),
    score_out_of_100: z.number().min(0).max(100).optional(),
    chance_of_selection_percentage: z.number().min(0).max(100).optional(),
    jobTitle: z.string().optional(),
    industry: z.string().optional(),
    job_description_validity: z.string().optional(),
    resume_eligibility: z.string().optional(),
    // Add other result fields as needed
  }).passthrough(), // Allow additional fields
});

const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be a positive integer'),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100'),
});

const analysisQuerySchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
  status: z.nativeEnum(AnalysisStatus).optional(),
  sortBy: z.enum(VALID_SORT_FIELDS).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().min(1).max(100).optional(),
});

export interface AnalysisQuery {
  page?: number;
  limit?: number;
  status?: AnalysisStatus;
  sortBy?: ValidSortField;
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

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: ValidSortField;
  sortOrder: 'asc' | 'desc';
}

// Utility function to sanitize search input
function sanitizeSearchInput(search: string): string {
  // Remove regex special characters to prevent ReDoS attacks
  return search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class AnalysisService {
  
  /**
   * Creates a new analysis record in the database.
   * @param analysisData - The data for the new analysis.
   * @param analysisData.analysisId - Unique identifier for the analysis.
   * @param analysisData.resumeFilename - Name of the resume file.
   * @param analysisData.jobDescriptionFilename - Name of the job description file (optional).
   * @param analysisData.resumeText - Text content of the resume.
   * @param analysisData.jobDescriptionText - Text content of the job description (optional).
   * @returns The created analysis record.
   * @throws {AnalysisServiceError} If the analysis ID already exists or if the database operation fails.
   */
  async createAnalysis(analysisData: {
    analysisId: string;
    resumeFilename: string;
    jobDescriptionFilename?: string;
    resumeText: string;
    jobDescriptionText?: string;
    userId?: string;
  }): Promise<IAnalysis> {
    try {
      // Validate input
      createAnalysisSchema.parse(analysisData);

      // Check for existing analysisId
      const existingAnalysis = await Analysis.findOne({ analysisId: analysisData.analysisId });
      if (existingAnalysis) {
        logger.warn(`Analysis with ID ${analysisData.analysisId} already exists`);
        throw new AnalysisServiceError('Analysis ID already exists', 'DUPLICATE_ANALYSIS_ID');
      }

      const analysis = new Analysis({
        ...analysisData,
        status: AnalysisStatus.PROCESSING,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedAnalysis = await analysis.save();
      logger.info(`Analysis created with ID: ${savedAnalysis.analysisId}`);
      
      return savedAnalysis;
    } catch (error) {
      logger.error('Error creating analysis:', error);
      if (error instanceof AnalysisServiceError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new AnalysisServiceError(
          `Validation error: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`,
          'VALIDATION_ERROR'
        );
      }
      throw new AnalysisServiceError('Failed to create analysis record', 'DATABASE_ERROR');
    }
  }

  /**
   * Updates analysis with results.
   * @param analysisId - The unique identifier of the analysis.
   * @param result - The analysis result data.
   * @returns The updated analysis record or null if not found.
   * @throws {AnalysisServiceError} If the database operation fails.
   */
  async updateAnalysisResult(analysisId: string, result: any): Promise<IAnalysis | null> {
    try {
      // Validate input
      updateAnalysisResultSchema.parse({ analysisId, result });

      const updatedAnalysis = await Analysis.findOneAndUpdate(
        { analysisId },
        {
          result,
          status: AnalysisStatus.COMPLETED,
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
      if (error instanceof AnalysisServiceError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new AnalysisServiceError(
          `Validation error: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`,
          'VALIDATION_ERROR'
        );
      }
      throw new AnalysisServiceError('Failed to update analysis result', 'DATABASE_ERROR');
    }
  }

  /**
   * Updates analysis status.
   * @param analysisId - The unique identifier of the analysis.
   * @param status - The new status.
   * @param error - Optional error message for failed status.
   * @returns The updated analysis record or null if not found.
   * @throws {AnalysisServiceError} If the database operation fails.
   */
  async updateAnalysisStatus(
    analysisId: string, 
    status: AnalysisStatus, 
    error?: string
  ): Promise<IAnalysis | null> {
    try {
      if (!analysisId || !status) {
        throw new AnalysisServiceError('Analysis ID and status are required', 'VALIDATION_ERROR');
      }

      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (error) {
        updateData.error = error;
      }

      if (status === AnalysisStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }

      const updatedAnalysis = await Analysis.findOneAndUpdate(
        { analysisId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedAnalysis) {
        logger.warn(`Analysis not found for status update: ${analysisId}`);
        return null;
      }

      logger.info(`Analysis status updated: ${analysisId} -> ${status}`);
      return updatedAnalysis;
    } catch (error) {
      logger.error('Error updating analysis status:', error);
      if (error instanceof AnalysisServiceError) {
        throw error;
      }
      throw new AnalysisServiceError('Failed to update analysis status', 'DATABASE_ERROR');
    }
  }

  /**
   * Marks analysis as failed.
   * @param analysisId - The unique identifier of the analysis.
   * @param error - Error message describing the failure.
   * @returns The updated analysis record or null if not found.
   */
  async markAnalysisAsFailed(analysisId: string, error: string): Promise<IAnalysis | null> {
    return this.updateAnalysisStatus(analysisId, AnalysisStatus.FAILED, error);
  }

  /**
   * Gets analysis by analysis ID.
   * @param analysisId - The unique identifier of the analysis.
   * @returns The analysis record or null if not found.
   * @throws {AnalysisServiceError} If the database operation fails.
   */
  async getAnalysisByAnalysisId(analysisId: string): Promise<IAnalysis | null> {
    try {
      if (!analysisId) {
        throw new AnalysisServiceError('Analysis ID is required', 'VALIDATION_ERROR');
      }

      const analysis = await Analysis.findOne({ analysisId })
        .select('-__v') // Exclude version field for better performance
        .lean();

      return analysis;
    } catch (error) {
      logger.error('Error fetching analysis by analysis ID:', error);
      if (error instanceof AnalysisServiceError) {
        throw error;
      }
      throw new AnalysisServiceError('Failed to fetch analysis', 'DATABASE_ERROR');
    }
  }

  /**
   * Get analysis by ID (alias for getAnalysisByAnalysisId for backward compatibility).
   * @deprecated Use getAnalysisByAnalysisId instead
   */
  async getAnalysisById(analysisId: string): Promise<IAnalysis | null> {
    return this.getAnalysisByAnalysisId(analysisId);
  }

  /**
   * Gets analyses with pagination.
   * @param options - Pagination options.
   * @returns Paginated analysis results.
   * @throws {AnalysisServiceError} If pagination parameters are invalid or database operation fails.
   */
  async getAnalysesWithPagination(options: PaginationOptions): Promise<PaginatedAnalysisResult> {
    try {
      // Validate pagination parameters
      paginationSchema.parse(options);

      const { page, limit, sortBy, sortOrder } = options;

      // Validate sortBy field
      if (!VALID_SORT_FIELDS.includes(sortBy)) {
        throw new AnalysisServiceError(
          `Invalid sortBy field. Must be one of: ${VALID_SORT_FIELDS.join(', ')}`,
          'INVALID_SORT_BY'
        );
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries with field selection for better performance
      const [analyses, totalCount] = await Promise.all([
        Analysis.find({ status: AnalysisStatus.COMPLETED })
          .select('analysisId resumeFilename jobDescriptionFilename status createdAt result.overallScore result.score_out_of_100 result.jobTitle')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Analysis.countDocuments({ status: AnalysisStatus.COMPLETED })
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
      logger.error('Error fetching analyses with pagination:', error);
      if (error instanceof AnalysisServiceError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new AnalysisServiceError(
          `Pagination validation error: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`,
          'VALIDATION_ERROR'
        );
      }
      throw new AnalysisServiceError('Failed to fetch analyses', 'DATABASE_ERROR');
    }
  }

  /**
   * Gets all analyses with pagination and filtering.
   * @param query - Query parameters for filtering and pagination.
   * @returns Paginated analysis results.
   * @throws {AnalysisServiceError} If query parameters are invalid or database operation fails.
   */
  async getAllAnalyses(query: AnalysisQuery = {}): Promise<PaginatedAnalysisResult> {
    try {
      // Validate query parameters
      const validatedQuery = analysisQuerySchema.parse(query);
      const {
        page,
        limit,
        status,
        sortBy,
        sortOrder,
        search
      } = validatedQuery;

      // Build filter object
      const filter: any = {};
      
      if (status) {
        filter.status = status;
      }

      if (search) {
        const safeSearch = sanitizeSearchInput(search);
        filter.$or = [
          { resumeFilename: { $regex: safeSearch, $options: 'i' } },
          { jobDescriptionFilename: { $regex: safeSearch, $options: 'i' } },
          { analysisId: { $regex: safeSearch, $options: 'i' } }
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries with field selection for better performance
      const [analyses, totalCount] = await Promise.all([
        Analysis.find(filter)
          .select('analysisId resumeFilename jobDescriptionFilename status createdAt result.overallScore result.score_out_of_100 result.jobTitle')
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
      if (error instanceof AnalysisServiceError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new AnalysisServiceError(
          `Query validation error: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`,
          'VALIDATION_ERROR'
        );
      }
      throw new AnalysisServiceError('Failed to fetch analyses', 'DATABASE_ERROR');
    }
  }

  /**
   * Gets analysis statistics.
   * @returns Analysis statistics including counts and averages.
   * @throws {AnalysisServiceError} If the database operation fails.
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
      const statusCounts = stats.statusCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      return {
        totalAnalyses: stats.totalCount[0]?.total || 0,
        completedAnalyses: statusCounts[AnalysisStatus.COMPLETED] || 0,
        processingAnalyses: statusCounts[AnalysisStatus.PROCESSING] || 0,
        failedAnalyses: statusCounts[AnalysisStatus.FAILED] || 0,
        averageScore: stats.averageScore[0]?.avgScore || 0,
        recentAnalyses: stats.recentCount[0]?.recent || 0
      };
    } catch (error) {
      logger.error('Error fetching analysis stats:', error);
      throw new AnalysisServiceError('Failed to fetch analysis statistics', 'DATABASE_ERROR');
    }
  }

  /**
   * Deletes analysis by ID.
   * @param analysisId - The unique identifier of the analysis to delete.
   * @returns True if deletion was successful, false if analysis not found.
   * @throws {AnalysisServiceError} If the database operation fails.
   */
  async deleteAnalysis(analysisId: string): Promise<boolean> {
    try {
      if (!analysisId) {
        throw new AnalysisServiceError('Analysis ID is required', 'VALIDATION_ERROR');
      }

      const result = await Analysis.deleteOne({ analysisId });
      
      if (result.deletedCount === 0) {
        logger.warn(`Analysis not found for deletion: ${analysisId}`);
        return false;
      }

      logger.info(`Analysis deleted: ${analysisId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting analysis:', error);
      if (error instanceof AnalysisServiceError) {
        throw error;
      }
      throw new AnalysisServiceError('Failed to delete analysis', 'DATABASE_ERROR');
    }
  }

  /**
   * Gets top performing analyses.
   * @param limit - Maximum number of analyses to return (default: 10, max: 50).
   * @returns Array of top performing analyses.
   * @throws {AnalysisServiceError} If the database operation fails.
   */
  async getTopAnalyses(limit: number = 10): Promise<IAnalysis[]> {
    try {
      // Validate limit
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        throw new AnalysisServiceError('Limit must be between 1 and 50', 'INVALID_LIMIT');
      }

      const topAnalyses = await Analysis.find({ 
        status: AnalysisStatus.COMPLETED,
        'result.overallScore': { $exists: true }
      })
        .select('analysisId resumeFilename result.overallScore result.jobTitle createdAt')
        .sort({ 'result.overallScore': -1 })
        .limit(limit)
        .lean();

      return topAnalyses as IAnalysis[];
    } catch (error) {
      logger.error('Error fetching top analyses:', error);
      if (error instanceof AnalysisServiceError) {
        throw error;
      }
      throw new AnalysisServiceError('Failed to fetch top analyses', 'DATABASE_ERROR');
    }
  }

  /**
   * Gets analyses by user ID (for future user-specific functionality).
   * @param userId - The user ID to filter by.
   * @param options - Pagination options.
   * @returns Paginated analysis results for the user.
   * @throws {AnalysisServiceError} If the database operation fails.
   */
  async getAnalysesByUserId(
    userId: string, 
    options: PaginationOptions
  ): Promise<PaginatedAnalysisResult> {
    try {
      if (!userId) {
        throw new AnalysisServiceError('User ID is required', 'VALIDATION_ERROR');
      }

      // Validate pagination parameters
      paginationSchema.parse(options);

      const { page, limit, sortBy, sortOrder } = options;

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute queries
      const [analyses, totalCount] = await Promise.all([
        Analysis.find({ userId })
          .select('analysisId resumeFilename jobDescriptionFilename status createdAt result.overallScore result.score_out_of_100 result.chance_of_selection_percentage result.jobTitle result.matchPercentage')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Analysis.countDocuments({ userId })
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
      logger.error('Error fetching analyses by user ID:', error);
      if (error instanceof AnalysisServiceError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new AnalysisServiceError(
          `Pagination validation error: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`,
          'VALIDATION_ERROR'
        );
      }
      throw new AnalysisServiceError('Failed to fetch user analyses', 'DATABASE_ERROR');
    }
  }
}

export const analysisService = new AnalysisService(); 