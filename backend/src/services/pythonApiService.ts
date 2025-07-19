import axios, { AxiosInstance, AxiosError } from 'axios';
const FormData = require('form-data');
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { IAnalysisResult } from '../models/Analysis';
import { extractErrorMessage } from '../utils/helpers';

// Constants for hardcoded values
const ANALYSIS_CONSTANTS = {
  RESUME_QUALITY: {
    FORMATTING_SCORE_OFFSET: 20,
    STRUCTURE_SCORE_OFFSET: 10,
    DEFAULT_LENGTH_SCORE: 75,
    MIN_SCORE: 50,
    MIN_FORMATTING_SCORE: 60
  },
  COMPETITIVE_ANALYSIS: {
    STRONG_THRESHOLD: 75,
    MODERATE_THRESHOLD: 50,
    WEAK_THRESHOLD: 25
  },
  DEFAULT_CONFIDENCE: 85,
  MAX_SUGGESTIONS: 3,
  WORD_COUNT_DIVISOR: 5
};

// New Python API response structure
interface PythonApiResponse {
  job_description_validity: string;
  validation_error?: string;
  resume_eligibility: string;
  score_out_of_100: number;
  short_conclusion: string;
  chance_of_selection_percentage: number;
  resume_improvement_priority: string[];
  overall_fit_summary: string;
  resume_analysis_report?: {
    candidate_information: {
      name: string;
      position_applied: string;
      experience_level: string;
      current_status: string;
    };
    strengths_analysis: {
      technical_skills: string[];
      project_portfolio: string[];
      educational_background: string[];
    };
    weaknesses_analysis: {
      critical_gaps_against_job_description: string[];
      technical_deficiencies: string[];
      resume_presentation_issues: string[];
      soft_skills_gaps: string[];
      missing_essential_elements: string[];
    };
    section_wise_detailed_feedback: {
      contact_information: {
        current_state: string;
        strengths: string[];
        improvements: string[];
      };
      profile_summary: {
        current_state: string;
        strengths: string[];
        improvements: string[];
      };
      education: {
        current_state: string;
        strengths: string[];
        improvements: string[];
      };
      skills: {
        current_state: string;
        strengths: string[];
        improvements: string[];
      };
      projects: {
        current_state: string;
        strengths: string[];
        improvements: string[];
      };
      missing_sections: {
        certifications: string;
        experience: string;
        achievements: string;
        soft_skills: string;
      };
    };
    improvement_recommendations: {
      immediate_resume_additions: string[];
      immediate_priority_actions: string[];
      short_term_development_goals: string[];
      medium_term_objectives: string[];
    };
    soft_skills_enhancement_suggestions: {
      communication_skills: string[];
      teamwork_and_collaboration: string[];
      leadership_and_initiative: string[];
      problem_solving_approach: string[];
    };
    final_assessment: {
      eligibility_status: string;
      hiring_recommendation: string;
      key_interview_areas: string[];
      onboarding_requirements: string[];
      long_term_potential: string;
    };
  };
}

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

class PythonResponseTransformer {
  public static transform(
    pythonResponse: PythonApiResponse,
    resumeFile?: Express.Multer.File,
    jobDescriptionFile?: Express.Multer.File
  ): IAnalysisResult {
    const report = pythonResponse.resume_analysis_report;
    
    // Ensure all required fields have fallback values
    const jobTitle = report?.candidate_information?.position_applied || 
                    report?.final_assessment?.hiring_recommendation?.split(' ').slice(0, 3).join(' ') || 
                    'Software Engineer';
    
    const industry = this.extractIndustryFromResponse(pythonResponse);
    
    return {
      overallScore: pythonResponse.score_out_of_100 || 50,
      matchPercentage: pythonResponse.chance_of_selection_percentage || 50,
      jobTitle: jobTitle,
      industry: industry,
      keywordMatch: this.buildKeywordMatch(pythonResponse),
      skillsAnalysis: this.buildSkillsAnalysis(pythonResponse),
      experienceAnalysis: this.buildExperienceAnalysis(pythonResponse),
      resumeQuality: this.buildResumeQuality(pythonResponse, resumeFile),
      competitiveAnalysis: this.buildCompetitiveAnalysis(pythonResponse),
      detailedFeedback: this.buildDetailedFeedback(pythonResponse),
      improvementPlan: this.buildImprovementPlan(pythonResponse),
      overallRecommendation: pythonResponse.short_conclusion || 'Analysis completed successfully',
      aiInsights: this.buildAiInsights(pythonResponse),
      candidateStrengths: report?.strengths_analysis?.technical_skills || [],
      developmentAreas: pythonResponse.resume_improvement_priority || [],
      confidence: this.calculateConfidence(pythonResponse)
    };
  }

