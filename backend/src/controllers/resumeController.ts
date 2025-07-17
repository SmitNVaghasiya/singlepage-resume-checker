import { Request, Response, NextFunction } from 'express';
import { pythonApiService } from '../services/pythonApiService';
import { cacheService } from '../services/cacheService';
import { analysisService, AnalysisServiceError, AnalysisStatus } from '../services/analysisService';
import { ResultTransformer } from '../services/resultTransformer';
import { logger } from '../utils/logger';
import { generateAnalysisId, extractErrorMessage } from '../utils/helpers';
import * as crypto from 'crypto';

interface MulterFiles {
  resume?: Express.Multer.File[];
  jobDescription?: Express.Multer.File[];
}

interface AnalysisStatusData {
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  currentStage?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
}



class ResumeController {
  // Upload temporary files without authentication (removed - frontend only approach)
  // public uploadTempFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //   // This method is no longer needed as we're handling everything on frontend
  // };

  // Analyze resume against job description
  public analyzeResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const files = req.files as MulterFiles;
      const { jobDescriptionText } = req.body;
      
      logger.info('Analyze resume request received:', {
        hasResumeFiles: !!files.resume?.length,
        hasJobDescriptionFiles: !!files.jobDescription?.length,
        hasJobDescriptionText: !!jobDescriptionText,
        resumeFileName: files.resume?.[0]?.originalname,
        jobDescriptionFileName: files.jobDescription?.[0]?.originalname
      });
      
      let resumeFile: Express.Multer.File | undefined;
      let jobDescriptionFile: Express.Multer.File | undefined;
      let finalJobDescriptionText: string | undefined;

      // Handle resume file - only from direct upload
      if (files.resume?.length) {
        resumeFile = files.resume[0];
        logger.info('Using uploaded resume file:', {
          filename: resumeFile.originalname,
          size: resumeFile.size
        });
      }

      // Handle job description - only from direct upload or text
      if (files.jobDescription?.length) {
        jobDescriptionFile = files.jobDescription[0];
        logger.info('Using uploaded job description file:', {
          filename: jobDescriptionFile.originalname,
          size: jobDescriptionFile.size
        });
      } else if (jobDescriptionText?.trim()) {
        // Use provided job description text
        finalJobDescriptionText = jobDescriptionText.trim();
        logger.info('Using provided job description text:', {
          length: finalJobDescriptionText?.length || 0,
          preview: finalJobDescriptionText?.substring(0, 100) + '...' || ''
        });
      }

      // Validate resume file
      if (!resumeFile) {
        res.status(400).json({
          error: 'Missing file',
          message: 'Resume file is required',
        });
        return;
      }

      // Validate job description input
      if (!jobDescriptionFile && !finalJobDescriptionText?.trim()) {
        res.status(400).json({
          error: 'Missing job description',
          message: 'Either job description file or text is required',
        });
        return;
      }

      // Generate unique analysis ID
      const analysisId = generateAnalysisId();

      // Log analysis request with structured data
      this.logAnalysisRequest(analysisId, resumeFile, jobDescriptionFile, finalJobDescriptionText);

      // Start async processing (fire and forget)
      this.processAnalysisAsync(analysisId, resumeFile, jobDescriptionFile, finalJobDescriptionText, startTime)
        .catch(error => {
          logger.error('Unhandled error in async processing:', { analysisId, error: extractErrorMessage(error) });
        });

      // No cleanup needed - frontend handles everything

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
      let dbResult: any = null;

