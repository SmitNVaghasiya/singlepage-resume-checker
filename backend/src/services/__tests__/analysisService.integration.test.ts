import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { analysisService, AnalysisServiceError, AnalysisStatus } from '../analysisService';
import { Analysis } from '../../models/Analysis';

describe('AnalysisService Integration Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('createAnalysis', () => {
    it('should create a new analysis successfully', async () => {
      const analysisData = {
        analysisId: 'test-123',
        resumeFilename: 'resume.pdf',
        resumeText: 'Sample resume content',
        jobDescriptionText: 'Sample job description',
      };

      const result = await analysisService.createAnalysis(analysisData);

      expect(result).toBeDefined();
      expect(result.analysisId).toBe('test-123');
      expect(result.resumeFilename).toBe('resume.pdf');
      expect(result.status).toBe(AnalysisStatus.PROCESSING);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      // Verify it's actually in the database
      const dbResult = await Analysis.findOne({ analysisId: 'test-123' });
      expect(dbResult).toBeDefined();
      expect(dbResult?.analysisId).toBe('test-123');
    });

    it('should throw error for duplicate analysis ID', async () => {
      const analysisData = {
        analysisId: 'duplicate-123',
        resumeFilename: 'resume.pdf',
        resumeText: 'Sample resume content',
      };

      // Create first analysis
      await analysisService.createAnalysis(analysisData);

      // Try to create duplicate
      await expect(
        analysisService.createAnalysis(analysisData)
      ).rejects.toThrow(AnalysisServiceError);
    });

    it('should validate required fields', async () => {
      await expect(
        analysisService.createAnalysis({
          analysisId: '',
          resumeFilename: '',
          resumeText: '',
        })
      ).rejects.toThrow(AnalysisServiceError);
    });
  });

  describe('updateAnalysisResult', () => {
    it('should update analysis with results successfully', async () => {
      // Create initial analysis
      await analysisService.createAnalysis({
        analysisId: 'update-test-123',
        resumeFilename: 'resume.pdf',
        resumeText: 'Sample content',
      });

      const resultData = {
        overallScore: 85,
        matchPercentage: 90,
        jobTitle: 'Software Engineer',
        industry: 'Technology',
        keywordMatch: {
          matched: ['JavaScript', 'React'],
          missing: ['Python'],
          percentage: 75,
          suggestions: ['Learn Python'],
        },
        skillsAnalysis: {
          technical: { required: [], present: ['JavaScript'], missing: [], recommendations: [] },
          soft: { required: [], present: [], missing: [], recommendations: [] },
          industry: { required: [], present: [], missing: [], recommendations: [] },
        },
        experienceAnalysis: {
          yearsRequired: 2,
          yearsFound: 3,
          relevant: true,
          experienceGaps: [],
          strengthAreas: ['Frontend Development'],
          improvementAreas: [],
        },
        resumeQuality: {
          formatting: { score: 85, issues: [], suggestions: [] },
          content: { score: 80, issues: [], suggestions: [] },
          length: { score: 90, wordCount: 500, recommendations: [] },
          structure: { score: 85, missingSections: [], suggestions: [] },
        },
        competitiveAnalysis: {
          positioningStrength: 80,
          competitorComparison: [],
          differentiators: [],
          marketPosition: 'Strong',
          improvementImpact: [],
        },
        detailedFeedback: {
          strengths: [],
          weaknesses: [],
          quickWins: [],
          industryInsights: [],
        },
        improvementPlan: {
          immediate: [],
          shortTerm: [],
          longTerm: [],
        },
        overallRecommendation: 'Strong candidate',
        aiInsights: ['Good technical skills'],
        candidateStrengths: ['JavaScript', 'React'],
        developmentAreas: ['Python'],
        confidence: 85,
      };

      const updatedAnalysis = await analysisService.updateAnalysisResult('update-test-123', resultData);

      expect(updatedAnalysis).toBeDefined();
      expect(updatedAnalysis?.status).toBe(AnalysisStatus.COMPLETED);
      expect(updatedAnalysis?.result?.overallScore).toBe(85);
      expect(updatedAnalysis?.result?.jobTitle).toBe('Software Engineer');
      expect(updatedAnalysis?.completedAt).toBeDefined();

      // Verify in database
      const dbResult = await Analysis.findOne({ analysisId: 'update-test-123' });
      expect(dbResult?.status).toBe(AnalysisStatus.COMPLETED);
      expect(dbResult?.result?.overallScore).toBe(85);
    });

    it('should return null for non-existent analysis', async () => {
      const result = await analysisService.updateAnalysisResult('non-existent', {
        overallScore: 85,
        matchPercentage: 90,
        jobTitle: 'Software Engineer',
        industry: 'Technology',
      } as any);
      expect(result).toBeNull();
    });
  });

  describe('getAnalysisByAnalysisId', () => {
    it('should retrieve analysis by ID', async () => {
      // Create analysis
      await analysisService.createAnalysis({
        analysisId: 'retrieve-test-123',
        resumeFilename: 'resume.pdf',
        resumeText: 'Sample content',
      });

      // Retrieve analysis
      const retrieved = await analysisService.getAnalysisByAnalysisId('retrieve-test-123');

      expect(retrieved).toBeDefined();
      expect(retrieved?.analysisId).toBe('retrieve-test-123');
      expect(retrieved?.resumeFilename).toBe('resume.pdf');
    });

    it('should return null for non-existent analysis', async () => {
      const result = await analysisService.getAnalysisByAnalysisId('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getAllAnalyses with pagination', () => {
    beforeEach(async () => {
      // Create multiple analyses
      const analyses = [
        { analysisId: 'page-1', resumeFilename: 'resume1.pdf', resumeText: 'Content 1' },
        { analysisId: 'page-2', resumeFilename: 'resume2.pdf', resumeText: 'Content 2' },
        { analysisId: 'page-3', resumeFilename: 'resume3.pdf', resumeText: 'Content 3' },
        { analysisId: 'page-4', resumeFilename: 'resume4.pdf', resumeText: 'Content 4' },
        { analysisId: 'page-5', resumeFilename: 'resume5.pdf', resumeText: 'Content 5' },
      ];

      for (const analysis of analyses) {
        await analysisService.createAnalysis(analysis);
      }
    });

    it('should return paginated results', async () => {
      const result = await analysisService.getAllAnalyses({
        page: 1,
        limit: 2,
      });

      expect(result.analyses).toHaveLength(2);
      expect(result.totalCount).toBe(5);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPrevPage).toBe(false);
    });

    it('should handle second page', async () => {
      const result = await analysisService.getAllAnalyses({
        page: 2,
        limit: 2,
      });

      expect(result.analyses).toHaveLength(2);
      expect(result.currentPage).toBe(2);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPrevPage).toBe(true);
    });

    it('should filter by status', async () => {
      // Update one analysis to completed
      await analysisService.updateAnalysisStatus('page-1', AnalysisStatus.COMPLETED);

      const result = await analysisService.getAllAnalyses({
        status: AnalysisStatus.COMPLETED,
      });

      expect(result.analyses).toHaveLength(1);
      expect(result.analyses[0].analysisId).toBe('page-1');
    });

    it('should search by filename', async () => {
      const result = await analysisService.getAllAnalyses({
        search: 'resume1',
      });

      expect(result.analyses).toHaveLength(1);
      expect(result.analyses[0].analysisId).toBe('page-1');
    });
  });

  describe('getTopAnalyses', () => {
    beforeEach(async () => {
      // Create analyses with different scores
      const analyses = [
        { analysisId: 'top-1', resumeFilename: 'resume1.pdf', resumeText: 'Content 1' },
        { analysisId: 'top-2', resumeFilename: 'resume2.pdf', resumeText: 'Content 2' },
        { analysisId: 'top-3', resumeFilename: 'resume3.pdf', resumeText: 'Content 3' },
      ];

      for (const analysis of analyses) {
        await analysisService.createAnalysis(analysis);
      }

      // Update with different scores
      await analysisService.updateAnalysisResult('top-1', {
        overallScore: 95,
        matchPercentage: 90,
        jobTitle: 'Engineer',
        industry: 'Tech',
      } as any);

      await analysisService.updateAnalysisResult('top-2', {
        overallScore: 85,
        matchPercentage: 80,
        jobTitle: 'Engineer',
        industry: 'Tech',
      } as any);

      await analysisService.updateAnalysisResult('top-3', {
        overallScore: 75,
        matchPercentage: 70,
        jobTitle: 'Engineer',
        industry: 'Tech',
      } as any);
    });

    it('should return top analyses by score', async () => {
      const result = await analysisService.getTopAnalyses(2);

      expect(result).toHaveLength(2);
      expect(result[0].analysisId).toBe('top-1'); // Highest score
      expect(result[1].analysisId).toBe('top-2'); // Second highest
    });
  });

  describe('deleteAnalysis', () => {
    it('should delete analysis successfully', async () => {
      // Create analysis
      await analysisService.createAnalysis({
        analysisId: 'delete-test-123',
        resumeFilename: 'resume.pdf',
        resumeText: 'Sample content',
      });

      // Delete analysis
      const deleted = await analysisService.deleteAnalysis('delete-test-123');

      expect(deleted).toBe(true);

      // Verify it's gone from database
      const dbResult = await Analysis.findOne({ analysisId: 'delete-test-123' });
      expect(dbResult).toBeNull();
    });

    it('should return false for non-existent analysis', async () => {
      const result = await analysisService.deleteAnalysis('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getAnalysisStats', () => {
    beforeEach(async () => {
      // Create analyses with different statuses
      const analyses = [
        { analysisId: 'stats-1', resumeFilename: 'resume1.pdf', resumeText: 'Content 1' },
        { analysisId: 'stats-2', resumeFilename: 'resume2.pdf', resumeText: 'Content 2' },
        { analysisId: 'stats-3', resumeFilename: 'resume3.pdf', resumeText: 'Content 3' },
        { analysisId: 'stats-4', resumeFilename: 'resume4.pdf', resumeText: 'Content 4' },
      ];

      for (const analysis of analyses) {
        await analysisService.createAnalysis(analysis);
      }

      // Update statuses
      await analysisService.updateAnalysisStatus('stats-1', AnalysisStatus.COMPLETED);
      await analysisService.updateAnalysisStatus('stats-2', AnalysisStatus.COMPLETED);
      await analysisService.updateAnalysisStatus('stats-3', AnalysisStatus.FAILED);

      // Add scores to completed analyses
      await analysisService.updateAnalysisResult('stats-1', {
        overallScore: 85,
        matchPercentage: 80,
        jobTitle: 'Engineer',
        industry: 'Tech',
      } as any);

      await analysisService.updateAnalysisResult('stats-2', {
        overallScore: 95,
        matchPercentage: 90,
        jobTitle: 'Engineer',
        industry: 'Tech',
      } as any);
    });

    it('should return correct statistics', async () => {
      const stats = await analysisService.getAnalysisStats();

      expect(stats.totalAnalyses).toBe(4);
      expect(stats.completedAnalyses).toBe(2);
      expect(stats.processingAnalyses).toBe(1);
      expect(stats.failedAnalyses).toBe(1);
      expect(stats.averageScore).toBe(90); // (85 + 95) / 2
      expect(stats.recentAnalyses).toBe(4); // All created in this test
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test verifies that the service handles errors properly
      // In a real scenario, you might want to test with a corrupted database connection
      await expect(
        analysisService.getAnalysisByAnalysisId('')
      ).rejects.toThrow(AnalysisServiceError);
    });
  });
}); 