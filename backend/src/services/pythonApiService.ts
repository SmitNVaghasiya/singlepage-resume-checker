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

interface FlaskAnalysisResponse {
  analysis_id: string;
  status: string;
  message: string;
  result: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    keyword_match: {
      matched: string[];
      missing: string[];
      percentage: number;
    };
    skills_analysis: {
      required: string[];
      present: string[];
      missing: string[];
    };
    experience_analysis: {
      years_required: number;
      years_found: number;
      relevant: boolean;
    };
    overall_recommendation: string;
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
    jobDescriptionFile: Express.Multer.File
  ): Promise<AnalysisResult> {
    try {
      // Create form data
      const formData = new FormData();
      
      // Append files
      formData.append('resume', resumeFile.buffer, {
        filename: resumeFile.originalname,
        contentType: resumeFile.mimetype,
      });
      
      formData.append('job_description', jobDescriptionFile.buffer, {
        filename: jobDescriptionFile.originalname,
        contentType: jobDescriptionFile.mimetype,
      });

      // Make request to Python API (Flask version)
      const response = await this.client.post<FlaskAnalysisResponse>('/analyze', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      // Transform Flask response to expected format
      const flaskResult = response.data.result;
      const analysisResult: AnalysisResult = {
        score: flaskResult.score,
        strengths: flaskResult.strengths,
        weaknesses: flaskResult.weaknesses,
        suggestions: flaskResult.suggestions,
        keywordMatch: {
          matched: flaskResult.keyword_match.matched,
          missing: flaskResult.keyword_match.missing,
          percentage: flaskResult.keyword_match.percentage,
        },
        skillsAnalysis: {
          required: flaskResult.skills_analysis.required,
          present: flaskResult.skills_analysis.present,
          missing: flaskResult.skills_analysis.missing,
        },
        experienceAnalysis: {
          yearsRequired: flaskResult.experience_analysis.years_required,
          yearsFound: flaskResult.experience_analysis.years_found,
          relevant: flaskResult.experience_analysis.relevant,
        },
        overallRecommendation: flaskResult.overall_recommendation,
      };

      return analysisResult;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Python API returned an error response
          throw new Error(
            error.response.data?.message || 
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