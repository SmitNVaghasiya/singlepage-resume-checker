import { Request, Response, NextFunction } from 'express';
import { pythonApiService } from '../services/pythonApiService';
import { cacheService } from '../services/cacheService';
import { analysisService } from '../services/analysisService';
import { logger } from '../utils/logger';
import { generateAnalysisId } from '../utils/helpers';

interface MulterFiles {
  resume?: Express.Multer.File[];
  jobDescription?: Express.Multer.File[];
}

export const resumeController = {
  // Analyze resume against job description
  analyzeResume: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    try {
      const files = req.files as MulterFiles;
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
      const analysisId = generateAnalysisId();

      // Log analysis request
      logger.info({
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

    } catch (error) {
      logger.error('Error in analyzeResume:', error);
      next(error);
    }
  },

  // Get analysis status
  getAnalysisStatus: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { analysisId } = req.params;

      // Check cache for status
      const status = await cacheService.getAnalysisStatus(analysisId);

      if (!status) {
        res.status(404).json({
          error: 'Not found',
          message: 'Analysis not found or expired',
        });
        return;
      }

      res.json(status);
    } catch (error) {
      logger.error('Error in getAnalysisStatus:', error);
      next(error);
    }
  },

  // Get analysis result
  getAnalysisResult: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { analysisId } = req.params;

      // Try cache first
      let result = await cacheService.getAnalysisResult(analysisId);

      if (!result) {
        // Fallback to database
        try {
          const dbResult = await analysisService.getAnalysisByAnalysisId(analysisId);
          if (dbResult && dbResult.status === 'completed') {
            result = dbResult.result;
          }
        } catch (dbError) {
          logger.warn('Database fallback failed:', dbError);
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
    } catch (error) {
      logger.error('Error in getAnalysisResult:', error);
      next(error);
    }
  },

  // Get user's analysis history (if authenticated)
  getAnalysisHistory: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = req.query.sortBy as string || 'createdAt';
      const sortOrder = req.query.sortOrder as string || 'desc';

      // For now, get all analyses (later filter by user when auth is implemented)
      const analyses = await analysisService.getAnalysesWithPagination({
        page,
        limit,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json(analyses);
    } catch (error) {
      logger.error('Error in getAnalysisHistory:', error);
      next(error);
    }
  },
};

// Async function to process analysis
async function processAnalysisAsync(
  analysisId: string,
  resumeFile: Express.Multer.File,
  jobDescriptionFile?: Express.Multer.File,
  jobDescriptionText?: string,
  startTime?: number
) {
  try {
    // Update status to processing in cache
    await cacheService.setAnalysisStatus(analysisId, {
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
    } catch {
      resumeTextPreview = 'Binary file - will be processed by AI service';
    }

    if (jobDescriptionFile) {
      try {
        jobDescriptionTextPreview = jobDescriptionFile.buffer.toString('utf-8').substring(0, 1000);
      } catch {
        jobDescriptionTextPreview = 'Binary file - will be processed by AI service';
      }
    } else {
      jobDescriptionTextPreview = jobDescriptionText || '';
    }

    // Save initial analysis record to MongoDB
    try {
      await analysisService.createAnalysis({
        analysisId,
        resumeFilename: resumeFile.originalname,
        jobDescriptionFilename: jobDescriptionFile?.originalname || 'Text Input',
        resumeText: resumeTextPreview,
        jobDescriptionText: jobDescriptionTextPreview,
      });
    } catch (dbError) {
      logger.warn('Failed to save initial record to MongoDB, continuing with cache only:', dbError);
    }

    // Update progress
    await cacheService.setAnalysisStatus(analysisId, {
      status: 'processing',
      progress: 25,
      currentStage: 'Analyzing job requirements...',
    });

    // Call Python API for comprehensive analysis
    const result = await pythonApiService.analyzeResume(
      resumeFile,
      jobDescriptionFile,
      jobDescriptionText
    );

    // Calculate processing time
    const processingTime = startTime ? Date.now() - startTime : undefined;
    if (processingTime && result.result) {
      result.result.processingTime = processingTime;
    }

    // Update progress
    await cacheService.setAnalysisStatus(analysisId, {
      status: 'processing',
      progress: 90,
      currentStage: 'Finalizing analysis report...',
    });

    // Store result in cache
    await cacheService.setAnalysisResult(analysisId, {
      ...result.result,
      completedAt: new Date().toISOString(),
    });

    // Update status to completed in cache
    await cacheService.setAnalysisStatus(analysisId, {
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
    });

    // Update MongoDB with comprehensive results
    try {
      await analysisService.updateAnalysisResult(analysisId, result.result);
    } catch (dbError) {
      logger.warn('Failed to update MongoDB with results, cache updated successfully:', dbError);
    }

    logger.info({
      message: 'Comprehensive analysis completed successfully',
      analysisId,
      overallScore: result.result?.overallScore,
      processingTime,
    });

  } catch (error) {
    logger.error({
      message: 'Comprehensive analysis failed',
      analysisId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Update status to failed
    await cacheService.setAnalysisStatus(analysisId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Analysis failed',
      failedAt: new Date().toISOString(),
    });

    // Update database status
    try {
      await analysisService.updateAnalysisStatus(analysisId, 'failed', 
        error instanceof Error ? error.message : 'Analysis failed');
    } catch (dbError) {
      logger.warn('Failed to update database status:', dbError);
    }
  }
} 