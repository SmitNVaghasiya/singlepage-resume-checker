import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { 
  X,
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Users, 
  Lightbulb, 
  Calendar, 
  Star, 
  Book, 
  Code, 
  Briefcase,
  BarChart3,
  Brain,
  Zap,
  Settings,
  MessageSquare,
  Clock,
  Shield,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Target,
  Award,
  User
} from 'lucide-react';
import '../styles/components/DashboardAnalysisView.css';

interface DashboardAnalysisViewProps {
  analysis: AnalysisResult;
  onClose: () => void;
}

const DashboardAnalysisView: React.FC<DashboardAnalysisViewProps> = ({
  analysis,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const getScore = () => analysis.score_out_of_100 || analysis.overallScore || (analysis as any).score || 0;
  const getChance = () => analysis.chance_of_selection_percentage || analysis.matchPercentage || (analysis as any).matchPercentage || 0;
  const getJobTitle = () => analysis.resume_analysis_report?.candidate_information?.position_applied || analysis.jobTitle || 'Position Analysis';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, color: '#667eea' },
    { id: 'strengths', label: 'Strengths', icon: TrendingUp, color: '#10b981' },
    { id: 'weaknesses', label: 'Weaknesses', icon: AlertTriangle, color: '#ef4444' },
    { id: 'feedback', label: 'Section Feedback', icon: MessageSquare, color: '#8b5cf6' },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, color: '#f59e0b' },
    { id: 'assessment', label: 'Final Assessment', icon: Award, color: '#06b6d4' }
  ];

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getChanceColor = (chance: number) => {
    if (chance >= 80) return '#3b82f6';
    if (chance >= 60) return '#8b5cf6';
    return '#06b6d4';
  };

  const TabButton = ({ tab }: { tab: typeof tabs[0] }) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    
    return (
      <button
        className={`tab-button ${isActive ? 'active' : ''}`}
        onClick={() => setActiveTab(tab.id)}
        style={{
          '--tab-color': tab.color
        } as React.CSSProperties}
      >
        <Icon className="tab-icon" />
        <span>{tab.label}</span>
        {isActive && <div className="tab-indicator" />}
      </button>
    );
  };

  const TabContent = ({ children, tabId }: { children: React.ReactNode; tabId: string }) => {
    if (activeTab !== tabId) return null;
    return (
      <div className="tab-content active">
        <div className="tab-content-inner">
          {children}
        </div>
      </div>
    );
  };

  const CollapsibleSection = ({ 
    title, 
    children, 
    isExpanded, 
    onToggle, 
    icon: Icon,
    color = '#667eea'
  }: {
    title: string;
    children: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    icon?: any;
    color?: string;
  }) => (
    <div className="collapsible-section">
      <button 
        className="collapsible-header"
        onClick={onToggle}
        style={{ '--section-color': color } as React.CSSProperties}
      >
        {Icon && <Icon className="section-icon" />}
        <span className="section-title">{title}</span>
        {isExpanded ? <ChevronUp className="expand-icon" /> : <ChevronDown className="expand-icon" />}
      </button>
      {isExpanded && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-analysis-overlay">
      <div className="dashboard-analysis-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <h1>Resume Analysis Report</h1>
            <p>Comprehensive evaluation and improvement recommendations</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X className="close-icon" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card score-card" style={{ '--card-color': getScoreColor(getScore()) } as React.CSSProperties}>
            <div className="card-icon">
              <Target className="icon" />
            </div>
            <h3>Overall Score</h3>
            <div className="card-value">{getScore()}</div>
            <div className="card-unit">out of 100</div>
            <div className="card-progress">
              <div className="progress-bar" style={{ width: `${getScore()}%` }} />
            </div>
          </div>
          
          <div className="summary-card chance-card" style={{ '--card-color': getChanceColor(getChance()) } as React.CSSProperties}>
            <div className="card-icon">
              <TrendingUp className="icon" />
            </div>
            <h3>Selection Chance</h3>
            <div className="card-value">{getChance()}%</div>
            <div className="card-unit">probability</div>
            <div className="card-progress">
              <div className="progress-bar" style={{ width: `${getChance()}%` }} />
            </div>
          </div>
          
          <div className="summary-card validity-card">
            <div className="card-icon">
              <CheckCircle className="icon" />
            </div>
            <h3>Job Description</h3>
            <div className="card-value">{analysis.job_description_validity || 'Valid'}</div>
            <div className="card-unit">status</div>
          </div>
          
          <div className="summary-card status-card">
            <div className="card-icon">
              <Shield className="icon" />
            </div>
            <h3>Resume Status</h3>
            <div className="card-value">{analysis.resume_eligibility || 'Eligible'}</div>
            <div className="card-unit">status</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="executive-summary">
          <h2 className="section-title">Executive Summary</h2>
          <div className="summary-box">
            <p>{analysis.short_conclusion || analysis.overallRecommendation || 'Analysis completed successfully.'}</p>
          </div>
          {analysis.overall_fit_summary && (
            <p className="overall-fit-summary">{analysis.overall_fit_summary}</p>
          )}

          {/* Candidate Information */}
          {analysis.resume_analysis_report?.candidate_information && (
            <div className="candidate-info">
              <div className="info-item">
                <div className="info-label">Name</div>
                <div className="info-value">{analysis.resume_analysis_report.candidate_information.name}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Position Applied</div>
                <div className="info-value">{analysis.resume_analysis_report.candidate_information.position_applied}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Experience Level</div>
                <div className="info-value">{analysis.resume_analysis_report.candidate_information.experience_level}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Current Status</div>
                <div className="info-value">{analysis.resume_analysis_report.candidate_information.current_status}</div>
              </div>
            </div>
          )}

          {/* Priority Improvements */}
          {analysis.resume_improvement_priority && (
            <div className="priority-improvements">
              <h3 className="priority-title">
                <AlertTriangle className="priority-icon" />
                Priority Improvements
              </h3>
              <ul className="priority-list">
                {analysis.resume_improvement_priority.map((item, index) => (
                  <li key={index} className="priority-item">
                    <span className="priority-number">{index + 1}</span>
                    <span className="priority-text">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            {tabs.map(tab => (
              <TabButton key={tab.id} tab={tab} />
            ))}
          </div>

          {/* Tab Contents */}
          <div className="tab-contents">
            {/* Overview Tab */}
            <TabContent tabId="overview">
              <h2 className="section-title">Analysis Overview</h2>
              <div className="overview-grid">
                <div className="overview-card">
                  <div className="overview-icon">
                    <Brain className="icon" />
                  </div>
                  <h4>AI Analysis</h4>
                  <p>Advanced AI-powered resume evaluation against job requirements</p>
                </div>
                <div className="overview-card">
                  <div className="overview-icon">
                    <Target className="icon" />
                  </div>
                  <h4>Job Matching</h4>
                  <p>Comprehensive matching of skills, experience, and qualifications</p>
                </div>
                <div className="overview-card">
                  <div className="overview-icon">
                    <Lightbulb className="icon" />
                  </div>
                  <h4>Smart Recommendations</h4>
                  <p>Actionable insights for resume improvement and career growth</p>
                </div>
                <div className="overview-card">
                  <div className="overview-icon">
                    <Zap className="icon" />
                  </div>
                  <h4>Instant Results</h4>
                  <p>Quick analysis with detailed feedback and scoring</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="quick-stats">
                <h3>Quick Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-number">{analysis.resume_analysis_report?.strengths_analysis?.technical_skills?.length || 0}</div>
                    <div className="stat-label">Technical Strengths</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{analysis.resume_analysis_report?.weaknesses_analysis?.critical_gaps_against_job_description?.length || 0}</div>
                    <div className="stat-label">Critical Gaps</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{analysis.resume_improvement_priority?.length || 0}</div>
                    <div className="stat-label">Priority Actions</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{analysis.resume_analysis_report?.improvement_recommendations?.immediate_resume_additions?.length || 0}</div>
                    <div className="stat-label">Quick Fixes</div>
                  </div>
                </div>
              </div>
            </TabContent>

            {/* Strengths Tab */}
            <TabContent tabId="strengths">
              <h2 className="section-title">Strengths Analysis</h2>
              <div className="strengths-grid">
                {analysis.resume_analysis_report?.strengths_analysis && (
                  <>
                    <CollapsibleSection
                      title="Technical Skills"
                      isExpanded={expandedSections.has('tech-skills')}
                      onToggle={() => toggleSection('tech-skills')}
                      icon={Code}
                      color="#10b981"
                    >
                      <ul className="item-list">
                        {analysis.resume_analysis_report.strengths_analysis.technical_skills.map((skill, index) => (
                          <li key={index}>
                            <CheckCircle2 className="strength-icon" />
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                    
                    <CollapsibleSection
                      title="Project Portfolio"
                      isExpanded={expandedSections.has('project-portfolio')}
                      onToggle={() => toggleSection('project-portfolio')}
                      icon={Briefcase}
                      color="#10b981"
                    >
                      <ul className="item-list">
                        {analysis.resume_analysis_report.strengths_analysis.project_portfolio.map((project, index) => (
                          <li key={index}>
                            <CheckCircle2 className="strength-icon" />
                            {project}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                    
                    <CollapsibleSection
                      title="Educational Background"
                      isExpanded={expandedSections.has('education')}
                      onToggle={() => toggleSection('education')}
                      icon={Book}
                      color="#10b981"
                    >
                      <ul className="item-list">
                        {analysis.resume_analysis_report.strengths_analysis.educational_background.map((edu, index) => (
                          <li key={index}>
                            <CheckCircle2 className="strength-icon" />
                            {edu}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                  </>
                )}
              </div>
            </TabContent>

            {/* Weaknesses Tab */}
            <TabContent tabId="weaknesses">
              <h2 className="section-title">Weaknesses Analysis</h2>
              <div className="weaknesses-grid">
                {analysis.resume_analysis_report?.weaknesses_analysis && (
                  <>
                    <CollapsibleSection
                      title="Critical Gaps Against Job Description"
                      isExpanded={expandedSections.has('critical-gaps')}
                      onToggle={() => toggleSection('critical-gaps')}
                      icon={XCircle}
                      color="#ef4444"
                    >
                      <ul className="item-list">
                        {analysis.resume_analysis_report.weaknesses_analysis.critical_gaps_against_job_description.map((gap, index) => (
                          <li key={index}>
                            <XCircle className="weakness-icon" />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                    
                    <CollapsibleSection
                      title="Technical Deficiencies"
                      isExpanded={expandedSections.has('tech-deficiencies')}
                      onToggle={() => toggleSection('tech-deficiencies')}
                      icon={Settings}
                      color="#ef4444"
                    >
                      <ul className="item-list">
                        {analysis.resume_analysis_report.weaknesses_analysis.technical_deficiencies.map((deficiency, index) => (
                          <li key={index}>
                            <XCircle className="weakness-icon" />
                            {deficiency}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                    
                    <CollapsibleSection
                      title="Resume Presentation Issues"
                      isExpanded={expandedSections.has('presentation-issues')}
                      onToggle={() => toggleSection('presentation-issues')}
                      icon={FileText}
                      color="#ef4444"
                    >
                      <ul className="item-list">
                        {analysis.resume_analysis_report.weaknesses_analysis.resume_presentation_issues.map((issue, index) => (
                          <li key={index}>
                            <XCircle className="weakness-icon" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                    
                    <CollapsibleSection
                      title="Soft Skills Gaps"
                      isExpanded={expandedSections.has('soft-skills-gaps')}
                      onToggle={() => toggleSection('soft-skills-gaps')}
                      icon={Users}
                      color="#ef4444"
                    >
                      <ul className="item-list">
                        {analysis.resume_analysis_report.weaknesses_analysis.soft_skills_gaps.map((gap, index) => (
                          <li key={index}>
                            <XCircle className="weakness-icon" />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                    
                    <CollapsibleSection
                      title="Missing Essential Elements"
                      isExpanded={expandedSections.has('missing-elements')}
                      onToggle={() => toggleSection('missing-elements')}
                      icon={Info}
                      color="#ef4444"
                    >
                      <ul className="item-list">
                        {analysis.resume_analysis_report.weaknesses_analysis.missing_essential_elements.map((element, index) => (
                          <li key={index}>
                            <XCircle className="weakness-icon" />
                            {element}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                  </>
                )}
              </div>
            </TabContent>

            {/* Section Feedback Tab */}
            <TabContent tabId="feedback">
              <h2 className="section-title">Section-wise Detailed Feedback</h2>
              <div className="section-feedback">
                {analysis.resume_analysis_report?.section_wise_detailed_feedback && (
                  <>
                    <div className="feedback-section">
                      <h3 className="feedback-title">
                        <User className="feedback-icon" />
                        Contact Information
                      </h3>
                      <div className="feedback-state">{analysis.resume_analysis_report.section_wise_detailed_feedback.contact_information.current_state}</div>
                      <div className="feedback-content">
                        <div className="feedback-list">
                          <h5>Strengths:</h5>
                          <ul className="item-list">
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.contact_information.strengths.map((strength, index) => (
                              <li key={index}>
                                <CheckCircle2 className="strength-icon" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="feedback-list improvements">
                          <h5>Improvements:</h5>
                          <ul className="item-list">
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.contact_information.improvements.map((improvement, index) => (
                              <li key={index}>
                                <AlertTriangle className="improvement-icon" />
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="feedback-section">
                      <h3 className="feedback-title">
                        <FileText className="feedback-icon" />
                        Profile Summary
                      </h3>
                      <div className="feedback-state">{analysis.resume_analysis_report.section_wise_detailed_feedback.profile_summary.current_state}</div>
                      <div className="feedback-content">
                        <div className="feedback-list">
                          <h5>Strengths:</h5>
                          <ul className="item-list">
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.profile_summary.strengths.map((strength, index) => (
                              <li key={index}>
                                <CheckCircle2 className="strength-icon" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="feedback-list improvements">
                          <h5>Improvements:</h5>
                          <ul className="item-list">
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.profile_summary.improvements.map((improvement, index) => (
                              <li key={index}>
                                <AlertTriangle className="improvement-icon" />
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="feedback-section">
                      <h3 className="feedback-title">
                        <Book className="feedback-icon" />
                        Education
                      </h3>
                      <div className="feedback-state">{analysis.resume_analysis_report.section_wise_detailed_feedback.education.current_state}</div>
                      <div className="feedback-content">
                        <div className="feedback-list">
                          <h5>Strengths:</h5>
                          <ul className="item-list">
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.education.strengths.map((strength, index) => (
                              <li key={index}>
                                <CheckCircle2 className="strength-icon" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="feedback-list improvements">
                          <h5>Improvements:</h5>
                          <ul className="item-list">
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.education.improvements.map((improvement, index) => (
                              <li key={index}>
                                <AlertTriangle className="improvement-icon" />
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="feedback-section">
                      <h3 className="feedback-title">
                        <Code className="feedback-icon" />
                        Skills
                      </h3>
                      <div className="feedback-state">{analysis.resume_analysis_report.section_wise_detailed_feedback.skills.current_state}</div>
                      <div className="feedback-content">
                        <div className="feedback-list">
                          <h5>Strengths:</h5>
                          <ul className="item-list">
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.skills.strengths.map((strength, index) => (
                              <li key={index}>
                                <CheckCircle2 className="strength-icon" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="feedback-list improvements">
                          <h5>Improvements:</h5>
                          <ul className="item-list">
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.skills.improvements.map((improvement, index) => (
                              <li key={index}>
                                <AlertTriangle className="improvement-icon" />
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="feedback-section">
                      <h3 className="feedback-title">
                        <Briefcase className="feedback-icon" />
                        Projects
                      </h3>
                      <div className="feedback-state">{analysis.resume_analysis_report.section_wise_detailed_feedback.projects.current_state}</div>
                      <div className="feedback-content">
                        <div className="feedback-list">
                          <h5>Strengths:</h5>
                          <ul className="item-list">
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.projects.strengths.map((strength, index) => (
                              <li key={index}>
                                <CheckCircle2 className="strength-icon" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="feedback-list improvements">
                          <h5>Improvements:</h5>
                          <ul className="item-list">
                            {analysis.resume_analysis_report.section_wise_detailed_feedback.projects.improvements.map((improvement, index) => (
                              <li key={index}>
                                <AlertTriangle className="improvement-icon" />
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Missing Sections */}
                {analysis.resume_analysis_report?.section_wise_detailed_feedback?.missing_sections && (
                  <div className="missing-sections">
                    <h4>Missing Sections</h4>
                    <div className="missing-grid">
                      <div className="missing-item">
                        <h5>Certifications</h5>
                        <p>{analysis.resume_analysis_report.section_wise_detailed_feedback.missing_sections.certifications}</p>
                      </div>
                      <div className="missing-item">
                        <h5>Experience</h5>
                        <p>{analysis.resume_analysis_report.section_wise_detailed_feedback.missing_sections.experience}</p>
                      </div>
                      <div className="missing-item">
                        <h5>Achievements</h5>
                        <p>{analysis.resume_analysis_report.section_wise_detailed_feedback.missing_sections.achievements}</p>
                      </div>
                      <div className="missing-item">
                        <h5>Soft Skills</h5>
                        <p>{analysis.resume_analysis_report.section_wise_detailed_feedback.missing_sections.soft_skills}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabContent>

            {/* Recommendations Tab */}
            <TabContent tabId="recommendations">
              <h2 className="section-title">Improvement Recommendations</h2>
              <div className="recommendations-grid">
                {analysis.resume_analysis_report?.improvement_recommendations && (
                  <>
                    <div className="recommendation-category">
                      <h3 className="category-title">
                        <Zap className="category-icon" />
                        Immediate Resume Additions
                      </h3>
                      <ul className="item-list">
                        {analysis.resume_analysis_report.improvement_recommendations.immediate_resume_additions.map((addition, index) => (
                          <li key={index}>
                            <ArrowRight className="recommendation-icon" />
                            {addition}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="recommendation-category">
                      <h3 className="category-title">
                        <Target className="category-icon" />
                        Immediate Priority Actions
                      </h3>
                      <ul className="item-list">
                        {analysis.resume_analysis_report.improvement_recommendations.immediate_priority_actions.map((action, index) => (
                          <li key={index}>
                            <ArrowRight className="recommendation-icon" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="recommendation-category">
                      <h3 className="category-title">
                        <Calendar className="category-icon" />
                        Short-term Development Goals
                      </h3>
                      <ul className="item-list">
                        {analysis.resume_analysis_report.improvement_recommendations.short_term_development_goals.map((goal, index) => (
                          <li key={index}>
                            <ArrowRight className="recommendation-icon" />
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="recommendation-category">
                      <h3 className="category-title">
                        <TrendingUp className="category-icon" />
                        Medium-term Objectives
                      </h3>
                      <ul className="item-list">
                        {analysis.resume_analysis_report.improvement_recommendations.medium_term_objectives.map((objective, index) => (
                          <li key={index}>
                            <ArrowRight className="recommendation-icon" />
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>

              {/* Soft Skills Enhancement */}
              {analysis.resume_analysis_report?.soft_skills_enhancement_suggestions && (
                <div className="skills-enhancement">
                  <h3>Soft Skills Enhancement</h3>
                  <div className="skills-grid">
                    <div className="skill-category">
                      <h4>Communication Skills</h4>
                      <ul className="item-list">
                        {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.communication_skills.map((skill, index) => (
                          <li key={index}>
                            <MessageSquare className="skill-icon" />
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="skill-category">
                      <h4>Teamwork & Collaboration</h4>
                      <ul className="item-list">
                        {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.teamwork_and_collaboration.map((skill, index) => (
                          <li key={index}>
                            <Users className="skill-icon" />
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="skill-category">
                      <h4>Leadership & Initiative</h4>
                      <ul className="item-list">
                        {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.leadership_and_initiative.map((skill, index) => (
                          <li key={index}>
                            <Star className="skill-icon" />
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="skill-category">
                      <h4>Problem-solving Approach</h4>
                      <ul className="item-list">
                        {analysis.resume_analysis_report.soft_skills_enhancement_suggestions.problem_solving_approach.map((skill, index) => (
                          <li key={index}>
                            <Lightbulb className="skill-icon" />
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </TabContent>

            {/* Final Assessment Tab */}
            <TabContent tabId="assessment">
              <div className="final-assessment">
                <h2 className="section-title">Final Assessment</h2>
                <div className="assessment-grid">
                  {analysis.resume_analysis_report?.final_assessment && (
                    <>
                      <div className="assessment-item">
                        <h4>Eligibility Status</h4>
                        <p>{analysis.resume_analysis_report.final_assessment.eligibility_status}</p>
                      </div>
                      <div className="assessment-item">
                        <h4>Hiring Recommendation</h4>
                        <p>{analysis.resume_analysis_report.final_assessment.hiring_recommendation}</p>
                      </div>
                      <div className="assessment-item">
                        <h4>Key Interview Areas</h4>
                        <ul className="item-list">
                          {analysis.resume_analysis_report.final_assessment.key_interview_areas.map((area, index) => (
                            <li key={index}>
                              <Target className="assessment-icon" />
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="assessment-item">
                        <h4>Onboarding Requirements</h4>
                        <ul className="item-list">
                          {analysis.resume_analysis_report.final_assessment.onboarding_requirements.map((requirement, index) => (
                            <li key={index}>
                              <Settings className="assessment-icon" />
                              {requirement}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="assessment-item">
                        <h4>Long-term Potential</h4>
                        <p>{analysis.resume_analysis_report.final_assessment.long_term_potential}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabContent>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalysisView; 