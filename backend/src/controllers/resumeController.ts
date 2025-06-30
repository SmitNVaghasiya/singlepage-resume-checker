import { Request, Response, NextFunction } from 'express';
import { pythonApiService } from '../services/pythonApiService';
import { cacheService } from '../services/cacheService';
import { analysisService } from '../services/analysisService';
import { logger } from '../utils/logger';
import { generateAnalysisId, extractErrorMessage } from '../utils/helpers';

interface MulterFiles {
  resume?: Express.Multer.File[];
  jobDescription?: Express.Multer.File[];
}

interface AnalysisStatus {
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  currentStage?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
}

class ResumeController {
  // Analyze resume against job description
  public analyzeResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const files = req.files as MulterFiles;
      const { jobDescriptionText } = req.body;
      
      // Validate resume file
      if (!files.resume?.length) {
        res.status(400).json({
          error: 'Missing file',
          message: 'Resume file is required',
        });
        return;
      }

      const resumeFile = files.resume[0];
      const jobDescriptionFile = files.jobDescription?.[0];

      // Validate job description input
      if (!jobDescriptionFile && !jobDescriptionText?.trim()) {
        res.status(400).json({
          error: 'Missing job description',
          message: 'Either job description file or text is required',
        });
        return;
      }

      // Generate unique analysis ID
      const analysisId = generateAnalysisId();

      // Log analysis request with structured data
      this.logAnalysisRequest(analysisId, resumeFile, jobDescriptionFile, jobDescriptionText);

      // Start async processing (fire and forget)
      this.processAnalysisAsync(analysisId, resumeFile, jobDescriptionFile, jobDescriptionText, startTime)
        .catch(error => {
          logger.error('Unhandled error in async processing:', { analysisId, error: extractErrorMessage(error) });
        });

