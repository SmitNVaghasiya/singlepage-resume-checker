import React from "react";
import { AnalysisResult } from "../../types";
import AnalysisCard from "./AnalysisCard";
import AnalysisLoading from "./AnalysisLoading";
import AnalysisWorkflow from "./AnalysisWorkflow";
import "./AnalysisDisplay.css";

interface AnalysisDisplayProps {
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  analysisProgress: number;
  currentStageIndex: number;
  onAnalyzeAnother: () => void;
  onViewDashboard: () => void;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({
  analysisResult,
  isAnalyzing,
  analysisProgress,
  currentStageIndex,
  onAnalyzeAnother,
  onViewDashboard,
}) => {
  // Define analysis stages for the loading component
  const analysisStages = [
    { id: 1, text: "Processing resume", completed: false },
    { id: 2, text: "Analyzing job requirements", completed: false },
    { id: 3, text: "Comparing skills and experience", completed: false },
    { id: 4, text: "Generating recommendations", completed: false },
    { id: 5, text: "Finalizing analysis", completed: false },
  ];

  if (isAnalyzing) {
    return (
      <AnalysisLoading
        analysisProgress={analysisProgress}
        currentStageIndex={currentStageIndex}
        analysisStages={analysisStages}
      />
    );
  }

  if (analysisResult) {
    return <AnalysisCard analysis={analysisResult} showFullDetails={true} />;
  }

  return <AnalysisWorkflow />;
};

export default AnalysisDisplay;
