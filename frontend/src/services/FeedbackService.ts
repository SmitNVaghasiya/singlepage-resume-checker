import { apiService } from './api';

export interface FeedbackData {
  analysisId: string;
  rating: number;
  helpful: boolean;
  suggestions: string;
  category?: 'general' | 'accuracy' | 'usefulness' | 'interface' | 'other';
}

export interface FeedbackResponse {
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
}

export class FeedbackService {
  /**
   * Submit feedback for an analysis
   */
  static async submitFeedback(feedbackData: FeedbackData): Promise<{ feedbackId: string }> {
    try {
      const response = await apiService.post('/feedback/submit', feedbackData);
      return response.data;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback for a specific analysis
   */
  static async getFeedbackByAnalysis(analysisId: string): Promise<FeedbackResponse | null> {
    try {
      const response = await apiService.get(`/feedback/analysis/${analysisId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No feedback found
      }
      console.error('Error getting feedback:', error);
      throw error;
    }
  }

  /**
   * Check if user has already submitted feedback for an analysis
   */
  static async hasSubmittedFeedback(analysisId: string): Promise<boolean> {
    try {
      const feedback = await this.getFeedbackByAnalysis(analysisId);
      return feedback !== null;
    } catch (error) {
      console.error('Error checking feedback status:', error);
      return false;
    }
  }
} 