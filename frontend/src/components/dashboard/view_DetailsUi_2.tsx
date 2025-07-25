// import React, { useState, useEffect } from "react";
// import {
//   User,
//   Target,
//   TrendingUp,
//   AlertCircle,
//   CheckCircle,
//   XCircle,
//   Star,
//   BookOpen,
//   Code,
//   Award,
//   Users,
//   Lightbulb,
//   RefreshCw,
//   LucideIcon,
//   BarChart3,
//   Brain,
//   Zap,
//   Settings,
//   MessageSquare,
//   Calendar,
//   FileText,
//   Briefcase,
//   Shield,
//   ArrowRight,
//   CheckCircle2,
//   Info,
//   Plus,
//   CheckSquare,
// } from "lucide-react";
// import { AnalysisResult } from "../../types";
// import { apiService } from "../../services/api";
// import FeedbackForm from "../feedback/FeedbackForm";
// import "./view_DetailsUi_2.css";

// interface ViewDetailsUI2Props {
//   analysisId: string;
// }

// const ViewDetailsUI2: React.FC<ViewDetailsUI2Props> = ({ analysisId }) => {
//   const [activeTab, setActiveTab] = useState("overview");
//   const [data, setData] = useState<AnalysisResult | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     fetchAnalysisData();
//   }, [analysisId]);

//   const fetchAnalysisData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const response = await apiService.getAnalysisResult(analysisId);

//       // Handle both response structures:
//       // 1. Expected: response.result (AnalysisResult)
//       // 2. Actual: response.result.result (nested structure)
//       const analysisData = (response.result as any).result || response.result;
//       setData(analysisData);
//     } catch (err) {
//       console.error("Error fetching analysis data:", err);
//       setError(
//         err instanceof Error ? err.message : "Failed to fetch analysis data"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getEligibilityColor = (eligibility: string) => {
//     if (eligibility.includes("Partially Eligible")) return "partially-eligible";
//     if (eligibility.includes("Eligible")) return "eligible";
//     return "not-eligible";
//   };

//   const getScoreColor = (score: number) => {
//     if (score >= 80) return "text-green-600";
//     if (score >= 60) return "text-yellow-600";
//     return "text-red-600";
//   };

//   const getScoreLabel = (score: number) => {
//     if (score >= 80) return "Excellent";
//     if (score >= 60) return "Good";
//     if (score >= 40) return "Average";
//     return "Needs Improvement";
//   };

//   const TabButton: React.FC<{
//     id: string;
//     label: string;
//     icon: LucideIcon;
//     active: boolean;
//     onClick: (id: string) => void;
//     count?: number;
//   }> = ({ id, label, icon: Icon, active, onClick, count }) => (
//     <button
//       onClick={() => onClick(id)}
//       className={`tab-button ${active ? "active" : ""}`}
//     >
//       <Icon size={18} />
//       <span className="tab-label">{label}</span>
//       {count !== undefined && <span className="tab-count">{count}</span>}
//     </button>
//   );

//   const Card: React.FC<{
//     title: string;
//     icon: LucideIcon;
//     children: React.ReactNode;
//     className?: string;
//     badge?: string;
//   }> = ({ title, icon: Icon, children, className = "", badge }) => (
//     <div className={`analysis-card ${className}`}>
//       <div className="card-header">
//         <div className="card-header-content">
//           <Icon className="card-header-icon" size={24} />
//           <h3 className="card-header-title">{title}</h3>
//           {badge && <span className="card-badge">{badge}</span>}
//         </div>
//       </div>
//       <div className="card-body">{children}</div>
//     </div>
//   );

//   const ListItem: React.FC<{
//     items: string[];
//     type?: "strength" | "weakness" | "default";
//   }> = ({ items, type = "default" }) => (
//     <ul className="list-container">
//       {items.map((item, index) => (
//         <li key={index} className="list-item">
//           <div className={`list-item-bullet ${type}`} />
//           <div className="list-item-content">{item}</div>
//         </li>
//       ))}
//     </ul>
//   );

