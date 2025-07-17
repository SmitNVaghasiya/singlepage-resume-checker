import React from "react";
import {
  Target,
  TrendingUp,
  CheckCircle,
  Shield,
  AlertTriangle,
  Brain,
  Zap,
  Lightbulb,
  User,
  FileText,
  Book,
  Code,
  Briefcase,
} from "lucide-react";
import "./AnalysisSummary.css";

interface AnalysisSummaryProps {
  analysisData: {
    score: number;
    chance: number;
    validity: string;
    eligibility: string;
    conclusion: string;
    fitSummary?: string;
    candidateInfo?: {
      name: string;
      position_applied: string;
      experience_level: string;
      current_status: string;
    };
    priorities: string[];
    strengths?: {
      technical_skills?: string[];
      project_portfolio?: string[];
      educational_background?: string[];
    };
    weaknesses?: {
      critical_gaps_against_job_description?: string[];
      technical_deficiencies?: string[];
      resume_presentation_issues?: string[];
      soft_skills_gaps?: string[];
      missing_essential_elements?: string[];
    };
    recommendations?: {
      immediate_resume_additions?: string[];
      immediate_priority_actions?: string[];
      short_term_development_goals?: string[];
      medium_term_objectives?: string[];
    };
  };
}

const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ analysisData }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getChanceColor = (chance: number) => {
    if (chance >= 80) return "#3b82f6";
    if (chance >= 60) return "#8b5cf6";
    return "#06b6d4";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Average";
    return "Needs Improvement";
  };

  return (
    <>
      {/* Summary Cards */}
      <section className="summary-cards" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="sr-only">
          Analysis Summary
        </h2>

        <div
          className="summary-card score-card"
          style={
            {
              "--card-color": getScoreColor(analysisData.score),
            } as React.CSSProperties
          }
        >
          <div className="card-icon">
            <Target className="icon" aria-hidden="true" />
          </div>
          <h3>Overall Score</h3>
          <div className="card-value">{analysisData.score}</div>
          <div className="card-unit">out of 100</div>
          <div className="card-label">{getScoreLabel(analysisData.score)}</div>
          <div
            className="card-progress"
            role="progressbar"
            aria-valuenow={analysisData.score}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="progress-bar"
              style={{ width: `${analysisData.score}%` }}
            />
          </div>
        </div>

        <div
          className="summary-card chance-card"
          style={
            {
              "--card-color": getChanceColor(analysisData.chance),
            } as React.CSSProperties
          }
        >
          <div className="card-icon">
            <TrendingUp className="icon" aria-hidden="true" />
          </div>
          <h3>Selection Chance</h3>
          <div className="card-value">{analysisData.chance}%</div>
          <div className="card-unit">probability</div>
          <div
            className="card-progress"
            role="progressbar"
            aria-valuenow={analysisData.chance}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="progress-bar"
              style={{ width: `${analysisData.chance}%` }}
            />
          </div>
        </div>

        <div className="summary-card validity-card">
          <div className="card-icon">
            <CheckCircle className="icon" aria-hidden="true" />
          </div>
          <h3>Job Description</h3>
          <div className="card-value">{analysisData.validity}</div>
          <div className="card-unit">status</div>
        </div>

        <div className="summary-card status-card">
          <div className="card-icon">
            <Shield className="icon" aria-hidden="true" />
          </div>
          <h3>Resume Status</h3>
          <div className="card-value">{analysisData.eligibility}</div>
          <div className="card-unit">status</div>
        </div>
      </section>

      {/* Executive Summary */}
      <section
        className="executive-summary"
        aria-labelledby="executive-summary-heading"
      >
        <h2 id="executive-summary-heading" className="section-title">
          Executive Summary
        </h2>
        <div className="summary-box">
          <p>{analysisData.conclusion}</p>
        </div>

        {analysisData.fitSummary && (
          <div className="fit-summary">
            <h3>Overall Fit Summary</h3>
            <p>{analysisData.fitSummary}</p>
          </div>
        )}

        {/* Candidate Information */}
        {analysisData.candidateInfo && (
          <div className="candidate-info">
            <h3>Candidate Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Name</div>
                <div className="info-value">
                  {analysisData.candidateInfo.name}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Position Applied</div>
                <div className="info-value">
                  {analysisData.candidateInfo.position_applied}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Experience Level</div>
                <div className="info-value">
                  {analysisData.candidateInfo.experience_level}
                </div>
              </div>
              <div className="info-item">
                <div className="info-label">Current Status</div>
                <div className="info-value">
                  {analysisData.candidateInfo.current_status}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Priority Improvements */}
        {analysisData.priorities.length > 0 && (
          <div className="priority-improvements">
            <h3 className="priority-title">
              <AlertTriangle className="priority-icon" aria-hidden="true" />
              Priority Improvements
            </h3>
            <ol className="priority-list">
              {analysisData.priorities.map((item, index) => (
                <li key={index} className="priority-item">
                  <span className="priority-number">{index + 1}</span>
                  <span className="priority-text">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {/* Quick Stats (for Overview Tab) */}
      <div className="quick-stats">
        <h3>Quick Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">
              {analysisData.strengths?.technical_skills?.length || 0}
            </div>
            <div className="stat-label">Technical Strengths</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {analysisData.weaknesses?.critical_gaps_against_job_description
                ?.length || 0}
            </div>
            <div className="stat-label">Critical Gaps</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{analysisData.priorities.length}</div>
            <div className="stat-label">Priority Actions</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {analysisData.recommendations?.immediate_resume_additions
                ?.length || 0}
            </div>
            <div className="stat-label">Quick Fixes</div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="overview-grid">
        <div className="overview-card">
          <div className="overview-icon">
            <Brain className="icon" aria-hidden="true" />
          </div>
          <h4>AI Analysis</h4>
          <p>Advanced AI-powered resume evaluation against job requirements</p>
        </div>
        <div className="overview-card">
          <div className="overview-icon">
            <Target className="icon" aria-hidden="true" />
          </div>
          <h4>Job Matching</h4>
          <p>
            Comprehensive matching of skills, experience, and qualifications
          </p>
        </div>
        <div className="overview-card">
          <div className="overview-icon">
            <Lightbulb className="icon" aria-hidden="true" />
          </div>
          <h4>Smart Recommendations</h4>
          <p>Actionable insights for resume improvement and career growth</p>
        </div>
        <div className="overview-card">
          <div className="overview-icon">
            <Zap className="icon" aria-hidden="true" />
          </div>
          <h4>Instant Results</h4>
          <p>Quick analysis with detailed feedback and scoring</p>
        </div>
      </div>
    </>
  );
};

export default AnalysisSummary;
