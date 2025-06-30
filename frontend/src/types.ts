// Enhanced Analysis Result Types for comprehensive resume analysis
export interface KeywordMatch {
  matched: string[];
  missing: string[];
  percentage: number;
  suggestions: string[];
}

export interface SkillsAnalysis {
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

export interface ExperienceAnalysis {
  yearsRequired: number;
  yearsFound: number;
  relevant: boolean;
  experienceGaps: string[];
  strengthAreas: string[];
  improvementAreas: string[];
}

export interface ResumeQualityAssessment {
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

export interface CompetitiveAnalysis {
  positioningStrength: number;
  competitorComparison: string[];
  differentiators: string[];
  marketPosition: string;
  improvementImpact: string[];
}

export interface ImprovementPlan {
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

export interface DetailedFeedback {
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

export interface AnalysisResult {
  id: string;
  analysisId: string;
  overallScore: number;
  matchPercentage: number;
  
  // File Information
  resumeFilename: string;
  jobDescriptionFilename?: string;
  jobTitle: string;
  industry: string;
  
  // Core Analysis
  keywordMatch: KeywordMatch;
  skillsAnalysis: SkillsAnalysis;
  experienceAnalysis: ExperienceAnalysis;
  resumeQuality: ResumeQualityAssessment;
  
  // Advanced Analysis
  competitiveAnalysis: CompetitiveAnalysis;
  detailedFeedback: DetailedFeedback;
  improvementPlan: ImprovementPlan;
  
  // AI Insights
  overallRecommendation: string;
  aiInsights: string[];
  candidateStrengths: string[];
  developmentAreas: string[];
  
  // Metadata
  analyzedAt: Date;
  processingTime?: number;
  confidence: number;
}

// API Request/Response Types
export interface AnalysisRequest {
  resumeFile: File;
  jobDescriptionFile?: File;
  jobDescriptionText?: string;
}

export interface AnalysisResponse {
  analysisId: string;
  status: 'processing' | 'completed' | 'failed';
  message: string;
  result?: AnalysisResult;
  error?: string;
  estimatedTime?: string;
}

export interface AnalysisStatus {
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  currentStage?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
}

// UI Component Types
export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface StepItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

export type JobInputMethod = 'text' | 'file';

export interface AnalysisStage {
  id: number;
  text: string;
  completed: boolean;
}

// Dashboard Types
export interface AnalysisHistoryItem {
  id: string;
  analysisId: string;
  resumeFilename: string;
  jobTitle: string;
  overallScore: number;
  analyzedAt: Date;
  status: 'completed' | 'processing' | 'failed';
}

// Filter and Sort Options
export interface AnalysisFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  scoreRange?: {
    min: number;
    max: number;
  };
  industry?: string[];
  status?: ('completed' | 'processing' | 'failed')[];
}

export interface SortOptions {
  field: 'analyzedAt' | 'overallScore' | 'resumeFilename' | 'jobTitle';
  direction: 'asc' | 'desc';
}