//   const StatCard: React.FC<{
//     title: string;
//     value: string | number;
//     description: string;
//     icon: LucideIcon;
//     color: "blue" | "green" | "purple" | "orange";
//   }> = ({ title, value, description, icon: Icon, color }) => (
//     <div className={`stat-card ${color}`}>
//       <div className="stat-card-content">
//         <div className="stat-card-info">
//           <h3>{title}</h3>
//           <div className="value">{value}</div>
//         </div>
//         <Icon className="stat-card-icon" size={32} />
//       </div>
//     </div>
//   );

//   const renderOverview = () => {
//     if (!data || !data.resume_analysis_report) return null;

//     return (
//       <div className="space-y-6">
//         {/* Hero Section */}
//         <div className="overview-hero">
//           <div className="overview-hero-content">
//             <div className="overview-hero-header">
//               <div className="overview-hero-icon">
//                 <BarChart3 size={32} />
//               </div>
//               <h2 className="overview-hero-title">Analysis Summary</h2>
//             </div>
//             <p className="overview-hero-description">
//               {data.overall_fit_summary || data.short_conclusion}
//             </p>
//           </div>
//         </div>

//         {/* Stats Grid */}
//         <div className="overview-grid">
//           <StatCard
//             title="Overall Score"
//             value={`${data.score_out_of_100}/100`}
//             description="Overall compatibility rating"
//             icon={Target}
//             color="blue"
//           />
//           <StatCard
//             title="Selection Chance"
//             value={`${data.chance_of_selection_percentage}%`}
//             description="Probability of success"
//             icon={TrendingUp}
//             color="green"
//           />
//           <StatCard
//             title="Position"
//             value={
//               data.resume_analysis_report.candidate_information.position_applied
//             }
//             description="Target role"
//             icon={User}
//             color="purple"
//           />
//           <StatCard
//             title="Experience Level"
//             value={
//               data.resume_analysis_report.candidate_information.experience_level
//             }
//             description="Current level"
//             icon={Award}
//             color="orange"
//           />
//         </div>

//         {/* Quick Stats */}
//         <Card title="Quick Statistics" icon={BarChart3}>
//           <div className="stats-grid">
//             <div className="stat-item">
//               <div className="stat-number">
//                 {data.resume_analysis_report.strengths_analysis
//                   ?.technical_skills?.length || 0}
//               </div>
//               <div className="stat-label">Technical Strengths</div>
//             </div>
//             <div className="stat-item">
//               <div className="stat-number">
//                 {data.resume_analysis_report.weaknesses_analysis
//                   ?.critical_gaps_against_job_description?.length || 0}
//               </div>
//               <div className="stat-label">Critical Gaps</div>
//             </div>
//             <div className="stat-item">
//               <div className="stat-number">
//                 {data.resume_improvement_priority?.length || 0}
//               </div>
//               <div className="stat-label">Priority Actions</div>
//             </div>
//             <div className="stat-item">
//               <div className="stat-number">
//                 {data.resume_analysis_report.improvement_recommendations
//                   ?.immediate_resume_additions?.length || 0}
//               </div>
//               <div className="stat-label">Quick Fixes</div>
//             </div>
//           </div>
//         </Card>

//         {/* Candidate Information */}
//         <Card title="Candidate Information" icon={User}>
//           <div className="info-grid">
//             <div className="info-item">
//               <h4>Name</h4>
//               <p>{data.resume_analysis_report.candidate_information.name}</p>
//             </div>
//             <div className="info-item">
//               <h4>Current status</h4>
//               <p>
//                 {
//                   data.resume_analysis_report.candidate_information
//                     .current_status
//                 }
//               </p>
//             </div>
//           </div>
//         </Card>

