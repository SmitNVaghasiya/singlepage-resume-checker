export interface AnalysisResult {
    id: string;
    score: number;
    remarks: string;
    improvements: string[];
    strengths: string[];
    matchPercentage: number;
    resumeName: string;
    jobTitle: string;
    analyzedAt: Date;
  }
  
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