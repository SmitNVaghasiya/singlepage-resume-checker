import mongoose, { Document, Schema } from 'mongoose';

// Enhanced interfaces for comprehensive analysis
export interface IKeywordMatch {
  matched: string[];
  missing: string[];
  percentage: number;
  suggestions: string[];
}

export interface ISkillsAnalysis {
  technical: {
    required: string[];
    present: string[];
    missing: string[];
    recommendations: string[];
  };
  soft: {
    required: string[];
    present: string[];
    missing: string[];
    recommendations: string[];
  };
  industry: {
    required: string[];
    present: string[];
    missing: string[];
    recommendations: string[];
  };
}

export interface IExperienceAnalysis {
  yearsRequired: number;
  yearsFound: number;
  relevant: boolean;
  experienceGaps: string[];
  strengthAreas: string[];
  improvementAreas: string[];
}

export interface IResumeQualityAssessment {
  formatting: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  content: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  length: {
    score: number;
    wordCount: number;
    recommendations: string[];
  };
  structure: {
    score: number;
    missingSections: string[];
    suggestions: string[];
  };
}

export interface ICompetitiveAnalysis {
  positioningStrength: number;
  competitorComparison: string[];
  differentiators: string[];
  marketPosition: string;
  improvementImpact: string[];
}

export interface IImprovementPlan {
  immediate: {
    priority: 'high' | 'medium' | 'low';
    actions: string[];
    estimatedImpact: string;
  }[];
  shortTerm: {
    priority: 'high' | 'medium' | 'low';
    actions: string[];
    estimatedImpact: string;
  }[];
  longTerm: {
    priority: 'high' | 'medium' | 'low';
    actions: string[];
    estimatedImpact: string;
  }[];
}

export interface IDetailedFeedback {
  strengths: {
    category: string;
    points: string[];
    impact: string;
  }[];
  weaknesses: {
    category: string;
    points: string[];
    impact: string;
    solutions: string[];
  }[];
  quickWins: string[];
  industryInsights: string[];
}

export interface IAnalysisResult {
  overallScore: number;
  matchPercentage: number;
  jobTitle: string;
  industry: string;
  keywordMatch: IKeywordMatch;
  skillsAnalysis: ISkillsAnalysis;
  experienceAnalysis: IExperienceAnalysis;
  resumeQuality: IResumeQualityAssessment;
  competitiveAnalysis: ICompetitiveAnalysis;
  detailedFeedback: IDetailedFeedback;
  improvementPlan: IImprovementPlan;
  overallRecommendation: string;
  aiInsights: string[];
  candidateStrengths: string[];
  developmentAreas: string[];
  confidence: number;
  processingTime?: number;
}

// Interface for the Analysis document
export interface IAnalysis extends Document {
  analysisId: string;
  resumeFilename: string;
  jobDescriptionFilename?: string;
  resumeText: string;
  jobDescriptionText?: string;
  result?: IAnalysisResult;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// MongoDB Schema
const keywordMatchSchema = new Schema({
  matched: [{ type: String }],
  missing: [{ type: String }],
  percentage: { type: Number, default: 0 },
  suggestions: [{ type: String }]
}, { _id: false });

const skillCategorySchema = new Schema({
  required: [{ type: String }],
  present: [{ type: String }],
  missing: [{ type: String }],
  recommendations: [{ type: String }]
}, { _id: false });

const skillsAnalysisSchema = new Schema({
  technical: skillCategorySchema,
  soft: skillCategorySchema,
  industry: skillCategorySchema
}, { _id: false });

const experienceAnalysisSchema = new Schema({
  yearsRequired: { type: Number, default: 0 },
  yearsFound: { type: Number, default: 0 },
  relevant: { type: Boolean, default: true },
  experienceGaps: [{ type: String }],
  strengthAreas: [{ type: String }],
  improvementAreas: [{ type: String }]
}, { _id: false });

const qualitySubsectionSchema = new Schema({
  score: { type: Number, default: 0 },
  issues: [{ type: String }],
  suggestions: [{ type: String }]
}, { _id: false });

const resumeQualitySchema = new Schema({
  formatting: qualitySubsectionSchema,
  content: qualitySubsectionSchema,
  length: {
    score: { type: Number, default: 0 },
    wordCount: { type: Number, default: 0 },
    recommendations: [{ type: String }]
  },
  structure: {
    score: { type: Number, default: 0 },
    missingSections: [{ type: String }],
    suggestions: [{ type: String }]
  }
}, { _id: false });

const competitiveAnalysisSchema = new Schema({
  positioningStrength: { type: Number, default: 0 },
  competitorComparison: [{ type: String }],
  differentiators: [{ type: String }],
  marketPosition: { type: String, default: '' },
  improvementImpact: [{ type: String }]
}, { _id: false });

const improvementItemSchema = new Schema({
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  actions: [{ type: String }],
  estimatedImpact: { type: String, default: '' }
}, { _id: false });

const improvementPlanSchema = new Schema({
  immediate: [improvementItemSchema],
  shortTerm: [improvementItemSchema],
  longTerm: [improvementItemSchema]
}, { _id: false });

const feedbackStrengthSchema = new Schema({
  category: { type: String, required: true },
  points: [{ type: String }],
  impact: { type: String, default: '' }
}, { _id: false });

const feedbackWeaknessSchema = new Schema({
  category: { type: String, required: true },
  points: [{ type: String }],
  impact: { type: String, default: '' },
  solutions: [{ type: String }]
}, { _id: false });

const detailedFeedbackSchema = new Schema({
  strengths: [feedbackStrengthSchema],
  weaknesses: [feedbackWeaknessSchema],
  quickWins: [{ type: String }],
  industryInsights: [{ type: String }]
}, { _id: false });

const analysisResultSchema = new Schema({
  overallScore: { type: Number, required: true, min: 0, max: 100 },
  matchPercentage: { type: Number, required: true, min: 0, max: 100 },
  jobTitle: { type: String, required: true },
  industry: { type: String, required: true },
  keywordMatch: keywordMatchSchema,
  skillsAnalysis: skillsAnalysisSchema,
  experienceAnalysis: experienceAnalysisSchema,
  resumeQuality: resumeQualitySchema,
  competitiveAnalysis: competitiveAnalysisSchema,
  detailedFeedback: detailedFeedbackSchema,
  improvementPlan: improvementPlanSchema,
  overallRecommendation: { type: String, default: '' },
  aiInsights: [{ type: String }],
  candidateStrengths: [{ type: String }],
  developmentAreas: [{ type: String }],
  confidence: { type: Number, default: 85, min: 0, max: 100 },
  processingTime: { type: Number }
}, { _id: false });

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
    type: analysisResultSchema,
    required: false
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
  timestamps: true,
  collection: 'analyses'
});

// Create indexes for better query performance
analysisSchema.index({ createdAt: -1 });
analysisSchema.index({ status: 1 });
analysisSchema.index({ 'result.overallScore': -1 });
analysisSchema.index({ 'result.industry': 1 });
analysisSchema.index({ 'result.jobTitle': 1 });

// Export the model
export const Analysis = mongoose.model<IAnalysis>('Analysis', analysisSchema); 