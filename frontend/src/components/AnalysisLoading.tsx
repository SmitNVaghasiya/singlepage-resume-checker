import React from 'react';
import { AnalysisResult } from '../types';
import '../styles/components/AnalysisLoading.css';

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
  analysisStages
}) => {
  return (
    <div className="analysis-loading">
      <div className="loading-header">
        <h2>Analyzing Your Resume</h2>
        <p>Please wait while we analyze your resume against the job description</p>
      </div>

      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${analysisProgress}%` }}
          ></div>
        </div>
        <div className="progress-text">{Math.round(analysisProgress)}%</div>
      </div>

      <div className="analysis-stages">
        {analysisStages.map((stage, index) => (
          <div 
            key={stage.id}
            className={`stage ${index <= currentStageIndex ? 'active' : ''} ${index < currentStageIndex ? 'completed' : ''}`}
          >
            <div className="stage-indicator">
              {index < currentStageIndex ? '✓' : index === currentStageIndex ? '⟳' : '○'}
            </div>
            <div className="stage-text">{stage.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisLoading; 