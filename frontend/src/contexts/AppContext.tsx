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
  
  // Actions
  addAnalysisToHistory: (analysis: AnalysisResult) => void;
  resetAnalysis: () => void;
  logout: () => void;
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
      const convertedHistory: AnalysisResult[] = historyResponse.analyses.map(item => ({
        id: item.id,
        analysisId: item.analysisId,
        resumeFilename: item.resumeFilename,
        jobTitle: item.jobTitle || 'Not specified',
        overallScore: item.overallScore,
        matchPercentage: 0, // Will be loaded when viewing details
        industry: 'General', // Default value
        analyzedAt: item.analyzedAt,
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
      }));
      
      setAnalysisHistory(convertedHistory);
    } catch (error) {
      console.warn('Failed to load analysis history:', error);
      // Don't throw error to avoid breaking the app
    }
  };

  const addAnalysisToHistory = (analysis: AnalysisResult) => {
    setCurrentAnalysis(analysis);
    setAnalysisHistory((prev) => [analysis, ...prev]);
    // Also reload the full history to get the latest data
    loadAnalysisHistory().catch(console.warn);
  };

  const resetAnalysis = () => {
    setCurrentAnalysis(null);
    setCurrentStep('upload');
    setResumeFile(null);
    setJobDescription('');
    setJobFile(null);
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
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 