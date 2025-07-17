import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  FileText,
  Calendar,
  Search,
  Eye,
  Plus,
  Target,
  Award,
  Loader,
  Lock,
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { AnalysisResult } from "../types";

import "../styles/pages/DashboardPage.css";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    isAuthLoading,
    currentAnalysis,
    analysisHistory,
    resetAnalysis,
  } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");

  // Check authentication when component mounts
  useEffect(() => {
    if (!isAuthLoading && !user) {
      // User is not authenticated, will show auth prompt
    }
  }, [user, isAuthLoading]);

  // Don't render content until we know authentication status
  if (isAuthLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <Loader className="loading-spinner2" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show auth prompt if not authenticated
  if (!user) {
    return (
      <div className="dashboard-page">
        <div className="auth-required-section">
          <div className="auth-required-content">
            <div className="auth-required-icon">
              <Lock className="lock-icon" />
            </div>
            <h2>Authentication Required</h2>
            <p>
              Please sign in to view your analysis dashboard and track your
              resume improvements.
            </p>
            <button
              onClick={() => {
                navigate("/login?redirect=/dashboard");
              }}
              className="auth-required-btn"
            >
              Sign In to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper functions to handle both new and legacy formats
  const getAnalysisScore = (analysis: AnalysisResult): number => {
    const score =
      analysis.score_out_of_100 ||
      analysis.overallScore ||
      (analysis as any).score ||
      0;
    return typeof score === "number" ? Math.max(0, Math.min(100, score)) : 0;
  };

  const getMatchPercentage = (analysis: AnalysisResult): number => {
    const percentage =
      analysis.chance_of_selection_percentage || analysis.matchPercentage || 0;
    return typeof percentage === "number"
      ? Math.max(0, Math.min(100, percentage))
      : 0;
  };

  const getJobTitle = (analysis: AnalysisResult): string => {
    return (
      analysis.resume_analysis_report?.candidate_information
        ?.position_applied ||
      analysis.jobTitle ||
      "Position Analysis"
    );
  };

  const getAnalyzedDate = (analysis: AnalysisResult): string => {
    try {
      // Try multiple date fields that might exist
      const dateFields = [
        analysis.analyzedAt,
        analysis.createdAt,
        analysis.updatedAt,
        (analysis as any).created_at,
        (analysis as any).updated_at,
      ];

      for (const dateField of dateFields) {
        if (dateField) {
          const date = new Date(dateField);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString();
          }
        }
      }

      // If no valid date found, return a default
      return "Recently";
    } catch {
      return "Recently";
    }
  };

  // Calculate statistics
  const totalAnalyses = analysisHistory.length;
  const averageScore =
    totalAnalyses > 0
      ? Math.round(
          analysisHistory.reduce(
            (sum, analysis) => sum + getAnalysisScore(analysis),
            0
          ) / totalAnalyses
        )
      : 0;
  const bestScore =
    totalAnalyses > 0
      ? Math.max(
          ...analysisHistory.map((analysis) => getAnalysisScore(analysis))
        )
      : 0;
  const averageMatchRate =
    totalAnalyses > 0
      ? Math.round(
          analysisHistory.reduce(
            (sum, analysis) => sum + getMatchPercentage(analysis),
            0
          ) / totalAnalyses
        )
      : 0;

  // Filter analysis history
  const filteredHistory = analysisHistory.filter(
    (analysis) =>
      (analysis.resumeFilename || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getJobTitle(analysis).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "error";
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="header-text">
            <h1 className="dashboard-title">Analysis Dashboard</h1>
            <p className="dashboard-subtitle">
              Track your resume analysis history and improvements
            </p>
          </div>
          <Link
            to="/resumechecker"
            onClick={resetAnalysis}
            className="new-analysis-btn"
          >
            <Plus className="btn-icon" />
            <span>New Analysis</span>
          </Link>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon-container">
              <FileText className="stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalAnalyses}</div>
              <div className="stat-label">Total Analyses</div>
            </div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon-container">
              <TrendingUp className="stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{averageScore}</div>
              <div className="stat-label">Average Score</div>
            </div>
          </div>

          <div className="stat-card stat-purple">
            <div className="stat-icon-container">
              <Award className="stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{bestScore}</div>
              <div className="stat-label">Best Score</div>
            </div>
          </div>

          <div className="stat-card stat-orange">
            <div className="stat-icon-container">
              <Target className="stat-icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{averageMatchRate}%</div>
              <div className="stat-label">Avg Match Rate</div>
            </div>
          </div>
        </div>

        {/* Analysis History */}
        {analysisHistory.length > 0 && (
          <div className="history-section">
            <div className="history-header">
              <h2 className="section-title">Analysis History</h2>

              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search analyses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="history-table">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Resume</th>
                      <th>Job Title</th>
                      <th>Date</th>
                      <th>Score</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((analysis: AnalysisResult) => (
                      <tr key={analysis.id} className="table-row">
                        <td>
                          <div className="file-info">
                            <div className="file-icon-wrapper">
                              <FileText className="file-icon" />
                            </div>
                            <span className="file-name">
                              {analysis.resumeFilename || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="job-title">{getJobTitle(analysis)}</td>
                        <td>
                          <div className="date-info">
                            <Calendar className="date-icon" />
                            <span className="date-text">
                              {getAnalyzedDate(analysis)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`score-badge ${getScoreBadgeColor(
                              getAnalysisScore(analysis)
                            )}`}
                          >
                            {getAnalysisScore(analysis)}/100
                          </span>
                        </td>
                        <td>
                          <button
                            className="view-details-btn"
                            onClick={() => {
                              const analysisId =
                                analysis.analysisId || analysis.id;
                              if (analysisId) {
                                navigate(`/dashboard/analysis/${analysisId}`);
                              }
                            }}
                          >
                            <Eye className="view-icon" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {analysisHistory.length === 0 && !currentAnalysis && (
          <div className="empty-state">
            <div className="empty-icon-container">
              <BarChart3 className="empty-icon" />
            </div>
            <h3 className="empty-title">No Analyses Yet</h3>
            <p className="empty-description">
              Start by analyzing your first resume to see results here.
            </p>
            <Link
              to="/resumechecker"
              onClick={resetAnalysis}
              className="start-analysis-btn"
            >
              <Plus className="btn-icon" />
              <span>Analyze Resume</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
