import React from "react";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Target,
  Code,
  Briefcase,
  Book,
  Settings,
  FileText,
  Users,
  User,
  Zap,
  Calendar,
  AlertTriangle,
  Award,
  MessageSquare,
  UserCheck,
  Lightbulb,
  BarChart3,
  TrendingUp,
  Info,
  Plus,
  CheckSquare,
  AlertCircle,
} from "lucide-react";
import "./AnalysisTabContent.css";

// Type definitions
interface ItemCardProps {
  items: string[];
  type?: "strength" | "weakness" | "recommendation" | "neutral";
  showIcon?: boolean;
  emptyMessage?: string;
}

interface SectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
  badge?: string;
}

interface AnalysisTabContentProps {
  activeTab: string;
  analysisData: {
    score: number;
    chance: number;
    jobTitle: string;
    validity: string;
    eligibility: string;
    conclusion: string;
    fitSummary?: string;
    candidateInfo?: {
      name: string;
      position_applied: string;
      experience_level: string;
      current_status: string;
    };
    priorities: string[];
    strengths?: {
      technical_skills?: string[];
      project_portfolio?: string[];
      educational_background?: string[];
    };
    weaknesses?: {
      critical_gaps_against_job_description?: string[];
      technical_deficiencies?: string[];
      resume_presentation_issues?: string[];
      soft_skills_gaps?: string[];
      missing_essential_elements?: string[];
    };
    feedback?: {
      contact_information?: {
        current_state: string;
        strengths: string[];
        improvements: string[];
      };
      profile_summary?: {
        current_state: string;
        strengths: string[];
        improvements: string[];
      };
      education?: {
        current_state: string;
        strengths: string[];
        improvements: string[];
      };
      skills?: {
        current_state: string;
        strengths: string[];
        improvements: string[];
      };
      projects?: {
        current_state: string;
        strengths: string[];
        improvements: string[];
      };
      missing_sections?: {
        certifications?: string;
        experience?: string;
        achievements?: string;
        soft_skills?: string;
      };
    };
    recommendations?: {
      immediate_resume_additions?: string[];
      immediate_priority_actions?: string[];
      short_term_development_goals?: string[];
      medium_term_objectives?: string[];
    };
    softSkills?: {
      communication_skills?: string[];
      teamwork_and_collaboration?: string[];
      leadership_and_initiative?: string[];
      problem_solving_approach?: string[];
    };
    finalAssessment?: {
      eligibility_status: string;
      hiring_recommendation: string;
      key_interview_areas?: string[];
      onboarding_requirements?: string[];
      long_term_potential: string;
    };
  };
}

