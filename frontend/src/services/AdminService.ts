import { apiService } from './api';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  lastLogin?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  status: string;
  createdAt: string;
  analysisCount?: number;
}

export interface Analysis {
  id: string;
  userId: string;
  jobTitle?: string;
  industry?: string;
  status: string;
  overallScore?: number;
  createdAt: string;
  result?: any;
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  analyses: {
    total: number;
    completed: number;
    failed: number;
    successRate: number;
    averageScore: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  popularIndustries: Array<{ _id: string; count: number }>;
  popularJobTitles: Array<{ _id: string; count: number }>;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  uptime: number;
  memory: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
  };
  database: {
    status: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class AdminService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    // Normalize the base URL to prevent double slashes
    // Use the same environment variable pattern as main API service for consistency
    this.baseUrl = (import.meta.env.VITE_API_BASE_URL?.replace('/api', '/api/admin') || 'https://singlepage-resume-checker-backend.vercel.app/api/admin').replace(/\/+$/, '');
  }

  // Helper method to construct API URLs properly
  private getApiUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.replace(/^\/+/, ''); // Remove leading slashes
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  private getAuthToken(): string {
    if (!this.authToken) {
      this.authToken = localStorage.getItem('adminToken');
    }
    return this.authToken || '';
  }

  private setAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem('adminToken', token);
  }

  // Authentication
  async login(username: string, password: string): Promise<{ token: string; admin: any }> {
    const response = await fetch(this.getApiUrl('login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    this.setAuthToken(data.token);
    return data;
  }

  async getCurrentAdmin(): Promise<any> {
    const response = await fetch(this.getApiUrl('me'), {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get admin info');
    }

    const data = await response.json();
    return data.admin;
  }

  // User Management
  async getAllUsers(
    page: number = 1, 
    limit: number = 20, 
    search?: string, 
    status?: string
  ): Promise<{ data: User[]; pagination: any }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const response = await fetch(`${this.getApiUrl('users')}?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get users');
    }

    const data = await response.json();
    return data;
  }

  async getUserById(userId: string): Promise<User> {
    const response = await fetch(this.getApiUrl(`users/${userId}`), {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    const data = await response.json();
    return data.user;
  }

  async updateUserStatus(userId: string, status: string): Promise<void> {
    const response = await fetch(this.getApiUrl(`users/${userId}/status`), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to update user status');
    }
  }

  // Analytics and Statistics
  async getDashboardStats(
    timeRange?: string, 
    customDateRange?: { startDate: string; endDate: string }
  ): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (timeRange) params.append('timeRange', timeRange);
    if (customDateRange?.startDate) params.append('startDate', customDateRange.startDate);
    if (customDateRange?.endDate) params.append('endDate', customDateRange.endDate);

    const response = await fetch(`${this.getApiUrl('stats/dashboard')}?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get dashboard stats');
    }

    const data = await response.json();
    return data.stats;
  }

  async getAnalysesStats(
    page: number = 1, 
    limit: number = 20, 
    status?: string,
    timeRange?: string,
    customDateRange?: { startDate: string; endDate: string }
  ): Promise<{ data: Analysis[]; pagination: any }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (status) params.append('status', status);
    if (timeRange) params.append('timeRange', timeRange);
    if (customDateRange?.startDate) params.append('startDate', customDateRange.startDate);
    if (customDateRange?.endDate) params.append('endDate', customDateRange.endDate);

    const response = await fetch(`${this.getApiUrl('stats/analyses')}?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get analyses stats');
    }

    const data = await response.json();
    return data;
  }

  async getAnalysisById(analysisId: string): Promise<Analysis> {
    const response = await fetch(this.getApiUrl(`analyses/${analysisId}`), {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get analysis');
    }

    const data = await response.json();
    return data.analysis;
  }

  // Data Export
  async exportData(
    type: 'users' | 'analyses' | 'stats',
    format: string = 'csv',
    timeRange?: string,
    customDateRange?: { startDate: string; endDate: string }
  ): Promise<string> {
    const params = new URLSearchParams({
      type,
      format
    });

    if (timeRange) params.append('timeRange', timeRange);
    if (customDateRange?.startDate) params.append('startDate', customDateRange.startDate);
    if (customDateRange?.endDate) params.append('endDate', customDateRange.endDate);

    const response = await fetch(`${this.getApiUrl('export')}?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to export data');
    }

    return await response.text();
  }

  // Bulk Operations
  async bulkUpdateUsers(userIds: string[], action: string): Promise<void> {
    const response = await fetch(this.getApiUrl('users/bulk'), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userIds, action })
    });

    if (!response.ok) {
      throw new Error('Failed to perform bulk operation');
    }
  }

  // System Health
  async getSystemHealth(): Promise<any> {
      const response = await fetch(this.getApiUrl('health'), {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get system health');
    }

    const data = await response.json();
    return data.health;
  }

  // Logout
  logout(): void {
    this.authToken = null;
    localStorage.removeItem('adminToken');
  }
}

export const adminService = new AdminService();