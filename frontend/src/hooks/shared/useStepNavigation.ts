import { useCallback } from 'react';

type AnalysisStep = "upload" | "job-description" | "analyze";
type JobInputMethod = 'text' | 'file';

interface UseStepNavigationProps {
  user: any;
  isAuthLoading: boolean;
  resumeFile: File | null;
  jobDescription: string;
  jobFile: File | null;
  jobInputMethod: JobInputMethod;
  currentStep: string;
  setCurrentStep: (step: AnalysisStep) => void;
}

export const useStepNavigation = (props: UseStepNavigationProps) => {
  const canProceedToAnalysis = useCallback(() => {
    const hasResume = props.resumeFile !== null;
    const hasJobDescription = props.jobInputMethod === "text"
      ? props.jobDescription.trim().length >= 50
      : props.jobFile !== null;

    return hasResume && hasJobDescription;
  }, [props.resumeFile, props.jobDescription, props.jobFile, props.jobInputMethod]);

  const canProceedToJobDescription = useCallback(() => {
    return props.resumeFile !== null;
  }, [props.resumeFile]);

  const goToNextStep = useCallback(() => {
    if (props.currentStep === "upload" && canProceedToJobDescription()) {
      props.setCurrentStep("job-description");
    } else if (props.currentStep === "job-description" && canProceedToAnalysis()) {
      props.setCurrentStep("analyze");
    }
  }, [props.currentStep, props.setCurrentStep, canProceedToJobDescription, canProceedToAnalysis]);

  return {
    canProceedToAnalysis,
    canProceedToJobDescription,
    goToNextStep,
  };
}; 