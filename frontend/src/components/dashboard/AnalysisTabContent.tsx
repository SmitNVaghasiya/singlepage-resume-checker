import React from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Target,
  ChevronDown,
  ChevronUp,
  Code,
  Briefcase,
  Book,
  Settings,
  FileText,
  Users,
  Info,
  User,
  MessageSquare,
  Zap,
  Calendar,
  TrendingUp,
  Award,
} from "lucide-react";
import "./AnalysisTabContent.css";

interface AnalysisTabContentProps {
  activeTab: string;
  expandedSections: Set<string>;
  analysisData: {
    strengths?: any;
    weaknesses?: any;
    feedback?: any;
    recommendations?: any;
    softSkills?: any;
    finalAssessment?: any;
  };
  onToggleSection: (sectionId: string) => void;
}

const AnalysisTabContent: React.FC<AnalysisTabContentProps> = ({
  activeTab,
  expandedSections,
  analysisData,
  onToggleSection,
}) => {
  const TabContent: React.FC<{ children: React.ReactNode; tabId: string }> = ({
    children,
    tabId,
  }) => {
    if (activeTab !== tabId) return null;
    return (
      <div
        className="tab-content active"
        role="tabpanel"
        aria-labelledby={`tab-${tabId}`}
      >
        <div className="tab-content-inner">{children}</div>
      </div>
    );
  };

  const CollapsibleSection: React.FC<{
    title: string;
    children: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    color?: string;
    isEmpty?: boolean;
  }> = ({
    title,
    children,
    isExpanded,
    onToggle,
    icon: Icon,
    color = "#667eea",
    isEmpty = false,
  }) => (
    <div className={`collapsible-section ${isEmpty ? "empty" : ""}`}>
      <button
        className="collapsible-header"
        onClick={onToggle}
        style={{ "--section-color": color } as React.CSSProperties}
        aria-expanded={isExpanded}
        disabled={isEmpty}
      >
        {Icon && <Icon className="section-icon" aria-hidden="true" />}
        <span className="section-title">{title}</span>
        {!isEmpty &&
          (isExpanded ? (
            <ChevronUp className="expand-icon" aria-hidden="true" />
          ) : (
            <ChevronDown className="expand-icon" aria-hidden="true" />
          ))}
      </button>
      {isExpanded && !isEmpty && (
        <div
          className="collapsible-content"
          role="region"
          aria-labelledby={`section-${title}`}
        >
          {children}
        </div>
      )}
      {isEmpty && <div className="empty-message">No data available</div>}
    </div>
  );

  const ItemList: React.FC<{
    items: string[];
    iconType: "strength" | "weakness" | "recommendation" | "assessment";
  }> = ({ items, iconType }) => {
    const iconMap = {
      strength: CheckCircle2,
      weakness: XCircle,
      recommendation: ArrowRight,
      assessment: Target,
    };

    const Icon = iconMap[iconType];

    if (!items || items.length === 0) {
      return <div className="empty-list">No items available</div>;
    }

    return (
      <ul className="item-list" role="list">
        {items.map((item, index) => (
          <li key={index} role="listitem">
            <Icon className={`${iconType}-icon`} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="tab-contents">
      {/* Overview Tab */}
      <TabContent tabId="overview">
        <h2 className="section-title">Analysis Overview</h2>
        {/* Overview content is now in AnalysisSummary component */}
      </TabContent>

      {/* Strengths Tab */}
      <TabContent tabId="strengths">
        <h2 className="section-title">Strengths Analysis</h2>
        <div className="strengths-grid">
          {analysisData.strengths && (
            <>
              <CollapsibleSection
                title="Technical Skills"
                isExpanded={expandedSections.has("tech-skills")}
                onToggle={() => onToggleSection("tech-skills")}
                icon={Code}
                color="#10b981"
                isEmpty={!analysisData.strengths.technical_skills?.length}
              >
                <ItemList
                  items={analysisData.strengths.technical_skills || []}
                  iconType="strength"
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Project Portfolio"
                isExpanded={expandedSections.has("project-portfolio")}
                onToggle={() => onToggleSection("project-portfolio")}
                icon={Briefcase}
                color="#10b981"
                isEmpty={!analysisData.strengths.project_portfolio?.length}
              >
                <ItemList
                  items={analysisData.strengths.project_portfolio || []}
                  iconType="strength"
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Educational Background"
                isExpanded={expandedSections.has("education")}
                onToggle={() => onToggleSection("education")}
                icon={Book}
                color="#10b981"
                isEmpty={!analysisData.strengths.educational_background?.length}
              >
                <ItemList
                  items={analysisData.strengths.educational_background || []}
                  iconType="strength"
                />
              </CollapsibleSection>
            </>
          )}
        </div>
      </TabContent>

      {/* Weaknesses Tab */}
      <TabContent tabId="weaknesses">
        <h2 className="section-title">Weaknesses Analysis</h2>
        <div className="weaknesses-grid">
          {analysisData.weaknesses && (
            <>
              <CollapsibleSection
                title="Critical Gaps Against Job Description"
                isExpanded={expandedSections.has("critical-gaps")}
                onToggle={() => onToggleSection("critical-gaps")}
                icon={XCircle}
                color="#ef4444"
                isEmpty={
                  !analysisData.weaknesses.critical_gaps_against_job_description
                    ?.length
                }
              >
                <ItemList
                  items={
                    analysisData.weaknesses
                      .critical_gaps_against_job_description || []
                  }
                  iconType="weakness"
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Technical Deficiencies"
                isExpanded={expandedSections.has("tech-deficiencies")}
                onToggle={() => onToggleSection("tech-deficiencies")}
                icon={Settings}
                color="#ef4444"
                isEmpty={
                  !analysisData.weaknesses.technical_deficiencies?.length
                }
              >
                <ItemList
                  items={analysisData.weaknesses.technical_deficiencies || []}
                  iconType="weakness"
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Resume Presentation Issues"
                isExpanded={expandedSections.has("presentation-issues")}
                onToggle={() => onToggleSection("presentation-issues")}
                icon={FileText}
                color="#ef4444"
                isEmpty={
                  !analysisData.weaknesses.resume_presentation_issues?.length
                }
              >
                <ItemList
                  items={
                    analysisData.weaknesses.resume_presentation_issues || []
                  }
                  iconType="weakness"
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Soft Skills Gaps"
                isExpanded={expandedSections.has("soft-skills-gaps")}
                onToggle={() => onToggleSection("soft-skills-gaps")}
                icon={Users}
                color="#ef4444"
                isEmpty={!analysisData.weaknesses.soft_skills_gaps?.length}
              >
                <ItemList
                  items={analysisData.weaknesses.soft_skills_gaps || []}
                  iconType="weakness"
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Missing Essential Elements"
                isExpanded={expandedSections.has("missing-elements")}
                onToggle={() => onToggleSection("missing-elements")}
                icon={Info}
                color="#ef4444"
                isEmpty={
                  !analysisData.weaknesses.missing_essential_elements?.length
                }
              >
                <ItemList
                  items={
                    analysisData.weaknesses.missing_essential_elements || []
                  }
                  iconType="weakness"
                />
              </CollapsibleSection>
            </>
          )}
        </div>
      </TabContent>

      {/* Section Feedback Tab */}
      <TabContent tabId="feedback">
        <h2 className="section-title">Section-wise Detailed Feedback</h2>
        <div className="section-feedback">
          {analysisData.feedback && (
            <>
              {/* Contact Information */}
              <div className="feedback-section">
                <h3 className="feedback-title">
                  <User className="feedback-icon" aria-hidden="true" />
                  Contact Information
                </h3>
                <div className="feedback-state">
                  {analysisData.feedback.contact_information.current_state}
                </div>
                <div className="feedback-content">
                  <div className="feedback-list">
                    <h5>Strengths:</h5>
                    <ItemList
                      items={
                        analysisData.feedback.contact_information.strengths
                      }
                      iconType="strength"
                    />
                  </div>
                  <div className="feedback-list improvements">
                    <h5>Improvements:</h5>
                    <ItemList
                      items={
                        analysisData.feedback.contact_information.improvements
                      }
                      iconType="recommendation"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Summary */}
              <div className="feedback-section">
                <h3 className="feedback-title">
                  <FileText className="feedback-icon" aria-hidden="true" />
                  Profile Summary
                </h3>
                <div className="feedback-state">
                  {analysisData.feedback.profile_summary.current_state}
                </div>
                <div className="feedback-content">
                  <div className="feedback-list">
                    <h5>Strengths:</h5>
                    <ItemList
                      items={analysisData.feedback.profile_summary.strengths}
                      iconType="strength"
                    />
                  </div>
                  <div className="feedback-list improvements">
                    <h5>Improvements:</h5>
                    <ItemList
                      items={analysisData.feedback.profile_summary.improvements}
                      iconType="recommendation"
                    />
                  </div>
                </div>
              </div>

              {/* Education */}
              <div className="feedback-section">
                <h3 className="feedback-title">
                  <Book className="feedback-icon" aria-hidden="true" />
                  Education
                </h3>
                <div className="feedback-state">
                  {analysisData.feedback.education.current_state}
                </div>
                <div className="feedback-content">
                  <div className="feedback-list">
                    <h5>Strengths:</h5>
                    <ItemList
                      items={analysisData.feedback.education.strengths}
                      iconType="strength"
                    />
                  </div>
                  <div className="feedback-list improvements">
                    <h5>Improvements:</h5>
                    <ItemList
                      items={analysisData.feedback.education.improvements}
                      iconType="recommendation"
                    />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="feedback-section">
                <h3 className="feedback-title">
                  <Code className="feedback-icon" aria-hidden="true" />
                  Skills
                </h3>
                <div className="feedback-state">
                  {analysisData.feedback.skills.current_state}
                </div>
                <div className="feedback-content">
                  <div className="feedback-list">
                    <h5>Strengths:</h5>
                    <ItemList
                      items={analysisData.feedback.skills.strengths}
                      iconType="strength"
                    />
                  </div>
                  <div className="feedback-list improvements">
                    <h5>Improvements:</h5>
                    <ItemList
                      items={analysisData.feedback.skills.improvements}
                      iconType="recommendation"
                    />
                  </div>
                </div>
              </div>

              {/* Projects */}
              <div className="feedback-section">
                <h3 className="feedback-title">
                  <Briefcase className="feedback-icon" aria-hidden="true" />
                  Projects
                </h3>
                <div className="feedback-state">
                  {analysisData.feedback.projects.current_state}
                </div>
                <div className="feedback-content">
                  <div className="feedback-list">
                    <h5>Strengths:</h5>
                    <ItemList
                      items={analysisData.feedback.projects.strengths}
                      iconType="strength"
                    />
                  </div>
                  <div className="feedback-list improvements">
                    <h5>Improvements:</h5>
                    <ItemList
                      items={analysisData.feedback.projects.improvements}
                      iconType="recommendation"
                    />
                  </div>
                </div>
              </div>

              {/* Missing Sections */}
              {analysisData.feedback.missing_sections && (
                <div className="missing-sections">
                  <h4>Missing Sections</h4>
                  <div className="missing-grid">
                    <div className="missing-item">
                      <h5>Certifications</h5>
                      <p>
                        {analysisData.feedback.missing_sections.certifications}
                      </p>
                    </div>
                    <div className="missing-item">
                      <h5>Experience</h5>
                      <p>{analysisData.feedback.missing_sections.experience}</p>
                    </div>
                    <div className="missing-item">
                      <h5>Achievements</h5>
                      <p>
                        {analysisData.feedback.missing_sections.achievements}
                      </p>
                    </div>
                    <div className="missing-item">
                      <h5>Soft Skills</h5>
                      <p>
                        {analysisData.feedback.missing_sections.soft_skills}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </TabContent>

      {/* Recommendations Tab */}
      <TabContent tabId="recommendations">
        <h2 className="section-title">Improvement Recommendations</h2>
        <div className="recommendations-grid">
          {analysisData.recommendations && (
            <>
              <div className="recommendation-category">
                <h3 className="category-title">
                  <Zap className="category-icon" aria-hidden="true" />
                  Immediate Resume Additions
                </h3>
                <ItemList
                  items={
                    analysisData.recommendations.immediate_resume_additions ||
                    []
                  }
                  iconType="recommendation"
                />
              </div>
              <div className="recommendation-category">
                <h3 className="category-title">
                  <Target className="category-icon" aria-hidden="true" />
                  Immediate Priority Actions
                </h3>
                <ItemList
                  items={
                    analysisData.recommendations.immediate_priority_actions ||
                    []
                  }
                  iconType="recommendation"
                />
              </div>
              <div className="recommendation-category">
                <h3 className="category-title">
                  <Calendar className="category-icon" aria-hidden="true" />
                  Short-term Development Goals
                </h3>
                <ItemList
                  items={
                    analysisData.recommendations.short_term_development_goals ||
                    []
                  }
                  iconType="recommendation"
                />
              </div>
              <div className="recommendation-category">
                <h3 className="category-title">
                  <TrendingUp className="category-icon" aria-hidden="true" />
                  Medium-term Objectives
                </h3>
                <ItemList
                  items={
                    analysisData.recommendations.medium_term_objectives || []
                  }
                  iconType="recommendation"
                />
              </div>
            </>
          )}
        </div>

        {/* Soft Skills Enhancement */}
        {analysisData.softSkills && (
          <div className="skills-enhancement">
            <h3>Soft Skills Enhancement</h3>
            <div className="skills-grid">
              <div className="skill-category">
                <h4>Communication Skills</h4>
                <ItemList
                  items={analysisData.softSkills.communication_skills || []}
                  iconType="recommendation"
                />
              </div>
              <div className="skill-category">
                <h4>Teamwork & Collaboration</h4>
                <ItemList
                  items={
                    analysisData.softSkills.teamwork_and_collaboration || []
                  }
                  iconType="recommendation"
                />
              </div>
              <div className="skill-category">
                <h4>Leadership & Initiative</h4>
                <ItemList
                  items={
                    analysisData.softSkills.leadership_and_initiative || []
                  }
                  iconType="recommendation"
                />
              </div>
              <div className="skill-category">
                <h4>Problem-solving Approach</h4>
                <ItemList
                  items={analysisData.softSkills.problem_solving_approach || []}
                  iconType="recommendation"
                />
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
            {analysisData.finalAssessment && (
              <>
                <div className="assessment-item">
                  <h4>Eligibility Status</h4>
                  <p>{analysisData.finalAssessment.eligibility_status}</p>
                </div>
                <div className="assessment-item">
                  <h4>Hiring Recommendation</h4>
                  <p>{analysisData.finalAssessment.hiring_recommendation}</p>
                </div>
                <div className="assessment-item">
                  <h4>Key Interview Areas</h4>
                  <ItemList
                    items={
                      analysisData.finalAssessment.key_interview_areas || []
                    }
                    iconType="assessment"
                  />
                </div>
                <div className="assessment-item">
                  <h4>Onboarding Requirements</h4>
                  <ItemList
                    items={
                      analysisData.finalAssessment.onboarding_requirements || []
                    }
                    iconType="assessment"
                  />
                </div>
                <div className="assessment-item">
                  <h4>Long-term Potential</h4>
                  <p>{analysisData.finalAssessment.long_term_potential}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </TabContent>
    </div>
  );
};

export default AnalysisTabContent;
