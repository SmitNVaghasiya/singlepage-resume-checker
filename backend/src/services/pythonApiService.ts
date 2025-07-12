import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { IAnalysisResult } from '../models/Analysis';
import { extractErrorMessage } from '../utils/helpers';

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
    resumeFile: Express.Multer.File,
    jobDescriptionFile?: Express.Multer.File
  ): IAnalysisResult {
    const report = pythonResponse.resume_analysis_report;
    
    return {
      overallScore: pythonResponse.score_out_of_100,
      matchPercentage: pythonResponse.chance_of_selection_percentage,
      jobTitle: report?.candidate_information.position_applied || 'Job Position',
      industry: 'General',
      keywordMatch: this.buildKeywordMatch(pythonResponse),
      skillsAnalysis: this.buildSkillsAnalysis(pythonResponse),
      experienceAnalysis: this.buildExperienceAnalysis(pythonResponse),
      resumeQuality: this.buildResumeQuality(pythonResponse, resumeFile),
      competitiveAnalysis: this.buildCompetitiveAnalysis(pythonResponse),
      detailedFeedback: this.buildDetailedFeedback(pythonResponse),
      improvementPlan: this.buildImprovementPlan(pythonResponse),
      overallRecommendation: pythonResponse.short_conclusion,
      aiInsights: this.buildAiInsights(pythonResponse),
      candidateStrengths: report?.strengths_analysis.technical_skills || [],
      developmentAreas: pythonResponse.resume_improvement_priority,
      confidence: 90
    };
  }

  private static buildKeywordMatch(response: PythonApiResponse) {
    const report = response.resume_analysis_report;
    return {
      matched: report?.strengths_analysis.technical_skills || [],
      missing: report?.weaknesses_analysis.technical_deficiencies || [],
      percentage: response.chance_of_selection_percentage,
      suggestions: response.resume_improvement_priority.slice(0, 3)
    };
  }

  private static buildSkillsAnalysis(response: PythonApiResponse) {
    const report = response.resume_analysis_report;
    return {
      technical: {
        required: [],
        present: report?.strengths_analysis.technical_skills || [],
        missing: report?.weaknesses_analysis.technical_deficiencies || [],
        recommendations: report?.improvement_recommendations.immediate_resume_additions || []
      },
      soft: {
        required: [],
        present: report?.soft_skills_enhancement_suggestions.communication_skills || [],
        missing: report?.weaknesses_analysis.soft_skills_gaps || [],
        recommendations: report?.soft_skills_enhancement_suggestions.communication_skills || []
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
      experienceGaps: report?.weaknesses_analysis.critical_gaps_against_job_description || [],
      strengthAreas: report?.strengths_analysis.project_portfolio || [],
      improvementAreas: report?.improvement_recommendations.short_term_development_goals || []
    };
  }

  private static buildResumeQuality(response: PythonApiResponse, resumeFile: Express.Multer.File) {
    const report = response.resume_analysis_report;
    return {
      formatting: {
        score: Math.max(60, response.score_out_of_100 - 20),
        issues: report?.weaknesses_analysis.resume_presentation_issues || [],
        suggestions: report?.section_wise_detailed_feedback.contact_information.improvements || []
      },
      content: {
        score: response.score_out_of_100,
        issues: report?.weaknesses_analysis.missing_essential_elements || [],
        suggestions: response.resume_improvement_priority
      },
      length: {
        score: 75,
        wordCount: resumeFile.size / 5,
        recommendations: []
      },
      structure: {
        score: Math.max(50, response.score_out_of_100 - 10),
        missingSections: Object.values(report?.section_wise_detailed_feedback.missing_sections || {}),
        suggestions: report?.section_wise_detailed_feedback.profile_summary.improvements || []
      }
    };
  }

  private static buildCompetitiveAnalysis(response: PythonApiResponse) {
    const report = response.resume_analysis_report;
    return {
      positioningStrength: Math.min(response.score_out_of_100 + 10, 100),
      competitorComparison: [`Your resume scores ${response.score_out_of_100}% compared to similar candidates`],
      differentiators: report?.strengths_analysis.technical_skills.slice(0, 3) || [],
      marketPosition: response.score_out_of_100 > 75 ? 'Strong' : response.score_out_of_100 > 50 ? 'Moderate' : 'Needs Improvement',
      improvementImpact: response.resume_improvement_priority.map(() => 
        'Implementing this could improve your score by 5-10%'
      )
    };
  }

  private static buildDetailedFeedback(response: PythonApiResponse) {
    const report = response.resume_analysis_report;
    return {
      strengths: (report?.strengths_analysis.technical_skills || []).map((s: string) => ({
        category: 'Technical Skills',
        points: [s],
        impact: 'Positive impact on application'
      })),
      weaknesses: (report?.weaknesses_analysis.critical_gaps_against_job_description || []).map((w: string) => ({
        category: 'Critical Gaps',
        points: [w],
        impact: 'May reduce application effectiveness',
        solutions: response.resume_improvement_priority.filter((s: string) => 
          s.toLowerCase().includes(w.toLowerCase().split(' ')[0])
        )
      })),
      quickWins: response.resume_improvement_priority.slice(0, 3),
      longTerm: report?.improvement_recommendations.medium_term_objectives || [],
      industryInsights: [
        'Consider industry-specific keywords', 
        'Align with current market trends'
      ]
    };
  }

  private static buildImprovementPlan(response: PythonApiResponse) {
    const report = response.resume_analysis_report;
    return {
      immediate: (report?.improvement_recommendations.immediate_priority_actions || []).map((action: string) => ({
        priority: 'high' as const,
        actions: [action],
        estimatedImpact: '5-10 point score improvement'
      })),
      shortTerm: (report?.improvement_recommendations.short_term_development_goals || []).map((goal: string) => ({
        priority: 'medium' as const,
        actions: [goal],
        estimatedImpact: '3-7 point score improvement'
      })),
      longTerm: (report?.improvement_recommendations.medium_term_objectives || []).map((objective: string) => ({
        priority: 'low' as const,
        actions: [objective],
        estimatedImpact: '2-5 point score improvement'
      }))
    };
  }

  private static buildAiInsights(response: PythonApiResponse) {
    const report = response.resume_analysis_report;
    return [
      `Overall fit: ${response.overall_fit_summary}`,
      `Eligibility: ${response.resume_eligibility}`,
      `Selection chance: ${response.chance_of_selection_percentage}%`,
      report?.final_assessment.hiring_recommendation || 'Consider for interview'
    ];
  }
}

