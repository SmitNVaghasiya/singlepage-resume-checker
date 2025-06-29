import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { config } from '../config/config';
import { logger } from '../utils/logger';

interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywordMatch?: {
    matched: string[];
    missing: string[];
    percentage: number;
  };
  skillsAnalysis?: {
    required: string[];
    present: string[];
    missing: string[];
  };
  experienceAnalysis?: {
    yearsRequired: number;
    yearsFound: number;
    relevant: boolean;
  };
  overallRecommendation: string;
}

// Updated interface for FastAPI response
interface FastApiAnalysisResponse {
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

class PythonApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.pythonApiUrl,
      timeout: config.pythonApiTimeout,
      headers: {
        'Accept': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (request) => {
        logger.info({
          message: 'Python API request',
          method: request.method,
          url: request.url,
        });
        return request;
      },
      (error) => {
        logger.error('Python API request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info({
          message: 'Python API response',
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logger.error({
          message: 'Python API response error',
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  async analyzeResume(
    resumeFile: Express.Multer.File,
    jobDescriptionFile?: Express.Multer.File
  ): Promise<AnalysisResult> {
    try {
      // Create form data
      const formData = new FormData();
      
      // Append resume file
      formData.append('resume', resumeFile.buffer, {
        filename: resumeFile.originalname,
        contentType: resumeFile.mimetype,
      });
      
      // Append job description if provided
      if (jobDescriptionFile) {
        // For FastAPI, we need to extract text and send as form field
        let jobDescriptionText = '';
        if (jobDescriptionFile.mimetype === 'text/plain') {
          jobDescriptionText = jobDescriptionFile.buffer.toString('utf-8');
        }
        formData.append('job_description', jobDescriptionText);
      }

      // Make request to FastAPI
      const response = await this.client.post<FastApiAnalysisResponse>('/analyze', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      // Transform FastAPI response to expected format
      const fastApiResult = response.data.analysis;
      const analysisResult: AnalysisResult = {
        score: fastApiResult.score,
        strengths: fastApiResult.strengths,
        weaknesses: fastApiResult.weaknesses,
        suggestions: fastApiResult.suggestions,
        keywordMatch: {
          matched: fastApiResult.keyword_match.matched,
          missing: fastApiResult.keyword_match.missing,
          percentage: fastApiResult.keyword_match.percentage,
        },
        skillsAnalysis: {
          required: [], // Not provided by current FastAPI implementation
          present: fastApiResult.keyword_match.matched,
          missing: [], // Not provided by current FastAPI implementation
        },
        experienceAnalysis: {
          yearsRequired: 0, // Not provided by current FastAPI implementation
          yearsFound: 0, // Not provided by current FastAPI implementation
          relevant: true, // Default to true
        },
        overallRecommendation: fastApiResult.overall_recommendation,
      };

      return analysisResult;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Python API returned an error response
          throw new Error(
            error.response.data?.detail || 
            `Python API error: ${error.response.status}`
          );
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('Python API is not responding');
        }
      }
      
      throw new Error('Failed to analyze resume');
    }
  }

  // Health check for Python API
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.error('Python API health check failed:', error);
      return false;
    }
  }
}

export const pythonApiService = new PythonApiService(); 