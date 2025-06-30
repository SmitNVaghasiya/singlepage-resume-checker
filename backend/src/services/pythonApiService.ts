import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { IAnalysisResult } from '../models/Analysis';
import { extractErrorMessage } from '../utils/helpers';

// Response structure from the new Python API
interface PythonApiResponse {
  analysis_id: string;
  status: 'completed' | 'failed';
  message: string;
  result?: IAnalysisResult;
  error?: string;
}

// Legacy response structure for backward compatibility
interface LegacyAnalysisResponse {
  success: boolean;
  analysis: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    keyword_match: {
      matched: string[];
      missing: string[];
      total_found: number;
      percentage: number;
    };
    overall_recommendation: string;
  };
  metadata: {
    filename: string;
    file_size: number;
    has_job_description: boolean;
  };
}

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

class LegacyResponseTransformer {
  private static readonly TECHNICAL_KEYWORDS = [
    'python', 'javascript', 'java', 'react', 'angular', 'node', 'sql', 'mongodb',
    'aws', 'docker', 'kubernetes', 'git', 'api', 'rest', 'html', 'css', 'typescript'
  ];

  private static readonly SOFT_SKILL_KEYWORDS = [
    'communication', 'leadership', 'teamwork', 'problem-solving', 'management',
    'collaboration', 'analytical', 'creative', 'adaptable', 'organized'
  ];

  public static transform(
    legacyResponse: LegacyAnalysisResponse,
    _resumeFile: Express.Multer.File,
    _jobDescriptionFile?: Express.Multer.File
  ): IAnalysisResult {
    const analysis = legacyResponse.analysis;
    
    return {
      overallScore: analysis.score,
      matchPercentage: analysis.keyword_match.percentage,
      jobTitle: 'Job Position', // Default value
      industry: 'General', // Default value
      keywordMatch: this.buildKeywordMatch(analysis),
      skillsAnalysis: this.buildSkillsAnalysis(analysis),
      experienceAnalysis: this.buildExperienceAnalysis(analysis),
      resumeQuality: this.buildResumeQuality(analysis, legacyResponse.metadata),
      competitiveAnalysis: this.buildCompetitiveAnalysis(analysis),
      detailedFeedback: this.buildDetailedFeedback(analysis),
      improvementPlan: this.buildImprovementPlan(analysis),
      overallRecommendation: analysis.overall_recommendation,
      aiInsights: this.buildAiInsights(),
      candidateStrengths: analysis.strengths,
      developmentAreas: analysis.weaknesses,
      confidence: 85 // Default confidence level
    };
  }

  private static buildKeywordMatch(analysis: any) {
    return {
      matched: analysis.keyword_match.matched,
      missing: analysis.keyword_match.missing,
      percentage: analysis.keyword_match.percentage,
      suggestions: analysis.suggestions.slice(0, 3)
    };
  }

  private static buildSkillsAnalysis(analysis: any) {
    return {
      technical: {
        required: [],
        present: analysis.keyword_match.matched.filter((skill: string) => 
          this.isTechnicalSkill(skill)
        ),
        missing: analysis.keyword_match.missing.filter((skill: string) => 
          this.isTechnicalSkill(skill)
        ),
        recommendations: analysis.suggestions.filter((s: string) => 
          s.toLowerCase().includes('skill')
        )
      },
      soft: {
        required: [],
        present: analysis.strengths.filter((s: string) => this.isSoftSkill(s)),
        missing: [],
        recommendations: analysis.suggestions.filter((s: string) => 
          s.toLowerCase().includes('communication') || 
          s.toLowerCase().includes('leadership')
        )
      },
      industry: {
        required: [],
        present: [],
        missing: [],
        recommendations: []
      }
    };
  }

  private static buildExperienceAnalysis(analysis: any) {
    return {
      yearsRequired: 0,
      yearsFound: 0,
      relevant: true,
      experienceGaps: analysis.weaknesses.filter((w: string) => 
        w.toLowerCase().includes('experience')
      ),
      strengthAreas: analysis.strengths.filter((s: string) => 
        s.toLowerCase().includes('experience')
      ),
      improvementAreas: analysis.suggestions.filter((s: string) => 
        s.toLowerCase().includes('experience')
      )
    };
  }

