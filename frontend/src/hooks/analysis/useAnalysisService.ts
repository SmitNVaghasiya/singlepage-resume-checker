import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisService } from '../../services/AnalysisService';
import { AnalysisResult } from '../../types';

type JobInputMethod = 'text' | 'file';

interface UseAnalysisServiceProps {
  user: any;
  resumeFile: File | null;
  jobDescription: string;
  jobFile: File | null;
  jobInputMethod: JobInputMethod;
  currentStep: string;
  setRequiresAuth: (requires: boolean) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  addAnalysisToHistory: (result: AnalysisResult) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalysisProgress: (progress: number) => void;
  setCurrentStageIndex: (index: number) => void;
  setCurrentStep: (step: string) => void;
}

export const useAnalysisService = (props: UseAnalysisServiceProps) => {
  const navigate = useNavigate();

  const analysisService = useMemo(() => {
    return new AnalysisService({
      ...props,
      setShowAuthModal: () => {}, // No-op for this hook
      onAnalysisComplete: (analysisId: string) => {
        // Navigate to analysis details page with seamless transition
        navigate(`/dashboard/analysis/${analysisId}`);
      },
      onAuthRequired: () => {
        // Navigate to login page with redirect parameter
        navigate('/login?redirect=/resumechecker');
      },
      getLatestState: () => ({
        user: props.user,
        resumeFile: props.resumeFile,
        jobDescription: props.jobDescription,
        jobFile: props.jobFile,
        jobInputMethod: props.jobInputMethod,
        currentStep: props.currentStep,
      }),
    });
  }, [
    props.user,
    props.resumeFile,
    props.jobDescription,
    props.jobFile,
    props.jobInputMethod,
    props.currentStep,
    props.setRequiresAuth,
    props.setAnalysisResult,
    props.addAnalysisToHistory,
    props.setIsAnalyzing,
    props.setAnalysisProgress,
    props.setCurrentStageIndex,
    props.setCurrentStep,
    navigate,
  ]);

  const startAnalysis = useCallback(() => {
    analysisService.startAnalysis();
  }, [analysisService]);

  return {
    analysisService,
    startAnalysis,
  };
}; 