class PythonApiService {
  private client: AxiosInstance;
  private retryOptions: RetryOptions;

  constructor() {
    this.client = axios.create({
      baseURL: config.pythonApiUrl || 'http://localhost:8000',
      timeout: 120000, // 2 minutes timeout
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
        logger.info('Python API response', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
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
    try {
      logger.info('Starting Python API analysis', {
        resumeFilename: resumeFile.originalname,
        resumeSize: resumeFile.size,
        hasJobDescriptionFile: !!jobDescriptionFile,
        hasJobDescriptionText: !!jobDescriptionText,
      });

      const formData = this.buildFormData(resumeFile, jobDescriptionFile, jobDescriptionText);
      
      // Use the new Python API endpoint
      const response = await this.makeRequestWithRetry('/analyze-resume', formData);
      
      // Check for job description validation errors
      if (response.job_description_validity === 'Invalid') {
        throw new Error(response.validation_error || 'Invalid job description');
      }

      const result = PythonResponseTransformer.transform(response, resumeFile, jobDescriptionFile);
      
      logger.info('Python API analysis completed successfully', {
        score: result.overallScore,
        matchPercentage: result.matchPercentage,
      });

      return { result };
    } catch (error) {
      throw this.createAnalysisError(error);
    }
  }

  private buildFormData(
    resumeFile: Express.Multer.File,
    jobDescriptionFile?: Express.Multer.File,
    jobDescriptionText?: string
  ): FormData {
    const formData = new FormData();
    
    // Add resume file
    formData.append('resume_file', resumeFile.buffer, {
      filename: resumeFile.originalname,
      contentType: resumeFile.mimetype,
    });

    // Add job description (either file or text)
    if (jobDescriptionFile) {
      formData.append('job_description_file', jobDescriptionFile.buffer, {
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
    let lastError: AxiosError;

    for (let attempt = 1; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        const response = await this.client.post(endpoint, formData, {
          headers: {
            ...formData.getHeaders(),
          },
        });

        return response.data;
      } catch (error) {
        lastError = error as AxiosError;
        
        if (!this.shouldRetry(lastError, attempt)) {
          throw lastError;
        }

        if (attempt < this.retryOptions.maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          logger.warn(`Python API request failed, retrying in ${delay}ms (attempt ${attempt}/${this.retryOptions.maxRetries})`, {
            error: extractErrorMessage(lastError),
            endpoint,
          });
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  private shouldRetry(error: AxiosError, attempt: number): boolean {
    // Don't retry on client errors (4xx) except for rate limiting
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      return error.response.status === 429; // Rate limiting
    }

    // Retry on server errors (5xx) and network errors
    return attempt < this.retryOptions.maxRetries;
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryOptions.baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, this.retryOptions.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private processResponse(
    responseData: any,
    resumeFile: Express.Multer.File,
    jobDescriptionFile?: Express.Multer.File
  ): { result: IAnalysisResult } {
    try {
      const result = PythonResponseTransformer.transform(responseData, resumeFile, jobDescriptionFile);
      return { result };
    } catch (error) {
      logger.error('Error processing Python API response:', error);
      throw new Error('Failed to process analysis response');
    }
  }

  private createAnalysisError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      if (status === 400) {
        return new Error(`Invalid request: ${message}`);
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
      method: error.config?.method?.toUpperCase(),
      message: error.message,
      responseData: error.response?.data,
    };

    if (error.response?.status && error.response.status >= 500) {
      logger.error('Python API server error:', errorInfo);
    } else if (error.response?.status && error.response.status >= 400) {
      logger.warn('Python API client error:', errorInfo);
    } else {
      logger.error('Python API network error:', errorInfo);
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