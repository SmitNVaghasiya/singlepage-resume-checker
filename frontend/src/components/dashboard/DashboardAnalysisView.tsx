import React, { useState, useCallback, useMemo } from "react";
import { AnalysisResult } from "../../types";
import {
  X,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  Award,
  Download,
  Share,
} from "lucide-react";
import AnalysisSummary from "./AnalysisSummary";
import AnalysisTabContent from "./AnalysisTabContent";
import "./DashboardAnalysisView.css";

interface DashboardAnalysisViewProps {
  analysis: AnalysisResult;
  onClose: () => void;
  onExport?: (format: "pdf" | "json") => void;
  onShare?: () => void;
  isLoading?: boolean;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  count?: number;
}

const DashboardAnalysisView: React.FC<DashboardAnalysisViewProps> = ({
  analysis,
  onClose,
  onExport,
  onShare,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["tech-skills", "critical-gaps"]) // Default expanded sections
  );

  // Memoized data extraction functions
  const analysisData = useMemo(
    () => ({
      score:
        analysis.score_out_of_100 ||
        analysis.overallScore ||
        (analysis as any).score ||
        0,
      chance:
        analysis.chance_of_selection_percentage ||
        analysis.matchPercentage ||
        (analysis as any).matchPercentage ||
        0,
      jobTitle:
        analysis.resume_analysis_report?.candidate_information
          ?.position_applied ||
        analysis.jobTitle ||
        "Position Analysis",
      validity: analysis.job_description_validity || "Valid",
      eligibility: analysis.resume_eligibility || "Eligible",
      conclusion:
        analysis.short_conclusion ||
        analysis.overallRecommendation ||
        "Analysis completed successfully.",
      fitSummary: analysis.overall_fit_summary,
      candidateInfo: analysis.resume_analysis_report?.candidate_information,
      priorities: analysis.resume_improvement_priority || [],
      strengths: analysis.resume_analysis_report?.strengths_analysis,
      weaknesses: analysis.resume_analysis_report?.weaknesses_analysis,
      feedback: analysis.resume_analysis_report?.section_wise_detailed_feedback,
      recommendations:
        analysis.resume_analysis_report?.improvement_recommendations,
      softSkills:
        analysis.resume_analysis_report?.soft_skills_enhancement_suggestions,
      finalAssessment: analysis.resume_analysis_report?.final_assessment,
    }),
    [analysis]
  );

  // Memoized tabs with dynamic counts
  const tabs: Tab[] = useMemo(
    () => [
      { id: "overview", label: "Overview", icon: BarChart3, color: "#667eea" },
      {
        id: "strengths",
        label: "Strengths",
        icon: TrendingUp,
        color: "#10b981",
        count:
          (analysisData.strengths?.technical_skills?.length || 0) +
          (analysisData.strengths?.project_portfolio?.length || 0) +
          (analysisData.strengths?.educational_background?.length || 0),
      },
      {
        id: "weaknesses",
        label: "Weaknesses",
        icon: AlertTriangle,
        color: "#ef4444",
        count:
          (analysisData.weaknesses?.critical_gaps_against_job_description
            ?.length || 0) +
          (analysisData.weaknesses?.technical_deficiencies?.length || 0),
      },
      {
        id: "feedback",
        label: "Section Feedback",
        icon: MessageSquare,
        color: "#8b5cf6",
      },
      {
        id: "recommendations",
        label: "Recommendations",
        icon: Lightbulb,
        color: "#f59e0b",
        count:
          analysisData.recommendations?.immediate_resume_additions?.length || 0,
      },
      {
        id: "assessment",
        label: "Final Assessment",
        icon: Award,
        color: "#06b6d4",
      },
    ],
    [analysisData]
  );

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }
      return newExpanded;
    });
  }, []);

  const handleExport = useCallback(
    (format: "pdf" | "json") => {
      if (onExport) {
        onExport(format);
      }
    },
    [onExport]
  );

  const handleShare = useCallback(() => {
    if (onShare) {
      onShare();
    }
  }, [onShare]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  const TabButton: React.FC<{ tab: Tab }> = React.memo(({ tab }) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;

    return (
      <button
        className={`tab-button ${isActive ? "active" : ""}`}
        onClick={() => setActiveTab(tab.id)}
        style={{ "--tab-color": tab.color } as React.CSSProperties}
        role="tab"
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
      >
        <Icon className="tab-icon" aria-hidden="true" />
        <span>{tab.label}</span>
        {tab.count !== undefined && tab.count > 0 && (
          <span className="tab-count">{tab.count}</span>
        )}
        {isActive && <div className="tab-indicator" />}
      </button>
    );
  });

  if (isLoading) {
    return (
      <div className="dashboard-analysis-overlay">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="dashboard-analysis-overlay"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div className="dashboard-analysis-modal">
        {/* Header */}
        <header className="modal-header">
          <div className="header-content">
            <h1 id="modal-title">Resume Analysis Report</h1>
            <p>Comprehensive evaluation and improvement recommendations</p>
          </div>
          <div className="header-actions">
            {onExport && (
              <div className="export-buttons">
                <button
                  className="action-btn"
                  onClick={() => handleExport("pdf")}
                  title="Export as PDF"
                >
                  <Download className="action-icon" />
                  <span>PDF</span>
                </button>
                <button
                  className="action-btn"
                  onClick={() => handleExport("json")}
                  title="Export as JSON"
                >
                  <Download className="action-icon" />
                  <span>JSON</span>
                </button>
              </div>
            )}
            {onShare && (
              <button
                className="action-btn"
                onClick={handleShare}
                title="Share analysis"
              >
                <Share className="action-icon" />
                <span>Share</span>
              </button>
            )}
            <button
              className="close-btn"
              onClick={onClose}
              aria-label="Close analysis report"
            >
              <X className="close-icon" />
            </button>
          </div>
        </header>

        {/* Analysis Summary Component */}
        <AnalysisSummary analysisData={analysisData} />

        {/* Tabs */}
        <section className="tabs-container">
          <div className="tabs" role="tablist" aria-labelledby="analysis-tabs">
            <h2 id="analysis-tabs" className="sr-only">
              Analysis Sections
            </h2>
            {tabs.map((tab) => (
              <TabButton key={tab.id} tab={tab} />
            ))}
          </div>

          {/* Tab Contents */}
          <AnalysisTabContent
            activeTab={activeTab}
            expandedSections={expandedSections}
            analysisData={analysisData}
            onToggleSection={toggleSection}
          />
        </section>
      </div>
    </div>
  );
};

export default DashboardAnalysisView;