      // Return immediate response
      res.status(202).json({
        message: 'Comprehensive analysis started',
        analysisId,
        status: 'processing',
        estimatedTime: '15-45 seconds',
      });

    } catch (error) {
      logger.error('Error in analyzeResume:', { error: extractErrorMessage(error), requestId: req.headers['x-request-id'] });
      next(error);
    }
  };

  // Get analysis status
  public getAnalysisStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { analysisId } = req.params;

      if (!analysisId) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Analysis ID is required',
        });
        return;
      }

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
      logger.error('Error in getAnalysisStatus:', { 
        analysisId: req.params.analysisId, 
        error: extractErrorMessage(error) 
      });
      next(error);
    }
  };

  // Get analysis result
  public getAnalysisResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { analysisId } = req.params;

      if (!analysisId) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'Analysis ID is required',
        });
        return;
      }

      let result = await cacheService.getAnalysisResult(analysisId);

      // Fallback to database if not in cache
      if (!result) {
        try {
          const dbResult = await analysisService.getAnalysisByAnalysisId(analysisId);
          if (dbResult?.status === 'completed') {
            result = dbResult.result;
            // Re-cache the result for future requests
            await cacheService.setAnalysisResult(analysisId, result);
          }
        } catch (dbError) {
          logger.warn('Database fallback failed:', { 
            analysisId, 
            error: extractErrorMessage(dbError) 
          });
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
        retrievedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in getAnalysisResult:', { 
        analysisId: req.params.analysisId, 
        error: extractErrorMessage(error) 
      });
      next(error);
    }
  };

  // Get user's analysis history (paginated)
  public getAnalysisHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (['asc', 'desc'].includes(req.query.sortOrder as string)) 
        ? req.query.sortOrder as 'asc' | 'desc' 
        : 'desc';

      const analyses = await analysisService.getAnalysesWithPagination({
        page,
        limit,
        sortBy,
        sortOrder,
      });

      res.json({
        ...analyses,
        pagination: {
          page,
          limit,
          hasNextPage: (analyses as any).results?.length === limit,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      logger.error('Error in getAnalysisHistory:', { 
        query: req.query, 
        error: extractErrorMessage(error) 
      });
      next(error);
    }
  };

  // Private helper methods
  private logAnalysisRequest(
    analysisId: string,
    resumeFile: Express.Multer.File,
    jobDescriptionFile?: Express.Multer.File,
    jobDescriptionText?: string
  ): void {
    logger.info('Starting comprehensive resume analysis', {
      analysisId,
      resume: {
        size: resumeFile.size,
        filename: resumeFile.originalname,
        mimetype: resumeFile.mimetype,
      },
      jobDescription: {
        hasFile: !!jobDescriptionFile,
        hasText: !!jobDescriptionText?.trim(),
        fileSize: jobDescriptionFile?.size || 0,
        filename: jobDescriptionFile?.originalname,
        textLength: jobDescriptionText?.length || 0,
      },
    });
  }

  private async processAnalysisAsync(
    analysisId: string,
    resumeFile: Express.Multer.File,
    jobDescriptionFile?: Express.Multer.File,
    jobDescriptionText?: string,
    startTime?: number
  ): Promise<void> {
    try {
      // Update initial status
      await this.updateAnalysisStatus(analysisId, {
        status: 'processing',
        startedAt: new Date().toISOString(),
        progress: 10,
        currentStage: 'Extracting resume content...',
      });

      // Create initial database record
      await this.createInitialAnalysisRecord(analysisId, resumeFile, jobDescriptionFile, jobDescriptionText);

      // Update progress - job description analysis
      await this.updateAnalysisStatus(analysisId, {
        status: 'processing',
        progress: 25,
        currentStage: 'Analyzing job requirements...',
      });

      // Call Python API for analysis
      const result = await pythonApiService.analyzeResume(
        resumeFile,
        jobDescriptionFile,
        jobDescriptionText
      );

      // Add processing time metadata
      if (startTime && result.result) {
        result.result.processingTime = Date.now() - startTime;
      }

      // Update progress - finalizing
      await this.updateAnalysisStatus(analysisId, {
        status: 'processing',
        progress: 90,
        currentStage: 'Finalizing analysis report...',
      });

      // Store results
      await this.storeAnalysisResults(analysisId, result.result);

      // Complete analysis
      await this.completeAnalysis(analysisId, result.result);

    } catch (error) {
      await this.handleAnalysisError(analysisId, error);
    }
  }

  private async updateAnalysisStatus(analysisId: string, status: AnalysisStatus): Promise<void> {
    try {
      await cacheService.setAnalysisStatus(analysisId, status);
    } catch (error) {
      logger.warn('Failed to update analysis status in cache:', { 
        analysisId, 
        error: extractErrorMessage(error) 
      });
    }
  }

  private async createInitialAnalysisRecord(
    analysisId: string,
    resumeFile: Express.Multer.File,
    jobDescriptionFile?: Express.Multer.File,
    jobDescriptionText?: string
  ): Promise<void> {
    try {
      const resumeTextPreview = this.extractTextPreview(resumeFile.buffer);
      const jobDescriptionTextPreview = jobDescriptionFile 
        ? this.extractTextPreview(jobDescriptionFile.buffer)
        : jobDescriptionText || '';

      await analysisService.createAnalysis({
        analysisId,
        resumeFilename: resumeFile.originalname,
        jobDescriptionFilename: jobDescriptionFile?.originalname || 'Text Input',
        resumeText: resumeTextPreview,
        jobDescriptionText: jobDescriptionTextPreview,
      });
    } catch (dbError) {
      logger.warn('Failed to save initial record to MongoDB:', { 
        analysisId, 
        error: extractErrorMessage(dbError) 
      });
    }
  }

  private extractTextPreview(buffer: Buffer): string {
    try {
      return buffer.toString('utf-8').substring(0, 1000);
    } catch {
      return 'Binary file - will be processed by AI service';
    }
  }

  private async storeAnalysisResults(analysisId: string, result: any): Promise<void> {
    const enhancedResult = {
      ...result,
      completedAt: new Date().toISOString(),
    };

    // Store in cache
    await cacheService.setAnalysisResult(analysisId, enhancedResult);

    // Update database
    try {
      await analysisService.updateAnalysisResult(analysisId, result);
    } catch (dbError) {
      logger.warn('Failed to update MongoDB with results:', { 
        analysisId, 
        error: extractErrorMessage(dbError) 
      });
    }
  }

  private async completeAnalysis(analysisId: string, result: any): Promise<void> {
    await this.updateAnalysisStatus(analysisId, {
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
    });

    logger.info('Comprehensive analysis completed successfully', {
      analysisId,
      overallScore: result?.overallScore,
      matchPercentage: result?.matchPercentage,
    });
  }

  private async handleAnalysisError(analysisId: string, error: unknown): Promise<void> {
    const errorMessage = extractErrorMessage(error);
    
    logger.error('Comprehensive analysis failed', {
      analysisId,
      error: errorMessage,
    });

    // Update status to failed
    await this.updateAnalysisStatus(analysisId, {
      status: 'failed',
      error: errorMessage,
      failedAt: new Date().toISOString(),
    });

    // Update database status
    try {
      await analysisService.updateAnalysisStatus(analysisId, 'failed', errorMessage);
    } catch (dbError) {
      logger.warn('Failed to update database status:', { 
        analysisId, 
        error: extractErrorMessage(dbError) 
      });
    }
  }
}

// Export singleton instance
export const resumeController = new ResumeController(); 