  private static extractIndustryFromResponse(response: PythonApiResponse): string {
    const report = response.resume_analysis_report;
    
    // Try to extract industry from various sources
    if (report?.candidate_information?.position_applied) {
      const position = report.candidate_information.position_applied.toLowerCase();
      if (position.includes('ai') || position.includes('ml') || position.includes('machine learning')) {
        return 'Artificial Intelligence';
      } else if (position.includes('web') || position.includes('frontend') || position.includes('backend')) {
        return 'Web Development';
      } else if (position.includes('mobile') || position.includes('ios') || position.includes('android')) {
        return 'Mobile Development';
      } else if (position.includes('data') || position.includes('analytics')) {
        return 'Data Science';
      } else if (position.includes('devops') || position.includes('cloud')) {
        return 'DevOps';
      } else if (position.includes('security') || position.includes('cyber')) {
        return 'Cybersecurity';
      }
    }
    
    // Default based on technical skills
    const technicalSkills = report?.strengths_analysis?.technical_skills || [];
    if (technicalSkills.some(skill => skill.toLowerCase().includes('python'))) {
      return 'Software Development';
    } else if (technicalSkills.some(skill => skill.toLowerCase().includes('javascript'))) {
      return 'Web Development';
    }
    
    return 'Technology';
  }

  private static buildKeywordMatch(response: PythonApiResponse) {
    const report = response.resume_analysis_report;
    return {
      matched: report?.strengths_analysis?.technical_skills || [],
      missing: report?.weaknesses_analysis?.technical_deficiencies || [],
      percentage: response.chance_of_selection_percentage,
      suggestions: response.resume_improvement_priority.slice(0, ANALYSIS_CONSTANTS.MAX_SUGGESTIONS)
    };
  }

  private static buildSkillsAnalysis(response: PythonApiResponse) {
    const report = response.resume_analysis_report;
    return {
      technical: {
        required: [],
        present: report?.strengths_analysis?.technical_skills || [],
        missing: report?.weaknesses_analysis?.technical_deficiencies || [],
        recommendations: report?.improvement_recommendations?.immediate_resume_additions || []
      },
      soft: {
        required: [],
        present: report?.soft_skills_enhancement_suggestions?.communication_skills || [],
        missing: report?.weaknesses_analysis?.soft_skills_gaps || [],
        recommendations: report?.soft_skills_enhancement_suggestions?.communication_skills || []
      },
      industry: {
        required: [],
        present: [],
        missing: [],
        recommendations: []
      }
    };
  }

  private static buildExperienceAnalysis(response: PythonApiResponse) {
    const report = response.resume_analysis_report;
    return {
      yearsRequired: 0,
      yearsFound: 0,
      relevant: response.resume_eligibility === 'Eligible',
      experienceGaps: report?.weaknesses_analysis?.critical_gaps_against_job_description || [],
      strengthAreas: report?.strengths_analysis?.project_portfolio || [],
      improvementAreas: report?.improvement_recommendations?.short_term_development_goals || []
    };
  }

  private static buildResumeQuality(response: PythonApiResponse, resumeFile?: Express.Multer.File) {
    const report = response.resume_analysis_report;
    return {
      formatting: {
        score: Math.max(
          ANALYSIS_CONSTANTS.RESUME_QUALITY.MIN_FORMATTING_SCORE, 
          response.score_out_of_100 - ANALYSIS_CONSTANTS.RESUME_QUALITY.FORMATTING_SCORE_OFFSET
        ),
        issues: report?.weaknesses_analysis?.resume_presentation_issues || [],
        suggestions: report?.section_wise_detailed_feedback?.contact_information?.improvements || []
      },
      content: {
        score: response.score_out_of_100,
        issues: report?.weaknesses_analysis?.missing_essential_elements || [],
        suggestions: response.resume_improvement_priority
      },
      length: {
        score: ANALYSIS_CONSTANTS.RESUME_QUALITY.DEFAULT_LENGTH_SCORE,
        wordCount: resumeFile ? Math.floor(resumeFile.size / ANALYSIS_CONSTANTS.WORD_COUNT_DIVISOR) : 0,
        recommendations: []
      },
      structure: {
        score: Math.max(
          ANALYSIS_CONSTANTS.RESUME_QUALITY.MIN_SCORE, 
          response.score_out_of_100 - ANALYSIS_CONSTANTS.RESUME_QUALITY.STRUCTURE_SCORE_OFFSET
        ),
        missingSections: Object.values(report?.section_wise_detailed_feedback?.missing_sections || {}),
        suggestions: report?.section_wise_detailed_feedback?.profile_summary?.improvements || []
      }
    };
  }