      // Fallback to database if not in cache
      if (!result) {
        try {
          dbResult = await analysisService.getAnalysisByAnalysisId(analysisId);
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

      // Transform result to frontend format if it's in old format
      let transformedResult: any = result;
      if (ResultTransformer.isOldFormat(result)) {
        logger.info('Transforming old format result to frontend format', { analysisId });
        transformedResult = ResultTransformer.transformToFrontendFormat(result, {
          analysisId,
          resumeFilename: dbResult?.resumeFilename,
          jobDescriptionFilename: dbResult?.jobDescriptionFilename,
          analyzedAt: dbResult?.createdAt,
          processingTime: result.processingTime
        });
      }

      res.json({
        analysisId,
        status: 'completed',
        result: transformedResult,
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
        sortBy: sortBy as 'createdAt' | 'score' | 'updatedAt',
        sortOrder,
      });

      // Transform the analyses to match frontend expectations
      const transformedAnalyses = analyses.analyses.map(analysis => {
        // Transform result to frontend format if it's in old format
        let transformedResult: any = analysis.result;
        if (analysis.result && ResultTransformer.isOldFormat(analysis.result)) {
          logger.info('Transforming old format result in history', { analysisId: analysis.analysisId });
          transformedResult = ResultTransformer.transformToFrontendFormat(analysis.result, {
            analysisId: analysis.analysisId,
            resumeFilename: analysis.resumeFilename,
            jobDescriptionFilename: analysis.jobDescriptionFilename,
            analyzedAt: analysis.createdAt,
            processingTime: analysis.result.processingTime
          });
        }

        return {
          id: String(analysis._id),
          analysisId: analysis.analysisId,
          resumeFilename: analysis.resumeFilename,
          jobDescriptionFilename: analysis.jobDescriptionFilename || 'Text Input',
          jobTitle: transformedResult?.jobTitle || analysis.result?.jobTitle || 'Position Analysis',
          overallScore: transformedResult?.score_out_of_100 || analysis.result?.overallScore || 0,
          chance_of_selection_percentage: transformedResult?.chance_of_selection_percentage || analysis.result?.chance_of_selection_percentage || 0,
          analyzedAt: analysis.createdAt,
          status: analysis.status,
          result: transformedResult // Include the full transformed result
        };
      });

      res.json({
        analyses: transformedAnalyses,
        totalCount: analyses.totalCount,
        currentPage: analyses.currentPage,
        totalPages: analyses.totalPages,
        hasNextPage: analyses.hasNextPage,
        hasPrevPage: analyses.hasPrevPage,
        pagination: {
          page,
          limit,
          hasNextPage: analyses.hasNextPage,
          hasPrevPage: analyses.hasPrevPage,
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

  private async updateAnalysisStatus(analysisId: string, status: AnalysisStatusData): Promise<void> {
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
      const errorMessage = extractErrorMessage(dbError);
      logger.error('Error updating analysis result:', {
        analysisId,
        error: errorMessage,
        resultKeys: Object.keys(result || {}),
        hasRequiredFields: {
          overallScore: typeof result?.overallScore === 'number',
          matchPercentage: typeof result?.matchPercentage === 'number',
          jobTitle: typeof result?.jobTitle === 'string',
          industry: typeof result?.industry === 'string'
        }
      });
      
      // Try to fix the result if it's missing required fields
      const fixedResult = this.fixMissingRequiredFields(result);
      if (fixedResult !== result) {
        try {
          await analysisService.updateAnalysisResult(analysisId, fixedResult);
          logger.info('Successfully updated with fixed result', { analysisId });
        } catch (retryError) {
          logger.error('Failed to update with fixed result:', {
            analysisId,
            error: extractErrorMessage(retryError)
          });
        }
      }
    }
  }

  private fixMissingRequiredFields(result: any): any {
    if (!result) return result;
    
    const fixed = { ...result };
    
    // Ensure required fields have default values
    if (typeof fixed.overallScore !== 'number' || isNaN(fixed.overallScore)) {
      fixed.overallScore = 50;
    }
    
    if (typeof fixed.matchPercentage !== 'number' || isNaN(fixed.matchPercentage)) {
      fixed.matchPercentage = 50;
    }
    
    if (typeof fixed.jobTitle !== 'string' || !fixed.jobTitle.trim()) {
      fixed.jobTitle = 'Software Engineer';
    }
    
    if (typeof fixed.industry !== 'string' || !fixed.industry.trim()) {
      fixed.industry = 'Technology';
    }
    
    return fixed;
  }

  private async completeAnalysis(analysisId: string, result: any): Promise<void> {
    await this.updateAnalysisStatus(analysisId, {
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
    });

    logger.info('Comprehensive analysis completed successfully', {
      analysisId,
      overallScore: result?.score_out_of_100 || result?.overallScore,
      matchPercentage: result?.chance_of_selection_percentage || result?.matchPercentage,
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
      await analysisService.updateAnalysisStatus(analysisId, AnalysisStatus.FAILED, errorMessage);
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