import React from "react";
import { AnalysisResult } from "../../types";
import {
  Loader2,
  CheckCircle,
  Circle,
  Upload,
  Brain,
  FileCheck,
  Sparkles,
} from "lucide-react";
import "./AnalysisLoading.css";

interface AnalysisStage {
  id: number;
  text: string;
  completed: boolean;
}

interface AnalysisLoadingProps {
  analysisProgress: number;
  currentStageIndex: number;
  analysisStages: AnalysisStage[];
}

const AnalysisLoading: React.FC<AnalysisLoadingProps> = ({
  analysisProgress,
  currentStageIndex,
  analysisStages,
}) => {
  const getStageIcon = (
    index: number,
    isCompleted: boolean,
    isActive: boolean
  ) => {
    if (isCompleted) {
      return <CheckCircle className="stage-icon completed" />;
    }

    if (isActive) {
      return <Loader2 className="stage-icon active" />;
    }

    // Return different icons for different stages
    const icons = [
      <Upload key="upload" className="stage-icon pending" />,
      <Brain key="brain" className="stage-icon pending" />,
      <FileCheck key="filecheck" className="stage-icon pending" />,
      <Sparkles key="sparkles" className="stage-icon pending" />,
      <CheckCircle key="final" className="stage-icon pending" />,
    ];

    return icons[index] || <Circle className="stage-icon pending" />;
  };

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Analyzing Your Resume</h2>
        <p>
          Please wait while we analyze your resume against the job description
        </p>
      </div>

      {/* Progress Section */}
      <div className="analysis-progress-section">
        <div className="progress-header">
          <span className="progress-label">Analysis Progress</span>
          <span className="progress-percentage">
            {Math.round(analysisProgress)}%
          </span>
        </div>

        <div className="progress-bar-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${analysisProgress}%` }}
            />
            <div className="progress-glow" />
          </div>
        </div>
      </div>

      {/* Stages Section */}
      <div className="analysis-stages-section">
        <div className="analysis-stages">
          {analysisStages.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isActive = index === currentStageIndex;
            const isPending = index > currentStageIndex;

            return (
              <div
                key={stage.id}
                className={`analysis-stage ${isCompleted ? "completed" : ""} ${
                  isActive ? "active" : ""
                } ${isPending ? "pending" : ""}`}
              >
                <div className="stage-icon-container">
                  {getStageIcon(index, isCompleted, isActive)}
                </div>

                <div className="stage-content">
                  <div className="stage-text">{stage.text}</div>
                  {isActive && (
                    <div className="stage-status">
                      <span className="status-dot" />
                      <span className="status-text">In progress...</span>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="stage-status">
                      <span className="status-text completed">Completed</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading Animation */}
      <div className="loading-animation">
        <div className="loading-dots">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
      </div>
    </div>
  );
};

export default AnalysisLoading;