  private static buildCompetitiveAnalysis(response: PythonApiResponse) {
    const report = response.resume_analysis_report;
    const score = response.score_out_of_100;
    
    let positioningStrength: number;
    if (score >= ANALYSIS_CONSTANTS.COMPETITIVE_ANALYSIS.STRONG_THRESHOLD) {
      positioningStrength = 85;
    } else if (score >= ANALYSIS_CONSTANTS.COMPETITIVE_ANALYSIS.MODERATE_THRESHOLD) {
      positioningStrength = 65;
    } else if (score >= ANALYSIS_CONSTANTS.COMPETITIVE_ANALYSIS.WEAK_THRESHOLD) {
      positioningStrength = 45;
    } else {
      positioningStrength = 25;
    }

    return {
      positioningStrength,
      competitorComparison: report?.weaknesses_analysis?.critical_gaps_against_job_description || [],
      differentiators: report?.strengths_analysis?.technical_skills || [],
      marketPosition: score >= ANALYSIS_CONSTANTS.COMPETITIVE_ANALYSIS.STRONG_THRESHOLD ? 'Strong' : 
                     score >= ANALYSIS_CONSTANTS.COMPETITIVE_ANALYSIS.MODERATE_THRESHOLD ? 'Moderate' : 'Weak',
      improvementImpact: response.resume_improvement_priority.slice(0, ANALYSIS_CONSTANTS.MAX_SUGGESTIONS)
    };
  }

  private static buildDetailedFeedback(response: PythonApiResponse) {
    const report = response.resume_analysis_report;
    return {
      strengths: (report?.strengths_analysis?.technical_skills || []).map((s: string) => ({
        category: 'Technical Skills',
        points: [s],
        impact: 'Positive impact on application'
      })),
      weaknesses: (report?.weaknesses_analysis?.critical_gaps_against_job_description || []).map((w: string) => ({
        category: 'Critical Gaps',
        points: [w],
        impact: 'May reduce application effectiveness',
        solutions: response.resume_improvement_priority.filter((s: string) => 
          s.toLowerCase().includes(w.toLowerCase().split(' ')[0])
        )
      })),
      quickWins: response.resume_improvement_priority.slice(0, ANALYSIS_CONSTANTS.MAX_SUGGESTIONS),
      longTerm: report?.improvement_recommendations?.medium_term_objectives || [],
      industryInsights: [
        'Consider industry-specific keywords', 
        'Align with current market trends'
      ]
    };
  }

  private static buildImprovementPlan(response: PythonApiResponse) {
    const report = response.resume_analysis_report;
    return {
      immediate: [{
        priority: 'high' as const,
        actions: report?.improvement_recommendations?.immediate_priority_actions || [],
        estimatedImpact: 'High impact on application success'
      }],
      shortTerm: [{
        priority: 'medium' as const,
        actions: report?.improvement_recommendations?.short_term_development_goals || [],
        estimatedImpact: 'Moderate impact on career growth'
      }],
      longTerm: [{
        priority: 'low' as const,
        actions: report?.improvement_recommendations?.medium_term_objectives || [],
        estimatedImpact: 'Long-term career development'
      }]
    };
  }

  private static buildAiInsights(response: PythonApiResponse) {
    const report = response.resume_analysis_report;
    return [
      `Overall fit: ${response.overall_fit_summary}`,
      `Eligibility: ${response.resume_eligibility}`,
      `Selection chance: ${response.chance_of_selection_percentage}%`,
      report?.final_assessment?.hiring_recommendation || 'Consider for interview'
    ];
  }

