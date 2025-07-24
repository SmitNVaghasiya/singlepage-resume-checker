import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  feedbackId: string;
  analysisId: string;
  userId?: string; // Optional for anonymous feedback
  rating: number; // 1-5 stars
  helpful: boolean; // Was the analysis helpful?
  suggestions: string; // User suggestions/feedback text
  category: 'general' | 'accuracy' | 'usefulness' | 'interface' | 'other';
  status: 'pending' | 'reviewed' | 'addressed' | 'closed';
  adminNotes?: string; // Admin notes about the feedback
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // Admin ID who reviewed it
}

const feedbackSchema = new Schema<IFeedback>({
  feedbackId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  analysisId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: false,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  helpful: {
    type: Boolean,
    required: true
  },
  suggestions: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['general', 'accuracy', 'usefulness', 'interface', 'other'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'addressed', 'closed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'feedbacks'
});

// Create indexes for better query performance
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ helpful: 1 });
feedbackSchema.index({ category: 1 });

// Export the model
export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema); 