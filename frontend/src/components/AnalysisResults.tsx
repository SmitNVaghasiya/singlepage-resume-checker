import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { ChevronDown, ChevronUp, User, Target, Award, TrendingUp, AlertTriangle, CheckCircle, FileText, Users, Lightbulb, Calendar, Star, Book, Code, Briefcase } from 'lucide-react';
import '../styles/components/AnalysisResults.css';

interface AnalysisResultsProps {
  analysisResult: AnalysisResult;
  onAnalyzeAnother: () => void;
  onViewDashboard: () => void;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysisResult,
  onAnalyzeAnother,
  onViewDashboard
}) => {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    strengths: true,
    weaknesses: true,
    improvements: true,
    sectionFeedback: false,
    softSkills: false,
    finalAssessment: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
      <div className="expandable-section">
        <div className="section-header" onClick={() => toggleSection(sectionKey)}>
          <div className="section-title">
            <Icon className="section-icon" />
            <h3>{title}</h3>
          </div>
          {isExpanded ? <ChevronUp className="expand-icon" /> : <ChevronDown className="expand-icon" />}
        </div>
        {isExpanded && (
          <div className="section-content">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="analysis-results comprehensive">
      <div className="results-header">
        <h2>Comprehensive Analysis Complete!</h2>
        <p>Here's your detailed resume analysis with all insights and recommendations</p>
      </div>

      {/* Score Cards */}
      <div className="score-cards">
        <div className="score-card resume-score">
          <div className="score-value">{analysisResult.score_out_of_100 || analysisResult.overallScore || (analysisResult as any).score || 0}</div>
          <div className="score-label">Resume Score</div>
          <div className="score-description">Overall resume quality</div>
        </div>
        <div className="score-card match-score">
          <div className="score-value">{analysisResult.chance_of_selection_percentage || analysisResult.matchPercentage || 0}%</div>
          <div className="score-label">Selection Chance</div>
          <div className="score-description">Probability of selection</div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="status-indicators">
        <div className="status-item">
          <CheckCircle className="status-icon success" />
          <span>Resume: {analysisResult.resume_eligibility || 'Eligible'}</span>
        </div>
        <div className="status-item">
          <Target className="status-icon success" />
          <span>Job Description: {analysisResult.job_description_validity || 'Valid'}</span>
        </div>
      </div>

      {/* AI Summary */}
      <div className="ai-summary">
        <h3>🤖 AI Analysis Summary</h3>
        <p className="main-conclusion">{analysisResult.short_conclusion || analysisResult.overallRecommendation || 'Analysis completed successfully.'}</p>
        
        {analysisResult.overall_fit_summary && (
          <div className="fit-summary-box">
            <h4>Overall Fit Assessment</h4>
            <p>{analysisResult.overall_fit_summary}</p>
          </div>
        )}
      </div>

      {/* Candidate Information */}
      {analysisResult.resume_analysis_report?.candidate_information && (
        <div className="candidate-info-section">
          <h3><User className="inline-icon" /> Candidate Profile</h3>
          <div className="candidate-info-grid">
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{analysisResult.resume_analysis_report.candidate_information.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Position Applied:</span>
              <span className="info-value">{analysisResult.resume_analysis_report.candidate_information.position_applied}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Experience Level:</span>
              <span className="info-value">{analysisResult.resume_analysis_report.candidate_information.experience_level}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Current Status:</span>
              <span className="info-value">{analysisResult.resume_analysis_report.candidate_information.current_status}</span>
            </div>
          </div>
        </div>
      )}

      {/* Priority Improvements - Always Visible */}
      {analysisResult.resume_improvement_priority?.length > 0 && (
        <div className="priority-improvements-section">
          <h3><AlertTriangle className="inline-icon" /> Priority Improvements</h3>
          <div className="priority-list">
            {analysisResult.resume_improvement_priority.map((improvement: string, index: number) => (
              <div key={index} className="priority-item">
                <span className="priority-number">{index + 1}</span>
                <span className="priority-text">{improvement}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Sections */}
      <div className="expandable-sections">
        {/* Strengths Analysis */}
        <ExpandableSection 
          title="Key Strengths Analysis" 
          sectionKey="strengths" 
          icon={Award}
          defaultExpanded={true}
        >
          {analysisResult.resume_analysis_report?.strengths_analysis && (
            <div className="strengths-detailed">
              {/* Technical Skills */}
              {analysisResult.resume_analysis_report.strengths_analysis.technical_skills?.length > 0 && (
                <div className="strength-category">
                  <h4><Code className="inline-icon" /> Technical Skills</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.strengths_analysis.technical_skills.map((skill: string, index: number) => (
                      <li key={index}>{skill}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Project Portfolio */}
              {analysisResult.resume_analysis_report.strengths_analysis.project_portfolio?.length > 0 && (
                <div className="strength-category">
                  <h4><Briefcase className="inline-icon" /> Project Portfolio</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.strengths_analysis.project_portfolio.map((project: string, index: number) => (
                      <li key={index}>{project}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Educational Background */}
              {analysisResult.resume_analysis_report.strengths_analysis.educational_background?.length > 0 && (
                <div className="strength-category">
                  <h4><Book className="inline-icon" /> Educational Background</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.strengths_analysis.educational_background.map((edu: string, index: number) => (
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
          {analysisResult.resume_analysis_report?.weaknesses_analysis && (
            <div className="weaknesses-detailed">
              {/* Critical Gaps */}
              {analysisResult.resume_analysis_report.weaknesses_analysis.critical_gaps_against_job_description?.length > 0 && (
                <div className="weakness-category critical">
                  <h4><AlertTriangle className="inline-icon" /> Critical Gaps Against Job Description</h4>
                  <ul className="detailed-list critical-gaps">
                    {analysisResult.resume_analysis_report.weaknesses_analysis.critical_gaps_against_job_description.map((gap: string, index: number) => (
                      <li key={index}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technical Deficiencies */}
              {analysisResult.resume_analysis_report.weaknesses_analysis.technical_deficiencies?.length > 0 && (
                <div className="weakness-category">
                  <h4><Code className="inline-icon" /> Technical Deficiencies</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.weaknesses_analysis.technical_deficiencies.map((deficiency: string, index: number) => (
                      <li key={index}>{deficiency}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resume Presentation Issues */}
              {analysisResult.resume_analysis_report.weaknesses_analysis.resume_presentation_issues?.length > 0 && (
                <div className="weakness-category">
                  <h4><FileText className="inline-icon" /> Resume Presentation Issues</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.weaknesses_analysis.resume_presentation_issues.map((issue: string, index: number) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Soft Skills Gaps */}
              {analysisResult.resume_analysis_report.weaknesses_analysis.soft_skills_gaps?.length > 0 && (
                <div className="weakness-category">
                  <h4><Users className="inline-icon" /> Soft Skills Gaps</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.weaknesses_analysis.soft_skills_gaps.map((gap: string, index: number) => (
                      <li key={index}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Essential Elements */}
              {analysisResult.resume_analysis_report.weaknesses_analysis.missing_essential_elements?.length > 0 && (
                <div className="weakness-category">
                  <h4><CheckCircle className="inline-icon" /> Missing Essential Elements</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.weaknesses_analysis.missing_essential_elements.map((element: string, index: number) => (
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
          {analysisResult.resume_analysis_report?.section_wise_detailed_feedback && (
            <div className="section-feedback-detailed">
              {/* Contact Information */}
              {analysisResult.resume_analysis_report.section_wise_detailed_feedback.contact_information && (
                <div className="feedback-section">
                  <h4>📞 Contact Information</h4>
                  <div className="feedback-content">
                    <div className="current-state">
                      <strong>Current State:</strong> {analysisResult.resume_analysis_report.section_wise_detailed_feedback.contact_information.current_state}
                    </div>
                    <div className="strengths">
                      <strong>Strengths:</strong>
                      <ul>
                        {analysisResult.resume_analysis_report.section_wise_detailed_feedback.contact_information.strengths.map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="improvements">
                      <strong>Improvements:</strong>
                      <ul>
                        {analysisResult.resume_analysis_report.section_wise_detailed_feedback.contact_information.improvements.map((improvement: string, index: number) => (
                          <li key={index}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Summary */}
              {analysisResult.resume_analysis_report.section_wise_detailed_feedback.profile_summary && (
                <div className="feedback-section">
                  <h4>📝 Profile Summary</h4>
                  <div className="feedback-content">
                    <div className="current-state">
                      <strong>Current State:</strong> {analysisResult.resume_analysis_report.section_wise_detailed_feedback.profile_summary.current_state}
                    </div>
                    <div className="strengths">
                      <strong>Strengths:</strong>
                      <ul>
                        {analysisResult.resume_analysis_report.section_wise_detailed_feedback.profile_summary.strengths.map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="improvements">
                      <strong>Improvements:</strong>
                      <ul>
                        {analysisResult.resume_analysis_report.section_wise_detailed_feedback.profile_summary.improvements.map((improvement: string, index: number) => (
                          <li key={index}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Education */}
              {analysisResult.resume_analysis_report.section_wise_detailed_feedback.education && (
                <div className="feedback-section">
                  <h4>🎓 Education</h4>
                  <div className="feedback-content">
                    <div className="current-state">
                      <strong>Current State:</strong> {analysisResult.resume_analysis_report.section_wise_detailed_feedback.education.current_state}
                    </div>
                    <div className="strengths">
                      <strong>Strengths:</strong>
                      <ul>
                        {analysisResult.resume_analysis_report.section_wise_detailed_feedback.education.strengths.map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="improvements">
                      <strong>Improvements:</strong>
                      <ul>
                        {analysisResult.resume_analysis_report.section_wise_detailed_feedback.education.improvements.map((improvement: string, index: number) => (
                          <li key={index}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills */}
              {analysisResult.resume_analysis_report.section_wise_detailed_feedback.skills && (
                <div className="feedback-section">
                  <h4>🛠️ Skills</h4>
                  <div className="feedback-content">
                    <div className="current-state">
                      <strong>Current State:</strong> {analysisResult.resume_analysis_report.section_wise_detailed_feedback.skills.current_state}
                    </div>
                    <div className="strengths">
                      <strong>Strengths:</strong>
                      <ul>
                        {analysisResult.resume_analysis_report.section_wise_detailed_feedback.skills.strengths.map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="improvements">
                      <strong>Improvements:</strong>
                      <ul>
                        {analysisResult.resume_analysis_report.section_wise_detailed_feedback.skills.improvements.map((improvement: string, index: number) => (
                          <li key={index}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Projects */}
              {analysisResult.resume_analysis_report.section_wise_detailed_feedback.projects && (
                <div className="feedback-section">
                  <h4>💼 Projects</h4>
                  <div className="feedback-content">
                    <div className="current-state">
                      <strong>Current State:</strong> {analysisResult.resume_analysis_report.section_wise_detailed_feedback.projects.current_state}
                    </div>
                    <div className="strengths">
                      <strong>Strengths:</strong>
                      <ul>
                        {analysisResult.resume_analysis_report.section_wise_detailed_feedback.projects.strengths.map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="improvements">
                      <strong>Improvements:</strong>
                      <ul>
                        {analysisResult.resume_analysis_report.section_wise_detailed_feedback.projects.improvements.map((improvement: string, index: number) => (
                          <li key={index}>{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Missing Sections */}
              {analysisResult.resume_analysis_report.section_wise_detailed_feedback.missing_sections && (
                <div className="feedback-section missing-sections">
                  <h4>❌ Missing Sections</h4>
                  <div className="missing-sections-content">
                    {Object.entries(analysisResult.resume_analysis_report.section_wise_detailed_feedback.missing_sections).map(([key, value]) => (
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
          {analysisResult.resume_analysis_report?.improvement_recommendations && (
            <div className="improvements-detailed">
              {/* Immediate Resume Additions */}
              {analysisResult.resume_analysis_report.improvement_recommendations.immediate_resume_additions?.length > 0 && (
                <div className="improvement-category immediate">
                  <h4><AlertTriangle className="inline-icon" /> Immediate Resume Updates</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.improvement_recommendations.immediate_resume_additions.map((action: string, index: number) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Immediate Priority Actions */}
              {analysisResult.resume_analysis_report.improvement_recommendations.immediate_priority_actions?.length > 0 && (
                <div className="improvement-category priority">
                  <h4><Target className="inline-icon" /> Immediate Priority Actions</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.improvement_recommendations.immediate_priority_actions.map((action: string, index: number) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Short Term Goals */}
              {analysisResult.resume_analysis_report.improvement_recommendations.short_term_development_goals?.length > 0 && (
                <div className="improvement-category short-term">
                  <h4><Calendar className="inline-icon" /> Short-term Goals (1-3 months)</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.improvement_recommendations.short_term_development_goals.map((goal: string, index: number) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Medium Term Objectives */}
              {analysisResult.resume_analysis_report.improvement_recommendations.medium_term_objectives?.length > 0 && (
                <div className="improvement-category medium-term">
                  <h4><Star className="inline-icon" /> Medium-term Objectives (3-6 months)</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.improvement_recommendations.medium_term_objectives.map((objective: string, index: number) => (
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
          {analysisResult.resume_analysis_report?.soft_skills_enhancement_suggestions && (
            <div className="soft-skills-detailed">
              {/* Communication Skills */}
              {analysisResult.resume_analysis_report.soft_skills_enhancement_suggestions.communication_skills?.length > 0 && (
                <div className="soft-skill-category">
                  <h4><Users className="inline-icon" /> Communication Skills</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.soft_skills_enhancement_suggestions.communication_skills.map((skill: string, index: number) => (
                      <li key={index}>{skill}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Teamwork and Collaboration */}
              {analysisResult.resume_analysis_report.soft_skills_enhancement_suggestions.teamwork_and_collaboration?.length > 0 && (
                <div className="soft-skill-category">
                  <h4><Users className="inline-icon" /> Teamwork and Collaboration</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.soft_skills_enhancement_suggestions.teamwork_and_collaboration.map((skill: string, index: number) => (
                      <li key={index}>{skill}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Leadership and Initiative */}
              {analysisResult.resume_analysis_report.soft_skills_enhancement_suggestions.leadership_and_initiative?.length > 0 && (
                <div className="soft-skill-category">
                  <h4><Award className="inline-icon" /> Leadership and Initiative</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.soft_skills_enhancement_suggestions.leadership_and_initiative.map((skill: string, index: number) => (
                      <li key={index}>{skill}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Problem Solving Approach */}
              {analysisResult.resume_analysis_report.soft_skills_enhancement_suggestions.problem_solving_approach?.length > 0 && (
                <div className="soft-skill-category">
                  <h4><Lightbulb className="inline-icon" /> Problem Solving Approach</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.soft_skills_enhancement_suggestions.problem_solving_approach.map((skill: string, index: number) => (
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
          {analysisResult.resume_analysis_report?.final_assessment && (
            <div className="final-assessment-detailed">
              <div className="assessment-status">
                <span className="status-label">Eligibility Status:</span>
                <span className={`status-value ${analysisResult.resume_analysis_report.final_assessment.eligibility_status.includes('Qualified') ? 'qualified' : 'needs-work'}`}>
                  {analysisResult.resume_analysis_report.final_assessment.eligibility_status}
                </span>
              </div>

              {analysisResult.resume_analysis_report.final_assessment.hiring_recommendation && (
                <div className="hiring-recommendation">
                  <h4><Briefcase className="inline-icon" /> Hiring Recommendation</h4>
                  <p>{analysisResult.resume_analysis_report.final_assessment.hiring_recommendation}</p>
                </div>
              )}

              {analysisResult.resume_analysis_report.final_assessment.key_interview_areas?.length > 0 && (
                <div className="interview-areas">
                  <h4><Users className="inline-icon" /> Key Interview Focus Areas</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.final_assessment.key_interview_areas.map((area: string, index: number) => (
                      <li key={index}>{area}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisResult.resume_analysis_report.final_assessment.onboarding_requirements?.length > 0 && (
                <div className="onboarding-requirements">
                  <h4><Book className="inline-icon" /> Onboarding Requirements</h4>
                  <ul className="detailed-list">
                    {analysisResult.resume_analysis_report.final_assessment.onboarding_requirements.map((requirement: string, index: number) => (
                      <li key={index}>{requirement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisResult.resume_analysis_report.final_assessment.long_term_potential && (
                <div className="long-term-potential">
                  <h4><Star className="inline-icon" /> Long-term Potential</h4>
                  <p>{analysisResult.resume_analysis_report.final_assessment.long_term_potential}</p>
                </div>
              )}
            </div>
          )}
        </ExpandableSection>
      </div>

      {/* Legacy Format Support */}
      {!analysisResult.resume_analysis_report && (
        <div className="legacy-format-support">
          <div className="results-sections">
            <div className="strengths-section">
              <h3>🌟 Key Strengths</h3>
              <ul className="strengths-list">
                {(analysisResult.candidateStrengths || (analysisResult as any).candidateStrengths || (analysisResult as any).strengths || []).map((strength: string, index: number) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>

            <div className="improvements-section">
              <h3>💡 Areas for Improvement</h3>
              <ul className="improvements-list">
                {(analysisResult.developmentAreas || (analysisResult as any).suggestions || []).map((improvement: string, index: number) => (
                  <li key={index}>{improvement}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="results-actions">
        <button className="secondary-button" onClick={onAnalyzeAnother}>
          Analyze Another Resume
        </button>
        <button className="primary-button" onClick={onViewDashboard}>
          View Dashboard
        </button>
      </div>
    </div>
  );
};

export default AnalysisResults; 