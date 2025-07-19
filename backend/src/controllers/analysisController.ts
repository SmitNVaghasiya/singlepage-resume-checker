import { Request, Response, NextFunction } from 'express';
import { analysisService, AnalysisQuery, AnalysisServiceError } from '../services/analysisService';
import { logger } from '../utils/logger';
import { database } from '../config/database';
import { emailService } from '../services/emailService';

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
      if (error instanceof AnalysisServiceError) {
        res.status(400).json({
          success: false,
          error: error.code,
          message: error.message
        });
        return;
      }
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
      if (error instanceof AnalysisServiceError) {
        res.status(400).json({
          success: false,
          error: error.code,
          message: error.message
        });
        return;
      }
      next(error);
    }
  },

  /**
   * GET /api/analyses/stats
   * Get analysis statistics
   */
  getAnalysisStats: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await analysisService.getAnalysisStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in getAnalysisStats:', error);
      if (error instanceof AnalysisServiceError) {
        res.status(400).json({
          success: false,
          error: error.code,
          message: error.message
        });
        return;
      }
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
      if (error instanceof AnalysisServiceError) {
        res.status(400).json({
          success: false,
          error: error.code,
          message: error.message
        });
        return;
      }
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
      if (error instanceof AnalysisServiceError) {
        res.status(400).json({
          success: false,
          error: error.code,
          message: error.message
        });
        return;
      }
      next(error);
    }
  },

  /**
   * POST /api/analyses/:analysisId/export
   * Export analysis report and send via email
   */
  exportAnalysisReport: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { analysisId } = req.params;
      const { userEmail, userName, format } = req.body;

      if (!userEmail || !userName || !format) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'userEmail, userName, and format are required'
        });
        return;
      }

      // Get the analysis data
      const analysis = await analysisService.getAnalysisById(analysisId);
      
      if (!analysis) {
        res.status(404).json({
          success: false,
          error: 'Analysis not found',
          message: `No analysis found with ID: ${analysisId}`
        });
        return;
      }

      // Generate report content
      const reportContent = generateReportHTML(analysis, userName);
      
      // Send email with the report
      const emailSuccess = await emailService.sendEmail({
        to: userEmail,
        subject: `Analysis Report - ${analysis.resumeFilename || 'Resume Analysis'}`,
        html: reportContent
      });

      if (!emailSuccess) {
        res.status(500).json({
          success: false,
          error: 'Email sending failed',
          message: 'Failed to send the analysis report via email'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Analysis report sent successfully to your email'
      });
    } catch (error) {
      logger.error('Error in exportAnalysisReport:', error);
      next(error);
    }
  },

  /**
   * GET /api/analyses/health
   * Check database health
   */
  getDatabaseHealth: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
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

/**
 * Generate HTML report content from analysis data
 */
function generateReportHTML(analysis: any, userName: string): string {
  const result = analysis.result || analysis;
  const analyzedDate = new Date(analysis.createdAt || analysis.analyzedAt || Date.now()).toLocaleDateString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resume Analysis Report</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f8fafc; }
        .container { max-width: 800px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 2rem; text-align: center; }
        .content { padding: 2rem; }
        .score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 2rem 0; }
        .score-card { background: #f1f5f9; padding: 1.5rem; border-radius: 8px; text-align: center; }
        .score-value { font-size: 2rem; font-weight: bold; color: #3b82f6; }
        .section { margin: 2rem 0; }
        .section h3 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
        .list-item { margin: 0.5rem 0; padding: 0.5rem; background: #f8fafc; border-left: 3px solid #3b82f6; }
        .strengths .list-item { border-left-color: #10b981; }
        .weaknesses .list-item { border-left-color: #ef4444; }
        .recommendations .list-item { border-left-color: #f59e0b; }
        .footer { background: #f1f5f9; padding: 1rem; text-align: center; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 Resume Analysis Report</h1>
          <p>Generated for ${userName}</p>
          <p>Analysis Date: ${analyzedDate}</p>
        </div>
        
        <div class="content">
          <div class="score-grid">
            <div class="score-card">
              <div class="score-value">${result.overallScore || 0}</div>
              <div>Overall Score</div>
            </div>
            <div class="score-card">
              <div class="score-value">${result.matchPercentage || 0}%</div>
              <div>Job Match</div>
            </div>
          </div>

          <div class="section">
            <h3>📄 Analysis Overview</h3>
            <p><strong>Resume:</strong> ${result.resumeFilename || analysis.resumeFilename || 'N/A'}</p>
            <p><strong>Job Position:</strong> ${result.jobTitle || analysis.jobTitle || 'General'}</p>
            <p><strong>Industry:</strong> ${result.industry || analysis.industry || 'General'}</p>
            <p><strong>Overall Recommendation:</strong></p>
            <div class="list-item">${result.overallRecommendation || 'Analysis completed successfully.'}</div>
          </div>

          ${result.candidateStrengths && result.candidateStrengths.length > 0 ? `
          <div class="section strengths">
            <h3>✅ Key Strengths</h3>
            ${result.candidateStrengths.map((strength: string) => `<div class="list-item">${strength}</div>`).join('')}
          </div>
          ` : ''}

          ${result.developmentAreas && result.developmentAreas.length > 0 ? `
          <div class="section weaknesses">
            <h3>⚠️ Development Areas</h3>
            ${result.developmentAreas.map((area: string) => `<div class="list-item">${area}</div>`).join('')}
          </div>
          ` : ''}

          ${result.aiInsights && result.aiInsights.length > 0 ? `
          <div class="section recommendations">
            <h3>🧠 AI Insights</h3>
            ${result.aiInsights.map((insight: string) => `<div class="list-item">${insight}</div>`).join('')}
          </div>
          ` : ''}

          ${result.skillsAnalysis ? `
          <div class="section">
            <h3>🎯 Skills Analysis</h3>
            ${result.skillsAnalysis.technical && result.skillsAnalysis.technical.present ? `
              <p><strong>Technical Skills Found:</strong> ${result.skillsAnalysis.technical.present.join(', ')}</p>
            ` : ''}
            ${result.skillsAnalysis.technical && result.skillsAnalysis.technical.missing ? `
              <p><strong>Missing Technical Skills:</strong> ${result.skillsAnalysis.technical.missing.join(', ')}</p>
            ` : ''}
          </div>
          ` : ''}

          <div class="section">
            <h3>📊 Analysis Confidence</h3>
            <div class="list-item">Confidence Level: ${result.confidence || 85}%</div>
          </div>
        </div>
        
        <div class="footer">
          <p>Generated by AI Resume Checker</p>
          <p>© 2024 AI Resume Checker. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
} 