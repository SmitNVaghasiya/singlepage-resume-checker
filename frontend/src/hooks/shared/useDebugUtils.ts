import { useEffect } from 'react';

type AnalysisStep = "upload" | "job-description" | "analyze";
type JobInputMethod = 'text' | 'file';

interface UseDebugUtilsProps {
  user: any;
  currentStep: string;
  resumeFile: File | null;
  jobFile: File | null;
  jobDescription: string;
  jobInputMethod: JobInputMethod;
  requiresAuth: boolean;
  startAnalysis: () => void;
  setCurrentStep: (step: AnalysisStep) => void;
}

export const useDebugUtils = (props: UseDebugUtilsProps) => {
  useEffect(() => {
    // Debug logging
    if (import.meta.env.MODE === 'development') {
      console.log('Debug State:', {
        user: !!props.user,
        currentStep: props.currentStep,
        hasResumeFile: !!props.resumeFile,
        hasJobFile: !!props.jobFile,
        jobDescriptionLength: props.jobDescription.length,
        jobInputMethod: props.jobInputMethod,
        requiresAuth: props.requiresAuth,
      });
    }
  }, [
    props.user,
    props.currentStep,
    props.resumeFile,
    props.jobFile,
    props.jobDescription,
    props.jobInputMethod,
    props.requiresAuth,
  ]);

  // Debug keyboard shortcuts (only in development)
  useEffect(() => {
    if (import.meta.env.MODE !== 'development') return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + A to start analysis
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        console.log('Debug: Starting analysis via keyboard shortcut');
        props.startAnalysis();
      }

      // Ctrl/Cmd + Shift + 1-3 to navigate steps
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && /^[1-3]$/.test(event.key)) {
        event.preventDefault();
        const stepMap: { [key: string]: AnalysisStep } = {
          '1': 'upload',
          '2': 'job-description',
          '3': 'analyze',
        };
        const step = stepMap[event.key];
        if (step) {
          console.log(`Debug: Navigating to step ${step} via keyboard shortcut`);
          props.setCurrentStep(step);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [props.startAnalysis, props.setCurrentStep]);
}; 