  private static buildResumeQuality(analysis: any, metadata: any) {
    return {
      formatting: {
        score: Math.max(60, analysis.score - 20),
        issues: analysis.weaknesses.filter((w: string) => 
          w.toLowerCase().includes('format')
        ),
        suggestions: analysis.suggestions.filter((s: string) => 
          s.toLowerCase().includes('format')
        )
      },
      content: {
        score: analysis.score,
        issues: analysis.weaknesses,
        suggestions: analysis.suggestions
      },
      length: {
        score: 75,
        wordCount: metadata.file_size / 5,
        recommendations: []
      },
      structure: {
        score: Math.max(50, analysis.score - 10),
        missingSections: [],
        suggestions: analysis.suggestions.filter((s: string) => 
          s.toLowerCase().includes('section')
        )
      }
    };
  }

  private static buildCompetitiveAnalysis(analysis: any) {
    return {
      positioningStrength: Math.min(analysis.score + 10, 100),
      competitorComparison: [`Your resume scores ${analysis.score}% compared to similar candidates`],
      differentiators: analysis.strengths.slice(0, 3),
      marketPosition: analysis.score > 75 ? 'Strong' : analysis.score > 50 ? 'Moderate' : 'Needs Improvement',
      improvementImpact: analysis.suggestions.map(() => 
        'Implementing this could improve your score by 5-10%'
      )
    };
  }

  private static buildDetailedFeedback(analysis: any) {
    return {
      strengths: analysis.strengths.map((s: string) => ({
        category: 'General',
        points: [s],
        impact: 'Positive impact on application'
      })),
      weaknesses: analysis.weaknesses.map((w: string) => ({
        category: 'General',
        points: [w],
        impact: 'May reduce application effectiveness',
        solutions: analysis.suggestions.filter((s: string) => 
          s.toLowerCase().includes(w.toLowerCase().split(' ')[0])
        )
      })),
      quickWins: analysis.suggestions.slice(0, 3),
      industryInsights: [
        'Consider industry-specific keywords', 
        'Align with current market trends'
      ]
    };
  }

  private static buildImprovementPlan(analysis: any) {
    return {
      immediate: analysis.suggestions.slice(0, 2).map((s: string) => ({
        priority: 'high' as const,
        actions: [s],
        estimatedImpact: '5-10 point score improvement'
      })),
      shortTerm: analysis.suggestions.slice(2, 4).map((s: string) => ({
        priority: 'medium' as const,
        actions: [s],
        estimatedImpact: '3-7 point score improvement'
      })),
      longTerm: analysis.suggestions.slice(4).map((s: string) => ({
        priority: 'low' as const,
        actions: [s],
        estimatedImpact: '2-5 point score improvement'
      }))
    };
  }

  private static buildAiInsights(): string[] {
    return [
      'Analysis completed using advanced AI algorithms',
      'Recommendations are based on industry best practices',
      'Consider implementing high-priority suggestions first'
    ];
  }

  private static isTechnicalSkill(skill: string): boolean {
    return this.TECHNICAL_KEYWORDS.some(keyword => 
      skill.toLowerCase().includes(keyword)
    );
  }

  private static isSoftSkill(skill: string): boolean {
    return this.SOFT_SKILL_KEYWORDS.some(keyword => 
      skill.toLowerCase().includes(keyword)
    );
  }
}

class PythonApiService {
  private client: AxiosInstance;
  private retryOptions: RetryOptions;

  constructor() {
    this.retryOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
    };

