import mongoose, { Document, Schema } from 'mongoose';

// Interface for the Analysis document
export interface IAnalysis extends Document {
  analysisId: string;
  resumeFilename: string;
  jobDescriptionFilename?: string;
  resumeText: string;
  jobDescriptionText?: string;
  result: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    keywordMatch: {
      matched: string[];
      missing: string[];
      percentage: number;
    };
    skillsAnalysis: {
      required: string[];
      present: string[];
      missing: string[];
    };
    experienceAnalysis: {
      yearsRequired: number;
      yearsFound: number;
      relevant: boolean;
    };
    overallRecommendation: string;
  };
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// MongoDB Schema
const analysisSchema = new Schema<IAnalysis>({
  analysisId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  resumeFilename: {
    type: String,
    required: true
  },
  jobDescriptionFilename: {
    type: String,
    required: false
  },
  resumeText: {
    type: String,
    required: true
  },
  jobDescriptionText: {
    type: String,
    required: false
  },
  result: {
    score: { type: Number, required: false },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    suggestions: [{ type: String }],
    keywordMatch: {
      matched: [{ type: String }],
      missing: [{ type: String }],
      percentage: { type: Number, default: 0 }
    },
    skillsAnalysis: {
      required: [{ type: String }],
      present: [{ type: String }],
      missing: [{ type: String }]
    },
    experienceAnalysis: {
      yearsRequired: { type: Number, default: 0 },
      yearsFound: { type: Number, default: 0 },
      relevant: { type: Boolean, default: true }
    },
    overallRecommendation: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  error: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  collection: 'analyses' // Specify collection name
});

// Create indexes for better query performance
analysisSchema.index({ createdAt: -1 });
analysisSchema.index({ status: 1 });
analysisSchema.index({ 'result.score': -1 });

// Export the model
export const Analysis = mongoose.model<IAnalysis>('Analysis', analysisSchema); 