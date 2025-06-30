import { 
  AnalysisRequest, 
  AnalysisResponse, 
  AnalysisResult, 
  AnalysisStatus,
  AnalysisHistoryItem 
} from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
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

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface UpdateProfileRequest {
  username: string;
  email: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface NotificationSettings {
  analysisNotifications: boolean;
  accountActivityNotifications: boolean;
  marketingEmails: boolean;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    return data;
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }

    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    return data;
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } finally {
      localStorage.removeItem('authToken');
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    const data = await response.json();
    return data.user; // Extract user from the response wrapper
  }

  async sendOtp(email: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to send OTP');
    }

    return response.json();
  }

  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update profile');
    }

    const data = await response.json();
    return data.user;
  }

  async updatePassword(passwordData: UpdatePasswordRequest): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/auth/password`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update password');
    }

    return response.json();
  }

  async updateNotificationSettings(settings: NotificationSettings): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/auth/notifications`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update notification settings');
    }

    return response.json();
  }

  async deleteAccount(): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/auth/account`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete account');
    }

    return response.json();
  }

  async exportUserData(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auth/export`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to export user data');
    }

    return response.json();
  }

  async analyzeResume(request: AnalysisRequest): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('resume', request.resumeFile);
    
    if (request.jobDescriptionFile) {
      formData.append('jobDescription', request.jobDescriptionFile);
    } else if (request.jobDescriptionText) {
      formData.append('jobDescriptionText', request.jobDescriptionText);
    }

    const response = await fetch(`${this.baseUrl}/resume/analyze`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(localStorage.getItem('authToken') && { 
          Authorization: `Bearer ${localStorage.getItem('authToken')}` 
        }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus> {
    const response = await fetch(`${this.baseUrl}/resume/status/${analysisId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get analysis status');
    }

    return response.json();
  }

  async getAnalysisResult(analysisId: string): Promise<{ 
    analysisId: string; 
    status: string; 
    result: AnalysisResult 
  }> {
    const response = await fetch(`${this.baseUrl}/resume/result/${analysisId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get analysis result');
    }

    return response.json();
  }

  // Poll for analysis completion (for backward compatibility)
  async pollForResult(analysisId: string, maxAttempts: number = 30, interval: number = 2000): Promise<AnalysisResult> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const status = await this.getAnalysisStatus(analysisId);
        
        if (status.status === 'completed') {
          const resultResponse = await this.getAnalysisResult(analysisId);
          return resultResponse.result;
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

  async getAnalysisHistory(
    page: number = 1, 
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    analyses: AnalysisHistoryItem[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder,
    });

    const response = await fetch(`${this.baseUrl}/resume/history?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get analysis history');
    }

    return response.json();
  }

  async submitContactForm(formData: ContactFormData): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to submit contact form');
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return response.json();
  }
}

export const apiService = new ApiService(); 