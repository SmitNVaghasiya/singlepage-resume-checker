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
  X,
  Loader
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { apiService } from '../services/api';
import { AnalysisResult } from '../types';
import ComprehensiveAnalysisModal from '../components/ComprehensiveAnalysisModal';
import '../styles/pages/DashboardPage.css';

const DashboardPage: React.FC = () => {
  const { currentAnalysis, analysisHistory, resetAnalysis } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Calculate statistics
  const totalAnalyses = analysisHistory.length;
  const averageScore = totalAnalyses > 0 
    ? Math.round(analysisHistory.reduce((sum, analysis) => sum + (analysis.overallScore || 0), 0) / totalAnalyses)
    : 0;
  const bestScore = totalAnalyses > 0 
    ? Math.max(...analysisHistory.map(analysis => analysis.overallScore || 0))
    : 0;
  const averageMatchRate = totalAnalyses > 0 
    ? Math.round(analysisHistory.reduce((sum, analysis) => sum + (analysis.matchPercentage || 0), 0) / totalAnalyses)
    : 0;

  // Filter analysis history
  const filteredHistory = analysisHistory.filter(analysis => 
    (analysis.resumeFilename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (analysis.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const loadFullAnalysisDetails = async (analysisId: string) => {
    setLoadingDetails(true);
    try {
      const response = await apiService.getAnalysisResult(analysisId);
      if (response.result) {
        setSelectedAnalysis(response.result);
      }
    } catch (error) {
      console.error('Failed to load analysis details:', error);
      // Still show basic info from history if full details fail to load
      const basicAnalysis = analysisHistory.find(a => a.analysisId === analysisId);
      if (basicAnalysis) {
        setSelectedAnalysis(basicAnalysis);
      }
    } finally {
      setLoadingDetails(false);
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
                    {filteredHistory.map((analysis) => (
                      <tr key={analysis.id} className="table-row">
                        <td>
                          <div className="file-info">
                            <div className="file-icon-wrapper">
                              <FileText className="file-icon" />
                            </div>
                            <span className="file-name">{analysis.resumeFilename || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="job-title">{analysis.jobTitle || 'Not specified'}</td>
                        <td>
                          <div className="date-info">
                            <Calendar className="date-icon" />
                            <span className="date-text">{new Date(analysis.analyzedAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`score-badge ${getScoreBadgeColor(analysis.overallScore || 0)}`}>
                            {analysis.overallScore || 0}/100
                          </span>
                        </td>
                        <td>
                          <button 
                            className="view-details-btn"
                            onClick={() => loadFullAnalysisDetails(analysis.analysisId)}
                            disabled={loadingDetails}
                          >
                            {loadingDetails ? (
                              <Loader className="view-icon animate-spin" />
                            ) : (
                              <Eye className="view-icon" />
                            )}
                            {loadingDetails ? 'Loading...' : 'View Details'}
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

        {/* Comprehensive Analysis Modal */}
        {selectedAnalysis && (
          <ComprehensiveAnalysisModal
            analysis={selectedAnalysis}
            onClose={() => setSelectedAnalysis(null)}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;