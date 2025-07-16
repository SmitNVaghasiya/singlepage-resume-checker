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
  BarChart3,
  Code,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AnalysisResult } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { apiService } from '../../services/api';
import './ComprehensiveAnalysisModal.css';

interface ComprehensiveAnalysisModalProps {
  analysis: AnalysisResult;
  onClose: () => void;
}

const ComprehensiveAnalysisModal: React.FC<ComprehensiveAnalysisModalProps> = ({ analysis, onClose }) => {
  const { user } = useAppContext();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    overview: true,
    strengths: true,
    weaknesses: true,
    sectionFeedback: false,
    improvements: true,
    softSkills: false,
    finalAssessment: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
  const getJobTitle = () => analysis.resume_analysis_report?.candidate_information?.position_applied || analysis.jobTitle || (analysis as any).jobTitle || 'Position Analysis';
  const getIndustry = () => analysis.industry || (analysis as any).industry || 'General';
  
  const getOverallRecommendation = () => {
    return analysis.short_conclusion || 
           analysis.overallRecommendation || 
           (analysis as any).overallRecommendation || 
           'Analysis completed successfully.';
  };

  const ExpandableSection = ({ title, children, sectionKey, icon: Icon, defaultExpanded = false }: {
    title: string;
    children: React.ReactNode;
    sectionKey: string;
    icon: React.ComponentType<any>;
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = expandedSections[sectionKey] ?? defaultExpanded;
    
    return (
      <section className="analysis-section expandable">
        <div className="section-header expandable-header" onClick={() => toggleSection(sectionKey)}>
          <div className="section-title">
            <Icon className="section-icon" />
            <h2>{title}</h2>
          </div>
          {isExpanded ? <ChevronUp className="expand-icon" /> : <ChevronDown className="expand-icon" />}
        </div>
        {isExpanded && (
          <div className="section-content">
            {children}
          </div>
        )}
      </section>
    );
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
            <ExpandableSection 
              title="Analysis Overview" 
              sectionKey="overview" 
              icon={Target}
              defaultExpanded={true}
            >
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

              {/* AI Summary */}
              <div className="ai-summary-section">
                <h3>🤖 AI Analysis Summary</h3>
                <p className="summary-text">{getOverallRecommendation()}</p>
                
                {analysis.overall_fit_summary && (
                  <div className="fit-summary">
                    <h4>Overall Fit Assessment</h4>
                    <p>{analysis.overall_fit_summary}</p>
                  </div>
                )}
              </div>

              {/* Candidate Information */}
              {analysis.resume_analysis_report?.candidate_information && (
                <div className="candidate-info">
                  <h3><User className="inline-icon" /> Candidate Profile</h3>
                  <div className="candidate-grid">
                    <div className="candidate-item">
                      <span className="label">Name:</span>
                      <span className="value">{analysis.resume_analysis_report.candidate_information.name}</span>
                    </div>
                    <div className="candidate-item">
                      <span className="label">Position:</span>
                      <span className="value">{analysis.resume_analysis_report.candidate_information.position_applied}</span>
                    </div>
                    <div className="candidate-item">
                      <span className="label">Experience:</span>
                      <span className="value">{analysis.resume_analysis_report.candidate_information.experience_level}</span>
                    </div>
                    <div className="candidate-item">
                      <span className="label">Status:</span>
                      <span className="value">{analysis.resume_analysis_report.candidate_information.current_status}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Priority Improvements */}
              {analysis.resume_improvement_priority?.length > 0 && (
                <div className="priority-improvements">
                  <h3><AlertTriangle className="inline-icon" /> Priority Improvements</h3>
                  <div className="priority-items">
                    {analysis.resume_improvement_priority.map((improvement: string, index: number) => (
                      <div key={index} className="priority-item">
                        <span className="priority-number">{index + 1}</span>
                        <span className="priority-text">{improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ExpandableSection>

            {/* Strengths Analysis */}
            <ExpandableSection 
              title="Comprehensive Strengths Analysis" 
              sectionKey="strengths" 
              icon={Award}
              defaultExpanded={true}
            >
              {analysis.resume_analysis_report?.strengths_analysis && (
                <div className="strengths-detailed">
                  {/* Technical Skills */}
                  {analysis.resume_analysis_report.strengths_analysis.technical_skills?.length > 0 && (
                    <div className="strength-category">
                      <h4><Code className="inline-icon" /> Technical Skills</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.strengths_analysis.technical_skills.map((skill: string, index: number) => (
                          <li key={index}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Project Portfolio */}
                  {analysis.resume_analysis_report.strengths_analysis.project_portfolio?.length > 0 && (
                    <div className="strength-category">
                      <h4><Briefcase className="inline-icon" /> Project Portfolio</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.strengths_analysis.project_portfolio.map((project: string, index: number) => (
                          <li key={index}>{project}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Educational Background */}
                  {analysis.resume_analysis_report.strengths_analysis.educational_background?.length > 0 && (
                    <div className="strength-category">
                      <h4><BookOpen className="inline-icon" /> Educational Background</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.strengths_analysis.educational_background.map((edu: string, index: number) => (
                          <li key={index}>{edu}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </ExpandableSection>

            {/* Weaknesses Analysis */}
            <ExpandableSection 
              title="Comprehensive Weaknesses Analysis" 
              sectionKey="weaknesses" 
              icon={AlertTriangle}
              defaultExpanded={true}
            >
              {analysis.resume_analysis_report?.weaknesses_analysis && (
                <div className="weaknesses-detailed">
                  {/* Critical Gaps */}
                  {analysis.resume_analysis_report.weaknesses_analysis.critical_gaps_against_job_description?.length > 0 && (
                    <div className="weakness-category critical">
                      <h4><AlertTriangle className="inline-icon" /> Critical Gaps Against Job Description</h4>
                      <ul className="detailed-list critical-gaps">
                        {analysis.resume_analysis_report.weaknesses_analysis.critical_gaps_against_job_description.map((gap: string, index: number) => (
                          <li key={index}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Technical Deficiencies */}
                  {analysis.resume_analysis_report.weaknesses_analysis.technical_deficiencies?.length > 0 && (
                    <div className="weakness-category">
                      <h4><Code className="inline-icon" /> Technical Deficiencies</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.weaknesses_analysis.technical_deficiencies.map((deficiency: string, index: number) => (
                          <li key={index}>{deficiency}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Resume Presentation Issues */}
                  {analysis.resume_analysis_report.weaknesses_analysis.resume_presentation_issues?.length > 0 && (
                    <div className="weakness-category">
                      <h4><FileText className="inline-icon" /> Resume Presentation Issues</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.weaknesses_analysis.resume_presentation_issues.map((issue: string, index: number) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Soft Skills Gaps */}
                  {analysis.resume_analysis_report.weaknesses_analysis.soft_skills_gaps?.length > 0 && (
                    <div className="weakness-category">
                      <h4><Users className="inline-icon" /> Soft Skills Gaps</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.weaknesses_analysis.soft_skills_gaps.map((gap: string, index: number) => (
                          <li key={index}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missing Essential Elements */}
                  {analysis.resume_analysis_report.weaknesses_analysis.missing_essential_elements?.length > 0 && (
                    <div className="weakness-category">
                      <h4><CheckCircle className="inline-icon" /> Missing Essential Elements</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.weaknesses_analysis.missing_essential_elements.map((element: string, index: number) => (
                          <li key={index}>{element}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </ExpandableSection>

            {/* Section-wise Detailed Feedback */}
            <ExpandableSection 
              title="Section-wise Detailed Feedback" 
              sectionKey="sectionFeedback" 
              icon={FileText}
            >
              {analysis.resume_analysis_report?.section_wise_detailed_feedback && (
                <div className="section-feedback">
                  {/* Contact Information */}
                  {analysis.resume_analysis_report.section_wise_detailed_feedback.contact_information && (
                    <div className="feedback-section">
                      <h4>📞 Contact Information</h4>
                      <div className="feedback-content">
                        <div className="current-state">
                          <strong>Current State:</strong> {analysis.resume_analysis_report.section_wise_detailed_feedback.contact_information.current_state}
                        </div>
                        <div className="strengths">
                          <strong>Strengths:</strong>
                          <ul>
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.contact_information.strengths.map((strength: string, index: number) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="improvements">
                          <strong>Improvements:</strong>
                          <ul>
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.contact_information.improvements.map((improvement: string, index: number) => (
                              <li key={index}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profile Summary */}
                  {analysis.resume_analysis_report.section_wise_detailed_feedback.profile_summary && (
                    <div className="feedback-section">
                      <h4>📝 Profile Summary</h4>
                      <div className="feedback-content">
                        <div className="current-state">
                          <strong>Current State:</strong> {analysis.resume_analysis_report.section_wise_detailed_feedback.profile_summary.current_state}
                        </div>
                        <div className="strengths">
                          <strong>Strengths:</strong>
                          <ul>
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.profile_summary.strengths.map((strength: string, index: number) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="improvements">
                          <strong>Improvements:</strong>
                          <ul>
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.profile_summary.improvements.map((improvement: string, index: number) => (
                              <li key={index}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {analysis.resume_analysis_report.section_wise_detailed_feedback.education && (
                    <div className="feedback-section">
                      <h4>🎓 Education</h4>
                      <div className="feedback-content">
                        <div className="current-state">
                          <strong>Current State:</strong> {analysis.resume_analysis_report.section_wise_detailed_feedback.education.current_state}
                        </div>
                        <div className="strengths">
                          <strong>Strengths:</strong>
                          <ul>
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.education.strengths.map((strength: string, index: number) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="improvements">
                          <strong>Improvements:</strong>
                          <ul>
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.education.improvements.map((improvement: string, index: number) => (
                              <li key={index}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {analysis.resume_analysis_report.section_wise_detailed_feedback.skills && (
                    <div className="feedback-section">
                      <h4>🛠️ Skills</h4>
                      <div className="feedback-content">
                        <div className="current-state">
                          <strong>Current State:</strong> {analysis.resume_analysis_report.section_wise_detailed_feedback.skills.current_state}
                        </div>
                        <div className="strengths">
                          <strong>Strengths:</strong>
                          <ul>
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.skills.strengths.map((strength: string, index: number) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="improvements">
                          <strong>Improvements:</strong>
                          <ul>
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.skills.improvements.map((improvement: string, index: number) => (
                              <li key={index}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {analysis.resume_analysis_report.section_wise_detailed_feedback.projects && (
                    <div className="feedback-section">
                      <h4>💼 Projects</h4>
                      <div className="feedback-content">
                        <div className="current-state">
                          <strong>Current State:</strong> {analysis.resume_analysis_report.section_wise_detailed_feedback.projects.current_state}
                        </div>
                        <div className="strengths">
                          <strong>Strengths:</strong>
                          <ul>
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.projects.strengths.map((strength: string, index: number) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="improvements">
                          <strong>Improvements:</strong>
                          <ul>
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.projects.improvements.map((improvement: string, index: number) => (
                              <li key={index}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Missing Sections */}
                  {analysis.resume_analysis_report.section_wise_detailed_feedback.missing_sections && (
                    <div className="feedback-section missing-sections">
                      <h4>❌ Missing Sections</h4>
                      <div className="missing-sections-content">
                        {Object.entries(analysis.resume_analysis_report.section_wise_detailed_feedback.missing_sections).map(([key, value]) => (
                          <div key={key} className="missing-section-item">
                            <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value as string}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ExpandableSection>

            {/* Improvement Recommendations */}
            <ExpandableSection 
              title="Comprehensive Improvement Roadmap" 
              sectionKey="improvements" 
              icon={TrendingUp}
              defaultExpanded={true}
            >
              {analysis.resume_analysis_report?.improvement_recommendations && (
                <div className="improvements-detailed">
                  {/* Immediate Resume Additions */}
                  {analysis.resume_analysis_report.improvement_recommendations.immediate_resume_additions?.length > 0 && (
                    <div className="improvement-category immediate">
                      <h4><AlertTriangle className="inline-icon" /> Immediate Resume Updates</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.improvement_recommendations.immediate_resume_additions.map((action: string, index: number) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Immediate Priority Actions */}
                  {analysis.resume_analysis_report.improvement_recommendations.immediate_priority_actions?.length > 0 && (
                    <div className="improvement-category priority">
                      <h4><Target className="inline-icon" /> Immediate Priority Actions</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.improvement_recommendations.immediate_priority_actions.map((action: string, index: number) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Short Term Goals */}
                  {analysis.resume_analysis_report.improvement_recommendations.short_term_development_goals?.length > 0 && (
                    <div className="improvement-category short-term">
                      <h4><Calendar className="inline-icon" /> Short-term Goals (1-3 months)</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.improvement_recommendations.short_term_development_goals.map((goal: string, index: number) => (
                          <li key={index}>{goal}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Medium Term Objectives */}
                  {analysis.resume_analysis_report.improvement_recommendations.medium_term_objectives?.length > 0 && (
                    <div className="improvement-category medium-term">
                      <h4><Star className="inline-icon" /> Medium-term Objectives (3-6 months)</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.improvement_recommendations.medium_term_objectives.map((objective: string, index: number) => (
                          <li key={index}>{objective}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </ExpandableSection>

            {/* Soft Skills Enhancement */}
            <ExpandableSection 
              title="Soft Skills Enhancement Suggestions" 
              sectionKey="softSkills" 
              icon={Users}
            >
              {analysis.resume_analysis_report?.soft_skills_enhancement_suggestions && (
                <div className="soft-skills-detailed">
                  {/* Communication Skills */}
                  {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.communication_skills?.length > 0 && (
                    <div className="soft-skill-category">
                      <h4><Users className="inline-icon" /> Communication Skills</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.communication_skills.map((skill: string, index: number) => (
                          <li key={index}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Teamwork and Collaboration */}
                  {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.teamwork_and_collaboration?.length > 0 && (
                    <div className="soft-skill-category">
                      <h4><Users className="inline-icon" /> Teamwork and Collaboration</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.teamwork_and_collaboration.map((skill: string, index: number) => (
                          <li key={index}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Leadership and Initiative */}
                  {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.leadership_and_initiative?.length > 0 && (
                    <div className="soft-skill-category">
                      <h4><Award className="inline-icon" /> Leadership and Initiative</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.leadership_and_initiative.map((skill: string, index: number) => (
                          <li key={index}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Problem Solving Approach */}
                  {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.problem_solving_approach?.length > 0 && (
                    <div className="soft-skill-category">
                      <h4><Lightbulb className="inline-icon" /> Problem Solving Approach</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.problem_solving_approach.map((skill: string, index: number) => (
                          <li key={index}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </ExpandableSection>

            {/* Final Assessment */}
            <ExpandableSection 
              title="Final Assessment & Recommendations" 
              sectionKey="finalAssessment" 
              icon={CheckCircle}
              defaultExpanded={true}
            >
              {analysis.resume_analysis_report?.final_assessment && (
                <div className="final-assessment-detailed">
                  <div className="assessment-status">
                    <span className="status-label">Eligibility Status:</span>
                    <span className={`status-value ${analysis.resume_analysis_report.final_assessment.eligibility_status.includes('Qualified') ? 'qualified' : 'needs-work'}`}>
                      {analysis.resume_analysis_report.final_assessment.eligibility_status}
                    </span>
                  </div>

                  {analysis.resume_analysis_report.final_assessment.hiring_recommendation && (
                    <div className="hiring-recommendation">
                      <h4><Briefcase className="inline-icon" /> Hiring Recommendation</h4>
                      <p>{analysis.resume_analysis_report.final_assessment.hiring_recommendation}</p>
                    </div>
                  )}

                  {analysis.resume_analysis_report.final_assessment.key_interview_areas?.length > 0 && (
                    <div className="interview-areas">
                      <h4><Users className="inline-icon" /> Key Interview Focus Areas</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.final_assessment.key_interview_areas.map((area: string, index: number) => (
                          <li key={index}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.resume_analysis_report.final_assessment.onboarding_requirements?.length > 0 && (
                    <div className="onboarding-requirements">
                      <h4><BookOpen className="inline-icon" /> Onboarding Requirements</h4>
                      <ul className="detailed-list">
                        {analysis.resume_analysis_report.final_assessment.onboarding_requirements.map((requirement: string, index: number) => (
                          <li key={index}>{requirement}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.resume_analysis_report.final_assessment.long_term_potential && (
                    <div className="long-term-potential">
                      <h4><Star className="inline-icon" /> Long-term Potential</h4>
                      <p>{analysis.resume_analysis_report.final_assessment.long_term_potential}</p>
                    </div>
                  )}
                </div>
              )}
            </ExpandableSection>

            {/* Export Error Display */}
            {exportError && (
              <div className="export-error">
                <AlertCircle className="error-icon" />
                <span>{exportError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveAnalysisModal; 