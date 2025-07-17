import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AnalysisSummary from "./AnalysisSummary";
import AnalysisTabContent from "./AnalysisTabContent";
import "./DashboardAnalysisView.css";

// Interface for the dashboard-specific data structure
interface DashboardAnalysisData {
  score: number;
  chance: number;
  jobTitle: string;
  validity: string;
  eligibility: string;
  conclusion: string;
  fitSummary?: string;
  candidateInfo?: any;
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
  feedback?: {
    contact_information?: {
      current_state: string;
      strengths: string[];
      improvements: string[];
    };
    profile_summary?: {
      current_state: string;
      strengths: string[];
      improvements: string[];
    };
    education?: {
      current_state: string;
      strengths: string[];
      improvements: string[];
    };
    skills?: {
      current_state: string;
      strengths: string[];
      improvements: string[];
    };
    projects?: {
      current_state: string;
      strengths: string[];
      improvements: string[];
    };
    missing_sections?: {
      certifications?: string;
      experience?: string;
      achievements?: string;
      soft_skills?: string;
    };
  };
  recommendations?: {
    immediate_resume_additions?: string[];
    immediate_priority_actions?: string[];
    short_term_development_goals?: string[];
    medium_term_objectives?: string[];
  };
  softSkills?: {
    communication_skills?: string[];
    teamwork_and_collaboration?: string[];
    leadership_and_initiative?: string[];
    problem_solving_approach?: string[];
  };
  finalAssessment?: {
    eligibility_status: string;
    hiring_recommendation: string;
    key_interview_areas?: string[];
    onboarding_requirements?: string[];
    long_term_potential: string;
  };
}

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
  const [isExporting, setIsExporting] = useState(false);
  const [tabScrollPosition, setTabScrollPosition] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Memoized data extraction functions
  const analysisData: DashboardAnalysisData = useMemo(
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
      feedback: analysis.resume_analysis_report?.section_wise_detailed_feedback
        ? {
            ...analysis.resume_analysis_report.section_wise_detailed_feedback,
            missing_sections: analysis.resume_analysis_report
              .section_wise_detailed_feedback.missing_sections
              ? {
                  certifications:
                    analysis.resume_analysis_report
                      .section_wise_detailed_feedback.missing_sections
                      .certifications || "No certifications found",
                  experience:
                    analysis.resume_analysis_report
                      .section_wise_detailed_feedback.missing_sections
                      .experience || "No experience found",
                  achievements:
                    analysis.resume_analysis_report
                      .section_wise_detailed_feedback.missing_sections
                      .achievements || "No achievements found",
                  soft_skills:
                    analysis.resume_analysis_report
                      .section_wise_detailed_feedback.missing_sections
                      .soft_skills || "No soft skills found",
                }
              : undefined,
          }
        : undefined,
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

  // Focus management for accessibility
  useEffect(() => {
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }, []);

  // Tab navigation with keyboard
  const handleTabNavigation = useCallback(
    (direction: "next" | "prev") => {
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
      let newIndex;

      if (direction === "next") {
        newIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
      } else {
        newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      }

      setActiveTab(tabs[newIndex].id);
    },
    [activeTab, tabs]
  );

  const handleExport = useCallback(
    async (format: "pdf" | "json") => {
      if (onExport) {
        setIsExporting(true);
        try {
          await onExport(format);
        } finally {
          setIsExporting(false);
        }
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
      } else if (e.key === "ArrowLeft" && e.ctrlKey) {
        e.preventDefault();
        handleTabNavigation("prev");
      } else if (e.key === "ArrowRight" && e.ctrlKey) {
        e.preventDefault();
        handleTabNavigation("next");
      }
    },
    [onClose, handleTabNavigation]
  );

  const scrollTabs = useCallback(
    (direction: "left" | "right") => {
      if (tabsRef.current) {
        const scrollAmount = 200;
        const newPosition =
          direction === "left"
            ? Math.max(0, tabScrollPosition - scrollAmount)
            : tabScrollPosition + scrollAmount;

        tabsRef.current.scrollTo({
          left: newPosition,
          behavior: "smooth",
        });
        setTabScrollPosition(newPosition);
      }
    },
    [tabScrollPosition]
  );

  const TabButton: React.FC<{ tab: Tab; index: number }> = React.memo(
    ({ tab, index }) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;

      return (
        <button
          className={`tab-button ${isActive ? "active" : ""}`}
          onClick={() => setActiveTab(tab.id)}
          style={{ "--tab-color": tab.color } as React.CSSProperties}
          role="tab"
          aria-selected={isActive}
          aria-controls={`tabpanel-${tab.id}`}
          id={`tab-${tab.id}`}
          tabIndex={isActive ? 0 : -1}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" && index > 0) {
              e.preventDefault();
              setActiveTab(tabs[index - 1].id);
            } else if (e.key === "ArrowRight" && index < tabs.length - 1) {
              e.preventDefault();
              setActiveTab(tabs[index + 1].id);
            }
          }}
        >
          <Icon className="tab-icon" aria-hidden="true" />
          <span className="tab-label">{tab.label}</span>
          {tab.count !== undefined && tab.count > 0 && (
            <span className="tab-count" aria-label={`${tab.count} items`}>
              {tab.count}
            </span>
          )}
          {isActive && <div className="tab-indicator" />}
        </button>
      );
    }
  );

  const LoadingSpinner = () => (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p className="loading-text">Loading analysis...</p>
      </div>
    </div>
  );

  const ExportButton: React.FC<{ format: "pdf" | "json"; label: string }> = ({
    format,
    label,
  }) => (
    <button
      className="action-btn export-btn"
      onClick={() => handleExport(format)}
      disabled={isExporting}
      title={`Export as ${label}`}
    >
      <Download className="action-icon" />
      <span>{isExporting ? "..." : label}</span>
    </button>
  );

  if (isLoading) {
    return (
      <div className="dashboard-analysis-overlay">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div
      className="dashboard-analysis-overlay"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div className="dashboard-analysis-modal" ref={modalRef}>
        {/* Header */}
        <header className="modal-header">
          <div className="header-content">
            <h1 id="modal-title">Resume Analysis Report</h1>
            <p id="modal-description">
              Comprehensive evaluation and improvement recommendations
            </p>
          </div>
          <div className="header-actions">
            {onExport && (
              <div className="export-buttons">
                <ExportButton format="pdf" label="PDF" />
                <ExportButton format="json" label="JSON" />
              </div>
            )}
            {onShare && (
              <button
                className="action-btn share-btn"
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
          <div className="tabs-wrapper">
            <button
              className="tab-scroll-btn tab-scroll-left"
              onClick={() => scrollTabs("left")}
              aria-label="Scroll tabs left"
            >
              <ChevronLeft className="scroll-icon" />
            </button>

            <div
              className="tabs"
              role="tablist"
              aria-label="Analysis sections"
              ref={tabsRef}
            >
              {tabs.map((tab, index) => (
                <TabButton key={tab.id} tab={tab} index={index} />
              ))}
            </div>

            <button
              className="tab-scroll-btn tab-scroll-right"
              onClick={() => scrollTabs("right")}
              aria-label="Scroll tabs right"
            >
              <ChevronRight className="scroll-icon" />
            </button>
          </div>

          {/* Tab Contents */}
          <div
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="tab-content"
          >
            <AnalysisTabContent
              activeTab={activeTab}
              analysisData={analysisData}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardAnalysisView;
