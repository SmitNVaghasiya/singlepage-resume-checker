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
    candidateInfo?: any;
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
    const getTypeConfig = () => {
      switch (type) {
        case "strength":
          return {
            icon: CheckCircle2,
            iconColor: "text-emerald-600",
            bgColor: "bg-emerald-50",
            borderColor: "border-emerald-200",
            textColor: "text-emerald-800",
            cardBg: "bg-white",
          };
        case "weakness":
          return {
            icon: XCircle,
            iconColor: "text-red-600",
            bgColor: "bg-red-50",
            borderColor: "border-red-200",
            textColor: "text-red-800",
            cardBg: "bg-white",
          };
        case "recommendation":
          return {
            icon: ArrowRight,
            iconColor: "text-blue-600",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
            textColor: "text-blue-800",
            cardBg: "bg-white",
          };
        default:
          return {
            icon: Target,
            iconColor: "text-gray-600",
            bgColor: "bg-gray-50",
            borderColor: "border-gray-200",
            textColor: "text-gray-800",
            cardBg: "bg-white",
          };
      }
    };

    const config = getTypeConfig();
    const Icon = config.icon;

    if (!items || items.length === 0) {
      return (
        <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 bg-gray-100 rounded-full">
              <Info className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">{emptyMessage}</p>
            <p className="text-sm text-gray-500">
              This section will be populated when data is available
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item: string, index: number) => (
          <div
            key={index}
            className={`${config.cardBg} ${config.borderColor} rounded-lg p-4 border-l-4 hover:shadow-md transition-all duration-200 group`}
          >
            <div className="flex items-start gap-3">
              {showIcon && (
                <div className="mt-0.5">
                  <Icon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
              )}
              <div className="flex-1">
                <p
                  className={`${config.textColor} font-medium leading-relaxed`}
                >
                  {item}
                </p>
              </div>
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
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {badge && (
              <div className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {badge}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-6 bg-white">{children}</div>
    </div>
  );

  const StatCard: React.FC<{
    title: string;
    value: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }> = ({ title, value, description, icon: Icon, color }) => (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{description}</p>
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
      <div className="space-y-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Current State
          </h4>
          <p className="text-blue-800 leading-relaxed">
            {feedbackData.current_state}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Strengths
            </h4>
            <ItemCard items={feedbackData.strengths} type="strength" />
          </div>

          <div>
            <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-500" />
              Improvements
            </h4>
            <ItemCard items={feedbackData.improvements} type="recommendation" />
          </div>
        </div>
      </div>
    </Section>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">Analysis Summary</h2>
        </div>
        <p className="text-blue-100 text-lg leading-relaxed">
          {analysisData.fitSummary || analysisData.conclusion}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Match Score"
          value={`${analysisData.score || 0}%`}
          description="Overall compatibility rating"
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard
          title="Success Chance"
          value={`${analysisData.chance || 0}%`}
          description="Probability of success"
          icon={Target}
          color="bg-emerald-500"
        />
        <StatCard
          title="Status"
          value={analysisData.validity || "Pending"}
          description="Current eligibility status"
          icon={CheckSquare}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
          <h3 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Key Strengths
          </h3>
          <div className="space-y-3">
            {(analysisData.strengths?.technical_skills?.slice(0, 3) || []).map(
              (skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <p className="text-emerald-800 font-medium">{skill}</p>
                </div>
              )
            )}
            {(!analysisData.strengths?.technical_skills ||
              analysisData.strengths.technical_skills.length === 0) && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <p className="text-emerald-800 font-medium">
                  Strong foundation in relevant technologies
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <h3 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Critical Gaps
          </h3>
          <div className="space-y-3">
            {(
              analysisData.weaknesses?.critical_gaps_against_job_description?.slice(
                0,
                3
              ) || []
            ).map((gap, index) => (
              <div key={index} className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-red-800 font-medium">{gap}</p>
              </div>
            ))}
            {(!analysisData.weaknesses?.critical_gaps_against_job_description ||
              analysisData.weaknesses.critical_gaps_against_job_description
                .length === 0) && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-red-800 font-medium">
                  Some areas need improvement
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
        <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-600" />
          Overall Assessment
        </h3>
        <div className="bg-white rounded-lg p-4 border border-amber-200">
          <p className="text-amber-800 font-medium">
            {analysisData.eligibility} - {analysisData.conclusion}
          </p>
        </div>
      </div>
    </div>
  );

  const StrengthsTab = () => (
    <div className="space-y-6">
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
    <div className="space-y-6">
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
    <div className="space-y-6">
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
          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <h4 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Sections to Add
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analysisData.feedback.missing_sections).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="bg-white rounded-lg p-4 border border-red-200"
                  >
                    <h5 className="font-medium text-red-900 capitalize mb-2">
                      {key.replace("_", " ")}
                    </h5>
                    <p className="text-red-800 text-sm">{value}</p>
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
    <div className="space-y-6">
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
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-8 text-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-white/20 rounded-lg">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">Final Assessment</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 rounded-lg p-6">
            <h4 className="font-semibold mb-3 text-slate-200">
              Eligibility Status
            </h4>
            <p className="text-xl font-bold text-white">
              {analysisData.finalAssessment?.eligibility_status ||
                analysisData.eligibility}
            </p>
          </div>
          <div className="bg-white/10 rounded-lg p-6">
            <h4 className="font-semibold mb-3 text-slate-200">
              Long-term Potential
            </h4>
            <p className="text-xl font-bold text-white">
              {analysisData.finalAssessment?.long_term_potential ||
                "High potential with proper development"}
            </p>
          </div>
        </div>
      </div>

      <Section title="Hiring Recommendation" icon={UserCheck}>
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-semibold text-blue-900">Recommendation</h4>
          </div>
          <p className="text-blue-800 leading-relaxed font-medium">
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm">{renderTabContent()}</div>
    </div>
  );
};

export default AnalysisTabContent;
