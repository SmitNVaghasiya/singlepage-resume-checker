import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Star, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Zap, 
  Award,
  BookOpen,
  Lightbulb,
  FileText,
  BarChart3,
  Users,
  Brain
} from 'lucide-react';
import { AnalysisResult } from '../types';
import '../styles/components/ComprehensiveAnalysisModal.css';

interface ComprehensiveAnalysisModalProps {
  analysis: AnalysisResult;
  onClose: () => void;
}

const ComprehensiveAnalysisModal: React.FC<ComprehensiveAnalysisModalProps> = ({ analysis, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'skills', label: 'Skills Analysis', icon: Target },
    { id: 'experience', label: 'Experience', icon: Award },
    { id: 'quality', label: 'Resume Quality', icon: FileText },
    { id: 'competitive', label: 'Market Position', icon: TrendingUp },
    { id: 'improvements', label: 'Action Plan', icon: Lightbulb },
    { id: 'insights', label: 'AI Insights', icon: Brain }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const renderContent = () => {
    return (
      <div className="analysis-content">
        <div className="analysis-overview">
          <h3>Comprehensive Analysis Results</h3>
          <div className="score-display">
            <div className="overall-score">
              <span className="score-value">{analysis.overallScore || analysis.score || 0}</span>
              <span className="score-label">Overall Score</span>
            </div>
            <div className="match-percentage">
              <span className="score-value">{analysis.matchPercentage || 0}%</span>
              <span className="score-label">Job Match</span>
            </div>
          </div>
          
          <div className="analysis-text">
            <p>{analysis.overallRecommendation || 'Analysis completed successfully.'}</p>
          </div>

          {/* Strengths */}
          {(analysis.candidateStrengths || analysis.strengths) && (
            <div className="strengths-section">
              <h4><CheckCircle size={16} className="text-green-500" /> Key Strengths</h4>
              <ul>
                {(analysis.candidateStrengths || analysis.strengths || []).map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Development Areas */}
          {(analysis.developmentAreas || analysis.suggestions) && (
            <div className="development-section">
              <h4><AlertCircle size={16} className="text-orange-500" /> Development Areas</h4>
              <ul>
                {(analysis.developmentAreas || analysis.weaknesses || analysis.suggestions || []).map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Insights */}
          {analysis.aiInsights && analysis.aiInsights.length > 0 && (
            <div className="insights-section">
              <h4><Brain size={16} className="text-blue-500" /> AI Insights</h4>
              <ul>
                {analysis.aiInsights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="comprehensive-modal-overlay" onClick={onClose}>
      <div className="comprehensive-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-info">
            <h2>{analysis.resumeFilename || 'Analysis Results'}</h2>
            <p>{analysis.jobTitle || 'Position Analysis'} • {analysis.industry || 'General'}</p>
          </div>
          <div className="header-actions">
            <button className="download-btn">
              <Download size={16} />
              Export Report
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="modal-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveAnalysisModal; 