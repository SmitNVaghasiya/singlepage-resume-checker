import React from "react";
import {
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Target,
  Award,
} from "lucide-react";
import { AnalysisResult } from "../../types";
import "./AnalysisCard.css";

interface AnalysisCardProps {
  analysis: AnalysisResult;
  showFullDetails?: boolean;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({
  analysis,
  showFullDetails = false,
}) => {
  // Handle both new and legacy formats
  const getScore = () => {
    return (
      analysis.score_out_of_100 ||
      analysis.overallScore ||
      (analysis as any).score ||
      0
    );
  };

  const getMatchPercentage = () => {
    return (
      analysis.chance_of_selection_percentage || analysis.matchPercentage || 0
    );
  };

  const getOverallRecommendation = () => {
    return (
      analysis.short_conclusion ||
      analysis.overallRecommendation ||
      (analysis as any).remarks ||
      "Analysis completed successfully."
    );
  };

  const getStrengths = () => {
    if (analysis.resume_analysis_report?.strengths_analysis) {
      return [
        ...analysis.resume_analysis_report.strengths_analysis.technical_skills,
        ...analysis.resume_analysis_report.strengths_analysis.project_portfolio,
        ...analysis.resume_analysis_report.strengths_analysis
          .educational_background,
      ];
    }
    return analysis.candidateStrengths || (analysis as any).strengths || [];
  };

  const getImprovements = () => {
    if (analysis.resume_improvement_priority) {
      return analysis.resume_improvement_priority;
    }
    if (analysis.resume_analysis_report?.weaknesses_analysis) {
      return [
        ...analysis.resume_analysis_report.weaknesses_analysis.critical_gaps_against_job_description.slice(
          0,
          3
        ),
        ...analysis.resume_analysis_report.weaknesses_analysis.resume_presentation_issues.slice(
          0,
          2
        ),
      ];
    }
    return (
      analysis.developmentAreas ||
      (analysis as any).improvements ||
      (analysis as any).suggestions ||
      []
    );
  };

  const getEligibilityStatus = () => {
    return analysis.resume_eligibility || "Eligible";
  };

  const getValidityStatus = () => {
    return analysis.job_description_validity || "Valid";
  };

  return (
    <div className="analysis-card">
      <div className="analysis-scores">
        <div className="analysis-score-card blue">
          <div className="analysis-score-value blue">{getScore()}</div>
          <div className="analysis-score-label">Overall Score</div>
          <div className="analysis-score-sublabel">Out of 100</div>
        </div>

        <div className="analysis-score-card green">
          <div className="analysis-score-value green">
            {getMatchPercentage()}%
          </div>
          <div className="analysis-score-label">Selection Chance</div>
          <div className="analysis-score-sublabel">Probability</div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="analysis-status">
        <div className="status-item">
          <CheckCircle className="status-icon green" />
          <span className="status-text">Resume: {getEligibilityStatus()}</span>
        </div>
        <div className="status-item">
          <Target className="status-icon blue" />
          <span className="status-text">
            Job Description: {getValidityStatus()}
          </span>
        </div>
      </div>

      <div className="analysis-remarks">
        <h3 className="analysis-remarks-title">AI Analysis Summary</h3>
        <p className="analysis-remarks-text">{getOverallRecommendation()}</p>

        {analysis.overall_fit_summary && (
          <div className="fit-summary">
            <h4 className="fit-summary-title">Overall Fit Assessment</h4>
            <p className="fit-summary-text">{analysis.overall_fit_summary}</p>
          </div>
        )}
      </div>

      {showFullDetails && (
        <div className="analysis-details">
          <div className="analysis-section">
            <div className="analysis-section-header">
              <Star className="analysis-section-icon green" />
              <h3 className="analysis-section-title">Key Strengths</h3>
            </div>
            <div className="analysis-items">
              {getStrengths()
                .slice(0, 5)
                .map((strength: string, index: number) => (
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
              <h3 className="analysis-section-title">Priority Improvements</h3>
            </div>
            <div className="analysis-items">
              {getImprovements()
                .slice(0, 5)
                .map((improvement: string, index: number) => (
                  <div key={index} className="analysis-item improvement">
                    <AlertCircle className="analysis-item-icon orange" />
                    <span className="analysis-item-text">{improvement}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Candidate Information */}
          {analysis.resume_analysis_report?.candidate_information && (
            <div className="analysis-section">
              <div className="analysis-section-header">
                <Award className="analysis-section-icon blue" />
                <h3 className="analysis-section-title">Candidate Profile</h3>
              </div>
              <div className="candidate-info">
                <div className="info-item">
                  <strong>Name:</strong>{" "}
                  {analysis.resume_analysis_report.candidate_information.name}
                </div>
                <div className="info-item">
                  <strong>Position Applied:</strong>{" "}
                  {
                    analysis.resume_analysis_report.candidate_information
                      .position_applied
                  }
                </div>
                <div className="info-item">
                  <strong>Experience Level:</strong>{" "}
                  {
                    analysis.resume_analysis_report.candidate_information
                      .experience_level
                  }
                </div>
                <div className="info-item">
                  <strong>Current Status:</strong>{" "}
                  {
                    analysis.resume_analysis_report.candidate_information
                      .current_status
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisCard;
