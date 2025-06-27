import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnalysisResult } from '../types';

type AnalysisStep = 'upload' | 'job-description' | 'analyze';

interface AppContextType {
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
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  
  // Single page analysis state
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobFile, setJobFile] = useState<File | null>(null);

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

  const value: AppContextType = {
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
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 