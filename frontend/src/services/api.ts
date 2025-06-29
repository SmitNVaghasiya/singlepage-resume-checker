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

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  otp: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export interface ProfileUpdateRequest {
  userId: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
}

export interface PasswordUpdateRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface AnalysisHistoryItem {
  id: string;
  fileName: string;
  analysisType: string;
  score: number;
  createdAt: string;
  status: 'completed' | 'pending' | 'failed';
  jobDescription?: string;
  suggestions?: string[];
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
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

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async sendOtp(email: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async logout(): Promise<void> {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        // Ignore logout errors
        console.warn('Logout request failed:', error);
      }
    }
    localStorage.removeItem('authToken');
  }

  async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication expired');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Profile management methods
  async getUserProfile(userId: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/user/profile/${userId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async updateProfile(profileData: ProfileUpdateRequest): Promise<User> {
    const response = await fetch(`${this.baseUrl}/user/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async updatePassword(passwordData: PasswordUpdateRequest): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/user/password`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/user/account/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async exportUserData(userId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/user/export/${userId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Analysis history methods
  async getUserAnalysisHistory(userId: string): Promise<AnalysisHistoryItem[]> {
    const response = await fetch(`${this.baseUrl}/analysis/history/${userId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async deleteAnalysis(analysisId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/analysis/${analysisId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async downloadAnalysisReport(analysisId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/analysis/download/${analysisId}`, {
      headers: {
        ...(localStorage.getItem('authToken') && { 
          'Authorization': `Bearer ${localStorage.getItem('authToken')}` 
        }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  // Enhanced analysis method with user tracking
  async analyzeResumeWithUser(request: AnalysisRequest, userId?: string): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('resume', request.resumeFile);
    
    if (request.jobDescriptionFile) {
      formData.append('jobDescription', request.jobDescriptionFile);
    } else if (request.jobDescriptionText) {
      const textFile = new Blob([request.jobDescriptionText], { type: 'text/plain' });
      formData.append('jobDescription', textFile, 'job_description.txt');
    }

    if (userId) {
      formData.append('userId', userId);
    }

    const headers: HeadersInit = {};
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/resume/analyze`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService(); 