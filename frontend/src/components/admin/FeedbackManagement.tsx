import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Calendar,
  User,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { AdminFeedbackService, AdminFeedbackData, FeedbackStats, FeedbackFilters } from '../../services/AdminFeedbackService';
import './FeedbackManagement.css';

const FeedbackManagement: React.FC = () => {
  const [feedback, setFeedback] = useState<AdminFeedbackData[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FeedbackFilters>({
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [selectedFeedback, setSelectedFeedback] = useState<AdminFeedbackData | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [feedbackResponse, statsResponse] = await Promise.all([
        AdminFeedbackService.getAllFeedback(filters),
        AdminFeedbackService.getFeedbackStats()
      ]);

      setFeedback(feedbackResponse.data);
      setPagination(feedbackResponse.pagination);
      setStats(statsResponse);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FeedbackFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleStatusUpdate = async (feedbackId: string, status: string, adminNotes?: string) => {
    try {
      await AdminFeedbackService.updateFeedback(feedbackId, { status, adminNotes });
      await loadData(); // Reload data
      setSelectedFeedback(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update feedback');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await AdminFeedbackService.exportFeedback(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to export feedback');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-yellow-500" />;
      case 'reviewed': return <Eye size={16} className="text-blue-500" />;
      case 'addressed': return <CheckCircle size={16} className="text-green-500" />;
      case 'closed': return <XCircle size={16} className="text-gray-500" />;
      default: return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'addressed': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <MessageSquare size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalFeedback}</h3>
            <p>Total Feedback</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Star size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.averageRating.toFixed(1)}</h3>
            <p>Average Rating</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <ThumbsUp size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.helpfulPercentage.toFixed(1)}%</h3>
            <p>Helpful Rate</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending Review</p>
          </div>
        </div>
      </div>
    );
  };

  const renderFilters = () => {
    return (
      <div className={`filters-panel ${showFilters ? 'expanded' : ''}`}>
        <div className="filters-header">
          <h3>Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="filter-toggle"
          >
            <Filter size={16} />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
        
        {showFilters && (
          <div className="filters-content">
            <div className="filter-row">
              <div className="filter-group">
                <label>Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="addressed">Addressed</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Category</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                >
                  <option value="">All Categories</option>
                  <option value="general">General</option>
                  <option value="accuracy">Accuracy</option>
                  <option value="usefulness">Usefulness</option>
                  <option value="interface">Interface</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Rating</label>
                <select
                  value={filters.rating || ''}
                  onChange={(e) => handleFilterChange('rating', e.target.value ? parseInt(e.target.value) : undefined)}
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>
            </div>
            
            <div className="filter-row">
              <div className="filter-group">
                <label>Helpful</label>
                <select
                  value={filters.helpful?.toString() || ''}
                  onChange={(e) => handleFilterChange('helpful', e.target.value ? e.target.value === 'true' : undefined)}
                >
                  <option value="">All</option>
                  <option value="true">Helpful</option>
                  <option value="false">Not Helpful</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Search in suggestions..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                />
              </div>
            </div>
            
            <div className="filter-actions">
              <button
                onClick={() => setFilters({ page: 1, limit: 20 })}
                className="clear-filters"
              >
                Clear Filters
              </button>
              <button
                onClick={handleExport}
                className="export-button"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFeedbackList = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading feedback...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <AlertCircle size={48} />
          <p>{error}</p>
          <button onClick={loadData} className="retry-button">
            Retry
          </button>
        </div>
      );
    }

    if (feedback.length === 0) {
      return (
        <div className="empty-container">
          <MessageSquare size={48} />
          <p>No feedback found</p>
        </div>
      );
    }

    return (
      <div className="feedback-list">
        {feedback.map((item) => (
          <div key={item.feedbackId} className="feedback-item">
            <div className="feedback-header">
              <div className="feedback-meta">
                <div className="feedback-rating">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < item.rating ? 'filled' : 'empty'}
                    />
                  ))}
                </div>
                <span className="feedback-date">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <span className={`status-badge ${getStatusColor(item.status)}`}>
                  {getStatusIcon(item.status)}
                  {item.status}
                </span>
              </div>
              
              <div className="feedback-actions">
                <button
                  onClick={() => setSelectedFeedback(item)}
                  className="action-button"
                  title="View Details"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>
            
            <div className="feedback-content">
              <div className="feedback-category">
                <span className="category-badge">{item.category}</span>
                {item.helpful ? (
                  <ThumbsUp size={16} className="text-green-500" />
                ) : (
                  <ThumbsDown size={16} className="text-red-500" />
                )}
              </div>
              
              <p className="feedback-suggestions">
                {item.suggestions.length > 150
                  ? `${item.suggestions.substring(0, 150)}...`
                  : item.suggestions}
              </p>
              
              {item.analysis && (
                <div className="feedback-analysis">
                  <FileText size={14} />
                  <span>{item.analysis.resumeFilename}</span>
                  {item.analysis.jobTitle && (
                    <>
                      <span>•</span>
                      <span>{item.analysis.jobTitle}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPagination = () => {
    if (pagination.pages <= 1) return null;

    return (
      <div className="pagination">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className="pagination-button"
        >
          Previous
        </button>
        
        <span className="pagination-info">
          Page {pagination.page} of {pagination.pages}
        </span>
        
        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.pages}
          className="pagination-button"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="feedback-management">
      <div className="feedback-header">
        <h1>Feedback Management</h1>
        <p>Monitor and manage user feedback for analysis results</p>
      </div>

      {renderStats()}
      {renderFilters()}
      {renderFeedbackList()}
      {renderPagination()}

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="modal-overlay" onClick={() => setSelectedFeedback(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Feedback Details</h2>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="close-button"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h3>Feedback Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Rating:</label>
                    <div className="rating-display">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={20}
                          className={i < selectedFeedback.rating ? 'filled' : 'empty'}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <label>Helpful:</label>
                    <span>{selectedFeedback.helpful ? 'Yes' : 'No'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Category:</label>
                    <span>{selectedFeedback.category}</span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge ${getStatusColor(selectedFeedback.status)}`}>
                      {selectedFeedback.status}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <label>Submitted:</label>
                    <span>{new Date(selectedFeedback.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Suggestions</h3>
                <p className="suggestions-text">{selectedFeedback.suggestions}</p>
              </div>
              
              {selectedFeedback.analysis && (
                <div className="detail-section">
                  <h3>Analysis Details</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Resume:</label>
                      <span>{selectedFeedback.analysis.resumeFilename}</span>
                    </div>
                    
                    {selectedFeedback.analysis.jobTitle && (
                      <div className="detail-item">
                        <label>Job Title:</label>
                        <span>{selectedFeedback.analysis.jobTitle}</span>
                      </div>
                    )}
                    
                    {selectedFeedback.analysis.industry && (
                      <div className="detail-item">
                        <label>Industry:</label>
                        <span>{selectedFeedback.analysis.industry}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="detail-section">
                <h3>Admin Actions</h3>
                <div className="admin-actions">
                  <select
                    value={selectedFeedback.status}
                    onChange={(e) => handleStatusUpdate(selectedFeedback.feedbackId, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="addressed">Addressed</option>
                    <option value="closed">Closed</option>
                  </select>
                  
                  <textarea
                    placeholder="Add admin notes..."
                    value={selectedFeedback.adminNotes || ''}
                    onChange={(e) => handleStatusUpdate(selectedFeedback.feedbackId, selectedFeedback.status, e.target.value)}
                    className="admin-notes"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement; 