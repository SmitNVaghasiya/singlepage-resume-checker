import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AnalysisResult } from '../types';
import { User, apiService } from '../services/api';

type AnalysisStep = 'upload' | 'job-description' | 'analyze';

interface AppContextType {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthLoading: boolean;
  
  // Analysis state
  analysisHistory: AnalysisResult[];
  currentAnalysis: AnalysisResult | null;
  
  // Step state
  currentStep: AnalysisStep;
  setCurrentStep: (step: AnalysisStep) => void;
  
  // File state
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  jobDescription: string;
  setJobDescription: (description: string) => void;
  jobFile: File | null;
  setJobFile: (file: File | null) => void;
  
  // Temporary file state
  tempFiles: {
    resume?: { tempId: string; filename: string; size: number; expiresAt: string };
    jobDescription?: { tempId: string; filename: string; size: number; expiresAt: string };
  };
  setTempFiles: (tempFiles: any) => void;
  
  // Actions
  addAnalysisToHistory: (analysis: AnalysisResult) => void;
  resetAnalysis: () => void;
  logout: () => void;
  requiresAuth: boolean;
  setRequiresAuth: (requires: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // User state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Analysis state
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  
  // Single page analysis state
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobFile, setJobFile] = useState<File | null>(null);

  // Temporary file state
  const [tempFiles, setTempFiles] = useState<{
    resume?: { tempId: string; filename: string; size: number; expiresAt: string };
    jobDescription?: { tempId: string; filename: string; size: number; expiresAt: string };
  }>({});
  const [requiresAuth, setRequiresAuth] = useState(false);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
          // Load analysis history after authentication
          await loadAnalysisHistory();
        } catch (error) {
          console.warn('Failed to get current user:', error);
          localStorage.removeItem('authToken');
        }
      } else {
        // Load analysis history even without authentication (for demo purposes)
        await loadAnalysisHistory();
      }
      setIsAuthLoading(false);
    };

    checkAuth();
  }, []);

  // Function to load analysis history
  const loadAnalysisHistory = async () => {
    try {
      const historyResponse = await apiService.getAnalysisHistory(1, 50); // Get recent analyses
      // Convert AnalysisHistoryItem to AnalysisResult format for compatibility
      const convertedHistory: AnalysisResult[] = historyResponse.analyses.map(item => {
        // Ensure date is properly handled
        let analyzedDate: Date;
        try {
          analyzedDate = new Date(item.analyzedAt);
          // Check if date is valid
          if (isNaN(analyzedDate.getTime())) {
            analyzedDate = new Date(); // Fallback to current date
          }
        } catch {
          analyzedDate = new Date(); // Fallback to current date
        }

        return {
          // Basic required fields
          job_description_validity: 'Valid',
          resume_eligibility: 'Eligible', 
          score_out_of_100: item.overallScore || 0,
          short_conclusion: 'Analysis completed successfully.',
          chance_of_selection_percentage: 0,
          resume_improvement_priority: [],
          overall_fit_summary: '',
          
          // Resume analysis report with minimal structure
          resume_analysis_report: {
            candidate_information: {
              name: 'Candidate',
              position_applied: item.jobTitle || 'Position Analysis',
              experience_level: 'Not specified',
              current_status: 'Analyzing'
            },
            strengths_analysis: {
              technical_skills: [],
              project_portfolio: [],
              educational_background: []
            },
            weaknesses_analysis: {
              critical_gaps_against_job_description: [],
              technical_deficiencies: [],
              resume_presentation_issues: [],
              soft_skills_gaps: [],
              missing_essential_elements: []
            },
            section_wise_detailed_feedback: {
              contact_information: { current_state: '', strengths: [], improvements: [] },
              profile_summary: { current_state: '', strengths: [], improvements: [] },
              education: { current_state: '', strengths: [], improvements: [] },
              skills: { current_state: '', strengths: [], improvements: [] },
              projects: { current_state: '', strengths: [], improvements: [] },
              missing_sections: {}
            },
            improvement_recommendations: {
              immediate_resume_additions: [],
              immediate_priority_actions: [],
              short_term_development_goals: [],
              medium_term_objectives: []
            },
            soft_skills_enhancement_suggestions: {
              communication_skills: [],
              teamwork_and_collaboration: [],
              leadership_and_initiative: [],
              problem_solving_approach: []
            },
            final_assessment: {
              eligibility_status: 'Qualified',
              hiring_recommendation: '',
              key_interview_areas: [],
              onboarding_requirements: [],
              long_term_potential: ''
            }
          },
          
          // Metadata
          id: item.id,
          analysisId: item.analysisId,
          resumeFilename: item.resumeFilename || 'Resume',
          jobTitle: item.jobTitle || 'Position Analysis',
          overallScore: item.overallScore || 0,
          matchPercentage: 0, // Will be loaded when viewing details
          industry: 'General', // Default value
          analyzedAt: analyzedDate,
          
          // Legacy compatibility fields
          keywordMatch: { matched: [], missing: [], percentage: 0, suggestions: [] },
          skillsAnalysis: {
            technical: { required: [], present: [], missing: [], recommendations: [] },
            soft: { required: [], present: [], missing: [], recommendations: [] },
            industry: { required: [], present: [], missing: [], recommendations: [] }
          },
          experienceAnalysis: {
            yearsRequired: 0,
            yearsFound: 0,
            relevant: true,
            experienceGaps: [],
            strengthAreas: [],
            improvementAreas: []
          },
          resumeQuality: {
            formatting: { score: 0, issues: [], suggestions: [] },
            content: { score: 0, issues: [], suggestions: [] },
            length: { score: 0, wordCount: 0, recommendations: [] },
            structure: { score: 0, missingSections: [], suggestions: [] }
          },
          competitiveAnalysis: {
            positioningStrength: 0,
            competitorComparison: [],
            differentiators: [],
            marketPosition: '',
            improvementImpact: []
          },
          detailedFeedback: {
            strengths: [],
            weaknesses: [],
            quickWins: [],
            industryInsights: []
          },
          improvementPlan: {
            immediate: [],
            shortTerm: [],
            longTerm: []
          },
          overallRecommendation: '',
          aiInsights: [],
          candidateStrengths: [],
          developmentAreas: [],
          confidence: 85
        };
      });
      
      setAnalysisHistory(convertedHistory);
    } catch (error) {
      console.warn('Failed to load analysis history:', error);
      // Don't throw error to avoid breaking the app
    }
  };

  const addAnalysisToHistory = (analysis: AnalysisResult) => {
    // Ensure the analysis has proper metadata
    const enrichedAnalysis: AnalysisResult = {
      ...analysis,
      // Ensure we have proper IDs
      id: analysis.id || analysis.analysisId || Date.now().toString(),
      analysisId: analysis.analysisId || analysis.id || Date.now().toString(),
      
      // Ensure we have a proper date
      analyzedAt: analysis.analyzedAt || new Date(),
      
      // Ensure we have proper scores mapped from new format to legacy
      overallScore: analysis.score_out_of_100 || analysis.overallScore || 0,
      matchPercentage: analysis.chance_of_selection_percentage || analysis.matchPercentage || 0,
      
      // Ensure we have job title - try multiple sources
      jobTitle: analysis.resume_analysis_report?.candidate_information?.position_applied || 
                analysis.jobTitle || 
                'Position Analysis',
      
      // Map other fields for compatibility
      overallRecommendation: analysis.short_conclusion || analysis.overallRecommendation || '',
      
      // Ensure candidate strengths are available
      candidateStrengths: analysis.resume_analysis_report?.strengths_analysis ? [
        ...analysis.resume_analysis_report.strengths_analysis.technical_skills,
        ...analysis.resume_analysis_report.strengths_analysis.project_portfolio,
        ...analysis.resume_analysis_report.strengths_analysis.educational_background
      ] : (analysis.candidateStrengths || []),
      
      // Ensure development areas are available
      developmentAreas: analysis.resume_improvement_priority || analysis.developmentAreas || []
    };

    setCurrentAnalysis(enrichedAnalysis);
    setAnalysisHistory((prev) => [enrichedAnalysis, ...prev]);
    
    // Also reload the full history to get the latest data
    loadAnalysisHistory().catch(console.warn);
  };

  const resetAnalysis = () => {
    setCurrentAnalysis(null);
    setCurrentStep('upload');
    setResumeFile(null);
    setJobDescription('');
    setJobFile(null);
    setTempFiles({});
    setRequiresAuth(false);
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    }
    setUser(null);
    resetAnalysis();
  };

  const value: AppContextType = {
    user,
    setUser,
    isAuthLoading,
    analysisHistory,
    currentAnalysis,
    currentStep,
    setCurrentStep,
    resumeFile,
    setResumeFile,
    jobDescription,
    setJobDescription,
    jobFile,
    setJobFile,
    addAnalysisToHistory,
    resetAnalysis,
    logout,
    tempFiles,
    setTempFiles,
    requiresAuth,
    setRequiresAuth,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 