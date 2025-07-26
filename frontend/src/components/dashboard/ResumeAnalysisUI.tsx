import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  BookOpen,
  Code,
  Award,
  Users,
  Lightbulb,
  RefreshCw,
  LucideIcon,
  Plus,
  BarChart3,
  Download,
  ChevronDown,
} from "lucide-react";
import { AnalysisResult } from "../../types";
import { apiService } from "../../services/api";
import { useAppContext } from "../../contexts/AppContext";
import "./ResumeAnalysisUI.css";
import FeedbackForm from "../feedback/FeedbackForm";
import jsPDF from "jspdf";
import Papa from "papaparse";
import ReactDOM from "react-dom";

interface ResumeAnalysisUIProps {
  analysisId: string;
}

const ResumeAnalysisUI: React.FC<ResumeAnalysisUIProps> = ({ analysisId }) => {
  const navigate = useNavigate();
  const { resetAnalysis } = useAppContext();
  const [activeTab, setActiveTab] = useState("overview");
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadBtnRef = React.useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    fetchAnalysisData();
  }, [analysisId]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getAnalysisResult(analysisId);

      // Handle both response structures:
      // 1. Expected: response.result (AnalysisResult)
      // 2. Actual: response.result.result (nested structure)
      const analysisData = (response.result as any).result || response.result;
      setData(analysisData);
    } catch (err) {
      console.error("Error fetching analysis data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch analysis data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = (type: "json" | "pdf" | "csv") => {
    if (!data) return;
    if (type === "json") {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume_analysis_report_${analysisId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (type === "pdf") {
      const doc = new jsPDF();
      let y = 15;
      const lineHeight = 6;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 10;
      const maxWidth = doc.internal.pageSize.width - 2 * margin;
      doc.setFontSize(16);
      doc.text("Resume Analysis Report", margin, y);
      y += 10;
      doc.setFontSize(10);
      // Print all top-level fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === "resume_analysis_report") return; // Print this as a section
        if (typeof value === "object" && value !== null) return;
        const text = `${key.replace(/_/g, " ")}: ${value}`;
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += lineHeight;
        });
      });
      y += 5;
      // Print resume_analysis_report sectioned
      const printSection = (obj: any, indent = 0) => {
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === "object" && value !== null) {
            const sectionHeader = `${" ".repeat(indent)}${key.replace(
              /_/g,
              " "
            )}:`;
            const lines = doc.splitTextToSize(
              sectionHeader,
              maxWidth - indent * 2
            );
            lines.forEach((line: string) => {
              if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
              }
              doc.text(line, margin + indent, y);
              y += lineHeight;
            });
            printSection(value, indent + 2);
          } else {
            const text = `${" ".repeat(indent)}${key.replace(
              /_/g,
              " "
            )}: ${value}`;
            const lines = doc.splitTextToSize(text, maxWidth - indent * 2);
            lines.forEach((line: string) => {
              if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
              }
              doc.text(line, margin + indent, y);
              y += lineHeight;
            });
          }
        });
      };
      const sectionHeader = "resume_analysis_report:";
      const lines = doc.splitTextToSize(sectionHeader, maxWidth);
      lines.forEach((line: string) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });
      printSection(data.resume_analysis_report, 2);
      doc.save(`resume_analysis_report_${analysisId}.pdf`);
    } else if (type === "csv") {
      // Flatten all fields for CSV
      const flatten = (obj: any, prefix = "") => {
        let rows: any[] = [];
        Object.entries(obj).forEach(([key, value]) => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          if (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
          ) {
            rows = rows.concat(flatten(value, fullKey));
          } else if (Array.isArray(value)) {
            rows.push({ key: fullKey, value: value.join("; ") });
          } else {
            rows.push({ key: fullKey, value });
          }
        });
        return rows;
      };
      const rows = flatten(data);
      const csv = Papa.unparse([
        ["Field", "Value"],
        ...rows.map((r) => [r.key, r.value]),
      ]);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resume_analysis_report_${analysisId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setDownloadOpen(false);
  };

  const getEligibilityColor = (eligibility: string) => {
    if (eligibility.includes("Partially Eligible")) return "partially-eligible";
    if (eligibility.includes("Eligible")) return "eligible";
    return "not-eligible";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const TabButton: React.FC<{
    id: string;
    label: string;
    icon: LucideIcon;
    active: boolean;
    onClick: (id: string) => void;
  }> = ({ id, label, icon: Icon, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`tab-button ${active ? "active" : ""}`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  const Card: React.FC<{
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
    className?: string;
  }> = ({ title, icon: Icon, children, className = "" }) => (
    <div className={`analysis-card ${className}`}>
      <div className="card-header">
        <div className="card-header-content">
          <Icon className="card-header-icon" size={24} />
          <h3 className="card-header-title">{title}</h3>
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );

  const ListItem: React.FC<{
    items: string[];
    type?: "strength" | "weakness" | "default";
  }> = ({ items, type = "default" }) => (
    <ul className="list-container">
      {items.map((item, index) => (
        <li key={index} className="list-item">
          <div className={`list-item-bullet ${type}`} />
          <div className="list-item-content">{item}</div>
        </li>
      ))}
    </ul>
  );

  const renderOverview = () => {
    if (!data || !data.resume_analysis_report) return null;

    return (
      <div className="space-y-6">
        <div className="overview-grid">
          <div className="stat-card blue">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <h3>Overall Score</h3>
                <div
                  className={`value ${getScoreColor(data.score_out_of_100)}`}
                >
                  {data.score_out_of_100}/100
                </div>
              </div>
              <Star className="stat-card-icon" size={32} />
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <h3>Selection Chance</h3>
                <div className="value">
                  {data.chance_of_selection_percentage}%
                </div>
              </div>
              <TrendingUp className="stat-card-icon" size={32} />
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <h3>Position</h3>
                <div className="value">
                  {
                    data.resume_analysis_report.candidate_information
                      .position_applied
                  }
                </div>
              </div>
              <Target className="stat-card-icon" size={32} />
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <h3>Experience Level</h3>
                <div className="value">
                  {
                    data.resume_analysis_report.candidate_information
                      .experience_level
                  }
                </div>
              </div>
              <User className="stat-card-icon" size={32} />
            </div>
          </div>
        </div>

        <Card title="Candidate Information" icon={User}>
          <div className="info-grid">
            <div className="info-item">
              <h4>Name</h4>
              <p>{data.resume_analysis_report.candidate_information.name}</p>
            </div>
            <div className="info-item">
              <h4>Current status</h4>
              <p>
                {
                  data.resume_analysis_report.candidate_information
                    .current_status
                }
              </p>
            </div>
          </div>
        </Card>

        <Card title="Eligibility Assessment" icon={CheckCircle}>
          <div
            className={`eligibility-badge ${getEligibilityColor(
              data.resume_eligibility
            )}`}
          >
            <p className="font-medium">{data.resume_eligibility}</p>
          </div>
          <div className="section-feedback-item">
            <h4>Short Conclusion</h4>
            <p>{data.short_conclusion}</p>
          </div>
          <div className="section-feedback-item">
            <h4>Overall Fit Summary</h4>
            <p>{data.overall_fit_summary}</p>
          </div>
        </Card>

        <Card title="Job Description" icon={Target}>
          <div className="job-description-content">
            <h4>Job Description Text</h4>
            <p className="job-description-text">
              {data.jobDescriptionFilename ||
                "Job description text is not available in the current response format."}
            </p>
          </div>
          <div className="job-description-validity">
            <h4>Validity status</h4>
            <p>{data.job_description_validity}</p>
          </div>
        </Card>
      </div>
    );
  };

  const renderStrengths = () => {
    if (!data || !data.resume_analysis_report) return null;

    return (
      <div className="space-y-6">
        <Card title="Technical Skills" icon={Code}>
          <ListItem
            items={
              data.resume_analysis_report.strengths_analysis.technical_skills
            }
            type="strength"
          />
        </Card>

        <Card title="Project Portfolio" icon={Award}>
          <ListItem
            items={
              data.resume_analysis_report.strengths_analysis.project_portfolio
            }
            type="strength"
          />
        </Card>

        <Card title="Educational Background" icon={BookOpen}>
          <ListItem
            items={
              data.resume_analysis_report.strengths_analysis
                .educational_background
            }
            type="strength"
          />
        </Card>
      </div>
    );
  };

  const renderWeaknesses = () => {
    if (!data || !data.resume_analysis_report) return null;

    return (
      <div className="space-y-6">
        <Card title="Critical Gaps Against Job Description" icon={AlertCircle}>
          <ListItem
            items={
              data.resume_analysis_report.weaknesses_analysis
                .critical_gaps_against_job_description
            }
            type="weakness"
          />
        </Card>

        <Card title="Technical Deficiencies" icon={XCircle}>
          <ListItem
            items={
              data.resume_analysis_report.weaknesses_analysis
                .technical_deficiencies
            }
            type="weakness"
          />
        </Card>

        <Card title="Resume Presentation Issues" icon={AlertCircle}>
          <ListItem
            items={
              data.resume_analysis_report.weaknesses_analysis
                .resume_presentation_issues
            }
            type="weakness"
          />
        </Card>

        <Card title="Soft Skills Gaps" icon={Users}>
          <ListItem
            items={
              data.resume_analysis_report.weaknesses_analysis.soft_skills_gaps
            }
            type="weakness"
          />
        </Card>

        <Card title="Missing Essential Elements" icon={XCircle}>
          <div className="space-y-4">
            {Object.entries(
              data.resume_analysis_report.weaknesses_analysis
                .missing_essential_elements
            ).map(([key, value]) => (
              <div key={key} className="missing-sections-item">
                <div className="missing-sections-bullet" />
                <div className="missing-sections-content">
                  <h4>{key.replace(/_/g, " ")}</h4>
                  <p>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderSectionFeedback = () => {
    if (!data || !data.resume_analysis_report) return null;

    const sections = data.resume_analysis_report.section_wise_detailed_feedback;
    const sectionEntries = Object.entries(sections).filter(
      ([key]) => key !== "missing_sections"
    );

    return (
      <div className="space-y-6">
        {sectionEntries.map(([section, feedback]) => (
          <Card
            key={section}
            title={section
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
            icon={BookOpen}
          >
            <div className="space-y-4">
              <div className="section-feedback-item">
                <h4>Current State</h4>
                <p>{feedback.current_state}</p>
              </div>

              {feedback.strengths && (
                <div className="section-feedback-item">
                  <h4>Strengths</h4>
                  <ListItem items={feedback.strengths} type="strength" />
                </div>
              )}

              {feedback.improvements && (
                <div className="section-feedback-item">
                  <h4>Improvements</h4>
                  <ListItem items={feedback.improvements} type="weakness" />
                </div>
              )}
            </div>
          </Card>
        ))}

        <Card title="Missing Sections" icon={AlertCircle}>
          <div className="space-y-4">
            {Object.entries(sections.missing_sections).map(([key, value]) => (
              <div key={key} className="missing-sections-item">
                <div className="missing-sections-bullet" />
                <div className="missing-sections-content">
                  <h4>{key.replace(/_/g, " ")}</h4>
                  <p>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderImprovements = () => {
    if (!data || !data.resume_analysis_report) return null;

    return (
      <div className="space-y-6">
        <Card title="Resume Improvement Priority" icon={TrendingUp}>
          <ListItem items={data.resume_improvement_priority} />
        </Card>

        <Card title="Immediate Resume Additions" icon={Lightbulb}>
          <ListItem
            items={
              data.resume_analysis_report.improvement_recommendations
                .immediate_resume_additions
            }
          />
        </Card>

        <Card title="Immediate Priority Actions" icon={Target}>
          <ListItem
            items={
              data.resume_analysis_report.improvement_recommendations
                .immediate_priority_actions
            }
          />
        </Card>

        <Card title="Short-term Development Goals" icon={BookOpen}>
          <ListItem
            items={
              data.resume_analysis_report.improvement_recommendations
                .short_term_development_goals
            }
          />
        </Card>

        <Card title="Medium-term Objectives" icon={TrendingUp}>
          <ListItem
            items={
              data.resume_analysis_report.improvement_recommendations
                .medium_term_objectives
            }
          />
        </Card>
      </div>
    );
  };

  const renderSkillsEnhancement = () => {
    if (!data || !data.resume_analysis_report) return null;

    return (
      <div className="space-y-6">
        {Object.entries(
          data.resume_analysis_report.soft_skills_enhancement_suggestions
        ).map(([skill, suggestions]) => (
          <Card
            key={skill}
            title={skill
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
            icon={Users}
          >
            <ListItem items={suggestions} />
          </Card>
        ))}
      </div>
    );
  };

  const renderFinalAssessment = () => {
    if (!data || !data.resume_analysis_report) return null;

    return (
      <div className="space-y-6">
        <Card title="Final Assessment" icon={CheckCircle}>
          <div className="space-y-4">
            <div className="section-feedback-item">
              <h4>Eligibility status</h4>
              <div
                className={`eligibility-badge ${getEligibilityColor(
                  data.resume_analysis_report.final_assessment
                    .eligibility_status
                )}`}
              >
                <p className="font-medium">
                  {
                    data.resume_analysis_report.final_assessment
                      .eligibility_status
                  }
                </p>
              </div>
            </div>

            <div className="section-feedback-item">
              <h4>Hiring Recommendation</h4>
              <p>
                {
                  data.resume_analysis_report.final_assessment
                    .hiring_recommendation
                }
              </p>
            </div>

            <div className="section-feedback-item">
              <h4>Long-term Potential</h4>
              <p>
                {
                  data.resume_analysis_report.final_assessment
                    .long_term_potential
                }
              </p>
            </div>
          </div>
        </Card>

        <Card title="Key Interview Areas" icon={Target}>
          <ListItem
            items={
              data.resume_analysis_report.final_assessment.key_interview_areas
            }
          />
        </Card>

        <Card title="Onboarding Requirements" icon={Users}>
          <ListItem
            items={
              data.resume_analysis_report.final_assessment
                .onboarding_requirements
            }
          />
        </Card>
      </div>
    );
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "strengths", label: "Strengths", icon: CheckCircle },
    { id: "weaknesses", label: "Weaknesses", icon: AlertCircle },
    { id: "section-feedback", label: "Section Feedback", icon: BookOpen },
    { id: "improvements", label: "Improvements", icon: TrendingUp },
    { id: "skills", label: "Skills Enhancement", icon: Users },
    { id: "assessment", label: "Final Assessment", icon: Award },
    // Add Feedback tab
    { id: "feedback", label: "Feedback", icon: Star },
  ];

  React.useEffect(() => {
    if (downloadOpen && downloadBtnRef.current) {
      const rect = downloadBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [downloadOpen]);

  // Add click-away handler for dropdown
  React.useEffect(() => {
    if (!downloadOpen) return;
    const handleClick = (e: MouseEvent) => {
      const dropdown = document.getElementById("download-dropdown");
      if (dropdown && !dropdown.contains(e.target as Node)) {
        setDownloadOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [downloadOpen]);

  // Remove the loading check since parent component handles it
  if (error) {
    return (
      <div className="resume-analysis-container">
        <div className="error-container">
          <AlertCircle className="error-icon" size={48} />
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={fetchAnalysisData}>
            <RefreshCw size={16} className="mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="resume-analysis-container">
        <div
          className="loading-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            textAlign: "center",
          }}
        >
          <div
            className="loading-spinner"
            style={{
              width: "2rem",
              height: "2rem",
              border: "3px solid #f3f4f6",
              borderTop: "3px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "1rem",
            }}
          ></div>
          <p style={{ color: "#6b7280", fontSize: "1rem" }}>
            Loading analysis...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="resume-analysis-container">
        <div className="error-container">
          <AlertCircle className="error-icon" size={48} />
          <p className="error-message">No analysis data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-analysis-container">
      <div className="resume-analysis-header">
        <div className="resume-analysis-header-content">
          <div className="resume-analysis-title">
            <h1>Resume Analysis Dashboard</h1>
          </div>
          <div
            className="resume-analysis-header-actions"
            style={{ position: "relative" }}
          >
            <Link
              to="/resumechecker"
              onClick={resetAnalysis}
              className="header-button"
            >
              <Plus size={18} />
              New Analysis
            </Link>
            <Link to="/dashboard" className="header-button">
              <BarChart3 size={18} />
              View Dashboard
            </Link>
            <button
              ref={downloadBtnRef}
              className="header-button"
              onClick={() => setDownloadOpen((v) => !v)}
              disabled={!data}
              title="Download Report"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Download size={18} />
              <span>Download</span>
              <ChevronDown size={16} style={{ marginLeft: 2 }} />
            </button>
            {downloadOpen &&
              ReactDOM.createPortal(
                <div
                  id="download-dropdown"
                  style={{
                    position: "absolute",
                    top: dropdownPos.top,
                    left: dropdownPos.left,
                    width: dropdownPos.width,
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                    zIndex: 9999,
                    minWidth: 140,
                    padding: 4,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <button
                    className="dropdown-item"
                    style={{
                      width: "100%",
                      padding: "12px 18px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 15,
                      color: "#222",
                      fontWeight: 500,
                      borderRadius: "8px 8px 0 0",
                      transition: "background 0.15s, color 0.15s",
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "#f3f4ff";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#3b3be6";
                      (e.currentTarget as HTMLButtonElement).style.fontWeight =
                        "600";
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "none";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#222";
                      (e.currentTarget as HTMLButtonElement).style.fontWeight =
                        "500";
                    }}
                    onClick={() => handleDownloadReport("json")}
                  >
                    JSON
                  </button>
                  <button
                    className="dropdown-item"
                    style={{
                      width: "100%",
                      padding: "12px 18px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 15,
                      color: "#222",
                      fontWeight: 500,
                      borderTop: "1px solid #ececff",
                      transition: "background 0.15s, color 0.15s",
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "#f3f4ff";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#3b3be6";
                      (e.currentTarget as HTMLButtonElement).style.fontWeight =
                        "600";
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "none";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#222";
                      (e.currentTarget as HTMLButtonElement).style.fontWeight =
                        "500";
                    }}
                    onClick={() => handleDownloadReport("pdf")}
                  >
                    PDF
                  </button>
                  <button
                    className="dropdown-item"
                    style={{
                      width: "100%",
                      padding: "12px 18px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 15,
                      color: "#222",
                      fontWeight: 500,
                      borderTop: "1px solid #ececff",
                      borderRadius: "0 0 8px 8px",
                      transition: "background 0.15s, color 0.15s",
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "#f3f4ff";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#3b3be6";
                      (e.currentTarget as HTMLButtonElement).style.fontWeight =
                        "600";
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "none";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "#222";
                      (e.currentTarget as HTMLButtonElement).style.fontWeight =
                        "500";
                    }}
                    onClick={() => handleDownloadReport("csv")}
                  >
                    CSV
                  </button>
                </div>,
                document.body
              )}
          </div>
        </div>
      </div>

      <div className="resume-analysis-main">
        <div className="tab-container">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              active={activeTab === tab.id}
              onClick={setActiveTab}
            />
          ))}
        </div>

        <div className="tab-content">
          {activeTab === "overview" && renderOverview()}
          {activeTab === "strengths" && renderStrengths()}
          {activeTab === "weaknesses" && renderWeaknesses()}
          {activeTab === "section-feedback" && renderSectionFeedback()}
          {activeTab === "improvements" && renderImprovements()}
          {activeTab === "skills" && renderSkillsEnhancement()}
          {activeTab === "assessment" && renderFinalAssessment()}
          {/* Feedback Tab */}
          {activeTab === "feedback" && analysisId && (
            <div style={{ width: "100%", padding: "0 20px" }}>
              <FeedbackForm analysisId={analysisId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysisUI;