//         {/* Eligibility Assessment */}
//         <Card title="Eligibility Assessment" icon={CheckCircle}>
//           <div
//             className={`eligibility-badge ${getEligibilityColor(
//               data.resume_eligibility
//             )}`}
//           >
//             <p className="font-medium">{data.resume_eligibility}</p>
//           </div>
//           <div className="section-feedback-item">
//             <h4>Short Conclusion</h4>
//             <p>{data.short_conclusion}</p>
//           </div>
//           <div className="section-feedback-item">
//             <h4>Overall Fit Summary</h4>
//             <p>{data.overall_fit_summary}</p>
//           </div>
//         </Card>

//         {/* Priority Improvements */}
//         {data.resume_improvement_priority && (
//           <div className="priority-improvements">
//             <h3 className="priority-title">
//               <AlertCircle className="priority-icon" size={24} />
//               Priority Improvements
//             </h3>
//             <ul className="priority-list">
//               {data.resume_improvement_priority.map((item, index) => (
//                 <li key={index} className="priority-item">
//                   <span className="priority-number">{index + 1}</span>
//                   <span className="priority-text">{item}</span>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )}

//         {/* Overview Cards */}
//         <div className="overview-grid">
//           <div className="overview-card">
//             <div className="overview-icon">
//               <Brain size={28} />
//             </div>
//             <h4>AI Analysis</h4>
//             <p>
//               Advanced AI-powered resume evaluation against job requirements
//             </p>
//           </div>
//           <div className="overview-card">
//             <div className="overview-icon">
//               <Target size={28} />
//             </div>
//             <h4>Job Matching</h4>
//             <p>
//               Comprehensive matching of skills, experience, and qualifications
//             </p>
//           </div>
//           <div className="overview-card">
//             <div className="overview-icon">
//               <Lightbulb size={28} />
//             </div>
//             <h4>Smart Recommendations</h4>
//             <p>Actionable insights for resume improvement and career growth</p>
//           </div>
//           <div className="overview-card">
//             <div className="overview-icon">
//               <Zap size={28} />
//             </div>
//             <h4>Instant Results</h4>
//             <p>Quick analysis with detailed feedback and scoring</p>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderStrengths = () => {
//     if (!data || !data.resume_analysis_report) return null;

//     return (
//       <div className="space-y-6">
//         <Card
//           title="Technical Skills"
//           icon={Code}
//           badge={`${data.resume_analysis_report.strengths_analysis.technical_skills.length} items`}
//         >
//           <ListItem
//             items={
//               data.resume_analysis_report.strengths_analysis.technical_skills
//             }
//             type="strength"
//           />
//         </Card>

//         <Card
//           title="Project Portfolio"
//           icon={Award}
//           badge={`${data.resume_analysis_report.strengths_analysis.project_portfolio.length} items`}
//         >
//           <ListItem
//             items={
//               data.resume_analysis_report.strengths_analysis.project_portfolio
//             }
//             type="strength"
//           />
//         </Card>

//         <Card
//           title="Educational Background"
//           icon={BookOpen}
//           badge={`${data.resume_analysis_report.strengths_analysis.educational_background.length} items`}
//         >
//           <ListItem
//             items={
//               data.resume_analysis_report.strengths_analysis
//                 .educational_background
//             }
//             type="strength"
//           />
//         </Card>
//       </div>
//     );
//   };

//   const renderWeaknesses = () => {
//     if (!data || !data.resume_analysis_report) return null;

//     return (
//       <div className="space-y-6">
//         <Card
//           title="Critical Gaps Against Job Description"
//           icon={AlertCircle}
//           badge={`${data.resume_analysis_report.weaknesses_analysis.critical_gaps_against_job_description.length} items`}
//         >
//           <ListItem
//             items={
//               data.resume_analysis_report.weaknesses_analysis
//                 .critical_gaps_against_job_description
//             }
//             type="weakness"
//           />
//         </Card>

