// Enhanced Analysis Result Types for comprehensive resume analysis

// New comprehensive analysis result structure matching the sample response
export interface CandidateInformation {
  name: string;
  position_applied: string;
  experience_level: string;
  current_status: string;
}

export interface StrengthsAnalysis {
  technical_skills: string[];
  project_portfolio: string[];
  educational_background: string[];
}

export interface WeaknessesAnalysis {
  critical_gaps_against_job_description: string[];
  technical_deficiencies: string[];
  resume_presentation_issues: string[];
  soft_skills_gaps: string[];
  missing_essential_elements: {
    [key: string]: string;
  };
}

export interface SectionFeedback {
  current_state: string;
  strengths: string[];
  improvements: string[];
}

export interface SectionWiseDetailedFeedback {
  contact_information: SectionFeedback;
  profile_summary: SectionFeedback;
  education: SectionFeedback;
  skills: SectionFeedback;
  projects: SectionFeedback;
  missing_sections: {
    certifications?: string;
    experience?: string;
    achievements?: string;
    soft_skills?: string;
  };
}

export interface ImprovementRecommendations {
  immediate_resume_additions: string[];
  immediate_priority_actions: string[];
  short_term_development_goals: string[];
  medium_term_objectives: string[];
}

export interface SoftSkillsEnhancementSuggestions {
  communication_skills: string[];
  teamwork_and_collaboration: string[];
  leadership_and_initiative: string[];
  problem_solving_approach: string[];
}

export interface FinalAssessment {
  eligibility_status: string;
  hiring_recommendation: string;
  key_interview_areas: string[];
  onboarding_requirements: string[];
  long_term_potential: string;
}

export interface ResumeAnalysisReport {
  candidate_information: CandidateInformation;
  strengths_analysis: StrengthsAnalysis;
  weaknesses_analysis: WeaknessesAnalysis;
  section_wise_detailed_feedback: SectionWiseDetailedFeedback;
  improvement_recommendations: ImprovementRecommendations;
  soft_skills_enhancement_suggestions: SoftSkillsEnhancementSuggestions;
  final_assessment: FinalAssessment;
}

export interface AnalysisResult {
  // Basic analysis fields
  job_description_validity: string;
  jobDescriptionFilename?: string;
  resume_eligibility: string;
  score_out_of_100: number;
  short_conclusion: string;
  chance_of_selection_percentage: number;
  resume_improvement_priority: string[];
  overall_fit_summary: string;
  
  // Detailed analysis report
  resume_analysis_report: ResumeAnalysisReport;
  
  // Metadata for compatibility with existing frontend
  id?: string;
  analysisId?: string;
  resumeFilename?: string;
  // jobDescriptionFilename?: string; // Removed duplicate
  jobTitle?: string;  // Removed duplicate
  industry?: string;
  analyzedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  processingTime?: number;
  
  // Legacy compatibility fields (these will map to the new structure)
  overallScore?: number; // maps to score_out_of_100
  matchPercentage?: number; // maps to chance_of_selection_percentage
  overallRecommendation?: string; // maps to short_conclusion
  candidateStrengths?: string[]; // maps to various strengths
  developmentAreas?: string[]; // maps to various weaknesses
}

// Legacy types for backward compatibility
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
  jobDescriptionFilename?: string;
  jobTitle: string;
  overallScore: number;
  score_out_of_100?: number;
  chance_of_selection_percentage?: number;
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