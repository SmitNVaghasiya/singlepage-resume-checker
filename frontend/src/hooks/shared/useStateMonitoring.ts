import { useEffect, useRef } from 'react';

type JobInputMethod = 'text' | 'file';

interface UseStateMonitoringProps {
  user: any;
  currentStep: string;
  jobDescription: string;
  jobInputMethod: JobInputMethod;
  resumeFile: File | null;
  jobFile: File | null;
}

export const useStateMonitoring = (props: UseStateMonitoringProps) => {
  const prevStateRef = useRef<UseStateMonitoringProps>(props);

  useEffect(() => {
    const prevState = prevStateRef.current;
    const currentState = props;

    // Monitor significant state changes
    const changes: string[] = [];

    if (prevState.user !== currentState.user) {
      changes.push(`User: ${prevState.user ? 'Logged in' : 'Not logged in'} → ${currentState.user ? 'Logged in' : 'Not logged in'}`);
    }

    if (prevState.currentStep !== currentState.currentStep) {
      changes.push(`Step: ${prevState.currentStep} → ${currentState.currentStep}`);
    }

    if (prevState.resumeFile !== currentState.resumeFile) {
      changes.push(`Resume: ${prevState.resumeFile ? 'Uploaded' : 'None'} → ${currentState.resumeFile ? 'Uploaded' : 'None'}`);
    }

    if (prevState.jobFile !== currentState.jobFile) {
      changes.push(`Job File: ${prevState.jobFile ? 'Uploaded' : 'None'} → ${currentState.jobFile ? 'Uploaded' : 'None'}`);
    }

    if (prevState.jobInputMethod !== currentState.jobInputMethod) {
      changes.push(`Job Input: ${prevState.jobInputMethod} → ${currentState.jobInputMethod}`);
    }

    if (prevState.jobDescription !== currentState.jobDescription) {
      const prevLength = prevState.jobDescription.length;
      const currentLength = currentState.jobDescription.length;
      if (Math.abs(currentLength - prevLength) > 10) {
        changes.push(`Job Description: ${prevLength} chars → ${currentLength} chars`);
      }
    }

    // Log changes if any
    if (changes.length > 0 && import.meta.env.MODE === 'development') {
      console.log('State Changes:', changes);
    }

    // Update previous state
    prevStateRef.current = currentState;
  }, [props]);

  // Monitor for potential issues
  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      // Check for potential issues
      const issues: string[] = [];

      if (props.currentStep === 'job-description' && !props.resumeFile) {
        issues.push('Warning: On job-description step but no resume file');
      }

      if (props.currentStep === 'analyze' && !props.resumeFile) {
        issues.push('Warning: On analyze step but no resume file');
      }

      if (props.jobInputMethod === 'text' && props.jobDescription.trim().length < 50) {
        issues.push('Warning: Text job description is too short');
      }

      if (props.jobInputMethod === 'file' && !props.jobFile) {
        issues.push('Warning: File job input method but no job file');
      }

      if (issues.length > 0) {
        console.warn('State Issues:', issues);
      }
    }
  }, [props]);
}; 