//         <Card
//           title="Technical Deficiencies"
//           icon={XCircle}
//           badge={`${data.resume_analysis_report.weaknesses_analysis.technical_deficiencies.length} items`}
//         >
//           <ListItem
//             items={
//               data.resume_analysis_report.weaknesses_analysis
//                 .technical_deficiencies
//             }
//             type="weakness"
//           />
//         </Card>

//         <Card
//           title="Resume Presentation Issues"
//           icon={AlertCircle}
//           badge={`${data.resume_analysis_report.weaknesses_analysis.resume_presentation_issues.length} items`}
//         >
//           <ListItem
//             items={
//               data.resume_analysis_report.weaknesses_analysis
//                 .resume_presentation_issues
//             }
//             type="weakness"
//           />
//         </Card>

//         <Card
//           title="Soft Skills Gaps"
//           icon={Users}
//           badge={`${data.resume_analysis_report.weaknesses_analysis.soft_skills_gaps.length} items`}
//         >
//           <ListItem
//             items={
//               data.resume_analysis_report.weaknesses_analysis.soft_skills_gaps
//             }
//             type="weakness"
//           />
//         </Card>

//         <Card title="Missing Essential Elements" icon={XCircle}>
//           <div className="space-y-4">
//             {Object.entries(
//               data.resume_analysis_report.weaknesses_analysis
//                 .missing_essential_elements
//             ).map(([key, value]) => (
//               <div key={key} className="missing-sections-item">
//                 <div className="missing-sections-bullet" />
//                 <div className="missing-sections-content">
//                   <h4>{key.replace(/_/g, " ")}</h4>
//                   <p>{value}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </Card>
//       </div>
//     );
//   };

//   const renderSectionFeedback = () => {
//     if (!data || !data.resume_analysis_report) return null;

//     const sections = data.resume_analysis_report.section_wise_detailed_feedback;
//     const sectionEntries = Object.entries(sections).filter(
//       ([key]) => key !== "missing_sections"
//     );

//     return (
//       <div className="space-y-6">
//         {sectionEntries.map(([section, feedback]) => (
//           <Card
//             key={section}
//             title={section
//               .replace(/_/g, " ")
//               .replace(/\b\w/g, (l) => l.toUpperCase())}
//             icon={BookOpen}
//           >
//             <div className="space-y-4">
//               <div className="section-feedback-item">
//                 <h4>Current State</h4>
//                 <p>{feedback.current_state}</p>
//               </div>

//               {feedback.strengths && (
//                 <div className="section-feedback-item">
//                   <h4>Strengths</h4>
//                   <ListItem items={feedback.strengths} type="strength" />
//                 </div>
//               )}

//               {feedback.improvements && (
//                 <div className="section-feedback-item">
//                   <h4>Improvements</h4>
//                   <ListItem items={feedback.improvements} type="weakness" />
//                 </div>
//               )}
//             </div>
//           </Card>
//         ))}

//         <Card title="Missing Sections" icon={AlertCircle}>
//           <div className="space-y-4">
//             {Object.entries(sections.missing_sections).map(([key, value]) => (
//               <div key={key} className="missing-sections-item">
//                 <div className="missing-sections-bullet" />
//                 <div className="missing-sections-content">
//                   <h4>{key.replace(/_/g, " ")}</h4>
//                   <p>{value}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </Card>
//       </div>
//     );
//   };

//   const renderImprovements = () => {
//     if (!data || !data.resume_analysis_report) return null;

//     return (
//       <div className="space-y-6">
//         <Card
//           title="Resume Improvement Priority"
//           icon={TrendingUp}
//           badge={`${data.resume_improvement_priority.length} items`}
//         >
//           <ListItem items={data.resume_improvement_priority} />
//         </Card>

