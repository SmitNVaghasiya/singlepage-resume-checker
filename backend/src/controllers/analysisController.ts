import { Request, Response, NextFunction } from 'express';
import { analysisService, AnalysisQuery } from '../services/analysisService';
import { logger } from '../utils/logger';
import { database } from '../config/database';

export const analysisController = {
  
  /**
   * GET /api/analyses
   * Get all analyses with pagination and filtering
   */
  getAllAnalyses: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: AnalysisQuery = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        status: req.query.status as any,
        sortBy: req.query.sortBy as any || 'createdAt',
        sortOrder: req.query.sortOrder as any || 'desc',
        search: req.query.search as string
      };

      const result = await analysisService.getAllAnalyses(query);

      res.json({
        success: true,
        data: result.analyses,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          limit: query.limit
        }
      });
    } catch (error) {
      logger.error('Error in getAllAnalyses:', error);
      next(error);
    }
  },

  /**
   * GET /api/analyses/:analysisId
   * Get specific analysis by ID
   */
  getAnalysisById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { analysisId } = req.params;
      
      const analysis = await analysisService.getAnalysisById(analysisId);
      
      if (!analysis) {
        res.status(404).json({
          success: false,
          error: 'Analysis not found',
          message: `No analysis found with ID: ${analysisId}`
        });
        return;
      }

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      logger.error('Error in getAnalysisById:', error);
      next(error);
    }
  },

  /**
   * GET /api/analyses/stats
   * Get analysis statistics
   */
  getAnalysisStats: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await analysisService.getAnalysisStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in getAnalysisStats:', error);
      next(error);
    }
  },

  /**
   * GET /api/analyses/top
   * Get top performing analyses
   */
  getTopAnalyses: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topAnalyses = await analysisService.getTopAnalyses(limit);
      
      res.json({
        success: true,
        data: topAnalyses
      });
    } catch (error) {
      logger.error('Error in getTopAnalyses:', error);
      next(error);
    }
  },

  /**
   * DELETE /api/analyses/:analysisId
   * Delete analysis by ID
   */
  deleteAnalysis: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { analysisId } = req.params;
      
      const deleted = await analysisService.deleteAnalysis(analysisId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Analysis not found',
          message: `No analysis found with ID: ${analysisId}`
        });
        return;
      }

      res.json({
        success: true,
        message: 'Analysis deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteAnalysis:', error);
      next(error);
    }
  },

  /**
   * GET /api/analyses/health
   * Check database health
   */
  getDatabaseHealth: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const health = await database.checkHealth();
      
      res.json({
        success: true,
        data: {
          database: health,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error in getDatabaseHealth:', error);
      next(error);
    }
  }
}; 