  private static calculateConfidence(response: PythonApiResponse): number {
    const report = response.resume_analysis_report;
    if (!report) {
      return ANALYSIS_CONSTANTS.DEFAULT_CONFIDENCE - 20; // Lower confidence if no detailed report
    }

    let confidence = ANALYSIS_CONSTANTS.DEFAULT_CONFIDENCE;
    
    // Adjust based on data completeness
    const hasStrengths = report.strengths_analysis?.technical_skills?.length > 0;
    const hasWeaknesses = report.weaknesses_analysis?.critical_gaps_against_job_description?.length > 0;
    const hasRecommendations = response.resume_improvement_priority?.length > 0;
    
    if (hasStrengths && hasWeaknesses && hasRecommendations) {
      confidence += 10; // High confidence for complete analysis
    } else if (hasStrengths || hasWeaknesses) {
      confidence += 5; // Medium confidence for partial analysis
    } else {
      confidence -= 10; // Lower confidence for minimal analysis
    }

    return Math.min(100, Math.max(0, confidence));
  }
}

class PythonApiService {
  private client: AxiosInstance;
  private retryOptions: RetryOptions;

  constructor() {
    this.client = axios.create({
      baseURL: config.pythonApiUrl,
      timeout: config.pythonApiTimeout || 120000, // Use config timeout or default to 2 minutes
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    this.retryOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
    };

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info('Python API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          hasFiles: !!config.data,
          requestId: this.generateRequestId(),
        });
        return config;
      },
      (error) => {
        logger.error('Python API request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info('Python API response received', {
          status: response.status,
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
    jobDescriptionText?: string,
    userId?: string
  ): Promise<{ analysis_id: string; status: string }> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    logger.info('Starting Python API analysis', {
      requestId,
      resumeFile: resumeFile.originalname,
      jobDescriptionFile: jobDescriptionFile?.originalname,
      hasJobDescriptionText: !!jobDescriptionText
    });

    try {
      // Build form data
      const formData = this.buildFormData(resumeFile, jobDescriptionFile, jobDescriptionText, userId);
      
      // Make request to Python API
      const response = await this.makeRequestWithRetry('/analyze-resume', formData);
      
      const responseTime = Date.now() - startTime;
      
      logger.info('Python API analysis completed', {
        requestId,
        responseTime,
        analysis_id: response.analysis_id,
        status: response.status
      });

      // Check if analysis was successful
      if (!response.success || response.status !== 'completed') {
        throw new Error(`Analysis failed: ${response.message || 'Unknown error'}`);
      }

      // Return only status and analysis_id - no need to fetch full result here
      // Frontend will fetch the complete analysis separately when needed
      return {
        analysis_id: response.analysis_id,
        status: response.status
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logApiError(error as AxiosError);
      
      logger.error('Python API analysis failed', {
        requestId,
        responseTime,
        error: extractErrorMessage(error)
      });

      throw this.createAnalysisError(error);
    }
  }

  private buildFormData(
    resumeFile: Express.Multer.File,
    jobDescriptionFile?: Express.Multer.File,
    jobDescriptionText?: string,
    userId?: string
  ): FormData {
    const formData = new FormData();
    
    // Add resume file - Python API expects 'resume_file'
    formData.append('resume_file', resumeFile.buffer, {
      filename: resumeFile.originalname,
      contentType: resumeFile.mimetype,
    });

    // Add job description (file or text, not both)
    if (jobDescriptionFile) {
      formData.append('job_description_file', jobDescriptionFile.buffer, {
        filename: jobDescriptionFile.originalname,
        contentType: jobDescriptionFile.mimetype,
      });
    } else if (jobDescriptionText) {
      formData.append('job_description_text', jobDescriptionText);
    }

    // Add user ID if provided
    if (userId) {
      formData.append('user_id', userId);
    }

    return formData;
  }

  private async makeRequestWithRetry(
    endpoint: string, 
    formData: FormData
  ): Promise<any> { // Changed return type to any as PythonApiResponse is not directly returned here
    let lastError: AxiosError;
    
    for (let attempt = 1; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        const response = await this.client.post(endpoint, formData, {
          headers: {
            ...(formData as any).getHeaders(),
          },
        });
        
        return response.data; // Return the raw response data
      } catch (error) {
        lastError = error as AxiosError;
        
        if (attempt === this.retryOptions.maxRetries) {
          logger.error('Max retries reached for Python API request', {
            endpoint,
            error: extractErrorMessage(lastError),
            attempts: attempt,
          });
          break;
        }

        if (!this.shouldRetry(lastError, attempt)) {
          break;
        }

        const delay = this.calculateRetryDelay(attempt);
        logger.warn(`Retrying Python API request (attempt ${attempt}/${this.retryOptions.maxRetries})`, {
          endpoint,
          delay,
          error: extractErrorMessage(lastError),
        });
        
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private shouldRetry(error: AxiosError, attempt: number): boolean {
    if (error.response?.status) {
      const status = error.response.status;
      // Retry on rate limiting (429) or server errors (5xx)
      return status === 429 || (status >= 500 && status < 600);
    }
    // Retry on network errors
    return !error.response && attempt < this.retryOptions.maxRetries;
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryOptions.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 100; // Add jitter to prevent synchronized retries
    return Math.min(delay + jitter, this.retryOptions.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createAnalysisError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      const details = error.response?.data?.detail;

      if (status === 400) {
        return new Error(`Invalid request: ${message}`);
      } else if (status === 422) {
        // Handle validation errors from Python API
        if (details && Array.isArray(details)) {
          const fieldErrors = details.map((detail: any) => 
            `${detail.loc?.join('.')}: ${detail.msg}`
          ).join(', ');
          return new Error(`Validation error: ${fieldErrors}`);
        }
        return new Error(`Validation error: ${message}`);
      } else if (status === 413) {
        return new Error('File too large. Please use smaller files.');
      } else if (status === 429) {
        return new Error('Too many requests. Please try again later.');
      } else if (status && status >= 500) {
        return new Error('Analysis service temporarily unavailable. Please try again.');
      } else {
        return new Error(`Analysis failed: ${message}`);
      }
    }

    return new Error(`Analysis failed: ${extractErrorMessage(error)}`);
  }

  private logApiError(error: AxiosError): void {
    const errorInfo = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      responseData: error.response?.data,
    };

    if (error.response?.status && error.response.status >= 500) {
      logger.error('Python API server error:', errorInfo);
    } else if (error.response?.status === 429) {
      logger.warn('Python API rate limit exceeded:', errorInfo);
    } else if (error.response?.status === 400) {
      logger.warn('Python API bad request:', errorInfo);
    } else if (!error.response) {
      logger.error('Python API network error:', errorInfo);
    } else {
      logger.error('Python API unexpected error:', errorInfo);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // REMOVED: fetchAnalysisFromDatabase method - no longer needed since we use API calls

  public async checkAnalysisStatus(analysis_id: string): Promise<{ status: string; has_result: boolean }> {
    try {
      logger.info('Checking analysis status from Python server API', { analysis_id });
      
      // Make API request to Python server to check status
      const response = await this.client.get(`/analysis/${analysis_id}/status`);
      
      if (!response.data || !response.data.success) {
        throw new Error('Failed to check analysis status from Python server');
      }
      
      return {
        status: response.data.status,
        has_result: response.data.has_result
      };
      
    } catch (error) {
      logger.error('Failed to check analysis status from Python server API', { 
        analysis_id, 
        error: extractErrorMessage(error) 
      });
      throw new Error(`Failed to check analysis status: ${extractErrorMessage(error)}`);
    }
  }

  /**
   * Fetch complete analysis result from Python server via API
   * This method is called when backend needs the full analysis data
   */
  public async fetchAnalysisResult(analysis_id: string): Promise<any> {
    try {
      logger.info('Fetching complete analysis result from Python server API', { analysis_id });
      
      // Make API request to Python server to get the full analysis
      const response = await this.client.get(`/analysis/${analysis_id}/result`);
      
      if (!response.data || !response.data.success) {
        throw new Error('Failed to fetch analysis result from Python server');
      }

      // Transform the result to match our schema
      const transformedResult = PythonResponseTransformer.transform(
        response.data.analysis_result,
        undefined, // We don't have file objects here, but transformer can handle it
        undefined
      );

      return transformedResult;
      
    } catch (error) {
      logger.error('Failed to fetch analysis result from Python server API', { 
        analysis_id, 
        error: extractErrorMessage(error) 
      });
      throw new Error(`Failed to fetch analysis result: ${extractErrorMessage(error)}`);
    }
  }

  public async checkHealth(): Promise<{ healthy: boolean; responseTime?: number; error?: string }> {
    try {
      const startTime = Date.now();
      const response = await this.client.get('/health');
      const responseTime = Date.now() - startTime;

      return {
        healthy: response.status === 200,
        responseTime,
      };
    } catch (error) {
      return {
        healthy: false,
        error: extractErrorMessage(error),
      };
    }
  }
}

export const pythonApiService = new PythonApiService(); 