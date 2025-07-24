import React from "react";
import { Brain, FileSearch, Target, Zap, CheckCircle, X } from "lucide-react";

const WhyChooseUs: React.FC = () => {
  const comparisons = [
    {
      feature: "Job Description Analysis",
      us: true,
      others: false,
      description: "Analyzes your resume against specific job requirements",
    },
    {
      feature: "Context-Aware Matching",
      us: true,
      others: false,
      description: "Understands the context, not just keywords",
    },
    {
      feature: "Actionable Recommendations",
      us: true,
      others: true,
      description: "Provides specific improvement suggestions",
    },
    {
      feature: "Section-wise Feedback",
      us: true,
      others: false,
      description: "Detailed analysis of each resume section",
    },
    {
      feature: "Real-time Analysis",
      us: true,
      others: false,
      description: "Instant results without waiting",
    },
  ];

  const advantages = [
    {
      icon: Brain,
      title: "Smart AI Analysis",
      description:
        "Our AI doesn't just look for keywords - it understands the context and meaning behind job requirements.",
      color: "bg-blue-500",
    },
    {
      icon: Target,
      title: "Job-Specific Matching",
      description:
        "Unlike generic ATS checkers, we analyze your resume against the actual job description you're applying for.",
      color: "bg-emerald-500",
    },
    {
      icon: FileSearch,
      title: "Comprehensive Analysis",
      description:
        "We evaluate skills, experience, education, and achievements in relation to job requirements.",
      color: "bg-purple-500",
    },
    {
      icon: Zap,
      title: "Instant Results",
      description:
        "Get detailed analysis and recommendations in seconds, not minutes or hours.",
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="why-choose-us-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Why Choose Our Resume Analyzer?</h2>
          <p className="section-subtitle">
            Unlike traditional ATS checkers that only scan for keywords, our
            AI-powered analyzer provides comprehensive, job-specific insights to
            truly optimize your resume.
          </p>
        </div>

        <div className="advantages-grid">
          {advantages.map((advantage, index) => {
            const Icon = advantage.icon;
            return (
              <div key={index} className="advantage-card">
                <div className={`advantage-icon ${advantage.color}`}>
                  <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <h3 className="advantage-title" title={advantage.title}>
                  {advantage.title}
                </h3>
                <p
                  className="advantage-description"
                  title={advantage.description}
                >
                  {advantage.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="comparison-section">
          <h3 className="comparison-title">How We Compare</h3>
          <div className="comparison-table">
            <div className="comparison-header">
              <div className="comparison-cell">Feature</div>
              <div className="comparison-cell highlight">Our Analyzer</div>
              <div className="comparison-cell">Other ATS Checkers</div>
            </div>
            {comparisons.map((item, index) => (
              <div key={index} className="comparison-row">
                <div className="comparison-cell feature-cell">
                  <div className="feature-name" title={item.feature}>
                    {item.feature}
                  </div>
                  <div className="feature-description" title={item.description}>
                    {item.description}
                  </div>
                </div>
                <div
                  className="comparison-cell highlight"
                  data-label="Our Analyzer:"
                >
                  {item.us ? (
                    <CheckCircle
                      className="w-5 h-5 text-emerald-500"
                      aria-label="Yes"
                    />
                  ) : (
                    <X className="w-5 h-5 text-red-500" aria-label="No" />
                  )}
                </div>
                <div
                  className="comparison-cell"
                  data-label="Other ATS Checkers:"
                >
                  {item.others ? (
                    <CheckCircle
                      className="w-5 h-5 text-emerald-500"
                      aria-label="Yes"
                    />
                  ) : (
                    <X className="w-5 h-5 text-red-500" aria-label="No" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyChooseUs;
