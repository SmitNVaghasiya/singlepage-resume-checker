import { apiService } from './api';

export interface AdminFeedbackData {
  feedbackId: string;
  analysisId: string;
  userId?: string;
  rating: number;
  helpful: boolean;
  suggestions: string;
  category: string;
  status: 'pending' | 'reviewed' | 'addressed' | 'closed';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  analysis?: {
    resumeFilename: string;
    jobDescriptionFilename?: string;
    jobTitle?: string;
    industry?: string;
    createdAt: Date;
  };
}

export interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  helpfulPercentage: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  pending: number;
  reviewed: number;
  statusBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  ratingDistribution: Record<string, number>;
}

export interface FeedbackFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  rating?: number;
  helpful?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface FeedbackPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export class AdminFeedbackService {
  /**
   * Get all feedback with pagination and filters
   */
  static async getAllFeedback(filters: FeedbackFilters = {}): Promise<{
    data: AdminFeedbackData[];
    pagination: FeedbackPagination;
  }> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await apiService.get(`/feedback/admin/all?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error getting all feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback statistics
   */
  static async getFeedbackStats(startDate?: string, endDate?: string): Promise<FeedbackStats> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiService.get(`/feedback/admin/stats?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      throw error;
    }
  }

  /**
   * Get feedback by ID
   */
  static async getFeedbackById(feedbackId: string): Promise<AdminFeedbackData> {
    try {
      const response = await apiService.get(`/feedback/admin/${feedbackId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting feedback by ID:', error);
      throw error;
    }
  }

  /**
   * Update feedback status and notes
   */
  static async updateFeedback(
    feedbackId: string, 
    updates: { status?: string; adminNotes?: string }
  ): Promise<AdminFeedbackData> {
    try {
      const response = await apiService.put(`/feedback/admin/${feedbackId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  }

  /**
   * Export feedback data as CSV
   */
  static async exportFeedback(filters: FeedbackFilters = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await apiService.get(`/feedback/admin/export?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting feedback:', error);
      throw error;
    }
  }
} 