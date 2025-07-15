import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  X,
  Loader,
  Lock
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { apiService } from '../services/api';
import { AnalysisResult } from '../types';
import DashboardAnalysisView from '../components/DashboardAnalysisView';
import AuthModal from '../components/AuthModal';
import '../styles/pages/DashboardPage.css';
import '../styles/components/AuthModal.css';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthLoading, currentAnalysis, analysisHistory, resetAnalysis, addAnalysisToHistory } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  // Remove all state and logic for selectedAnalysis, loadingDetails, and modal rendering

  // Check authentication when component mounts
  useEffect(() => {
    if (!isAuthLoading && !user) {
      // setShowAuthModal(true); // This line is removed as per the edit hint
    }
  }, [user, isAuthLoading]);

  // Handle successful authentication
  const handleAuthSuccess = () => {
    // setShowAuthModal(false); // This line is removed as per the edit hint
    // Reload the page to fetch user's analysis history
    window.location.reload();
  };

  // Handle auth modal close
  const handleAuthModalClose = () => {
    // setShowAuthModal(false); // This line is removed as per the edit hint
    navigate('/'); // Redirect to homepage if user closes auth modal
  };

  // Don't render content until we know authentication status
  if (isAuthLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <Loader className="loading-spinner" />
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
            <p>Please sign in to view your analysis dashboard and track your resume improvements.</p>
            <button 
              onClick={() => {
                navigate('/login?redirect=/dashboard');
              }}
              className="auth-required-btn"
            >
              Sign In to Continue
            </button>
          </div>
        </div>

        {/* {showAuthModal && ( // This block is removed as per the edit hint */}
        {/*   <AuthModal // This block is removed as per the edit hint */}
        {/*     isOpen={showAuthModal} // This block is removed as per the edit hint */}
        {/*     onAuthSuccess={handleAuthSuccess} // This block is removed as per the edit hint */}
        {/*     onClose={handleAuthModalClose} // This block is removed as per the edit hint */}
        {/*   /> // This block is removed as per the edit hint */}
        {/* )} // This block is removed as per the edit hint */}
      </div>
    );
  }

  // Helper functions to handle both new and legacy formats
  const getAnalysisScore = (analysis: AnalysisResult): number => {
    const score = analysis.score_out_of_100 || analysis.overallScore || (analysis as any).score || 0;
    return typeof score === 'number' ? Math.max(0, Math.min(100, score)) : 0;
  };

  const getMatchPercentage = (analysis: AnalysisResult): number => {
    const percentage = analysis.chance_of_selection_percentage || analysis.matchPercentage || 0;
    return typeof percentage === 'number' ? Math.max(0, Math.min(100, percentage)) : 0;
  };

  const getJobTitle = (analysis: AnalysisResult): string => {
    return analysis.resume_analysis_report?.candidate_information?.position_applied ||
           analysis.jobTitle ||
           'Position Analysis';
  };

  const getAnalyzedDate = (analysis: AnalysisResult): string => {
    try {
      if (!analysis.analyzedAt) {
        return 'Recently';
      }
      const date = new Date(analysis.analyzedAt);
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  // Calculate statistics
  const totalAnalyses = analysisHistory.length;
  const averageScore = totalAnalyses > 0 
    ? Math.round(analysisHistory.reduce((sum, analysis) => sum + getAnalysisScore(analysis), 0) / totalAnalyses)
    : 0;
  const bestScore = totalAnalyses > 0 
    ? Math.max(...analysisHistory.map(analysis => getAnalysisScore(analysis)))
    : 0;
  const averageMatchRate = totalAnalyses > 0 
    ? Math.round(analysisHistory.reduce((sum, analysis) => sum + getMatchPercentage(analysis), 0) / totalAnalyses)
    : 0;

  // Filter analysis history
  const filteredHistory = analysisHistory.filter(analysis => 
    (analysis.resumeFilename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    getJobTitle(analysis).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const loadFullAnalysisDetails = async (analysisId: string) => {
    // setLoadingDetails(true); // This line is removed as per the edit hint
    try {
      const response = await apiService.getAnalysisResult(analysisId);
      if (response.result) {
        // setSelectedAnalysis(response.result); // This line is removed as per the edit hint
      }
    } catch (error) {
      console.error('Failed to load analysis details:', error);
      // Still show basic info from history if full details fail to load
      const basicAnalysis = analysisHistory.find(a => a.analysisId === analysisId);
      if (basicAnalysis) {
        // setSelectedAnalysis(basicAnalysis); // This line is removed as per the edit hint
      }
    } finally {
      // setLoadingDetails(false); // This line is removed as per the edit hint
    }
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
                    {filteredHistory.map((analysis: AnalysisResult) => (
                      <tr key={analysis.id} className="table-row">
                        <td>
                          <div className="file-info">
                            <div className="file-icon-wrapper">
                              <FileText className="file-icon" />
                            </div>
                            <span className="file-name">{analysis.resumeFilename || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="job-title">{getJobTitle(analysis)}</td>
                        <td>
                          <div className="date-info">
                            <Calendar className="date-icon" />
                            <span className="date-text">{getAnalyzedDate(analysis)}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`score-badge ${getScoreBadgeColor(getAnalysisScore(analysis))}`}>
                            {getAnalysisScore(analysis)}/100
                          </span>
                        </td>
                        <td>
                          <button 
                            className="view-details-btn"
                            onClick={() => {
                              const analysisId = analysis.analysisId || analysis.id;
                              if (analysisId) {
                                navigate(`/dashboard/analysis/${analysisId}`);
                              }
                            }}
                            // disabled={loadingDetails} // This line is removed as per the edit hint
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
              to="/resumechecker"
              onClick={resetAnalysis}
              className="start-analysis-btn"
            >
              <Plus className="btn-icon" />
              <span>Analyze Resume</span>
            </Link>
          </div>
        )}

        {/* Dashboard Analysis View */}
        {/* This section is removed as per the edit hint */}
      </div>
    </div>
  );
};

export default DashboardPage;