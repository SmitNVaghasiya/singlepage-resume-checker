import { Request } from 'express';
import { IAdmin } from './Admin';

// Admin request interface
export interface AdminRequest extends Request {
  admin?: IAdmin & { _id: string };
}

// Admin login request
export interface AdminLoginRequest {
  username: string;
  password: string;
}

// Admin login response
export interface AdminLoginResponse {
  success: boolean;
  message: string;
  token?: string;
  admin?: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    permissions: string[];
    lastLogin?: Date;
  };
}

// Admin dashboard stats
export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    new24h: number;
    new7d: number;
    new30d: number;
    growthRate: string;
  };
  analyses: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    last24h: number;
    last7d: number;
    successRate: number;
    avgTimeMs: number;
  };
  feedback: {
    total: number;
    positive: number;
    negative: number;
    avgRating: number;
    satisfactionRate: number;
  };
  system: {
    auditLogs: number;
    notifications: number;
    unreadNotifications: number;
    uptime: number;
  };
  trends: {
    userGrowth: any[];
    analysisTrend: any[];
    performanceTrend: any[];
  };
}

// User management filters
export interface UserFilters {
  search?: string;
  status?: 'active' | 'inactive';
  role?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Pagination options
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Export options
export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  filters?: any;
  fields?: string[];
} 