    this.client = axios.create({
      baseURL: config.pythonApiUrl,
      timeout: config.pythonApiTimeout * 2,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ResumeChecker-Backend/1.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (request) => {
        logger.info('Python API request initiated', {
          method: request.method,
          url: request.url,
          baseURL: request.baseURL,
          timeout: request.timeout,
        });
        return request;
      },
      (error) => {
        logger.error('Python API request setup failed:', extractErrorMessage(error));
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.info('Python API response received', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          responseTime: response.headers['x-response-time'],
        });
        return response;
      },
      (error) => {
        this.logApiError(error);
        return Promise.reject(error);
      }
    );
  }

  public async analyzeResume(
    resumeFile: Express.Multer.File,
    jobDescriptionFile?: Express.Multer.File,
    jobDescriptionText?: string
  ): Promise<{ result: IAnalysisResult }> {
    const startTime = Date.now();

    try {
      const formData = this.buildFormData(resumeFile, jobDescriptionFile, jobDescriptionText);
      const response = await this.makeRequestWithRetry('/analyze', formData);
      
      logger.info('Python API analysis completed', {
        duration: Date.now() - startTime,
        status: response.data.status,
      });

      return this.processResponse(response.data, resumeFile, jobDescriptionFile);

    } catch (error) {
      logger.error('Resume analysis failed', {
        error: extractErrorMessage(error),
        duration: Date.now() - startTime,
        resumeFilename: resumeFile.originalname,
        hasJobDescription: !!(jobDescriptionFile || jobDescriptionText),
      });

      throw this.createAnalysisError(error);
    }
  }

  private buildFormData(
    resumeFile: Express.Multer.File,
    jobDescriptionFile?: Express.Multer.File,
    jobDescriptionText?: string
  ): FormData {
    const formData = new FormData();
    
    // Append resume file
    formData.append('resume', resumeFile.buffer, {
      filename: resumeFile.originalname,
      contentType: resumeFile.mimetype,
    });
    
    // Append job description
    if (jobDescriptionFile) {
      formData.append('job_description', jobDescriptionFile.buffer, {
        filename: jobDescriptionFile.originalname,
        contentType: jobDescriptionFile.mimetype,
      });
    } else if (jobDescriptionText) {
      formData.append('job_description_text', jobDescriptionText);
    }

    return formData;
  }

  private async makeRequestWithRetry(
    endpoint: string, 
    formData: FormData
  ): Promise<any> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        return await this.client.post<PythonApiResponse>(endpoint, formData, {
          headers: {
            ...formData.getHeaders(),
          },
        });
      } catch (error) {
        lastError = error as Error;
        
        if (!this.shouldRetry(error as AxiosError, attempt)) {
          throw error;
        }

        const delay = this.calculateRetryDelay(attempt);
        logger.warn(`Python API request failed, retrying in ${delay}ms`, {
          attempt,
          maxAttempts: this.retryOptions.maxRetries,
          error: extractErrorMessage(error),
        });

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private shouldRetry(error: AxiosError, attempt: number): boolean {
    if (attempt >= this.retryOptions.maxRetries) {
      return false;
    }

    // Don't retry client errors (4xx)
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return false;
    }

    // Retry on network errors, timeouts, and server errors (5xx)
    return (
      !error.response || // Network error
      error.code === 'ECONNABORTED' || // Timeout
      error.code === 'ENOTFOUND' || // DNS error
      (error.response.status >= 500) // Server error
    );
  }

  private calculateRetryDelay(attempt: number): number {
    const exponentialDelay = this.retryOptions.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
    return Math.min(exponentialDelay + jitter, this.retryOptions.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private processResponse(
    responseData: any,
    resumeFile: Express.Multer.File,
    jobDescriptionFile?: Express.Multer.File
  ): { result: IAnalysisResult } {
    // Check if the response is the new comprehensive format
    if (responseData.result) {
      return { result: responseData.result };
    }

    // Fallback to legacy format transformation
    const legacyResponse = responseData as LegacyAnalysisResponse;
    if (legacyResponse.success && legacyResponse.analysis) {
      return { 
        result: LegacyResponseTransformer.transform(
          legacyResponse, 
          resumeFile, 
          jobDescriptionFile
        ) 
      };
    }

    throw new Error('Invalid response format from Python API');
  }

  private createAnalysisError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const message = error.response.data?.detail || 
                       error.response.data?.error ||
                       `Python API error: ${error.response.status}`;
        return new Error(message);
      } else if (error.request) {
        return new Error('Python API is not responding. Please try again later.');
      }
    }
    
    return new Error('Failed to analyze resume. Please try again later.');
  }

  private logApiError(error: AxiosError): void {
    const errorDetails = {
      message: extractErrorMessage(error),
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      timeout: error.config?.timeout,
    };

    if (error.response?.status && error.response.status >= 500) {
      logger.error('Python API server error', errorDetails);
    } else if (error.response?.status && error.response.status >= 400) {
      logger.warn('Python API client error', errorDetails);
    } else {
      logger.error('Python API network error', errorDetails);
    }
  }

  // Health check for Python API
  public async checkHealth(): Promise<{ healthy: boolean; responseTime?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: response.status === 200,
        responseTime,
      };
    } catch (error) {
      logger.error('Python API health check failed:', extractErrorMessage(error));
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        error: extractErrorMessage(error),
      };
    }
  }
}

export const pythonApiService = new PythonApiService(); 