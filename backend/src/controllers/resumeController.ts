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
  // Upload temporary files without authentication
  public uploadTempFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as MulterFiles;
      
      if (!files.resume?.length && !files.jobDescription?.length) {
        res.status(400).json({
          error: 'No files uploaded',
          message: 'At least one file (resume or job description) is required',
        });
        return;
      }

      const tempFiles: { resume?: TempFileInfo; jobDescription?: TempFileInfo } = {};

      // Process resume file
      if (files.resume?.length) {
        const resumeFile = files.resume[0];
        const resumeTempInfo = await this.storeTempFile(resumeFile, 'resume');
        tempFiles.resume = resumeTempInfo;
      }

      // Process job description file
      if (files.jobDescription?.length) {
        const jobFile = files.jobDescription[0];
        const jobTempInfo = await this.storeTempFile(jobFile, 'job-description');
        tempFiles.jobDescription = jobTempInfo;
      }

      logger.info('Temporary files uploaded successfully', {
        resumeUploaded: !!tempFiles.resume,
        jobDescriptionUploaded: !!tempFiles.jobDescription,
        tempIds: {
          resume: tempFiles.resume?.tempId,
          jobDescription: tempFiles.jobDescription?.tempId,
        }
      });

      res.status(200).json({
        message: 'Files uploaded successfully. Please log in to continue with analysis.',
        tempFiles,
        requiresAuth: true,
        expiresAt: tempFiles.resume?.expiresAt || tempFiles.jobDescription?.expiresAt,
      });

    } catch (error) {
      logger.error('Error in uploadTempFiles:', { error: extractErrorMessage(error) });
      next(error);
    }
  };

  // Analyze resume against job description
  public analyzeResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const files = req.files as MulterFiles;
      const { jobDescriptionText, resumeTempId, jobDescriptionTempId } = req.body;
      
      let resumeFile: Express.Multer.File | undefined;
      let jobDescriptionFile: Express.Multer.File | undefined;

      // Handle resume file - either from upload or from temp storage
      if (files.resume?.length) {
        resumeFile = files.resume[0];
      } else if (resumeTempId) {
        resumeFile = await this.retrieveTempFile(resumeTempId);
      }

      // Handle job description file - either from upload or from temp storage
      if (files.jobDescription?.length) {
        jobDescriptionFile = files.jobDescription[0];
      } else if (jobDescriptionTempId) {
        jobDescriptionFile = await this.retrieveTempFile(jobDescriptionTempId);
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

      // Clean up temp files after starting analysis
      if (resumeTempId) {
        this.cleanupTempFile(resumeTempId).catch(error => {
          logger.warn('Failed to cleanup temp resume file:', { resumeTempId, error: extractErrorMessage(error) });
        });
      }
      if (jobDescriptionTempId) {
        this.cleanupTempFile(jobDescriptionTempId).catch(error => {
          logger.warn('Failed to cleanup temp job description file:', { jobDescriptionTempId, error: extractErrorMessage(error) });
        });
      }

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