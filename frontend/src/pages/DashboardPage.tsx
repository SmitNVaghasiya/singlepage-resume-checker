import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Star, 
  Download, 
  FileText, 
  Calendar, 
  Search,
  Eye,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const DashboardPage: React.FC = () => {
  const { currentAnalysis, analysisHistory, resetAnalysis } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate statistics
  const totalAnalyses = analysisHistory.length;
  const averageScore = totalAnalyses > 0 
    ? Math.round(analysisHistory.reduce((sum, analysis) => sum + analysis.score, 0) / totalAnalyses)
    : 0;
  const bestScore = totalAnalyses > 0 
    ? Math.max(...analysisHistory.map(analysis => analysis.score))
    : 0;

  // Filter analysis history
  const filteredHistory = analysisHistory.filter(analysis => 
    analysis.resumeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analysis.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="hero-header">
        <div className="container">
          <div className="hero-header-content">
            <div>
              <h1 className="hero-title">Analysis Dashboard</h1>
              <p className="hero-subtitle">Track your resume analysis history and improvements</p>
            </div>
            <Link
              to="/"
              onClick={resetAnalysis}
              className="hero-cta"
            >
              <Plus className="h-5 w-5" />
              <span>New Analysis</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container pb-16">
        {/* Statistics Cards */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-icon-wrapper blue">
                <FileText className="stat-icon blue" />
              </div>
              <div>
                <div className="stat-value">{totalAnalyses}</div>
                <div className="stat-label">Total Analyses</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-icon-wrapper green">
                <TrendingUp className="stat-icon green" />
              </div>
              <div>
                <div className="stat-value">{averageScore}</div>
                <div className="stat-label">Average Score</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-icon-wrapper purple">
                <Star className="stat-icon purple" />
              </div>
              <div>
                <div className="stat-value">{bestScore}</div>
                <div className="stat-label">Best Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Analysis Section */}
        {currentAnalysis && (
          <div className="mb-8">
            <div className="analysis-header">
              <h2 className="analysis-title">Latest Analysis</h2>
              <button className="download-btn">
                <Download className="h-4 w-4" />
                <span>Download Report</span>
              </button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="score-grid">
                <div className="score-card blue">
                  <div className="score-value blue">{currentAnalysis.score}</div>
                  <div className="score-label">Overall Score</div>
                  <div className="score-sublabel">Out of 100</div>
                </div>

                <div className="score-card green">
                  <div className="score-value green">{currentAnalysis.matchPercentage}%</div>
                  <div className="score-label">Job Match</div>
                  <div className="score-sublabel">Compatibility</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Remarks</h3>
                <p className="text-gray-700 leading-relaxed">{currentAnalysis.remarks}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-bold text-gray-900">Strengths</h3>
                  </div>
                  <div className="space-y-2">
                    {currentAnalysis.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-bold text-gray-900">Improvements</h3>
                  </div>
                  <div className="space-y-2">
                    {currentAnalysis.improvements.map((improvement, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-orange-50 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis History */}
        {analysisHistory.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Analysis History</h2>
              
              {/* Search */}
              <div className="search-wrapper">
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
            
            <div className="data-table">
              <div className="data-table-wrapper">
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
                      <tr key={analysis.id}>
                        <td>
                          <div className="table-file-info">
                            <FileText className="table-file-icon" />
                            <span className="table-file-name">{analysis.resumeName}</span>
                          </div>
                        </td>
                        <td className="table-job-title">{analysis.jobTitle}</td>
                        <td>
                          <div className="table-date">
                            <Calendar className="table-date-icon" />
                            <span className="table-date-text">{new Date(analysis.analyzedAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${getScoreBadgeColor(analysis.score)}`}>
                            {analysis.score}/100
                          </span>
                        </td>
                        <td>
                          <button className="table-action">
                            <Eye className="h-4 w-4" />
                            <span>View Details</span>
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
            <BarChart3 className="empty-state-icon" />
            <h3 className="empty-state-title">No Analyses Yet</h3>
            <p className="empty-state-description">Start by analyzing your first resume to see results here.</p>
            <Link
              to="/"
              onClick={resetAnalysis}
              className="btn btn-primary"
            >
              <Plus className="h-5 w-5" />
              <span>Analyze Resume</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;