//         <Card
//           title="Immediate Resume Additions"
//           icon={Lightbulb}
//           badge={`${data.resume_analysis_report.improvement_recommendations.immediate_resume_additions.length} items`}
//         >
//           <ListItem
//             items={
//               data.resume_analysis_report.improvement_recommendations
//                 .immediate_resume_additions
//             }
//           />
//         </Card>

//         <Card
//           title="Immediate Priority Actions"
//           icon={Target}
//           badge={`${data.resume_analysis_report.improvement_recommendations.immediate_priority_actions.length} items`}
//         >
//           <ListItem
//             items={
//               data.resume_analysis_report.improvement_recommendations
//                 .immediate_priority_actions
//             }
//           />
//         </Card>

//         <Card
//           title="Short-term Development Goals"
//           icon={BookOpen}
//           badge={`${data.resume_analysis_report.improvement_recommendations.short_term_development_goals.length} items`}
//         >
//           <ListItem
//             items={
//               data.resume_analysis_report.improvement_recommendations
//                 .short_term_development_goals
//             }
//           />
//         </Card>

//         <Card
//           title="Medium-term Objectives"
//           icon={TrendingUp}
//           badge={`${data.resume_analysis_report.improvement_recommendations.medium_term_objectives.length} items`}
//         >
//           <ListItem
//             items={
//               data.resume_analysis_report.improvement_recommendations
//                 .medium_term_objectives
//             }
//           />
//         </Card>
//       </div>
//     );
//   };

//   const renderSkillsEnhancement = () => {
//     if (!data || !data.resume_analysis_report) return null;

//     return (
//       <div className="space-y-6">
//         {Object.entries(
//           data.resume_analysis_report.soft_skills_enhancement_suggestions
//         ).map(([skill, suggestions]) => (
//           <Card
//             key={skill}
//             title={skill
//               .replace(/_/g, " ")
//               .replace(/\b\w/g, (l) => l.toUpperCase())}
//             icon={Users}
//             badge={`${suggestions.length} suggestions`}
//           >
//             <ListItem items={suggestions} />
//           </Card>
//         ))}
//       </div>
//     );
//   };

//   const renderFinalAssessment = () => {
//     if (!data || !data.resume_analysis_report) return null;

//     return (
//       <div className="space-y-6">
//         <div className="assessment-hero">
//           <div className="assessment-hero-content">
//             <div className="assessment-hero-header">
//               <div className="assessment-hero-icon">
//                 <Award size={32} />
//               </div>
//               <h2 className="assessment-hero-title">Final Assessment</h2>
//             </div>
//           </div>
//         </div>

//         <Card title="Final Assessment" icon={CheckCircle}>
//           <div className="space-y-4">
//             <div className="section-feedback-item">
//               <h4>Eligibility status</h4>
//               <div
//                 className={`eligibility-badge ${getEligibilityColor(
//                   data.resume_analysis_report.final_assessment
//                     .eligibility_status
//                 )}`}
//               >
//                 <p className="font-medium">
//                   {
//                     data.resume_analysis_report.final_assessment
//                       .eligibility_status
//                   }
//                 </p>
//               </div>
//             </div>

//             <div className="section-feedback-item">
//               <h4>Hiring Recommendation</h4>
//               <p>
//                 {
//                   data.resume_analysis_report.final_assessment
//                     .hiring_recommendation
//                 }
//               </p>
//             </div>

//             <div className="section-feedback-item">
//               <h4>Long-term Potential</h4>
//               <p>
//                 {
//                   data.resume_analysis_report.final_assessment
//                     .long_term_potential
//                 }
//               </p>
//             </div>
//           </div>
//         </Card>

//         <Card
//           title="Key Interview Areas"
//           icon={Target}
//           badge={`${data.resume_analysis_report.final_assessment.key_interview_areas.length} areas`}
//         >
//           <ListItem
//             items={
//               data.resume_analysis_report.final_assessment.key_interview_areas
//             }
//           />
//         </Card>