const AnalysisTabContent: React.FC<AnalysisTabContentProps> = ({
  activeTab,
  analysisData,
}) => {
  const ItemCard: React.FC<ItemCardProps> = ({
    items,
    type = "neutral",
    showIcon = true,
    emptyMessage = "No items available",
  }) => {
    if (!items || items.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Info className="w-6 h-6" />
          </div>
          <p className="empty-state-title">{emptyMessage}</p>
          <p className="empty-state-description">
            This section will be populated when data is available
          </p>
        </div>
      );
    }

    return (
      <div className="item-cards-container">
        {items.map((item: string, index: number) => (
          <div key={index} className={`item-card ${type}`}>
            <div className="item-card-content">
              {showIcon && (
                <div className={`item-card-icon ${type}`}>
                  {type === "strength" && <CheckCircle2 className="w-5 h-5" />}
                  {type === "weakness" && <XCircle className="w-5 h-5" />}
                  {type === "recommendation" && (
                    <ArrowRight className="w-5 h-5" />
                  )}
                  {type === "neutral" && <Target className="w-5 h-5" />}
                </div>
              )}
              <div className="item-card-text">{item}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const Section: React.FC<SectionProps> = ({
    title,
    icon: Icon,
    children,
    className = "",
    badge,
  }) => (
    <div className={`analysis-section ${className}`}>
      <div className="section-header">
        <div className="section-title">
          <div className="section-icon">
            <Icon className="w-5 h-5" />
          </div>
          <span>{title}</span>
          {badge && <span className="section-badge">{badge}</span>}
        </div>
      </div>
      <div className="section-content">{children}</div>
    </div>
  );

  const StatCard: React.FC<{
    title: string;
    value: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: "blue" | "green" | "purple";
  }> = ({ title, value, description, icon: Icon, color }) => (
    <div className="stat-card">
      <div className="stat-header">
        <div className={`stat-icon ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h4 className="stat-title">{title}</h4>
      </div>
      <div className="stat-content">
        <p className="stat-value">{value}</p>
        <p className="stat-description">{description}</p>
      </div>
    </div>
  );

  const FeedbackSection: React.FC<{
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    feedbackData: {
      current_state: string;
      strengths: string[];
      improvements: string[];
    };
  }> = ({ title, icon: Icon, feedbackData }) => (
    <Section title={title} icon={Icon}>
      <div className="feedback-section">
        <div className="feedback-content">
          <div className="feedback-subtitle info">
            <h4 className="feedback-title">
              <Info className="w-4 h-4" />
              Current State
            </h4>
            <p className="feedback-text">{feedbackData.current_state}</p>
          </div>

          <div className="feedback-grid">
            <div className="feedback-column">
              <h4 className="feedback-column-title success">
                <CheckCircle2 className="w-4 h-4" />
                Strengths
              </h4>
              <ItemCard items={feedbackData.strengths} type="strength" />
            </div>

            <div className="feedback-column">
              <h4 className="feedback-column-title warning">
                <Plus className="w-4 h-4" />
                Improvements
              </h4>
              <ItemCard
                items={feedbackData.improvements}
                type="recommendation"
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );

  const OverviewTab = () => (
    <div className="analysis-tab-content">
      <div className="overview-hero">
        <div className="overview-hero-content">
          <div className="overview-hero-header">
            <div className="overview-hero-icon">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h2 className="overview-hero-title">Analysis Summary</h2>
          </div>
          <p className="overview-hero-description">
            {analysisData.fitSummary || analysisData.conclusion}
          </p>
        </div>
      </div>

      <div className="analysis-grid">
        <StatCard
          title="Match Score"
          value={`${analysisData.score || 0}%`}
          description="Overall compatibility rating"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Success Chance"
          value={`${analysisData.chance || 0}%`}
          description="Probability of success"
          icon={Target}
          color="green"
        />
        <StatCard
          title="Status"
          value={analysisData.validity || "Pending"}
          description="Current eligibility status"
          icon={CheckSquare}
          color="purple"
        />
      </div>

      <div className="analysis-grid">
        <div className="strengths-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <CheckCircle2 className="panel-icon" />
              Key Strengths
            </h3>
          </div>
          <div className="panel-content">
            {(analysisData.strengths?.technical_skills?.slice(0, 3) || []).map(
              (skill, index) => (
                <div key={index} className="panel-item">
                  <CheckCircle2 className="panel-item-icon" />
                  <p className="panel-item-text">{skill}</p>
                </div>
              )
            )}
            {(!analysisData.strengths?.technical_skills ||
              analysisData.strengths.technical_skills.length === 0) && (
              <div className="panel-item">
                <CheckCircle2 className="panel-item-icon" />
                <p className="panel-item-text">
                  Strong foundation in relevant technologies
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="weaknesses-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <AlertCircle className="panel-icon" />
              Critical Gaps
            </h3>
          </div>
          <div className="panel-content">
            {(
              analysisData.weaknesses?.critical_gaps_against_job_description?.slice(
                0,
                3
              ) || []
            ).map((gap, index) => (
              <div key={index} className="panel-item">
                <AlertCircle className="panel-item-icon" />
                <p className="panel-item-text">{gap}</p>
              </div>
            ))}
            {(!analysisData.weaknesses?.critical_gaps_against_job_description ||
              analysisData.weaknesses.critical_gaps_against_job_description
                .length === 0) && (
              <div className="panel-item">
                <AlertCircle className="panel-item-icon" />
                <p className="panel-item-text">Some areas need improvement</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="assessment-summary">
        <h3 className="assessment-title">
          <Award className="assessment-icon" />
          Overall Assessment
        </h3>
        <div className="assessment-content">
          <p className="assessment-text">
            {analysisData.eligibility} - {analysisData.conclusion}
          </p>
        </div>
      </div>
    </div>
  );

  const StrengthsTab = () => (
    <div className="analysis-tab-content">
      <Section
        title="Technical Skills"
        icon={Code}
        badge={`${analysisData.strengths?.technical_skills?.length || 0} items`}
      >
        <ItemCard
          items={analysisData.strengths?.technical_skills || []}
          type="strength"
          emptyMessage="No technical skills highlighted"
        />
      </Section>

      <Section
        title="Project Portfolio"
        icon={Briefcase}
        badge={`${
          analysisData.strengths?.project_portfolio?.length || 0
        } items`}
      >
        <ItemCard
          items={analysisData.strengths?.project_portfolio || []}
          type="strength"
          emptyMessage="No project portfolio strengths identified"
        />
      </Section>

      <Section
        title="Educational Background"
        icon={Book}
        badge={`${
          analysisData.strengths?.educational_background?.length || 0
        } items`}
      >
        <ItemCard
          items={analysisData.strengths?.educational_background || []}
          type="strength"
          emptyMessage="No educational background strengths noted"
        />
      </Section>
    </div>
  );

  const WeaknessesTab = () => (
    <div className="analysis-tab-content">
      <Section
        title="Critical Gaps Against Job Description"
        icon={AlertTriangle}
        badge={`${
          analysisData.weaknesses?.critical_gaps_against_job_description
            ?.length || 0
        } items`}
      >
        <ItemCard
          items={
            analysisData.weaknesses?.critical_gaps_against_job_description || []
          }
          type="weakness"
          emptyMessage="No critical gaps identified"
        />
      </Section>

      <Section
        title="Technical Deficiencies"
        icon={Settings}
        badge={`${
          analysisData.weaknesses?.technical_deficiencies?.length || 0
        } items`}
      >
        <ItemCard
          items={analysisData.weaknesses?.technical_deficiencies || []}
          type="weakness"
          emptyMessage="No technical deficiencies found"
        />
      </Section>

      <Section
        title="Resume Presentation Issues"
        icon={FileText}
        badge={`${
          analysisData.weaknesses?.resume_presentation_issues?.length || 0
        } items`}
      >
        <ItemCard
          items={analysisData.weaknesses?.resume_presentation_issues || []}
          type="weakness"
          emptyMessage="No resume presentation issues noted"
        />
      </Section>

      <Section
        title="Soft Skills Gaps"
        icon={Users}
        badge={`${
          analysisData.weaknesses?.soft_skills_gaps?.length || 0
        } items`}
      >
        <ItemCard
          items={analysisData.weaknesses?.soft_skills_gaps || []}
          type="weakness"
          emptyMessage="No soft skills gaps identified"
        />
      </Section>
    </div>
  );

  const FeedbackTab = () => (
    <div className="analysis-tab-content">
      {analysisData.feedback?.contact_information && (
        <FeedbackSection
          title="Contact Information"
          icon={User}
          feedbackData={analysisData.feedback.contact_information}
        />
      )}

      {analysisData.feedback?.profile_summary && (
        <FeedbackSection
          title="Profile Summary"
          icon={FileText}
          feedbackData={analysisData.feedback.profile_summary}
        />
      )}

      {analysisData.feedback?.skills && (
        <FeedbackSection
          title="Skills Section"
          icon={Code}
          feedbackData={analysisData.feedback.skills}
        />
      )}

      {analysisData.feedback?.education && (
        <FeedbackSection
          title="Education"
          icon={Book}
          feedbackData={analysisData.feedback.education}
        />
      )}

      {analysisData.feedback?.projects && (
        <FeedbackSection
          title="Projects"
          icon={Briefcase}
          feedbackData={analysisData.feedback.projects}
        />
      )}

      {analysisData.feedback?.missing_sections && (
        <Section title="Missing Sections" icon={AlertTriangle}>
          <div className="missing-sections">
            <h4 className="missing-sections-title">
              <AlertTriangle className="missing-sections-icon" />
              Sections to Add
            </h4>
            <div className="missing-sections-grid">
              {Object.entries(analysisData.feedback.missing_sections).map(
                ([key, value]) => (
                  <div key={key} className="missing-section-item">
                    <h5 className="missing-section-name">
                      {key.replace("_", " ")}
                    </h5>
                    <p className="missing-section-description">{value}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </Section>
      )}
    </div>
  );

  const RecommendationsTab = () => (
    <div className="analysis-tab-content">
      <Section
        title="Immediate Resume Additions"
        icon={FileText}
        badge={`${
          analysisData.recommendations?.immediate_resume_additions?.length || 0
        } items`}
      >
        <ItemCard
          items={analysisData.recommendations?.immediate_resume_additions || []}
          type="recommendation"
          emptyMessage="No immediate resume additions recommended"
        />
      </Section>

      <Section
        title="Immediate Priority Actions"
        icon={Zap}
        badge={`${
          analysisData.recommendations?.immediate_priority_actions?.length || 0
        } items`}
      >
        <ItemCard
          items={analysisData.recommendations?.immediate_priority_actions || []}
          type="recommendation"
          emptyMessage="No immediate priority actions identified"
        />
      </Section>

      <Section
        title="Short-term Development Goals"
        icon={Calendar}
        badge={`${
          analysisData.recommendations?.short_term_development_goals?.length ||
          0
        } items`}
      >
        <ItemCard
          items={
            analysisData.recommendations?.short_term_development_goals || []
          }
          type="recommendation"
          emptyMessage="No short-term development goals specified"
        />
      </Section>

      {analysisData.recommendations?.medium_term_objectives && (
        <Section
          title="Medium-term Objectives"
          icon={Target}
          badge={`${analysisData.recommendations.medium_term_objectives.length} items`}
        >
          <ItemCard
            items={analysisData.recommendations.medium_term_objectives}
            type="recommendation"
            emptyMessage="No medium-term objectives defined"
          />
        </Section>
      )}
    </div>
  );

  const AssessmentTab = () => (
    <div className="analysis-tab-content">
      <div className="assessment-hero">
        <div className="assessment-hero-content">
          <div className="assessment-hero-header">
            <div className="assessment-hero-icon">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="assessment-hero-title">Final Assessment</h2>
          </div>

          <div className="assessment-grid">
            <div className="assessment-card">
              <h4 className="assessment-card-title">Eligibility Status</h4>
              <p className="assessment-card-value">
                {analysisData.finalAssessment?.eligibility_status ||
                  analysisData.eligibility}
              </p>
            </div>
            <div className="assessment-card">
              <h4 className="assessment-card-title">Long-term Potential</h4>
              <p className="assessment-card-value">
                {analysisData.finalAssessment?.long_term_potential ||
                  "High potential with proper development"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Section title="Hiring Recommendation" icon={UserCheck}>
        <div className="hiring-recommendation">
          <div className="recommendation-header">
            <div className="recommendation-icon">
              <UserCheck className="w-5 h-5" />
            </div>
            <h4 className="recommendation-title">Recommendation</h4>
          </div>
          <p className="recommendation-text">
            {analysisData.finalAssessment?.hiring_recommendation ||
              analysisData.conclusion}
          </p>
        </div>
      </Section>

      <Section
        title="Key Interview Areas"
        icon={MessageSquare}
        badge={`${
          analysisData.finalAssessment?.key_interview_areas?.length || 0
        } areas`}
      >
        <ItemCard
          items={analysisData.finalAssessment?.key_interview_areas || []}
          emptyMessage="No specific interview areas identified"
        />
      </Section>

      {analysisData.finalAssessment?.onboarding_requirements && (
        <Section
          title="Onboarding Requirements"
          icon={Settings}
          badge={`${analysisData.finalAssessment.onboarding_requirements.length} requirements`}
        >
          <ItemCard
            items={analysisData.finalAssessment.onboarding_requirements}
            emptyMessage="No specific onboarding requirements"
          />
        </Section>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "strengths":
        return <StrengthsTab />;
      case "weaknesses":
        return <WeaknessesTab />;
      case "feedback":
        return <FeedbackTab />;
      case "recommendations":
        return <RecommendationsTab />;
      case "assessment":
        return <AssessmentTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="analysis-tab-content-container">
      <div className="analysis-tab-content-wrapper">{renderTabContent()}</div>
    </div>
  );
};

export default AnalysisTabContent;
