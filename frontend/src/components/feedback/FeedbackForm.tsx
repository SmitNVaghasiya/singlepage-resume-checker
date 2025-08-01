import React, { useState, useEffect } from "react";
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
} from "lucide-react";
import { FeedbackService, FeedbackData } from "../../services/FeedbackService";
import { useAppContext } from "../../contexts/AppContext";
import "./FeedbackForm.css";

interface FeedbackFormProps {
  analysisId: string;
  onFeedbackSubmitted?: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  analysisId,
  onFeedbackSubmitted,
}) => {
  const { user } = useAppContext();
  const [rating, setRating] = useState<number>(0);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string>("");
  const [category, setCategory] = useState<
    "general" | "accuracy" | "usefulness" | "interface" | "other"
  >("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if feedback has already been submitted when component loads
  useEffect(() => {
    const checkFeedbackStatus = async () => {
      if (!analysisId) {
        setIsLoading(false);
        return;
      }

      try {
        // Check localStorage first for immediate response
        const localStorageKey = `feedback_submitted_${analysisId}`;
        const storedFeedback = localStorage.getItem(localStorageKey);

        if (storedFeedback) {
          setHasSubmitted(true);
          setIsLoading(false);
          return;
        }

        // Only check backend if user is logged in
        if (user) {
          try {
            const hasFeedback = await FeedbackService.hasSubmittedFeedback(
              analysisId
            );
            if (hasFeedback) {
              setHasSubmitted(true);
              // Store in localStorage for future reference
              localStorage.setItem(localStorageKey, "true");
            }
          } catch (backendError) {
            console.error(
              "Error checking backend feedback status:",
              backendError
            );
            // If backend check fails, we'll still show the form
            // The user can try to submit again if needed
          }
        }
      } catch (error) {
        console.error("Error checking feedback status:", error);
        // Don't show error to user, just continue with form
      } finally {
        setIsLoading(false);
      }
    };

    checkFeedbackStatus();
  }, [user, analysisId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Please log in to submit feedback");
      return;
    }
    if (rating === 0 || helpful === null || !suggestions.trim()) {
      setError("Please fill in all required fields");
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
        category,
      };
      await FeedbackService.submitFeedback(feedbackData);
      setHasSubmitted(true);

      // Store in localStorage for persistence
      const localStorageKey = `feedback_submitted_${analysisId}`;
      localStorage.setItem(localStorageKey, "true");

      onFeedbackSubmitted?.();
    } catch (error: any) {
      console.error("Feedback submission error:", error);
      if (error.response?.status === 401) {
        setError("Please log in to submit feedback");
      } else if (error.response?.status === 409) {
        setError("You have already submitted feedback for this analysis");
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to submit feedback. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAgain = () => {
    setHasSubmitted(false);
    setRating(0);
    setHelpful(null);
    setSuggestions("");
    setCategory("general");
    setError(null);

    // Remove from localStorage when user wants to send again
    const localStorageKey = `feedback_submitted_${analysisId}`;
    localStorage.removeItem(localStorageKey);
  };

  // Clear localStorage when component unmounts if user is not logged in
  useEffect(() => {
    return () => {
      if (!user) {
        const localStorageKey = `feedback_submitted_${analysisId}`;
        localStorage.removeItem(localStorageKey);
      }
    };
  }, [user, analysisId]);

  const renderStars = () => (
    <div className="stars-container">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-button ${rating >= star ? "filled" : ""}`}
          onClick={() => setRating(star)}
          disabled={isSubmitting}
        >
          <Star size={20} />
        </button>
      ))}
      <span className="rating-text">
        {rating > 0
          ? `${rating} star${rating > 1 ? "s" : ""}`
          : "Rate your experience"}
      </span>
    </div>
  );

  const renderHelpfulButtons = () => (
    <div className="helpful-container">
      <span className="helpful-label">Was this analysis helpful?</span>
      <div className="helpful-buttons">
        <button
          type="button"
          className={`helpful-button ${helpful === true ? "selected" : ""}`}
          onClick={() => setHelpful(true)}
          disabled={isSubmitting}
        >
          <ThumbsUp size={16} />
          <span>Yes</span>
        </button>
        <button
          type="button"
          className={`helpful-button ${helpful === false ? "selected" : ""}`}
          onClick={() => setHelpful(false)}
          disabled={isSubmitting}
        >
          <ThumbsDown size={16} />
          <span>No</span>
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="feedback-container">
        <div className="feedback-loading">
          <div className="loading-spinner"></div>
          <p>Checking feedback status...</p>
        </div>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="feedback-container">
        <div className="feedback-submitted">
          <div className="success-header">
            <CheckCircle size={32} className="success-icon" />
            <h3>
              <span className="gradient-text">Thank you so much!</span>
              <span className="heart-emoji">💝</span>
            </h3>
          </div>
          <p>
            We're truly grateful for taking the time to help us improve our
            resume analysis service.
          </p>
          {!user && (
            <p className="login-reminder">
              <em>Please log in to submit additional feedback.</em>
            </p>
          )}
          {user && (
            <button onClick={handleSendAgain} className="send-again-btn">
              Send Another Feedback
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="feedback-container">
        <div className="feedback-login-required">
          <MessageSquare size={32} className="login-icon" />
          <h3>Login Required</h3>
          <p>
            Please log in to submit feedback and help us improve our resume
            analysis service.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <MessageSquare size={24} />
        <h3>Help us improve!</h3>
        <p>
          Every piece of feedback brings us one step closer to creating the
          perfect resume analysis experience.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="feedback-form">
        <div className="rating-helpful-section">
          <div className="rating-section">
            <label className="form-label">
              How would you rate this analysis?
            </label>
            {renderStars()}
          </div>
          <div className="helpful-section">{renderHelpfulButtons()}</div>
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
        {error && <div className="feedback-error">{error}</div>}
        <button
          type="submit"
          className="feedback-submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;
