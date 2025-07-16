import { useState, useCallback } from 'react';
import { AnalysisResult } from '../../types';

export interface AnalysisStage {
  id: number;
  text: string;
  completed: boolean;
}

export const useAnalysisState = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const resetAnalysisState = useCallback(() => {
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    setCurrentStageIndex(0);
    setAnalysisResult(null);
  }, []);

  const handleAnalyzeAnother = useCallback(() => {
    resetAnalysisState();
  }, [resetAnalysisState]);

  return {
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
  };
}; 