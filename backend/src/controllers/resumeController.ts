import { Request, Response, NextFunction } from 'express';
import { pythonApiService } from '../services/pythonApiService';
import { cacheService } from '../services/cacheService';
import { analysisService } from '../services/analysisService';
import { logger } from '../utils/logger';
import { generateAnalysisId, extractErrorMessage } from '../utils/helpers';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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

interface TempFileInfo {
  tempId: string;
  filename: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  expiresAt: string;
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

      // Transform the analyses to match frontend expectations
      const transformedAnalyses = analyses.analyses.map(analysis => ({
        id: String(analysis._id),
        analysisId: analysis.analysisId,
        resumeFilename: analysis.resumeFilename,
        jobDescriptionFilename: analysis.jobDescriptionFilename || 'Text Input',
        jobTitle: analysis.result?.jobTitle || 'Position Analysis',
        overallScore: analysis.result?.overallScore || 0,
        chance_of_selection_percentage: analysis.result?.chance_of_selection_percentage || 0, // Send as-is
        analyzedAt: analysis.createdAt,
        status: analysis.status
      }));

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

  // Temporary file handling methods
  private async storeTempFile(file: Express.Multer.File, type: string): Promise<TempFileInfo> {
    const tempId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    
    const tempFileInfo: TempFileInfo = {
      tempId,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Store file info and content in cache (with expiration)
    await cacheService.setTempFile(tempId, {
      ...tempFileInfo,
      buffer: file.buffer,
    });

    // Schedule cleanup
    setTimeout(() => {
      this.cleanupTempFile(tempId).catch((error: unknown) => {
        logger.warn('Scheduled cleanup failed:', { tempId, error: extractErrorMessage(error) });
      });
    }, 30 * 60 * 1000); // 30 minutes

    return tempFileInfo;
  }

  private async retrieveTempFile(tempId: string): Promise<Express.Multer.File | undefined> {
    try {
      const tempFileData = await cacheService.getTempFile(tempId);
      if (!tempFileData) {
        logger.warn('Temporary file not found or expired:', { tempId });
        return undefined;
      }

      // Check if file has expired
      const now = new Date();
      const expiresAt = new Date(tempFileData.expiresAt);
      if (now > expiresAt) {
        logger.warn('Temporary file has expired:', { tempId, expiresAt });
        await this.cleanupTempFile(tempId);
        return undefined;
      }

      // Convert back to Multer file format
      const file: Express.Multer.File = {
        fieldname: 'temp',
        originalname: tempFileData.filename,
        encoding: '7bit',
        mimetype: tempFileData.mimetype,
        size: tempFileData.size,
        buffer: tempFileData.buffer,
        destination: '',
        filename: '',
        path: '',
        stream: {} as any,
      };

      return file;
    } catch (error) {
      logger.error('Error retrieving temporary file:', { tempId, error: extractErrorMessage(error) });
      return undefined;
    }
  }

  private async cleanupTempFile(tempId: string): Promise<void> {
    try {
      await cacheService.deleteTempFile(tempId);
    } catch (error) {
      logger.warn('Failed to cleanup temporary file:', { tempId, error: extractErrorMessage(error) });
    }
  }
}

// Export singleton instance
export const resumeController = new ResumeController(); 