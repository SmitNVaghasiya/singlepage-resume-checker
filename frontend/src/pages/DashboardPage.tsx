import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  FileText, 
  Calendar, 
  Search,
  Eye,
  Plus,
  CheckCircle,
  AlertCircle,
  Target,
  Award,
  Activity,
  Star,
  X
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import '../styles/pages/DashboardPage.css';

const DashboardPage: React.FC = () => {
  const { currentAnalysis, analysisHistory, resetAnalysis } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);

  // Calculate statistics
  const totalAnalyses = analysisHistory.length;
  const averageScore = totalAnalyses > 0 
    ? Math.round(analysisHistory.reduce((sum, analysis) => sum + analysis.score, 0) / totalAnalyses)
    : 0;
  const bestScore = totalAnalyses > 0 
    ? Math.max(...analysisHistory.map(analysis => analysis.score))
    : 0;
  const averageMatchRate = totalAnalyses > 0 
    ? Math.round(analysisHistory.reduce((sum, analysis) => sum + analysis.matchPercentage, 0) / totalAnalyses)
    : 0;

  // Filter analysis history
  const filteredHistory = analysisHistory.filter(analysis => 
    analysis.resumeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analysis.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="header-text">
            <h1 className="dashboard-title">Analysis Dashboard</h1>
            <p className="dashboard-subtitle">Track your resume analysis history and improvements</p>
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
                    {filteredHistory.map((analysis) => (
                      <tr key={analysis.id} className="table-row">
                        <td>
                          <div className="file-info">
                            <div className="file-icon-wrapper">
                              <FileText className="file-icon" />
                            </div>
                            <span className="file-name">{analysis.resumeName}</span>
                          </div>
                        </td>
                        <td className="job-title">{analysis.jobTitle}</td>
                        <td>
                          <div className="date-info">
                            <Calendar className="date-icon" />
                            <span className="date-text">{new Date(analysis.analyzedAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`score-badge ${getScoreBadgeColor(analysis.score)}`}>
                            {analysis.score}/100
                          </span>
                        </td>
                        <td>
                          <button 
                            className="view-details-btn"
                            onClick={() => setSelectedAnalysis(analysis)}
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
            <p className="empty-description">Start by analyzing your first resume to see results here.</p>
            <Link
              to="/"
              onClick={resetAnalysis}
              className="start-analysis-btn"
            >
              <Plus className="btn-icon" />
              <span>Analyze Resume</span>
            </Link>
          </div>
        )}

        {/* Analysis Details Modal - Redesigned */}
        {selectedAnalysis && (
          <div className="modal-overlay" onClick={() => setSelectedAnalysis(null)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="modal-header">
                <div className="modal-header-content">
                  <h2 className="modal-title">Analysis Details</h2>
                  <button 
                    className="modal-close-btn"
                    onClick={() => setSelectedAnalysis(null)}
                  >
                    <X size={20} />
                  </button>
                </div>
                <button className="download-report-btn">
                  <Download size={16} />
                  <span>Download Report</span>
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="modal-content">
                {/* Stats Overview */}
                <div className="modal-stats">
                  <div className="modal-stat-card primary">
                    <div className="stat-icon-circle">
                      <Activity size={20} />
                    </div>
                    <div className="stat-info">
                      <div className="stat-number">{selectedAnalysis.score}</div>
                      <div className="stat-title">Overall Score</div>
                      <div className="stat-subtitle">Out of 100</div>
                    </div>
                  </div>
                  
                  <div className="modal-stat-card success">
                    <div className="stat-icon-circle">
                      <Target size={20} />
                    </div>
                    <div className="stat-info">
                      <div className="stat-number">{selectedAnalysis.matchPercentage}%</div>
                      <div className="stat-title">Job Match</div>
                      <div className="stat-subtitle">Compatibility</div>
                    </div>
                  </div>
                  
                  <div className="modal-stat-card info">
                    <div className="stat-icon-circle">
                      <Calendar size={20} />
                    </div>
                    <div className="stat-info">
                      <div className="stat-number">{new Date(selectedAnalysis.analyzedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      <div className="stat-title">Analysis Date</div>
                      <div className="stat-subtitle">Last Updated</div>
                    </div>
                  </div>
                </div>

                {/* File Information */}
                <div className="file-meta">
                  <div className="meta-item">
                    <FileText size={16} className="meta-icon" />
                    <div className="meta-text">
                      <span className="meta-label">Resume File</span>
                      <span className="meta-value">{selectedAnalysis.resumeName}</span>
                    </div>
                  </div>
                  <div className="meta-item">
                    <Target size={16} className="meta-icon" />
                    <div className="meta-text">
                      <span className="meta-label">Target Position</span>
                      <span className="meta-value">{selectedAnalysis.jobTitle}</span>
                    </div>
                  </div>
                </div>

                {/* Analysis Sections */}
                <div className="analysis-sections">
                  {/* AI Analysis */}
                  <div className="analysis-section">
                    <div className="section-header">
                      <div className="section-icon ai">
                        <Star size={18} />
                      </div>
                      <h3 className="section-title">AI Analysis</h3>
                    </div>
                    <div className="section-content">
                      <p className="analysis-text">{selectedAnalysis.remarks}</p>
                    </div>
                  </div>

                  {/* Strengths & Improvements Grid */}
                  <div className="feedback-grid">
                    {/* Strengths */}
                    <div className="analysis-section">
                      <div className="section-header">
                        <div className="section-icon success">
                          <CheckCircle size={18} />
                        </div>
                        <h3 className="section-title">Strengths</h3>
                        <span className="item-count">{selectedAnalysis.strengths.length}</span>
                      </div>
                      <div className="section-content">
                        <div className="feedback-list">
                          {selectedAnalysis.strengths.map((strength: string, index: number) => (
                            <div key={index} className="feedback-item success">
                              <div className="feedback-dot success"></div>
                              <span className="feedback-text">{strength}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Improvements */}
                    <div className="analysis-section">
                      <div className="section-header">
                        <div className="section-icon warning">
                          <AlertCircle size={18} />
                        </div>
                        <h3 className="section-title">Improvements</h3>
                        <span className="item-count">{selectedAnalysis.improvements.length}</span>
                      </div>
                      <div className="section-content">
                        <div className="feedback-list">
                          {selectedAnalysis.improvements.map((improvement: string, index: number) => (
                            <div key={index} className="feedback-item warning">
                              <div className="feedback-dot warning"></div>
                              <span className="feedback-text">{improvement}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;