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
      // The backend returns { success: true, message: string, data: { feedbackId: string } }
      // apiService.post returns the entire response, so we need to access response.data
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
      // The backend returns { success: true, data: FeedbackResponse }
      // apiService.get returns the entire response, so we need to access response.data
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No feedback found - this is expected when user hasn't submitted feedback
      }
      // Only log non-404 errors
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
    } catch (error: any) {
      // Only log non-404 errors (404 is expected when no feedback exists)
      if (error.response?.status !== 404) {
        console.error('Error checking feedback status:', error);
      }
      return false;
    }
  }
} 