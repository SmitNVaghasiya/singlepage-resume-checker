import { Request, Response, NextFunction } from 'express';
import { pythonApiService } from '../services/pythonApiService';
import { cacheService } from '../services/cacheService';
import { analysisService } from '../services/analysisService';
import { ResultTransformer } from '../services/resultTransformer';
import { logger } from '../utils/logger';
import { extractErrorMessage } from '../utils/helpers';

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
    try {
      const { jobDescriptionText } = req.body;
      const files = req.files as MulterFiles;

      let resumeFile: Express.Multer.File | undefined;
      let jobDescriptionFile: Express.Multer.File | undefined;
      let finalJobDescriptionText: string | undefined;

      // Handle resume file
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

      // Log analysis request
      this.logAnalysisRequest('pending', resumeFile, jobDescriptionFile, finalJobDescriptionText);

      // Get JWT from request headers
      const userJwt = req.headers['authorization'] ? String(req.headers['authorization']).replace(/^Bearer /, '') : undefined;

      // Start async processing and get the Python server's analysis ID
      const pythonAnalysisId = await this.processAnalysisAsync(resumeFile, jobDescriptionFile, finalJobDescriptionText, (req as any).userId, userJwt);

      // Return immediate response with the Python server's analysis ID
      res.status(202).json({
        message: 'Comprehensive analysis started',
        analysisId: pythonAnalysisId, // Use Python server's ID
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

      // First check cache
      let status = await cacheService.getAnalysisStatus(analysisId);

      // If not in cache, check Python server directly
      if (!status) {
        try {
          const analysisDoc = await analysisService.getAnalysisByAnalysisId(analysisId);
          if (analysisDoc) {
            status = {
              status: analysisDoc.status as 'processing' | 'completed' | 'failed',
              progress: analysisDoc.status === 'completed' ? 100 : 50,
              currentStage: analysisDoc.status === 'completed' ? 'Analysis completed' : 'Processing analysis',
              startedAt: (analysisDoc as any).startedAt ? new Date((analysisDoc as any).startedAt).toISOString() : new Date().toISOString(),
              ...(analysisDoc.status === 'completed' && { completedAt: analysisDoc.completedAt ? new Date(analysisDoc.completedAt).toISOString() : new Date().toISOString() })
            };
            await cacheService.setAnalysisStatus(analysisId, status);
          }
        } catch (dbError) {
          logger.warn('Failed to check analysis status from MongoDB:', {
            analysisId,
            error: extractErrorMessage(dbError)
          });
        }
      }

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

      // First check if we have the analysis in our backend database
      let analysis = await analysisService.getAnalysisByAnalysisId(analysisId);
      
      if (analysis && analysis.result) {
        // We have the data in our database, return it directly
        logger.info('Found analysis in backend database', { analysisId });
        
        // Transform result to frontend format
        const transformedResult = this.transformResult(analysis.result, analysisId);

        // Ensure the response has all required fields
        const finalResult = {
          ...transformedResult,
          // Add metadata fields that frontend expects
          id: analysisId,
          analysisId: analysisId,
          resumeFilename: analysis.resumeFilename || transformedResult.resumeFilename || 'Resume',
          jobDescriptionFilename: analysis.jobDescriptionFilename || transformedResult.jobDescriptionFilename || 'Job Description',
          jobTitle: transformedResult.jobTitle || analysis.result.jobTitle || 'Position Analysis',
          overallScore: transformedResult.score_out_of_100 || transformedResult.overallScore || analysis.result.overallScore || 0,
          chance_of_selection_percentage: transformedResult.chance_of_selection_percentage || transformedResult.matchPercentage || analysis.result.matchPercentage || 0,
          analyzedAt: analysis.createdAt || new Date().toISOString(),
          status: 'completed'
        };

        res.json({
          analysisId,
          status: 'completed',
          result: finalResult,
          retrievedAt: new Date().toISOString(),
        });
        return;
      }

      // If not in backend database, check cache
      const status = await cacheService.getAnalysisStatus(analysisId);
      let result = await cacheService.getAnalysisResult(analysisId);

      // If we have result in cache, return it
      if (result) {
        logger.info('Found analysis in cache', { analysisId });
        
        // Transform result to frontend format
        const transformedResult = this.transformResult(result, analysisId);

        // Ensure the response has all required fields
        const finalResult = {
          ...transformedResult,
          // Add metadata fields that frontend expects
          id: analysisId,
          analysisId: analysisId,
          resumeFilename: result.resumeFilename || transformedResult.resumeFilename || 'Resume',
          jobDescriptionFilename: result.jobDescriptionFilename || transformedResult.jobDescriptionFilename || 'Job Description',
          jobTitle: transformedResult.jobTitle || result.jobTitle || 'Position Analysis',
          overallScore: transformedResult.score_out_of_100 || transformedResult.overallScore || result.overallScore || 0,
          chance_of_selection_percentage: transformedResult.chance_of_selection_percentage || transformedResult.matchPercentage || result.matchPercentage || 0,
          analyzedAt: result.analyzedAt || result.createdAt || new Date().toISOString(),
          status: 'completed'
        };

        res.json({
          analysisId,
          status: 'completed',
          result: finalResult,
          retrievedAt: new Date().toISOString(),
        });
        return;
      }

      // If we have status but no result, try to fetch from MongoDB
      if (status?.status === 'completed' && !result) {
        try {
          const analysisDoc = await analysisService.getAnalysisByAnalysisId(analysisId);
          if (analysisDoc && analysisDoc.result) {
            result = analysisDoc.result;
            await cacheService.setAnalysisResult(analysisId, result);
          }
        } catch (fetchError) {
          logger.warn('Failed to fetch analysis result from MongoDB:', {
            analysisId,
            error: extractErrorMessage(fetchError)
          });
        }
      }

      if (!result && status?.status !== 'processing') {
        res.status(404).json({
          error: 'Not found',
          message: 'Analysis result not found or expired',
        });
        return;
      }

      // If still processing, return status
      if (status?.status === 'processing') {
        res.json({
          analysisId,
          status: 'processing',
          progress: status.progress,
          currentStage: status.currentStage,
          startedAt: status.startedAt
        });
        return;
      }

      // Transform result to frontend format
      const transformedResult = this.transformResult(result, analysisId);

      // Ensure the response has all required fields
      const finalResult = {
        ...transformedResult,
        // Add metadata fields that frontend expects
        id: analysisId,
        analysisId: analysisId,
        resumeFilename: result.resumeFilename || transformedResult.resumeFilename || 'Resume',
        jobDescriptionFilename: result.jobDescriptionFilename || transformedResult.jobDescriptionFilename || 'Job Description',
        jobTitle: transformedResult.jobTitle || result.jobTitle || 'Position Analysis',
        overallScore: transformedResult.score_out_of_100 || transformedResult.overallScore || result.overallScore || 0,
        chance_of_selection_percentage: transformedResult.chance_of_selection_percentage || transformedResult.matchPercentage || result.matchPercentage || 0,
        analyzedAt: result.analyzedAt || result.createdAt || new Date().toISOString(),
        status: 'completed'
      };

      res.json({
        analysisId,
        status: 'completed',
        result: finalResult,
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

      // Get analyses from backend database
      const analyses = await analysisService.getAnalysesWithPagination({
        page,
        limit,
        sortBy: sortBy as 'createdAt' | 'score' | 'updatedAt',
        sortOrder,
      });

      // Transform the analyses to match frontend expectations
      const transformedAnalyses = analyses.analyses.map((analysis) => {
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
          overallScore: transformedResult?.score_out_of_100 || transformedResult?.overallScore || analysis.result?.overallScore || 0,
          chance_of_selection_percentage: transformedResult?.chance_of_selection_percentage || transformedResult?.matchPercentage || analysis.result?.matchPercentage || 0,
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
    status: 'pending' | 'processing' | 'completed' | 'failed',
    resumeFile: Express.Multer.File,
    jobDescriptionFile?: Express.Multer.File,
    jobDescriptionText?: string
  ): void {
    logger.info('Starting comprehensive resume analysis', {
      status,
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
    resumeFile: Express.Multer.File,
    jobDescriptionFile?: Express.Multer.File,
    jobDescriptionText?: string,
    userId?: string,
    userJwt?: string // <-- Add userJwt param
  ): Promise<string> {
    try {
      // Call Python API for analysis first to get the analysis ID
      const result = await pythonApiService.analyzeResume(
        resumeFile,
        jobDescriptionFile,
        jobDescriptionText,
        userId,
        userJwt // <-- Pass userJwt
      );

      const pythonAnalysisId = result.analysisId;

      // DO NOT create or write analysis records in MongoDB here.
      // Only poll MongoDB for the full result (wait for Python server to write it)
      const maxWaitMs = 15000; // 15 seconds max
      const pollIntervalMs = 1000; // 1 second
      let waited = 0;
      let fullResult = null;
      while (waited < maxWaitMs) {
        const analysisDoc = await analysisService.getAnalysisByAnalysisId(pythonAnalysisId);
        if (analysisDoc && analysisDoc.result && Object.keys(analysisDoc.result).length > 3) { // Heuristic: more than minimal keys
          fullResult = analysisDoc.result;
          break;
        }
        await new Promise(res => setTimeout(res, pollIntervalMs));
        waited += pollIntervalMs;
      }

      if (!fullResult) {
        // Mark as failed in cache and log error (do not update DB)
        await cacheService.setAnalysisStatus(pythonAnalysisId, {
          status: 'failed',
          currentStage: 'Failed to fetch full analysis report from database',
          progress: 0,
          startedAt: new Date().toISOString(),
        });
        logger.error('Failed to fetch full analysis report from MongoDB after Python completion', {
          pythonAnalysisId
        });
        throw new Error('Full analysis report not found in database after waiting');
      }

      // Store complete result in cache for future requests
      await cacheService.setAnalysisResult(pythonAnalysisId, fullResult);
      await cacheService.setAnalysisStatus(pythonAnalysisId, {
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString()
      });

      logger.info('Analysis completed and available in backend cache', {
        pythonAnalysisId: pythonAnalysisId,
        status: 'completed'
      });

      // No DB write for analysis report here

      // Log the Python server's analysis ID for reference
      logger.info('Analysis completed with Python server analysis ID', {
        pythonAnalysisId: pythonAnalysisId,
        status: 'completed'
      });

      return pythonAnalysisId;

    } catch (error) {
      throw error; // Re-throw to be caught by the caller
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
    jobDescriptionText?: string,
    userId?: string
  ): Promise<void> {
    try {
      // Extract text from resume file for storage
      const resumeText = this.extractTextPreview(resumeFile.buffer);
      
      // Create analysis record in backend database
      await analysisService.createAnalysis({
        analysisId: analysisId, // Use Python server's analysis ID
        resumeFilename: resumeFile.originalname,
        jobDescriptionFilename: jobDescriptionFile?.originalname,
        resumeText: resumeText,
        jobDescriptionText: jobDescriptionText,
        userId: userId // Add user ID if authenticated
      });

      logger.info('Created analysis record in backend database', {
        analysisId,
        resumeFilename: resumeFile.originalname,
        jobDescriptionFilename: jobDescriptionFile?.originalname || 'Text Input',
        userId: userId || 'anonymous'
      });
    } catch (error) {
      logger.warn('Failed to create analysis record in backend database:', {
        analysisId,
        error: extractErrorMessage(error)
      });
      // Don't throw error - Python server is the source of truth
    }
  }

  private extractTextPreview(buffer: Buffer): string {
    try {
      return buffer.toString('utf-8').substring(0, 1000);
    } catch {
      return 'Binary file - will be processed by AI service';
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

    // Update status to failed in cache only - Python server handles database operations
    await this.updateAnalysisStatus(analysisId, {
      status: 'failed',
      error: errorMessage,
      failedAt: new Date().toISOString(),
    });

    logger.info('Analysis failure status updated in cache - Python server handles database operations', {
      analysisId,
      error: errorMessage
    });
  }

  private transformResult(result: any, analysisId: string): any {
    // If result is already in the new format (from Python server), return as is
    if (result && (result.job_description_validity || result.score_out_of_100)) {
      logger.info('Result is already in new format, returning as is', { analysisId });
      return result;
    }
    
    // If result is in old format, transform it
    if (ResultTransformer.isOldFormat(result)) {
      logger.info('Transforming old format result to frontend format', { analysisId });
      return ResultTransformer.transformToFrontendFormat(result, {
        analysisId,
        resumeFilename: result.resumeFilename,
        jobDescriptionFilename: result.jobDescriptionFilename,
        analyzedAt: result.analyzedAt,
        processingTime: result.processingTime
      });
    }
    
    // If result is in the new format from database, return as is
    if (result && result.resume_analysis_report) {
      logger.info('Result is in new format from database, returning as is', { analysisId });
      return result;
    }
    
    // Fallback: return the result as is
    logger.warn('Unknown result format, returning as is', { analysisId, resultKeys: Object.keys(result || {}) });
    return result;
  }

}

// Export singleton instance
export const resumeController = new ResumeController(); 