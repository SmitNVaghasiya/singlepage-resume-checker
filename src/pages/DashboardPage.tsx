import React from 'react';
import { BarChart3, History, Eye, Download, Star, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
// import AnalysisCard from '../components/AnalysisCard';
import { AnalysisResult } from '../types';

interface DashboardPageProps {
  analysisResult: AnalysisResult | null;
  analysisHistory: AnalysisResult[];
  onNewAnalysis: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ 
  analysisResult, 
  analysisHistory, 
  onNewAnalysis 
}) => {
  const handleViewAnalysis = (analysis: AnalysisResult) => {
    // In a real app, this would navigate to a detailed view
    console.log('Viewing analysis:', analysis);
  };

  const handleDownloadReport = (analysis: AnalysisResult) => {
    // In a real app, this would generate and download a PDF report
    console.log('Downloading report for:', analysis);
    alert('Report download feature coming soon!');
  };

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Analysis Dashboard</h1>
          <p className="text-xl text-gray-600">Track your resume analysis history and results</p>
        </div>

        {/* Current Analysis */}
        {analysisResult && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Latest Analysis</h2>
              <button
                onClick={() => handleDownloadReport(analysisResult)}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download Report</span>
              </button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{analysisResult.score}</div>
                  <div className="text-gray-600 font-medium">Overall Score</div>
                  <div className="text-sm text-gray-500 mt-1">Out of 100</div>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <div className="text-4xl font-bold text-green-600 mb-2">{analysisResult.matchPercentage}%</div>
                  <div className="text-gray-600 font-medium">Job Match</div>
                  <div className="text-sm text-gray-500 mt-1">Compatibility</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Remarks</h3>
                <p className="text-gray-700 leading-relaxed">{analysisResult.remarks}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <Star className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-bold text-gray-900">Strengths</h3>
                  </div>
                  <div className="space-y-2">
                    {analysisResult.strengths.map((strength, index) => (
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
                    {analysisResult.improvements.map((improvement, index) => (
                      <div key={index} className="flex items-start space-x-2 p-2 bg-orange-50 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis History */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
            <History className="h-6 w-6" />
            <span>Analysis History</span>
          </h2>
          
          {analysisHistory.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Analysis History</h3>
              <p className="text-gray-500 mb-6">Start analyzing resumes to see your history here</p>
              <button
                onClick={onNewAnalysis}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Analyze Resume
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {analysisHistory.map((analysis) => (
                <div key={analysis.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{analysis.resumeName}</h3>
                      <p className="text-sm text-gray-600">{analysis.jobTitle}</p>
                      <p className="text-xs text-gray-500">{analysis.analyzedAt.toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{analysis.score}</div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{analysis.matchPercentage}%</div>
                        <div className="text-xs text-gray-500">Match</div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewAnalysis(analysis)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadReport(analysis)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Download Report"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{analysis.remarks}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {analysisHistory.length > 0 && (
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{analysisHistory.length}</div>
              <div className="text-gray-600 font-medium">Total Analyses</div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Math.round(analysisHistory.reduce((sum, analysis) => sum + analysis.score, 0) / analysisHistory.length)}
              </div>
              <div className="text-gray-600 font-medium">Average Score</div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.round(analysisHistory.reduce((sum, analysis) => sum + analysis.matchPercentage, 0) / analysisHistory.length)}%
              </div>
              <div className="text-gray-600 font-medium">Average Match</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;