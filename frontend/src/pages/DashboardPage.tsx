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
  Download,
  CheckSquare,
  Square,
  ChevronDown,
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { AnalysisResult } from "../types";
import jsPDF from "jspdf";
import Papa from "papaparse";
import ReactDOM from "react-dom";

import "../styles/pages/DashboardPage.css";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, currentAnalysis, analysisHistory, resetAnalysis } =
    useAppContext();
  const [searchTerm, setSearchTerm] = useState("");

  // Bulk download functionality
  const [selectedAnalyses, setSelectedAnalyses] = useState<Set<string>>(
    new Set()
  );
  const [selectAll, setSelectAll] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadBtnRef, setDownloadBtnRef] =
    useState<HTMLButtonElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  // Close bulk download dropdown when clicking outside
  useEffect(() => {
    // This useEffect is no longer needed as the button is persistent
    // but keeping it for now as it might be re-used or removed later.
    // If the button is removed, this can be removed.
  }, []);

  // Update select all when individual selections change
  useEffect(() => {
    const filteredHistory = analysisHistory.filter(
      (analysis) =>
        (analysis.resumeFilename || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        getJobTitle(analysis).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredHistory.length === 0) {
      setSelectAll(false);
      return;
    }

    const allSelected = filteredHistory.every(
      (analysis) => analysis.id && selectedAnalyses.has(analysis.id)
    );
    setSelectAll(allSelected);
  }, [selectedAnalyses, analysisHistory, searchTerm]);

  // Add click-away handler for dropdown
  useEffect(() => {
    if (!downloadOpen) return;
    const handleClick = (e: MouseEvent) => {
      const dropdown = document.getElementById("dashboard-download-dropdown");
      if (dropdown && !dropdown.contains(e.target as Node)) {
        setDownloadOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [downloadOpen]);

  // Update dropdown position when opened
  useEffect(() => {
    if (downloadOpen && downloadBtnRef) {
      const rect = downloadBtnRef.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [downloadOpen, downloadBtnRef]);

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
        (analysis as any).createdAt,
        (analysis as any).updatedAt,
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

  // Bulk selection handlers
  const handleSelectAll = () => {
    const filteredHistory = analysisHistory.filter(
      (analysis) =>
        (analysis.resumeFilename || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        getJobTitle(analysis).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectAll) {
      // Deselect all
      setSelectedAnalyses(new Set());
    } else {
      // Select all
      const newSelected = new Set(
        filteredHistory
          .map((analysis) => analysis.id)
          .filter(Boolean) as string[]
      );
      setSelectedAnalyses(newSelected);
    }
  };

  const handleSelectAnalysis = (analysisId: string | undefined) => {
    if (!analysisId) return;
    const newSelected = new Set(selectedAnalyses);
    if (newSelected.has(analysisId)) {
      newSelected.delete(analysisId);
    } else {
      newSelected.add(analysisId);
    }
    setSelectedAnalyses(newSelected);
  };

  // Bulk download handlers
  const handleBulkDownload = (type: "json" | "pdf" | "csv") => {
    if (selectedAnalyses.size === 0) return;

    const selectedAnalysisData = analysisHistory.filter(
      (analysis) => analysis.id && selectedAnalyses.has(analysis.id)
    );

    const timestamp = new Date().toISOString().split("T")[0];
    const baseFilename = `selected_resume_analyses_${timestamp}`;

    if (type === "json") {
      const filename = `${baseFilename}.json`;
      const json = JSON.stringify(selectedAnalysisData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (type === "pdf") {
      const filename = `${baseFilename}.pdf`;
      const doc = new jsPDF();
      let y = 15;
      const lineHeight = 6;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 10;
      const maxWidth = doc.internal.pageSize.width - 2 * margin;

      doc.setFontSize(16);
      doc.text("Selected Resume Analyses Report", margin, y);
      y += 10;
      doc.setFontSize(10);

      // Recursively print all fields
      const printObject = (obj: any, indent = 0) => {
        Object.entries(obj).forEach(([key, value]) => {
          let prefix = "";
          for (let i = 0; i < indent; i++) prefix += "  ";
          if (typeof value === "object" && value !== null) {
            if (Array.isArray(value)) {
              doc.text(`${prefix}${key}: [Array]`, margin + indent * 5, y);
              y += lineHeight;
              value.forEach((item, idx) => {
                doc.text(`${prefix}  [${idx}]`, margin + (indent + 1) * 5, y);
                y += lineHeight;
                if (typeof item === "object" && item !== null) {
                  printObject(item, indent + 2);
                } else {
                  doc.text(
                    `${prefix}    ${item}`,
                    margin + (indent + 2) * 5,
                    y
                  );
                  y += lineHeight;
                }
              });
            } else {
              doc.text(`${prefix}${key}:`, margin + indent * 5, y);
              y += lineHeight;
              printObject(value, indent + 1);
            }
          } else {
            const text = `${prefix}${key}: ${value}`;
            const lines = doc.splitTextToSize(text, maxWidth - indent * 5);
            lines.forEach((line: string) => {
              if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
              }
              doc.text(line, margin + indent * 5, y);
              y += lineHeight;
            });
          }
          if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
        });
      };

      selectedAnalysisData.forEach((analysis, index) => {
        // Add page break if needed
        if (y > pageHeight - margin - 50) {
          doc.addPage();
          y = margin;
        }

        doc.setFontSize(12);
        doc.text(
          `Analysis ${index + 1}: ${analysis.resumeFilename || "Unknown"}`,
          margin,
          y
        );
        y += 8;
        doc.setFontSize(10);

        // Print all analysis data recursively
        printObject(analysis, 1);
        y += 10;
      });

      doc.save(filename);
    } else if (type === "csv") {
      const filename = `${baseFilename}.csv`;

      // Flatten the data for CSV, including all nested fields
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
            if (value.length === 0) {
              rows.push({ key: fullKey, value: "[]" });
            } else {
              value.forEach((item, idx) => {
                if (typeof item === "object" && item !== null) {
                  rows = rows.concat(flatten(item, `${fullKey}[${idx}]`));
                } else {
                  rows.push({ key: `${fullKey}[${idx}]`, value: item });
                }
              });
            }
          } else {
            rows.push({ key: fullKey, value });
          }
        });
        return rows;
      };

      let rows: any[] = [];
      selectedAnalysisData.forEach((analysis, idx) => {
        rows = rows.concat(flatten(analysis, `analysis[${idx}]`));
      });

      const csv = Papa.unparse([
        ["Field", "Value"],
        ...rows.map((r) => [r.key, r.value]),
      ]);

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    setDownloadOpen(false);
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
    if (score >= 80) return "score-excellent";
    if (score >= 60) return "score-good";
    return "score-poor";
  };

  // Export functionality
  const handleExportData = (type: "csv" | "pdf") => {
    // This function is now deprecated and does nothing.
    // All export logic is handled by the Download button for selected reports as JSON.
    return;
  };

  // Close download dropdown when clicking outside
  useEffect(() => {
    // This useEffect is no longer needed as the button is persistent
    // but keeping it for now as it might be re-used or removed later.
    // If the button is removed, this can be removed.
  }, []);

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

      <div
        className="dashboard-content"
        style={{
          animation: "fadeInUp 1s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: 0,
          animationFillMode: "forwards",
        }}
      >
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
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Analysis History */}
        {analysisHistory.length > 0 && (
          <div className="history-section">
            <div className="history-header">
              <h2 className="section-title">Analysis History</h2>

              <div className="history-actions">
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

                {/* Bulk Download Button */}
                <div
                  className="bulk-export-container"
                  style={{ position: "relative" }}
                >
                  <button
                    ref={setDownloadBtnRef}
                    className="bulk-export-button"
                    onClick={() => setDownloadOpen((v) => !v)}
                    title={
                      selectedAnalyses.size > 0
                        ? `Download ${selectedAnalyses.size} selected analyses`
                        : "Select at least one report to download"
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      backgroundColor:
                        selectedAnalyses.size > 0 ? "#10b981" : "#d1d5db",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor:
                        selectedAnalyses.size > 0 ? "pointer" : "not-allowed",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "background-color 0.2s",
                    }}
                    disabled={selectedAnalyses.size === 0}
                  >
                    <Download size={16} />
                    <span>
                      Download
                      {selectedAnalyses.size > 0
                        ? ` (${selectedAnalyses.size})`
                        : ""}
                    </span>
                    <ChevronDown size={16} style={{ marginLeft: 2 }} />
                  </button>
                </div>

                {/* Download Dropdown */}
                {downloadOpen &&
                  ReactDOM.createPortal(
                    <div
                      id="dashboard-download-dropdown"
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
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "#f3f4ff";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#3b3be6";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.fontWeight = "600";
                        }}
                        onMouseOut={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "none";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#222";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.fontWeight = "500";
                        }}
                        onClick={() => handleBulkDownload("json")}
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
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "#f3f4ff";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#3b3be6";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.fontWeight = "600";
                        }}
                        onMouseOut={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "none";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#222";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.fontWeight = "500";
                        }}
                        onClick={() => handleBulkDownload("pdf")}
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
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "#f3f4ff";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#3b3be6";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.fontWeight = "600";
                        }}
                        onMouseOut={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "none";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#222";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.fontWeight = "500";
                        }}
                        onClick={() => handleBulkDownload("csv")}
                      >
                        CSV
                      </button>
                    </div>,
                    document.body
                  )}

                <div
                  className="export-container"
                  style={{ position: "relative" }}
                >
                  {/* Export All button and dropdown removed as requested */}
                </div>
              </div>
            </div>

            <div className="history-table">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>
                        <button
                          onClick={handleSelectAll}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          title={selectAll ? "Deselect all" : "Select all"}
                        >
                          {selectAll ? (
                            <CheckSquare size={16} color="#3b82f6" />
                          ) : (
                            <Square size={16} color="#6b7280" />
                          )}
                        </button>
                      </th>
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
                          <button
                            onClick={() => handleSelectAnalysis(analysis.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {analysis.id &&
                            selectedAnalyses.has(analysis.id) ? (
                              <CheckSquare size={16} color="#3b82f6" />
                            ) : (
                              <Square size={16} color="#6b7280" />
                            )}
                          </button>
                        </td>
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
