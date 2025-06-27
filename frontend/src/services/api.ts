const API_BASE_URL = 'http://localhost:5000/api';

export interface AnalysisRequest {
  resumeFile: File;
  jobDescriptionFile?: File;
  jobDescriptionText?: string;
}

export interface AnalysisResponse {
  message: string;
  analysisId: string;
  status: string;
  estimatedTime: string;
}

export interface AnalysisResult {
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
  completedAt?: string;
}

export interface AnalysisStatus {
  status: 'processing' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Start resume analysis
  async analyzeResume(request: AnalysisRequest): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('resume', request.resumeFile);
    
    if (request.jobDescriptionFile) {
      formData.append('jobDescription', request.jobDescriptionFile);
    } else if (request.jobDescriptionText) {
      // Create a text file from the job description text
      const textFile = new Blob([request.jobDescriptionText], { type: 'text/plain' });
      formData.append('jobDescription', textFile, 'job_description.txt');
    }

    const response = await fetch(`${this.baseUrl}/resume/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get analysis status
  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus> {
    const response = await fetch(`${this.baseUrl}/resume/status/${analysisId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get analysis result
  async getAnalysisResult(analysisId: string): Promise<AnalysisResult> {
    const response = await fetch(`${this.baseUrl}/resume/result/${analysisId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Poll for analysis completion
  async pollForResult(analysisId: string, maxAttempts: number = 30, interval: number = 2000): Promise<AnalysisResult> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const status = await this.getAnalysisStatus(analysisId);
        
        if (status.status === 'completed') {
          return await this.getAnalysisResult(analysisId);
        } else if (status.status === 'failed') {
          throw new Error(status.error || 'Analysis failed');
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, interval));
        attempts++;
      } catch (error) {
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
        attempts++;
      }
    }
    
    throw new Error('Analysis timed out');
  }
}

export const apiService = new ApiService(); 