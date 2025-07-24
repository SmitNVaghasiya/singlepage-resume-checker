import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Send, CheckCircle } from 'lucide-react';
import { FeedbackService, FeedbackData } from '../../services/FeedbackService';
import './FeedbackForm.css';

interface FeedbackFormProps {
  analysisId: string;
  onFeedbackSubmitted?: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ analysisId, onFeedbackSubmitted }) => {
  const [rating, setRating] = useState<number>(0);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string>('');
  const [category, setCategory] = useState<'general' | 'accuracy' | 'usefulness' | 'interface' | 'other'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkExistingFeedback();
  }, [analysisId]);

  const checkExistingFeedback = async () => {
    try {
      const hasFeedback = await FeedbackService.hasSubmittedFeedback(analysisId);
      setHasSubmitted(hasFeedback);
    } catch (error) {
      console.error('Error checking feedback status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0 || helpful === null || !suggestions.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const feedbackData: FeedbackData = {
        analysisId,
        rating,
        helpful,
        suggestions: suggestions.trim(),
        category
      };

      await FeedbackService.submitFeedback(feedbackData);
      setHasSubmitted(true);
      onFeedbackSubmitted?.();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-button ${rating >= star ? 'filled' : ''}`}
            onClick={() => setRating(star)}
            disabled={isSubmitting}
          >
            <Star size={24} />
          </button>
        ))}
        <span className="rating-text">
          {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Rate your experience'}
        </span>
      </div>
    );
  };

  const renderHelpfulButtons = () => {
    return (
      <div className="helpful-container">
        <span className="helpful-label">Was this analysis helpful?</span>
        <div className="helpful-buttons">
          <button
            type="button"
            className={`helpful-button ${helpful === true ? 'selected' : ''}`}
            onClick={() => setHelpful(true)}
            disabled={isSubmitting}
          >
            <ThumbsUp size={20} />
            <span>Yes</span>
          </button>
          <button
            type="button"
            className={`helpful-button ${helpful === false ? 'selected' : ''}`}
            onClick={() => setHelpful(false)}
            disabled={isSubmitting}
          >
            <ThumbsDown size={20} />
            <span>No</span>
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="feedback-container">
        <div className="feedback-loading">
          <div className="loading-spinner"></div>
          <p>Loading feedback form...</p>
        </div>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="feedback-container">
        <div className="feedback-submitted">
          <CheckCircle size={48} className="success-icon" />
          <h3>Thank you for your feedback!</h3>
          <p>Your feedback has been submitted successfully. We appreciate your input to help us improve our service.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <MessageSquare size={24} />
        <h3>Help us improve!</h3>
        <p>Your feedback helps us make our resume analysis better for everyone.</p>
      </div>

      <form onSubmit={handleSubmit} className="feedback-form">
        <div className="form-section">
          <label className="form-label">How would you rate this analysis?</label>
          {renderStars()}
        </div>

        <div className="form-section">
          {renderHelpfulButtons()}
        </div>

        <div className="form-section">
          <label className="form-label">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="form-select"
            disabled={isSubmitting}
          >
            <option value="general">General Feedback</option>
            <option value="accuracy">Analysis Accuracy</option>
            <option value="usefulness">Usefulness of Recommendations</option>
            <option value="interface">User Interface</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-section">
          <label className="form-label">
            Suggestions or comments <span className="required">*</span>
          </label>
          <textarea
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            placeholder="Tell us what you think about the analysis, what we can improve, or any suggestions you have..."
            className="form-textarea"
            rows={4}
            maxLength={1000}
            disabled={isSubmitting}
            required
          />
          <div className="character-count">
            {suggestions.length}/1000 characters
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="submit-button"
          disabled={isSubmitting || rating === 0 || helpful === null || !suggestions.trim()}
        >
          {isSubmitting ? (
            <>
              <div className="loading-spinner-small"></div>
              Submitting...
            </>
          ) : (
            <>
              <Send size={20} />
              Submit Feedback
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm; 