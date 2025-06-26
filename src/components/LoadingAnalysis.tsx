import React from 'react';
import { Brain, Clock, Shield, Target } from 'lucide-react';

interface LoadingAnalysisProps {
  progress: number;
  stage: string;
}

const LoadingAnalysis: React.FC<LoadingAnalysisProps> = ({ progress, stage }) => {
  const features = [
    {
      icon: Clock,
      title: 'Fast Processing',
      description: 'Analysis completes in seconds',
      color: 'blue'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected',
      color: 'green'
    },
    {
      icon: Target,
      title: 'Accurate Results',
      description: 'AI-powered precision',
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600 text-blue-900 text-blue-700',
      green: 'bg-green-50 text-green-600 text-green-900 text-green-700',
      purple: 'bg-purple-50 text-purple-600 text-purple-900 text-purple-700'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-6 relative">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          <Brain className="absolute inset-0 m-auto h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Analyzing Your Resume</h2>
        <p className="text-gray-600 mb-6">Our AI is reviewing your resume against the job requirements...</p>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">{stage}</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colors = getColorClasses(feature.color).split(' ');
            
            return (
              <div key={index} className={`${colors[0]} rounded-lg p-4 text-center`}>
                <Icon className={`h-8 w-8 ${colors[1]} mx-auto mb-2`} />
                <p className={`text-sm font-medium ${colors[2]}`}>{feature.title}</p>
                <p className={`text-xs ${colors[3]}`}>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LoadingAnalysis;