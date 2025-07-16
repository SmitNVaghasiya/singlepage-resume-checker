import React from 'react';
import { Brain, Clock, Shield, Target, Zap, CheckCircle } from 'lucide-react';

interface LoadingAnalysisProps {
  progress: number;
  stage: string;
}

const LoadingAnalysis: React.FC<LoadingAnalysisProps> = ({ progress, stage }) => {
  const analysisSteps = [
    { title: 'Parsing Resume', description: 'Extracting text and structure from your resume', icon: CheckCircle },
    { title: 'Analyzing Content', description: 'Understanding your skills and experience', icon: Brain },
    { title: 'Matching Requirements', description: 'Comparing with job description', icon: Target },
    { title: 'Generating Insights', description: 'Creating personalized recommendations', icon: Zap },
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Instant Results',
      description: 'Get comprehensive analysis in under 60 seconds',
      color: 'blue'
    },
    {
      icon: Shield,
      title: 'Secure Processing',
      description: 'Your data is encrypted and protected',
      color: 'green'
    },
    {
      icon: Target,
      title: 'Precise Matching',
      description: 'AI-powered job compatibility scoring',
      color: 'purple'
    }
  ];

  const getCurrentStepIndex = () => {
    return Math.floor((progress / 100) * analysisSteps.length);
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 border-blue-200 text-blue-600',
      green: 'bg-green-50 border-green-200 text-green-600',
      purple: 'bg-purple-50 border-purple-200 text-purple-600'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-6 relative">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 border-4 border-transparent border-r-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>
          <Brain className="absolute inset-0 m-auto h-10 w-10 text-blue-600 animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Analyzing Your Resume</h2>
        <p className="text-gray-600 mb-6">Our advanced AI is processing your resume and matching it with job requirements</p>
      </div>

      {/* Progress Section */}
      <div className="space-y-6 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-gray-800">{stage}</span>
            <span className="text-lg font-bold text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center">This process typically takes 30-60 seconds</p>
        </div>

        {/* Analysis Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysisSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === getCurrentStepIndex();
            const isCompleted = index < getCurrentStepIndex();
            
            return (
              <div 
                key={index} 
                className={`
                  p-4 rounded-lg border-2 transition-all duration-300
                  ${isActive ? 'border-blue-500 bg-blue-50 shadow-md' : 
                    isCompleted ? 'border-green-500 bg-green-50' : 
                    'border-gray-200 bg-gray-50'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-6 w-6 ${
                    isActive ? 'text-blue-600 animate-pulse' : 
                    isCompleted ? 'text-green-600' : 
                    'text-gray-400'
                  }`} />
                  <div>
                    <p className={`font-semibold ${
                      isActive ? 'text-blue-900' : 
                      isCompleted ? 'text-green-900' : 
                      'text-gray-600'
                    }`}>
                      {step.title}
                    </p>
                    <p className={`text-sm ${
                      isActive ? 'text-blue-700' : 
                      isCompleted ? 'text-green-700' : 
                      'text-gray-500'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">What You'll Get</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const colorClasses = getColorClasses(benefit.color);
            
            return (
              <div key={index} className={`${colorClasses} rounded-lg p-4 text-center border-2`}>
                <Icon className="h-8 w-8 mx-auto mb-2" />
                <p className="font-semibold mb-1">{benefit.title}</p>
                <p className="text-xs opacity-80">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LoadingAnalysis;