import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Star, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  User, 
  Zap, 
  Award,
  BookOpen,
  Lightbulb,
  FileText,
  Users,
  Brain,
  ClipboardList,
  Settings,
  TrendingDown,
  Briefcase,
  BarChart3
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { apiService } from '../services/api';
import '../styles/components/ComprehensiveAnalysisModal.css';

interface ComprehensiveAnalysisModalProps {
  analysis: AnalysisResult;
  onClose: () => void;
}

const ComprehensiveAnalysisModal: React.FC<ComprehensiveAnalysisModalProps> = ({ analysis, onClose }) => {
  const { user } = useAppContext();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string>('');

  const handleExportReport = async () => {
    if (!user) {
      setExportError('Please log in to export reports');
      return;
    }

    setIsExporting(true);
    setExportError('');
    setExportSuccess(false);

    try {
      await apiService.exportAnalysisReport(analysis.analysisId || '', {
        userEmail: user.email,
        userName: user.username,
        format: 'pdf'
      });
      
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to export report:', error);
      setExportError(error instanceof Error ? error.message : 'Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper functions to get data from both new and legacy formats
  const getScore = () => analysis.score_out_of_100 || analysis.overallScore || (analysis as any).overallScore || 0;
  const getChance = () => analysis.chance_of_selection_percentage || analysis.matchPercentage || (analysis as any).matchPercentage || 0;
  const getJobTitle = () => analysis.jobTitle || (analysis as any).jobTitle || 'Position Analysis';
  const getIndustry = () => analysis.industry || (analysis as any).industry || 'General';
  
  const getOverallRecommendation = () => {
    return analysis.short_conclusion || 
           analysis.overallRecommendation || 
           (analysis as any).overallRecommendation || 
           'Analysis completed successfully.';
  };

  const getCandidateStrengths = (): string[] => {
    if (analysis.resume_analysis_report?.strengths_analysis) {
      return [
        ...analysis.resume_analysis_report.strengths_analysis.technical_skills,
        ...analysis.resume_analysis_report.strengths_analysis.project_portfolio,
        ...analysis.resume_analysis_report.strengths_analysis.educational_background
      ];
    }
    return analysis.candidateStrengths || 
           (analysis as any).candidateStrengths || 
           (analysis as any).strengths || 
           [];
  };

  const getDevelopmentAreas = () => {
    if (analysis.resume_improvement_priority?.length) {
      return analysis.resume_improvement_priority;
    }
    return analysis.developmentAreas || 
           (analysis as any).developmentAreas || 
           (analysis as any).weaknesses || 
           [];
  };

  const getAIInsights = () => {
    return (analysis as any).aiInsights || [];
  };

  const getKeywordMatch = () => {
    return (analysis as any).keywordMatch || null;
  };

  const getSkillsAnalysis = () => {
    return (analysis as any).skillsAnalysis || null;
  };

  const getResumeQuality = () => {
    return (analysis as any).resumeQuality || null;
  };

  const getCompetitiveAnalysis = () => {
    return (analysis as any).competitiveAnalysis || null;
  };

  const getDetailedFeedback = () => {
    return (analysis as any).detailedFeedback || null;
  };

  const getImprovementPlan = () => {
    return (analysis as any).improvementPlan || null;
  };

  return (
    <div className="comprehensive-modal-overlay" onClick={onClose}>
      <div className="comprehensive-modal fullscreen" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-info">
            <h2>{analysis.resumeFilename || 'Comprehensive Analysis Report'}</h2>
            <p>
              {getJobTitle()} • 
              Score: {getScore()}/100 • 
              Selection Chance: {getChance()}%
            </p>
          </div>
          <div className="header-actions">
            <button 
              className={`download-btn ${isExporting ? 'loading' : ''} ${exportSuccess ? 'success' : ''}`}
              onClick={handleExportReport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <div className="spinner"></div>
                  <span>Exporting...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle size={16} />
                  <span>Sent to Email!</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Export Report</span>
                </>
              )}
            </button>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Single Page Content */}
        <div className="modal-body single-page">
          <div className="analysis-content">
            
            {/* Overview Section */}
            <section className="analysis-section overview-section">
              <div className="section-header">
                <div className="section-title">
                  <Target className="section-icon" />
                  <h2>Analysis Overview</h2>
                </div>
              </div>
              
              <div className="overview-grid">
                <div className="overview-card primary">
                  <div className="card-value">{getScore()}</div>
                  <div className="card-label">Resume Score</div>
                  <div className="card-sublabel">Out of 100</div>
                </div>
                <div className="overview-card success">
                  <div className="card-value">{getChance()}%</div>
                  <div className="card-label">Selection Chance</div>
                  <div className="card-sublabel">Probability</div>
                </div>
                <div className="overview-card info">
                  <div className="card-value">{analysis.resume_eligibility || 'Eligible'}</div>
                  <div className="card-label">Resume Status</div>
                  <div className="card-sublabel">Eligibility</div>
                </div>
                <div className="overview-card warning">
                  <div className="card-value">{analysis.job_description_validity || 'Valid'}</div>
                  <div className="card-label">Job Description</div>
                  <div className="card-sublabel">Validity</div>
                </div>
              </div>

              <div className="summary-box">
                <h3>AI Analysis Summary</h3>
                <p>{getOverallRecommendation()}</p>
                
                {analysis.overall_fit_summary && (
                  <div className="fit-summary">
                    <h4>Overall Fit Assessment</h4>
                    <p>{analysis.overall_fit_summary}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Two Column Layout for Main Content */}
            <div className="main-content-grid">
              
              {/* Left Column */}
              <div className="left-column">
                
                {/* Candidate Information */}
                {analysis.resume_analysis_report?.candidate_information ? (
                  <section className="analysis-section">
                    <div className="section-header">
                      <div className="section-title">
                        <User className="section-icon" />
                        <h2>Candidate Profile</h2>
                      </div>
                    </div>
                    <div className="candidate-grid">
                      <div className="candidate-item">
                        <Briefcase size={16} />
                        <div>
                          <strong>Name:</strong>
                          <span>{analysis.resume_analysis_report.candidate_information.name}</span>
                        </div>
                      </div>
                      <div className="candidate-item">
                        <Target size={16} />
                        <div>
                          <strong>Position:</strong>
                          <span>{analysis.resume_analysis_report.candidate_information.position_applied}</span>
                        </div>
                      </div>
                      <div className="candidate-item">
                        <Award size={16} />
                        <div>
                          <strong>Experience:</strong>
                          <span>{analysis.resume_analysis_report.candidate_information.experience_level}</span>
                        </div>
                      </div>
                      <div className="candidate-item">
                        <CheckCircle size={16} />
                        <div>
                          <strong>Status:</strong>
                          <span>{analysis.resume_analysis_report.candidate_information.current_status}</span>
                        </div>
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="analysis-section">
                    <div className="section-header">
                      <div className="section-title">
                        <FileText className="section-icon" />
                        <h2>Analysis Summary</h2>
                      </div>
                    </div>
                    <div className="analysis-meta">
                      <div className="meta-item">
                        <strong>Job Title:</strong> {getJobTitle()}
                      </div>
                      <div className="meta-item">
                        <strong>Industry:</strong> {getIndustry()}
                      </div>
                      <div className="meta-item">
                        <strong>Confidence:</strong> {(analysis as any).confidence || 85}%
                      </div>
                      {(analysis as any).processingTime && (
                        <div className="meta-item">
                          <strong>Processing Time:</strong> {(analysis as any).processingTime}ms
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Strengths */}
                <section className="analysis-section strengths-section">
                  <div className="section-header">
                    <div className="section-title">
                      <Star className="section-icon success" />
                      <h2>Key Strengths</h2>
                    </div>
                  </div>
                  
                  <div className="strengths-content">
                    <div className="strength-group">
                      <h3><CheckCircle size={18} /> Identified Strengths</h3>
                      <div className="item-list">
                        {getCandidateStrengths().map((strength: string, index: number) => (
                          <div key={index} className="list-item success">
                            <CheckCircle size={16} />
                            <span>{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technical Skills from Legacy Format */}
                    {getSkillsAnalysis() && getSkillsAnalysis().technical.present.length > 0 && (
                      <div className="strength-group">
                        <h3><Settings size={18} /> Technical Skills Found</h3>
                        <div className="item-list">
                          {getSkillsAnalysis().technical.present.map((skill: string, index: number) => (
                            <div key={index} className="list-item success">
                              <Settings size={16} />
                              <span>{skill}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Keyword Matches */}
                    {getKeywordMatch() && getKeywordMatch().matched.length > 0 && (
                      <div className="strength-group">
                        <h3><Target size={18} /> Matched Keywords</h3>
                        <div className="item-list">
                          {getKeywordMatch().matched.map((keyword: string, index: number) => (
                            <div key={index} className="list-item success">
                              <Target size={16} />
                              <span>{keyword}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* AI Insights */}
                {getAIInsights().length > 0 && (
                  <section className="analysis-section insights-section">
                    <div className="section-header">
                      <div className="section-title">
                        <Brain className="section-icon info" />
                        <h2>AI Insights</h2>
                      </div>
                    </div>
                    
                    <div className="insights-content">
                      <div className="insight-group">
                        <div className="item-list">
                          {getAIInsights().map((insight: string, index: number) => (
                            <div key={index} className="list-item info">
                              <Brain size={16} />
                              <span>{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Industry Insights from Detailed Feedback */}
                      {getDetailedFeedback() && getDetailedFeedback().industryInsights && getDetailedFeedback().industryInsights.length > 0 && (
                        <div className="insight-group">
                          <h3><Briefcase size={18} /> Industry Insights</h3>
                          <div className="item-list">
                            {getDetailedFeedback().industryInsights.map((insight: string, index: number) => (
                              <div key={index} className="list-item info">
                                <Briefcase size={16} />
                                <span>{insight}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Improvement Plan from Legacy Format */}
                {getImprovementPlan() && (
                  <section className="analysis-section recommendations-section">
                    <div className="section-header">
                      <div className="section-title">
                        <Lightbulb className="section-icon warning" />
                        <h2>Improvement Plan</h2>
                      </div>
                    </div>
                    
                    <div className="recommendations-content">
                      {getImprovementPlan().immediate && getImprovementPlan().immediate.length > 0 && (
                        <div className="recommendation-group immediate">
                          <h3><Zap size={18} /> Immediate Actions</h3>
                          <div className="item-list">
                            {getImprovementPlan().immediate.map((item: { actions?: string[]; estimatedImpact: string }, index: number) => (
                              <div key={index} className="list-item immediate">
                                <AlertCircle size={16} />
                                <span>{item.actions?.join(', ') || 'Action needed'} (Impact: {item.estimatedImpact})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {getImprovementPlan().shortTerm && getImprovementPlan().shortTerm.length > 0 && (
                        <div className="recommendation-group short-term">
                          <h3><TrendingUp size={18} /> Short-term Goals</h3>
                          <div className="item-list">
                            {getImprovementPlan().shortTerm.map((item: { actions?: string[]; estimatedImpact: string }, index: number) => (
                              <div key={index} className="list-item short-term">
                                <TrendingUp size={16} />
                                <span>{item.actions?.join(', ') || 'Goal to achieve'} (Impact: {item.estimatedImpact})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {getImprovementPlan().longTerm && getImprovementPlan().longTerm.length > 0 && (
                        <div className="recommendation-group long-term">
                          <h3><Award size={18} /> Long-term Objectives</h3>
                          <div className="item-list">
                            {getImprovementPlan().longTerm.map((item: { actions?: string[]; estimatedImpact: string }, index: number) => (
                              <div key={index} className="list-item long-term">
                                <Award size={16} />
                                <span>{item.actions?.join(', ') || 'Long-term goal'} (Impact: {item.estimatedImpact})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column */}
              <div className="right-column">
                
                {/* Areas for Improvement */}
                <section className="analysis-section weaknesses-section">
                  <div className="section-header">
                    <div className="section-title">
                      <TrendingDown className="section-icon error" />
                      <h2>Areas for Improvement</h2>
                    </div>
                  </div>
                  
                  <div className="weaknesses-content">
                    {/* Priority Improvements */}
                    {analysis.resume_improvement_priority?.length > 0 && (
                      <div className="weakness-group">
                        <h3><AlertCircle size={18} /> Priority Improvements</h3>
                        <div className="item-list">
                          {analysis.resume_improvement_priority.map((improvement: string, index: number) => (
                            <div key={index} className="list-item warning">
                              <AlertCircle size={16} />
                              <span>{improvement}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detailed Weaknesses Analysis */}
                    {analysis.resume_analysis_report?.weaknesses_analysis && (
                      <>
                        {/* Critical Gaps */}
                        {analysis.resume_analysis_report.weaknesses_analysis.critical_gaps_against_job_description?.length > 0 && (
                          <div className="weakness-group">
                            <h3><Target size={18} /> Critical Gaps Against Job Description</h3>
                            <div className="item-list">
                              {analysis.resume_analysis_report.weaknesses_analysis.critical_gaps_against_job_description.map((gap: string, index: number) => (
                                <div key={index} className="list-item error">
                                  <Target size={16} />
                                  <span>{gap}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Technical Deficiencies */}
                        {analysis.resume_analysis_report.weaknesses_analysis.technical_deficiencies?.length > 0 && (
                          <div className="weakness-group">
                            <h3><Settings size={18} /> Technical Deficiencies</h3>
                            <div className="item-list">
                              {analysis.resume_analysis_report.weaknesses_analysis.technical_deficiencies.map((deficiency: string, index: number) => (
                                <div key={index} className="list-item error">
                                  <Settings size={16} />
                                  <span>{deficiency}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Resume Presentation Issues */}
                        {analysis.resume_analysis_report.weaknesses_analysis.resume_presentation_issues?.length > 0 && (
                          <div className="weakness-group">
                            <h3><FileText size={18} /> Resume Presentation Issues</h3>
                            <div className="item-list">
                              {analysis.resume_analysis_report.weaknesses_analysis.resume_presentation_issues.map((issue: string, index: number) => (
                                <div key={index} className="list-item warning">
                                  <FileText size={16} />
                                  <span>{issue}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Soft Skills Gaps */}
                        {analysis.resume_analysis_report.weaknesses_analysis.soft_skills_gaps?.length > 0 && (
                          <div className="weakness-group">
                            <h3><Users size={18} /> Soft Skills Gaps</h3>
                            <div className="item-list">
                              {analysis.resume_analysis_report.weaknesses_analysis.soft_skills_gaps.map((gap: string, index: number) => (
                                <div key={index} className="list-item warning">
                                  <Users size={16} />
                                  <span>{gap}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missing Essential Elements */}
                        {analysis.resume_analysis_report.weaknesses_analysis.missing_essential_elements?.length > 0 && (
                          <div className="weakness-group">
                            <h3><AlertCircle size={18} /> Missing Essential Elements</h3>
                            <div className="item-list">
                              {analysis.resume_analysis_report.weaknesses_analysis.missing_essential_elements.map((element: string, index: number) => (
                                <div key={index} className="list-item error">
                                  <AlertCircle size={16} />
                                  <span>{element}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Legacy Development Areas */}
                    {!analysis.resume_improvement_priority && getDevelopmentAreas().length > 0 && (
                      <div className="weakness-group">
                        <h3><AlertCircle size={18} /> Development Areas</h3>
                        <div className="item-list">
                          {getDevelopmentAreas().map((area: string, index: number) => (
                            <div key={index} className="list-item warning">
                              <AlertCircle size={16} />
                              <span>{area}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Keywords */}
                    {getKeywordMatch() && getKeywordMatch().missing.length > 0 && (
                      <div className="weakness-group">
                        <h3><Target size={18} /> Missing Keywords</h3>
                        <div className="item-list">
                          {getKeywordMatch().missing.map((keyword: string, index: number) => (
                            <div key={index} className="list-item error">
                              <Target size={16} />
                              <span>{keyword}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Wins from Detailed Feedback */}
                    {getDetailedFeedback() && getDetailedFeedback().quickWins && getDetailedFeedback().quickWins.length > 0 && (
                      <div className="weakness-group">
                        <h3><Zap size={18} /> Quick Wins</h3>
                        <div className="item-list">
                          {getDetailedFeedback().quickWins.map((win: string, index: number) => (
                            <div key={index} className="list-item warning">
                              <Zap size={16} />
                              <span>{win}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Resume Quality Assessment */}
                {getResumeQuality() && (
                  <section className="analysis-section quality-section">
                    <div className="section-header">
                      <div className="section-title">
                        <BarChart3 className="section-icon info" />
                        <h2>Resume Quality Assessment</h2>
                      </div>
                    </div>
                    
                    <div className="quality-content">
                      <div className="quality-scores">
                        <div className="quality-item">
                          <strong>Content Score:</strong> {getResumeQuality().content.score}/100
                        </div>
                        <div className="quality-item">
                          <strong>Formatting Score:</strong> {getResumeQuality().formatting.score}/100
                        </div>
                        <div className="quality-item">
                          <strong>Structure Score:</strong> {getResumeQuality().structure.score}/100
                        </div>
                        <div className="quality-item">
                          <strong>Length Score:</strong> {getResumeQuality().length.score}/100
                        </div>
                      </div>

                      {getResumeQuality().content.suggestions.length > 0 && (
                        <div className="quality-group">
                          <h3><FileText size={18} /> Content Suggestions</h3>
                          <div className="item-list">
                            {getResumeQuality().content.suggestions.map((suggestion: string, index: number) => (
                              <div key={index} className="list-item info">
                                <FileText size={16} />
                                <span>{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Competitive Analysis */}
                {getCompetitiveAnalysis() && (
                  <section className="analysis-section competitive-section">
                    <div className="section-header">
                      <div className="section-title">
                        <Award className="section-icon primary" />
                        <h2>Competitive Analysis</h2>
                      </div>
                    </div>
                    
                    <div className="competitive-content">
                      <div className="competitive-overview">
                        <div className="competitive-item">
                          <strong>Positioning Strength:</strong> {getCompetitiveAnalysis().positioningStrength}/100
                        </div>
                        <div className="competitive-item">
                          <strong>Market Position:</strong> {getCompetitiveAnalysis().marketPosition}
                        </div>
                      </div>

                      {getCompetitiveAnalysis().differentiators.length > 0 && (
                        <div className="competitive-group">
                          <h3><Star size={18} /> Key Differentiators</h3>
                          <div className="item-list">
                            {getCompetitiveAnalysis().differentiators.map((diff: string, index: number) => (
                              <div key={index} className="list-item success">
                                <Star size={16} />
                                <span>{diff}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {getCompetitiveAnalysis().competitorComparison.length > 0 && (
                        <div className="competitive-group">
                          <h3><BarChart3 size={18} /> Competitor Comparison</h3>
                          <div className="item-list">
                            {getCompetitiveAnalysis().competitorComparison.map((comparison: string, index: number) => (
                              <div key={index} className="list-item info">
                                <BarChart3 size={16} />
                                <span>{comparison}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Improvement Impact */}
                      {getCompetitiveAnalysis().improvementImpact && getCompetitiveAnalysis().improvementImpact.length > 0 && (
                        <div className="competitive-group">
                          <h3><TrendingUp size={18} /> Improvement Impact</h3>
                          <div className="item-list">
                            {getCompetitiveAnalysis().improvementImpact.map((impact: string, index: number) => (
                              <div key={index} className="list-item warning">
                                <TrendingUp size={16} />
                                <span>{impact}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>

            {/* Section-wise Detailed Feedback */}
            {analysis.resume_analysis_report?.section_wise_detailed_feedback && (
              <section className="analysis-section feedback-section">
                <div className="section-header">
                  <div className="section-title">
                    <ClipboardList className="section-icon" />
                    <h2>Section-wise Detailed Feedback</h2>
                  </div>
                </div>
                
                <div className="feedback-content">
                  {/* Contact Information */}
                  {analysis.resume_analysis_report.section_wise_detailed_feedback.contact_information && (
                    <div className="feedback-group">
                      <h3>📞 Contact Information</h3>
                      <div className="feedback-status">{analysis.resume_analysis_report.section_wise_detailed_feedback.contact_information.current_state}</div>
                      {analysis.resume_analysis_report.section_wise_detailed_feedback.contact_information.strengths?.length > 0 && (
                        <div className="feedback-subsection">
                          <h4>Strengths:</h4>
                          <ul>
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.contact_information.strengths.map((strength: string, idx: number) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysis.resume_analysis_report.section_wise_detailed_feedback.contact_information.improvements?.length > 0 && (
                        <div className="feedback-subsection">
                          <h4>Improvements:</h4>
                          <ul>
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.contact_information.improvements.map((improvement: string, idx: number) => (
                              <li key={idx}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Profile Summary */}
                  {analysis.resume_analysis_report.section_wise_detailed_feedback.profile_summary && (
                    <div className="feedback-group">
                      <h3>👤 Profile Summary</h3>
                      <div className="feedback-status">{analysis.resume_analysis_report.section_wise_detailed_feedback.profile_summary.current_state}</div>
                      {analysis.resume_analysis_report.section_wise_detailed_feedback.profile_summary.strengths?.length > 0 && (
                        <div className="feedback-subsection">
                          <h4>Strengths:</h4>
                          <ul>
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.profile_summary.strengths.map((strength: string, idx: number) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysis.resume_analysis_report.section_wise_detailed_feedback.profile_summary.improvements?.length > 0 && (
                        <div className="feedback-subsection">
                          <h4>Improvements:</h4>
                          <ul>
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.profile_summary.improvements.map((improvement: string, idx: number) => (
                              <li key={idx}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Missing Sections */}
                  {analysis.resume_analysis_report.section_wise_detailed_feedback.missing_sections && 
                    Object.keys(analysis.resume_analysis_report.section_wise_detailed_feedback.missing_sections).length > 0 && (
                    <div className="feedback-group missing-sections">
                      <h3>⚠️ Missing Sections</h3>
                      <div className="missing-sections-list">
                        {Object.entries(analysis.resume_analysis_report.section_wise_detailed_feedback.missing_sections).map(([section, description]) => (
                          <div key={section} className="missing-section-item">
                            <h4>{section.charAt(0).toUpperCase() + section.slice(1).replace(/_/g, ' ')}</h4>
                            <p>{description as string}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Improvement Recommendations */}
            {analysis.resume_analysis_report?.improvement_recommendations && (
              <section className="analysis-section recommendations-section">
                <div className="section-header">
                  <div className="section-title">
                    <Lightbulb className="section-icon warning" />
                    <h2>Comprehensive Improvement Roadmap</h2>
                  </div>
                </div>
                
                <div className="recommendations-content">
                  {/* Immediate Resume Additions */}
                  {analysis.resume_analysis_report.improvement_recommendations.immediate_resume_additions?.length > 0 && (
                    <div className="recommendation-group immediate">
                      <h3><Zap size={18} /> Immediate Resume Additions</h3>
                      <div className="item-list">
                        {analysis.resume_analysis_report.improvement_recommendations.immediate_resume_additions.map((addition: string, index: number) => (
                          <div key={index} className="list-item immediate">
                            <Zap size={16} />
                            <span>{addition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Immediate Priority Actions */}
                  {analysis.resume_analysis_report.improvement_recommendations.immediate_priority_actions?.length > 0 && (
                    <div className="recommendation-group immediate">
                      <h3><Target size={18} /> Immediate Priority Actions</h3>
                      <div className="item-list">
                        {analysis.resume_analysis_report.improvement_recommendations.immediate_priority_actions.map((action: string, index: number) => (
                          <div key={index} className="list-item immediate">
                            <Target size={16} />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Short-term Development Goals */}
                  {analysis.resume_analysis_report.improvement_recommendations.short_term_development_goals?.length > 0 && (
                    <div className="recommendation-group short-term">
                      <h3><TrendingUp size={18} /> Short-term Development Goals (1-3 months)</h3>
                      <div className="item-list">
                        {analysis.resume_analysis_report.improvement_recommendations.short_term_development_goals.map((goal: string, index: number) => (
                          <div key={index} className="list-item short-term">
                            <TrendingUp size={16} />
                            <span>{goal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medium-term Objectives */}
                  {analysis.resume_analysis_report.improvement_recommendations.medium_term_objectives?.length > 0 && (
                    <div className="recommendation-group long-term">
                      <h3><Award size={18} /> Medium-term Objectives (3-6 months)</h3>
                      <div className="item-list">
                        {analysis.resume_analysis_report.improvement_recommendations.medium_term_objectives.map((objective: string, index: number) => (
                          <div key={index} className="list-item long-term">
                            <Award size={16} />
                            <span>{objective}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Soft Skills Enhancement Suggestions */}
            {analysis.resume_analysis_report?.soft_skills_enhancement_suggestions && (
              <section className="analysis-section soft-skills-section">
                <div className="section-header">
                  <div className="section-title">
                    <Users className="section-icon info" />
                    <h2>Soft Skills Enhancement</h2>
                  </div>
                </div>
                
                <div className="soft-skills-content">
                  {/* Communication Skills */}
                  {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.communication_skills?.length > 0 && (
                    <div className="skill-group">
                      <h3>💬 Communication Skills</h3>
                      <div className="item-list">
                        {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.communication_skills.map((skill: string, index: number) => (
                          <div key={index} className="list-item info">
                            <Brain size={16} />
                            <span>{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Teamwork and Collaboration */}
                  {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.teamwork_and_collaboration?.length > 0 && (
                    <div className="skill-group">
                      <h3>🤝 Teamwork and Collaboration</h3>
                      <div className="item-list">
                        {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.teamwork_and_collaboration.map((skill: string, index: number) => (
                          <div key={index} className="list-item info">
                            <Users size={16} />
                            <span>{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Leadership and Initiative */}
                  {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.leadership_and_initiative?.length > 0 && (
                    <div className="skill-group">
                      <h3>🚀 Leadership and Initiative</h3>
                      <div className="item-list">
                        {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.leadership_and_initiative.map((skill: string, index: number) => (
                          <div key={index} className="list-item info">
                            <Award size={16} />
                            <span>{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Problem Solving Approach */}
                  {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.problem_solving_approach?.length > 0 && (
                    <div className="skill-group">
                      <h3>🧩 Problem Solving Approach</h3>
                      <div className="item-list">
                        {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.problem_solving_approach.map((approach: string, index: number) => (
                          <div key={index} className="list-item info">
                            <Lightbulb size={16} />
                            <span>{approach}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Final Assessment */}
            {analysis.resume_analysis_report?.final_assessment && (
              <section className="analysis-section final-assessment-section">
                <div className="section-header">
                  <div className="section-title">
                    <Target className="section-icon" />
                    <h2>Final Assessment & Recommendations</h2>
                  </div>
                </div>
                
                <div className="assessment-content">
                  <div className="assessment-overview">
                    <div className="assessment-item">
                      <strong>Eligibility Status:</strong>
                      <span className={`status ${analysis.resume_analysis_report.final_assessment.eligibility_status.toLowerCase().includes('qualified') ? 'qualified' : 'needs-work'}`}>
                        {analysis.resume_analysis_report.final_assessment.eligibility_status}
                      </span>
                    </div>
                  </div>

                  {/* Hiring Recommendation */}
                  {analysis.resume_analysis_report.final_assessment.hiring_recommendation && (
                    <div className="assessment-group">
                      <h3>💼 Hiring Recommendation</h3>
                      <p>{analysis.resume_analysis_report.final_assessment.hiring_recommendation}</p>
                    </div>
                  )}

                  {/* Key Interview Areas */}
                  {analysis.resume_analysis_report.final_assessment.key_interview_areas?.length > 0 && (
                    <div className="assessment-group">
                      <h3>🎤 Key Interview Focus Areas</h3>
                      <div className="item-list">
                        {analysis.resume_analysis_report.final_assessment.key_interview_areas.map((area: string, index: number) => (
                          <div key={index} className="list-item primary">
                            <Target size={16} />
                            <span>{area}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Onboarding Requirements */}
                  {analysis.resume_analysis_report.final_assessment.onboarding_requirements?.length > 0 && (
                    <div className="assessment-group">
                      <h3>📋 Onboarding Requirements</h3>
                      <div className="item-list">
                        {analysis.resume_analysis_report.final_assessment.onboarding_requirements.map((req: string, index: number) => (
                          <div key={index} className="list-item info">
                            <BookOpen size={16} />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Long-term Potential */}
                  {analysis.resume_analysis_report.final_assessment.long_term_potential && (
                    <div className="assessment-group">
                      <h3>🚀 Long-term Potential</h3>
                      <p className="potential-text">{analysis.resume_analysis_report.final_assessment.long_term_potential}</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Export Error */}
        {exportError && (
          <div className="export-error">
            <AlertCircle size={16} />
            {exportError}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveAnalysisModal; 