import { config } from '../config/config';
import { logger } from './logger';

/**
 * Utility class for counting tokens in text content
 * Uses a simple approximation: 1 token ≈ 4 characters for English text
 */
export class TokenCounter {
  private static readonly CHARS_PER_TOKEN = 4; // Rough approximation for English text
  private static readonly MIN_TOKENS = 1;
  private static readonly MAX_TOKENS = 100000; // Safety limit

  /**
   * Estimate token count for a given text
   * @param text - The text to count tokens for
   * @returns Estimated token count
   */
  public static estimateTokens(text: string): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }

    try {
      // Remove extra whitespace and normalize
      const normalizedText = text.trim().replace(/\s+/g, ' ');
      
      // Simple character-based estimation
      const estimatedTokens = Math.ceil(normalizedText.length / this.CHARS_PER_TOKEN);
      
      // Apply bounds
      const boundedTokens = Math.max(this.MIN_TOKENS, Math.min(this.MAX_TOKENS, estimatedTokens));
      
      logger.debug('Token estimation', {
        textLength: text.length,
        normalizedLength: normalizedText.length,
        estimatedTokens: boundedTokens,
        charsPerToken: this.CHARS_PER_TOKEN
      });
      
      return boundedTokens;
    } catch (error) {
      logger.error('Error estimating tokens', { error: error instanceof Error ? error.message : 'Unknown error' });
      return this.MIN_TOKENS;
    }
  }

  /**
   * Estimate total tokens for resume analysis request
   * @param resumeText - Resume text content
   * @param jobDescriptionText - Job description text content
   * @returns Total estimated tokens
   */
  public static estimateAnalysisTokens(resumeText: string, jobDescriptionText: string): {
    resumeTokens: number;
    jobDescriptionTokens: number;
    totalTokens: number;
    estimatedOutputTokens: number;
  } {
    const resumeTokens = this.estimateTokens(resumeText);
    const jobDescriptionTokens = this.estimateTokens(jobDescriptionText);
    const totalInputTokens = resumeTokens + jobDescriptionTokens;
    
    // Estimate output tokens based on input size (typically 1:1 to 2:1 ratio)
    const estimatedOutputTokens = Math.min(
      Math.ceil(totalInputTokens * 1.5),
      config.maxOutputTokens
    );
    
    const totalTokens = totalInputTokens + estimatedOutputTokens;
    
    logger.info('Analysis token estimation', {
      resumeTokens,
      jobDescriptionTokens,
      totalInputTokens,
      estimatedOutputTokens,
      totalTokens,
      maxAllowed: config.maxTotalTokens
    });
    
    return {
      resumeTokens,
      jobDescriptionTokens,
      totalTokens,
      estimatedOutputTokens
    };
  }

  /**
   * Check if token count exceeds limits
   * @param resumeText - Resume text content
   * @param jobDescriptionText - Job description text content
   * @returns Object with validation results
   */
  public static validateTokenLimits(resumeText: string, jobDescriptionText: string): {
    isValid: boolean;
    errors: string[];
    tokenCounts: {
      resumeTokens: number;
      jobDescriptionTokens: number;
      totalInputTokens: number;
      estimatedOutputTokens: number;
      totalTokens: number;
    };
  } {
    const errors: string[] = [];
    const tokenCounts = this.estimateAnalysisTokens(resumeText, jobDescriptionText);
    
    // Check input token limits
    if (tokenCounts.resumeTokens > config.maxInputTokens) {
      errors.push(`Resume text too long. Maximum ${config.maxInputTokens} tokens allowed, got ${tokenCounts.resumeTokens}`);
    }
    
    if (tokenCounts.jobDescriptionTokens > config.maxInputTokens) {
      errors.push(`Job description too long. Maximum ${config.maxInputTokens} tokens allowed, got ${tokenCounts.jobDescriptionTokens}`);
    }
    
    const totalInputTokens = tokenCounts.resumeTokens + tokenCounts.jobDescriptionTokens;
    if (totalInputTokens > config.maxInputTokens) {
      errors.push(`Total input too long. Maximum ${config.maxInputTokens} tokens allowed, got ${totalInputTokens}`);
    }
    
    // Check total token limits
    if (tokenCounts.totalTokens > config.maxTotalTokens) {
      errors.push(`Total tokens exceed limit. Maximum ${config.maxTotalTokens} tokens allowed, got ${tokenCounts.totalTokens}`);
    }
    
    // Check minimum content requirements
    if (tokenCounts.resumeTokens < 10) {
      errors.push('Resume text too short. Please provide more content for accurate analysis.');
    }
    
    if (tokenCounts.jobDescriptionTokens < 10) {
      errors.push('Job description too short. Please provide more content for accurate analysis.');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      tokenCounts: {
        resumeTokens: tokenCounts.resumeTokens,
        jobDescriptionTokens: tokenCounts.jobDescriptionTokens,
        totalInputTokens,
        estimatedOutputTokens: tokenCounts.estimatedOutputTokens,
        totalTokens: tokenCounts.totalTokens
      }
    };
  }

  /**
   * Get token usage statistics
   * @param text - Text to analyze
   * @returns Token usage statistics
   */
  public static getTokenStats(text: string): {
    characterCount: number;
    wordCount: number;
    estimatedTokens: number;
    efficiency: number; // tokens per word
  } {
    if (!text || typeof text !== 'string') {
      return {
        characterCount: 0,
        wordCount: 0,
        estimatedTokens: 0,
        efficiency: 0
      };
    }
    
    const characterCount = text.length;
    const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const estimatedTokens = this.estimateTokens(text);
    const efficiency = wordCount > 0 ? estimatedTokens / wordCount : 0;
    
    return {
      characterCount,
      wordCount,
      estimatedTokens,
      efficiency: Math.round(efficiency * 100) / 100
    };
  }
} 