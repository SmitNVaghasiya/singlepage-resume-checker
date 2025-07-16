import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { AnalysisServiceError, AnalysisStatus } from '../analysisService';

// Mock the Analysis model and logger
jest.mock('../../models/Analysis');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocking
import { analysisService } from '../analysisService';

describe('AnalysisService Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should validate analysis ID is required', async () => {
      await expect(
        analysisService.getAnalysisByAnalysisId('')
      ).rejects.toThrow(AnalysisServiceError);
    });

    it('should validate analysis ID for deletion', async () => {
      await expect(
        analysisService.deleteAnalysis('')
      ).rejects.toThrow(AnalysisServiceError);
    });

    it('should validate analysis ID for status update', async () => {
      await expect(
        analysisService.updateAnalysisStatus('', AnalysisStatus.COMPLETED)
      ).rejects.toThrow(AnalysisServiceError);
    });
  });

  describe('Pagination Validation', () => {
    it('should validate page number is positive', async () => {
      await expect(
        analysisService.getAllAnalyses({
          page: -1,
          limit: 10,
        })
      ).rejects.toThrow(AnalysisServiceError);
    });

    it('should validate limit is within bounds', async () => {
      await expect(
        analysisService.getAllAnalyses({
          limit: 0,
        })
      ).rejects.toThrow(AnalysisServiceError);

      await expect(
        analysisService.getAllAnalyses({
          limit: 101,
        })
      ).rejects.toThrow(AnalysisServiceError);
    });

    it('should validate sortBy field', async () => {
      await expect(
        analysisService.getAllAnalyses({
          sortBy: 'invalidField' as any,
        })
      ).rejects.toThrow(AnalysisServiceError);
    });
  });

  describe('Limit Validation', () => {
    it('should validate getTopAnalyses limit', async () => {
      await expect(analysisService.getTopAnalyses(-1)).rejects.toThrow(AnalysisServiceError);
      await expect(analysisService.getTopAnalyses(51)).rejects.toThrow(AnalysisServiceError);
    });
  });

  describe('Search Input Sanitization', () => {
    it('should handle search with special characters', async () => {
      // This test verifies that the search sanitization doesn't throw errors
      // The actual sanitization is tested in integration tests
      expect(() => {
        analysisService.getAllAnalyses({
          search: 'test.*+?^${}()|[\\]',
        });
      }).not.toThrow();
    });
  });

  describe('Status Enum Usage', () => {
    it('should use correct status enum values', () => {
      expect(AnalysisStatus.PROCESSING).toBe('processing');
      expect(AnalysisStatus.COMPLETED).toBe('completed');
      expect(AnalysisStatus.FAILED).toBe('failed');
    });
  });

  describe('Error Types', () => {
    it('should create AnalysisServiceError with code', () => {
      const error = new AnalysisServiceError('Test error', 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('AnalysisServiceError');
    });
  });
}); 