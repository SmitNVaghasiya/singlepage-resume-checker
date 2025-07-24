import { TokenCounter } from '../tokenCounter';

describe('TokenCounter', () => {
  describe('estimateTokens', () => {
    it('should return 0 for empty or null text', () => {
      expect(TokenCounter.estimateTokens('')).toBe(0);
      expect(TokenCounter.estimateTokens(null as any)).toBe(0);
      expect(TokenCounter.estimateTokens(undefined as any)).toBe(0);
    });

    it('should estimate tokens correctly for short text', () => {
      const text = 'Hello world';
      const tokens = TokenCounter.estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThanOrEqual(Math.ceil(text.length / 4));
    });

    it('should estimate tokens correctly for long text', () => {
      const text = 'This is a longer text that should have more tokens. It contains multiple sentences and should be processed correctly by the token counter utility.';
      const tokens = TokenCounter.estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThanOrEqual(Math.ceil(text.length / 4));
    });

    it('should handle text with extra whitespace', () => {
      const text = '  Hello   world  ';
      const tokens = TokenCounter.estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe('estimateAnalysisTokens', () => {
    it('should calculate total tokens for resume and job description', () => {
      const resumeText = 'Software engineer with 5 years experience';
      const jobDescText = 'Looking for a senior developer';
      
      const result = TokenCounter.estimateAnalysisTokens(resumeText, jobDescText);
      
      expect(result.resumeTokens).toBeGreaterThan(0);
      expect(result.jobDescriptionTokens).toBeGreaterThan(0);
      expect(result.totalTokens).toBeGreaterThan(result.resumeTokens + result.jobDescriptionTokens);
      expect(result.estimatedOutputTokens).toBeGreaterThan(0);
    });

    it('should handle empty job description', () => {
      const resumeText = 'Software engineer with 5 years experience';
      const jobDescText = '';
      
      const result = TokenCounter.estimateAnalysisTokens(resumeText, jobDescText);
      
      expect(result.resumeTokens).toBeGreaterThan(0);
      expect(result.jobDescriptionTokens).toBe(0);
      expect(result.totalTokens).toBeGreaterThan(result.resumeTokens);
    });
  });

  describe('validateTokenLimits', () => {
    it('should pass validation for reasonable content', () => {
      const resumeText = 'Software engineer with 5 years experience in web development';
      const jobDescText = 'Looking for a senior developer with React experience';
      
      const result = TokenCounter.validateTokenLimits(resumeText, jobDescText);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.tokenCounts).toBeDefined();
    });

    it('should fail validation for extremely long content', () => {
      // Create extremely long text
      const longText = 'A'.repeat(50000); // 50k characters
      const resumeText = longText;
      const jobDescText = longText;
      
      const result = TokenCounter.validateTokenLimits(resumeText, jobDescText);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail validation for very short content', () => {
      const resumeText = 'Hi';
      const jobDescText = 'Job';
      
      const result = TokenCounter.validateTokenLimits(resumeText, jobDescText);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getTokenStats', () => {
    it('should return correct statistics for text', () => {
      const text = 'Hello world, this is a test';
      const stats = TokenCounter.getTokenStats(text);
      
      expect(stats.characterCount).toBe(text.length);
      expect(stats.wordCount).toBe(6); // "Hello world, this is a test"
      expect(stats.estimatedTokens).toBeGreaterThan(0);
      expect(stats.efficiency).toBeGreaterThan(0);
    });

    it('should handle empty text', () => {
      const stats = TokenCounter.getTokenStats('');
      
      expect(stats.characterCount).toBe(0);
      expect(stats.wordCount).toBe(0);
      expect(stats.estimatedTokens).toBe(0);
      expect(stats.efficiency).toBe(0);
    });
  });
}); 