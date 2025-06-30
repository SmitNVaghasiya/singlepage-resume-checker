import React from 'react';
import { Star, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { AnalysisResult } from '../types';
import '../styles/analysis.css';

interface AnalysisCardProps {
  analysis: AnalysisResult;
  showFullDetails?: boolean;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis, showFullDetails = false }) => {
  return (
    <div className="analysis-card">
      <div className="analysis-scores">
        <div className="analysis-score-card blue">
          <div className="analysis-score-value blue">{analysis.overallScore || (analysis as any).score || 0}</div>
          <div className="analysis-score-label">Overall Score</div>
          <div className="analysis-score-sublabel">Out of 100</div>
        </div>
        
        <div className="analysis-score-card green">
          <div className="analysis-score-value green">{analysis.matchPercentage || 0}%</div>
          <div className="analysis-score-label">Job Match</div>
          <div className="analysis-score-sublabel">Compatibility</div>
        </div>
      </div>

      <div className="analysis-remarks">
        <h3 className="analysis-remarks-title">AI Analysis</h3>
        <p className="analysis-remarks-text">{analysis.overallRecommendation || (analysis as any).remarks || 'Analysis completed successfully.'}</p>
      </div>

      {showFullDetails && (
        <div className="analysis-details">
          <div className="analysis-section">
            <div className="analysis-section-header">
              <Star className="analysis-section-icon green" />
              <h3 className="analysis-section-title">Strengths</h3>
            </div>
            <div className="analysis-items">
              {(analysis.candidateStrengths || (analysis as any).strengths || []).map((strength, index) => (
                <div key={index} className="analysis-item strength">
                  <CheckCircle className="analysis-item-icon green" />
                  <span className="analysis-item-text">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="analysis-section">
            <div className="analysis-section-header">
              <TrendingUp className="analysis-section-icon orange" />
              <h3 className="analysis-section-title">Improvements</h3>
            </div>
            <div className="analysis-items">
              {(analysis.developmentAreas || (analysis as any).improvements || (analysis as any).suggestions || []).map((improvement, index) => (
                <div key={index} className="analysis-item improvement">
                  <AlertCircle className="analysis-item-icon orange" />
                  <span className="analysis-item-text">{improvement}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisCard;