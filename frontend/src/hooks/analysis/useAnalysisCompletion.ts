import { useCallback } from 'react';
import { AnalysisResult } from '../../types';

interface UseAnalysisCompletionProps {
  analysisResult: AnalysisResult | null;
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onAnalysisError?: (error: Error) => void;
}

export const useAnalysisCompletion = (props: UseAnalysisCompletionProps) => {
  const handleAnalysisComplete = useCallback((result: AnalysisResult) => {
    if (props.onAnalysisComplete) {
      props.onAnalysisComplete(result);
    }
  }, [props.onAnalysisComplete]);

  const handleAnalysisError = useCallback((error: Error) => {
    if (props.onAnalysisError) {
      props.onAnalysisError(error);
    }
  }, [props.onAnalysisError]);

  const isAnalysisComplete = useCallback(() => {
    return props.analysisResult !== null;
  }, [props.analysisResult]);

  return {
    handleAnalysisComplete,
    handleAnalysisError,
    isAnalysisComplete,
  };
}; 