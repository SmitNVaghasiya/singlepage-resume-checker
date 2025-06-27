import React from 'react';
import { ArrowRight, Zap, Target, Brain, CheckCircle, Star, TrendingUp } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  const benefits = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced AI analyzes your resume against specific job requirements, not just keywords',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: Target,
      title: 'Job-Specific Matching',
      description: 'Get precise compatibility scores based on actual job descriptions',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      icon: TrendingUp,
      title: 'Actionable Insights',
      description: 'Receive specific recommendations to improve your resume\'s impact',
      color: 'from-purple-500 to-pink-600'
    }
  ];

  const stats = [
    { number: '95%', label: 'Accuracy Rate', icon: Star },
    { number: '10k+', label: 'Resumes Analyzed', icon: CheckCircle },
    { number: '2x', label: 'Better Match Rate', icon: TrendingUp }
  ];

  return (
    <div className="hero-section-modern">
      <div className="hero-background">
        <div className="hero-gradient-orb hero-orb-1"></div>
        <div className="hero-gradient-orb hero-orb-2"></div>
        <div className="hero-gradient-orb hero-orb-3"></div>
        <div className="hero-grid-pattern"></div>
      </div>
      
      <div className="container hero-content-wrapper">
        <div className="hero-main-content">
          <h1 className="hero-title-modern">
            Perfect Your Resume with 
            <span className="hero-title-gradient"> Smart AI Analysis</span>
          </h1>
          
          <p className="hero-description-modern">
            Stop guessing if your resume matches job requirements. Our advanced AI analyzes your resume 
            against specific job descriptions, providing detailed insights and actionable recommendations 
            to help you land your dream job.
          </p>

          <div className="hero-stats-container">
            <div className="hero-stats">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="hero-stat-item">
                    <Icon className="hero-stat-icon" />
                    <div className="hero-stat-content">
                      <div className="hero-stat-number">{stat.number}</div>
                      <div className="hero-stat-label">{stat.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hero-cta-section">
            <button onClick={onGetStarted} className="hero-cta-primary">
              <span>Analyze My Resume</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="hero-cta-subtext">Free analysis • No signup required • Instant results</p>
          </div>
        </div>

        <div className="hero-benefits-grid">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="hero-benefit-card">
                <div className={`hero-benefit-icon bg-gradient-to-r ${benefit.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="hero-benefit-title">{benefit.title}</h3>
                <p className="hero-benefit-description">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HeroSection; 