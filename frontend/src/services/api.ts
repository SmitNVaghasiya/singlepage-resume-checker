import { 
  AnalysisRequest, 
  AnalysisResponse, 
  AnalysisResult, 
  AnalysisStatus,
  AnalysisHistoryItem 
} from '../types';
import { config } from '../utils/config';

const API_BASE_URL = config.api.baseUrl;

export interface User {
  id: string;
  username: string;
  fullName?: string;
  email: string;
  location?: string;
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
  user?: User;
  admin?: {
    id: string;
    username: string;
    email: string;
    fullName: string;
  };
  token: string;
  isAdmin?: boolean;
  message?: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface UpdateProfileRequest {
  username: string;
  fullName?: string;
  email: string;
  location?: string;
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

export interface ExportReportRequest {
  userEmail: string;
  userName: string;
  format: 'pdf' | 'docx' | 'html';
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // Normalize the base URL to prevent double slashes
    this.baseUrl = API_BASE_URL.replace(/\/+$/, ''); // Remove trailing slashes
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Helper method to construct API URLs properly
  private getApiUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.replace(/^\/+/, ''); // Remove leading slashes
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(this.getApiUrl('auth/login'), {
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
    const response = await fetch(this.getApiUrl('auth/register'), {
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
      await fetch(this.getApiUrl('auth/logout'), {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } finally {
      localStorage.removeItem('authToken');
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(this.getApiUrl('auth/me'), {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    const data = await response.json();
    return data.user; // Extract user from the response wrapper
  }

  async sendOtp(email: string): Promise<{ message: string }> {
    const response = await fetch(this.getApiUrl('auth/send-otp'), {
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
    const response = await fetch(this.getApiUrl('auth/profile'), {
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
    const response = await fetch(this.getApiUrl('auth/password'), {
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
    const response = await fetch(this.getApiUrl('auth/notifications'), {
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
    const response = await fetch(this.getApiUrl('auth/account'), {
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
    const response = await fetch(this.getApiUrl('auth/export'), {
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

    const response = await fetch(this.getApiUrl('resume/analyze'), {
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

    const data = await response.json();
    
    // Handle the new response format from backend
    if (data.analysisId) {
      return {
        analysisId: data.analysisId,
        status: data.status || 'processing',
        message: data.message || 'Analysis started successfully'
      };
    }
    
    return data;
  }

  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus> {
    const response = await fetch(this.getApiUrl(`resume/analysis/${analysisId}/status`), {
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
    const response = await fetch(this.getApiUrl(`resume/analysis/${analysisId}/result`), {
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

    const response = await fetch(`${this.getApiUrl('resume/history')}?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get analysis history');
    }

    return response.json();
  }

  async submitContactForm(formData: ContactFormData): Promise<{ message: string }> {
    const response = await fetch(this.getApiUrl('contact'), {
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

  async exportAnalysisReport(analysisId: string, exportData: ExportReportRequest): Promise<{ message: string }> {
    const response = await fetch(this.getApiUrl(`analyses/${analysisId}/export`), {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(exportData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to export analysis report');
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(this.getApiUrl('health'));
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return response.json();
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(this.getApiUrl('auth/forgot-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to send password reset email');
    }

    return response.json();
  }

  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
      const response = await fetch(this.getApiUrl('auth/reset-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getMyAnalyses(): Promise<any[]> {
    const response = await fetch(this.getApiUrl('resume/my-analyses'), {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch your analyses');
    }
    return response.json();
  }

  // Temporary file methods removed - frontend only approach
}

export const apiService = new ApiService(); 