import { Request, Response, NextFunction } from 'express';
import { pythonApiService } from '../services/pythonApiService';
import { cacheService } from '../services/cacheService';
import { logger } from '../utils/logger';
import { generateAnalysisId } from '../utils/helpers';

interface MulterFiles {
  resume?: Express.Multer.File[];
  jobDescription?: Express.Multer.File[];
}

export const resumeController = {
  // Analyze resume against job description
  analyzeResume: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as MulterFiles;
      
      if (!files.resume || !files.jobDescription) {
        res.status(400).json({
          error: 'Missing files',
          message: 'Both resume and job description are required',
        });
        return;
      }

      const resumeFile = files.resume[0];
      const jobDescriptionFile = files.jobDescription[0];

      // Generate unique analysis ID
      const analysisId = generateAnalysisId();

      // Log analysis request
      logger.info({
        message: 'Starting resume analysis',
        analysisId,
        resumeSize: resumeFile.size,
        jobDescriptionSize: jobDescriptionFile.size,
      });

      // Start analysis (async processing for better performance)
      processAnalysisAsync(analysisId, resumeFile, jobDescriptionFile);

      // Return immediate response
      res.status(202).json({
        message: 'Analysis started',
        analysisId,
        status: 'processing',
        estimatedTime: '10-30 seconds',
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

      // Check cache for result
      const result = await cacheService.getAnalysisResult(analysisId);

      if (!result) {
        // Check if analysis is still processing
        const status = await cacheService.getAnalysisStatus(analysisId);
        
        if (status && status.status === 'processing') {
          res.status(202).json({
            message: 'Analysis still in progress',
            status: 'processing',
          });
          return;
        }

        res.status(404).json({
          error: 'Not found',
          message: 'Analysis result not found or expired',
        });
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Error in getAnalysisResult:', error);
      next(error);
    }
  },
};

// Async function to process analysis
async function processAnalysisAsync(
  analysisId: string,
  resumeFile: Express.Multer.File,
  jobDescriptionFile: Express.Multer.File
) {
  try {
    // Update status to processing
    await cacheService.setAnalysisStatus(analysisId, {
      status: 'processing',
      startedAt: new Date().toISOString(),
    });

    // Call Python API
    const result = await pythonApiService.analyzeResume(
      resumeFile,
      jobDescriptionFile
    );

    // Store result in cache
    await cacheService.setAnalysisResult(analysisId, {
      ...result,
      completedAt: new Date().toISOString(),
    });

    // Update status to completed
    await cacheService.setAnalysisStatus(analysisId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    logger.info({
      message: 'Analysis completed successfully',
      analysisId,
    });

  } catch (error) {
    logger.error({
      message: 'Analysis failed',
      analysisId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Update status to failed
    await cacheService.setAnalysisStatus(analysisId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Analysis failed',
      failedAt: new Date().toISOString(),
    });
  }
} 