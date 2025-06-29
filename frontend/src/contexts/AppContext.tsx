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
        } catch (error) {
          console.warn('Failed to get current user:', error);
          localStorage.removeItem('authToken');
        }
      }
      setIsAuthLoading(false);
    };

    checkAuth();
  }, []);

  const addAnalysisToHistory = (analysis: AnalysisResult) => {
    setCurrentAnalysis(analysis);
    setAnalysisHistory((prev) => [analysis, ...prev]);
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