//         <Card
//           title="Onboarding Requirements"
//           icon={Users}
//           badge={`${data.resume_analysis_report.final_assessment.onboarding_requirements.length} requirements`}
//         >
//           <ListItem
//             items={
//               data.resume_analysis_report.final_assessment
//                 .onboarding_requirements
//             }
//           />
//         </Card>
//       </div>
//     );
//   };

//   const tabs = [
//     {
//       id: "overview",
//       label: "Overview",
//       icon: User,
//       count: undefined,
//     },
//     {
//       id: "strengths",
//       label: "Strengths",
//       icon: CheckCircle,
//       count:
//         data?.resume_analysis_report?.strengths_analysis?.technical_skills
//           ?.length,
//     },
//     {
//       id: "weaknesses",
//       label: "Weaknesses",
//       icon: AlertCircle,
//       count:
//         data?.resume_analysis_report?.weaknesses_analysis
//           ?.critical_gaps_against_job_description?.length,
//     },
//     {
//       id: "section-feedback",
//       label: "Section Feedback",
//       icon: BookOpen,
//       count: Object.keys(
//         data?.resume_analysis_report?.section_wise_detailed_feedback || {}
//       ).length,
//     },
//     {
//       id: "improvements",
//       label: "Improvements",
//       icon: TrendingUp,
//       count: data?.resume_improvement_priority?.length,
//     },
//     {
//       id: "skills",
//       label: "Skills Enhancement",
//       icon: Users,
//       count: Object.keys(
//         data?.resume_analysis_report?.soft_skills_enhancement_suggestions || {}
//       ).length,
//     },
//     {
//       id: "assessment",
//       label: "Final Assessment",
//       icon: Award,
//       count: undefined,
//     },
//     {
//       id: "feedback",
//       label: "Feedback",
//       icon: MessageSquare,
//       count: undefined,
//     },
//   ];

//   if (loading) {
//     return (
//       <div className="view-details-container">
//         <div className="loading-container">
//           <div className="loading-spinner"></div>
//           <p>Loading analysis data...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="view-details-container">
//         <div className="error-container">
//           <AlertCircle className="error-icon" size={48} />
//           <p className="error-message">{error}</p>
//           <button className="retry-button" onClick={fetchAnalysisData}>
//             <RefreshCw size={16} className="mr-2" />
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!data) {
//     return (
//       <div className="view-details-container">
//         <div className="error-container">
//           <AlertCircle className="error-icon" size={48} />
//           <p className="error-message">No analysis data available</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="view-details-container">
//       <div className="view-details-header">
//         <div className="view-details-header-content">
//           <div className="view-details-title">
//             <h1>Resume Analysis Dashboard</h1>
//             <p className="view-details-subtitle">
//               Comprehensive analysis for{" "}
//               {data.resume_analysis_report.candidate_information.name}
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="view-details-main">
//         <div className="tab-container">
//           {tabs.map((tab) => (
//             <TabButton
//               key={tab.id}
//               id={tab.id}
//               label={tab.label}
//               icon={tab.icon}
//               active={activeTab === tab.id}
//               onClick={setActiveTab}
//               count={tab.count}
//             />
//           ))}
//         </div>

//         <div className="tab-content">
//           {activeTab === "overview" && renderOverview()}
//           {activeTab === "strengths" && renderStrengths()}
//           {activeTab === "weaknesses" && renderWeaknesses()}
//           {activeTab === "section-feedback" && renderSectionFeedback()}
//           {activeTab === "improvements" && renderImprovements()}
//           {activeTab === "skills" && renderSkillsEnhancement()}
//           {activeTab === "assessment" && renderFinalAssessment()}
//           {activeTab === "feedback" && (
//             <div className="feedback-tab-content">
//               <FeedbackForm
//                 analysisId={analysisId}
//                 onFeedbackSubmitted={() => {
//                   // Optionally refresh data or show success message
//                   console.log("Feedback submitted successfully");
//                 }}
//               />
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ViewDetailsUI2;
