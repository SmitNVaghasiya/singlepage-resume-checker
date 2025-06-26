import React from 'react';
import { Star, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { AnalysisResult } from '../types';

interface AnalysisCardProps {
  analysis: AnalysisResult;
  showFullDetails?: boolean;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis, showFullDetails = false }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <div className="text-4xl font-bold text-blue-600 mb-2">{analysis.score}</div>
          <div className="text-gray-600 font-medium">Overall Score</div>
          <div className="text-sm text-gray-500 mt-1">Out of 100</div>
        </div>
        
        <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
          <div className="text-4xl font-bold text-green-600 mb-2">{analysis.matchPercentage}%</div>
          <div className="text-gray-600 font-medium">Job Match</div>
          <div className="text-sm text-gray-500 mt-1">Compatibility</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Remarks</h3>
        <p className="text-gray-700 leading-relaxed">{analysis.remarks}</p>
      </div>

      {showFullDetails && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Star className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-bold text-gray-900">Strengths</h3>
            </div>
            <div className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-bold text-gray-900">Improvements</h3>
            </div>
            <div className="space-y-2">
              {analysis.improvements.map((improvement, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-orange-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{improvement}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisCard;