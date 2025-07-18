import { useAppContext } from "../../contexts/AppContext";
import { useAnalysisState, useAnalysisService } from "../analysis";
import { useStepNavigation, useDebugUtils, useStateMonitoring } from "../shared";
import { useFileReconstruction } from "./useFileReconstruction";
import { useNavigate } from "react-router-dom";

// Import the AnalysisStep type from AppContext
type AnalysisStep = "upload" | "job-description" | "analyze";

export const useResumeChecker = () => {
  const navigate = useNavigate();
  
  const {
    user,
    currentStep,
    setCurrentStep,
    resumeFile,
    setResumeFile,
    jobDescription,
    setJobDescription,
    jobFile,
    setJobFile,
    jobInputMethod,
    setJobInputMethod,
    addAnalysisToHistory,
    resetAnalysis,
    requiresAuth,
    setRequiresAuth,
    isAuthLoading,
  } = useAppContext();

  // Analysis state management
  const {
    isAnalyzing,
    analysisProgress,
    currentStageIndex,
    analysisResult,
    setIsAnalyzing,
    setAnalysisProgress,
    setCurrentStageIndex,
    setAnalysisResult,
    resetAnalysisState,
    handleAnalyzeAnother,
  } = useAnalysisState();

  // File reconstruction from homepage
  useFileReconstruction({
    resumeFile,
    setResumeFile,
    setCurrentStep: (step: AnalysisStep) => setCurrentStep(step),
  });

  // Analysis service setup
  const { analysisService, startAnalysis } = useAnalysisService({
    user,
    resumeFile,
    jobDescription,
    jobFile,
    jobInputMethod,
    currentStep,
    setRequiresAuth,
    setAnalysisResult,
    addAnalysisToHistory,
    setIsAnalyzing,
    setAnalysisProgress,
    setCurrentStageIndex,
    setCurrentStep: (step: string) => setCurrentStep(step as AnalysisStep),
  });

  // Step navigation logic
  const { canProceedToAnalysis } = useStepNavigation({
    user,
    isAuthLoading,
    resumeFile,
    jobDescription,
    jobFile,
    jobInputMethod,
    currentStep,
    setCurrentStep: (step: string) => setCurrentStep(step as AnalysisStep),
  });

  // Debug utilities
  useDebugUtils({
    user,
    currentStep,
    resumeFile,
    jobFile,
    jobDescription,
    jobInputMethod,
    requiresAuth,
    startAnalysis,
    setCurrentStep: (step: string) => setCurrentStep(step as AnalysisStep),
  });

  // State monitoring
  useStateMonitoring({
    user,
    currentStep,
    jobDescription,
    jobInputMethod,
    resumeFile,
    jobFile,
  });

  const handleViewDashboard = () => {
    navigate("/dashboard");
  };

  return {
    // Context state
    user,
    currentStep,
    setCurrentStep,
    resumeFile,
    setResumeFile,
    jobDescription,
    setJobDescription,
    jobFile,
    setJobFile,
    jobInputMethod,
    setJobInputMethod,
    requiresAuth,
    isAuthLoading,
    
    // Analysis state
    isAnalyzing,
    analysisProgress,
    currentStageIndex,
    analysisResult,
    
    // Analysis service
    analysisService,
    startAnalysis,
    
    // Step navigation
    canProceedToAnalysis,
    
    // Actions
    handleAnalyzeAnother,
    handleViewDashboard,
    resetAnalysisState,
    resetAnalysis, // Add this missing return
  };
}; 