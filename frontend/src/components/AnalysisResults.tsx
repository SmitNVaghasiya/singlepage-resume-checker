import React from 'react';
import { AnalysisResult } from '../types';
import '../styles/components/AnalysisResults.css';

interface AnalysisResultsProps {
  analysisResult: AnalysisResult;
  onAnalyzeAnother: () => void;
  onViewDashboard: () => void;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysisResult,
  onAnalyzeAnother,
  onViewDashboard
}) => {
  return (
    <div className="analysis-results">
      <div className="results-header">
        <h2>Analysis Complete!</h2>
        <p>Here's how your resume performs against the job description</p>
      </div>

      <div className="score-cards">
        <div className="score-card resume-score">
          <div className="score-value">{analysisResult.score_out_of_100 || analysisResult.overallScore || (analysisResult as any).score || 0}</div>
          <div className="score-label">Resume Score</div>
          <div className="score-description">Overall resume quality</div>
        </div>
        <div className="score-card match-score">
          <div className="score-value">{analysisResult.chance_of_selection_percentage || analysisResult.matchPercentage || 0}%</div>
          <div className="score-label">Selection Chance</div>
          <div className="score-description">Probability of selection</div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="status-indicators">
        <div className="status-item">
          <span className="status-icon">✅</span>
          <span>Resume: {analysisResult.resume_eligibility || 'Eligible'}</span>
        </div>
        <div className="status-item">
          <span className="status-icon">🎯</span>
          <span>Job Description: {analysisResult.job_description_validity || 'Valid'}</span>
        </div>
      </div>

      {/* AI Summary */}
      <div className="ai-summary">
        <h3>🤖 AI Analysis Summary</h3>
        <p>{analysisResult.short_conclusion || analysisResult.overallRecommendation || 'Analysis completed successfully.'}</p>
        
        {analysisResult.overall_fit_summary && (
          <div className="fit-summary-box">
            <h4>Overall Fit Assessment</h4>
            <p>{analysisResult.overall_fit_summary}</p>
          </div>
        )}
      </div>

      {/* Candidate Information Section */}
      {analysisResult.resume_analysis_report?.candidate_information && (
        <div className="candidate-info-section">
          <h3>👤 Candidate Profile</h3>
          <div className="candidate-info-grid">
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{analysisResult.resume_analysis_report.candidate_information.name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Position Applied:</span>
              <span className="info-value">{analysisResult.resume_analysis_report.candidate_information.position_applied}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Experience Level:</span>
              <span className="info-value">{analysisResult.resume_analysis_report.candidate_information.experience_level}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Current Status:</span>
              <span className="info-value">{analysisResult.resume_analysis_report.candidate_information.current_status}</span>
            </div>
          </div>
        </div>
      )}

      <div className="results-sections">
        <div className="strengths-section">
          <h3>🌟 Key Strengths</h3>
          
          {/* Technical Skills */}
          {analysisResult.resume_analysis_report?.strengths_analysis?.technical_skills?.length > 0 && (
            <div className="strength-category">
              <h4>💻 Technical Skills</h4>
              <ul className="strengths-list">
                {analysisResult.resume_analysis_report.strengths_analysis.technical_skills.map((skill: string, index: number) => (
                  <li key={`tech-${index}`}>{skill}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Project Portfolio */}
          {analysisResult.resume_analysis_report?.strengths_analysis?.project_portfolio?.length > 0 && (
            <div className="strength-category">
              <h4>📂 Project Portfolio</h4>
              <ul className="strengths-list">
                {analysisResult.resume_analysis_report.strengths_analysis.project_portfolio.map((project: string, index: number) => (
                  <li key={`proj-${index}`}>{project}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Educational Background */}
          {analysisResult.resume_analysis_report?.strengths_analysis?.educational_background?.length > 0 && (
            <div className="strength-category">
              <h4>🎓 Educational Background</h4>
              <ul className="strengths-list">
                {analysisResult.resume_analysis_report.strengths_analysis.educational_background.map((edu: string, index: number) => (
                  <li key={`edu-${index}`}>{edu}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Fallback for legacy format */}
          {!analysisResult.resume_analysis_report?.strengths_analysis && (
            <ul className="strengths-list">
              {(analysisResult.candidateStrengths || (analysisResult as any).candidateStrengths || (analysisResult as any).strengths || []).slice(0, 5).map((strength: string, index: number) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="improvements-section">
          <h3>💡 Areas for Improvement</h3>
          
          {/* Priority Improvements */}
          {analysisResult.resume_improvement_priority?.length > 0 && (
            <div className="improvement-category">
              <h4>🎯 Priority Actions</h4>
              <ul className="improvements-list">
                {analysisResult.resume_improvement_priority.map((improvement: string, index: number) => (
                  <li key={`priority-${index}`}>{improvement}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses Analysis */}
          {analysisResult.resume_analysis_report?.weaknesses_analysis && (
            <>
              {/* Critical Gaps */}
              {analysisResult.resume_analysis_report.weaknesses_analysis.critical_gaps_against_job_description?.length > 0 && (
                <div className="improvement-category">
                  <h4>⚠️ Critical Gaps</h4>
                  <ul className="improvements-list critical">
                    {analysisResult.resume_analysis_report.weaknesses_analysis.critical_gaps_against_job_description.slice(0, 3).map((gap: string, index: number) => (
                      <li key={`gap-${index}`}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technical Deficiencies */}
              {analysisResult.resume_analysis_report.weaknesses_analysis.technical_deficiencies?.length > 0 && (
                <div className="improvement-category">
                  <h4>🔧 Technical Skills to Add</h4>
                  <ul className="improvements-list">
                    {analysisResult.resume_analysis_report.weaknesses_analysis.technical_deficiencies.slice(0, 3).map((deficiency: string, index: number) => (
                      <li key={`tech-def-${index}`}>{deficiency}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resume Presentation Issues */}
              {analysisResult.resume_analysis_report.weaknesses_analysis.resume_presentation_issues?.length > 0 && (
                <div className="improvement-category">
                  <h4>📝 Resume Format Issues</h4>
                  <ul className="improvements-list">
                    {analysisResult.resume_analysis_report.weaknesses_analysis.resume_presentation_issues.slice(0, 2).map((issue: string, index: number) => (
                      <li key={`pres-${index}`}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Fallback for legacy format */}
          {!analysisResult.resume_improvement_priority && !analysisResult.resume_analysis_report?.weaknesses_analysis && (
            <ul className="improvements-list">
              {(analysisResult.developmentAreas || (analysisResult as any).suggestions || []).slice(0, 5).map((improvement: string, index: number) => (
                <li key={index}>{improvement}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Improvement Recommendations */}
      {analysisResult.resume_analysis_report?.improvement_recommendations && (
        <div className="recommendations-section">
          <h3>📈 Improvement Roadmap</h3>
          
          {/* Immediate Actions */}
          {analysisResult.resume_analysis_report.improvement_recommendations.immediate_resume_additions?.length > 0 && (
            <div className="recommendation-category">
              <h4>⚡ Immediate Resume Updates</h4>
              <ul className="recommendation-list">
                {analysisResult.resume_analysis_report.improvement_recommendations.immediate_resume_additions.slice(0, 4).map((action: string, index: number) => (
                  <li key={`imm-${index}`}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Priority Actions */}
          {analysisResult.resume_analysis_report.improvement_recommendations.immediate_priority_actions?.length > 0 && (
            <div className="recommendation-category">
              <h4>🎯 Priority Actions</h4>
              <ul className="recommendation-list">
                {analysisResult.resume_analysis_report.improvement_recommendations.immediate_priority_actions.slice(0, 3).map((action: string, index: number) => (
                  <li key={`priority-action-${index}`}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Short Term Goals */}
          {analysisResult.resume_analysis_report.improvement_recommendations.short_term_development_goals?.length > 0 && (
            <div className="recommendation-category">
              <h4>📅 Short-term Goals (1-3 months)</h4>
              <ul className="recommendation-list">
                {analysisResult.resume_analysis_report.improvement_recommendations.short_term_development_goals.slice(0, 3).map((goal: string, index: number) => (
                  <li key={`short-${index}`}>{goal}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Final Assessment */}
      {analysisResult.resume_analysis_report?.final_assessment && (
        <div className="final-assessment-section">
          <h3>🎯 Final Assessment</h3>
          
          <div className="assessment-status">
            <span className="status-label">Eligibility Status:</span>
            <span className={`status-value ${analysisResult.resume_analysis_report.final_assessment.eligibility_status.includes('Qualified') ? 'qualified' : 'needs-work'}`}>
              {analysisResult.resume_analysis_report.final_assessment.eligibility_status}
            </span>
          </div>

          {analysisResult.resume_analysis_report.final_assessment.hiring_recommendation && (
            <div className="hiring-recommendation">
              <h4>💼 Hiring Recommendation</h4>
              <p>{analysisResult.resume_analysis_report.final_assessment.hiring_recommendation}</p>
            </div>
          )}

          {analysisResult.resume_analysis_report.final_assessment.key_interview_areas?.length > 0 && (
            <div className="interview-areas">
              <h4>🎤 Key Interview Focus Areas</h4>
              <ul className="interview-list">
                {analysisResult.resume_analysis_report.final_assessment.key_interview_areas.slice(0, 4).map((area: string, index: number) => (
                  <li key={`interview-${index}`}>{area}</li>
                ))}
              </ul>
            </div>
          )}

          {analysisResult.resume_analysis_report.final_assessment.long_term_potential && (
            <div className="long-term-potential">
              <h4>🚀 Long-term Potential</h4>
              <p>{analysisResult.resume_analysis_report.final_assessment.long_term_potential}</p>
            </div>
          )}
        </div>
      )}

      {/* Additional Analysis Details */}
      <div className="analysis-details-grid">
        {/* Resume Quality Scores */}
        {(analysisResult as any).resumeQuality && (
          <div className="quality-scores">
            <h4>📊 Resume Quality Breakdown</h4>
            <div className="quality-items">
              <div className="quality-item">
                <span className="quality-label">Content:</span>
                <span className="quality-score">{(analysisResult as any).resumeQuality.content.score}/100</span>
              </div>
              <div className="quality-item">
                <span className="quality-label">Formatting:</span>
                <span className="quality-score">{(analysisResult as any).resumeQuality.formatting.score}/100</span>
              </div>
              <div className="quality-item">
                <span className="quality-label">Structure:</span>
                <span className="quality-score">{(analysisResult as any).resumeQuality.structure.score}/100</span>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights */}
        {(analysisResult as any).aiInsights?.length > 0 && (
          <div className="ai-insights">
            <h4>🧠 AI Insights</h4>
            <ul className="insights-list">
              {(analysisResult as any).aiInsights.slice(0, 3).map((insight: string, index: number) => (
                <li key={index}>{insight}</li>
              ))}
            </ul>
            
            {/* Industry Insights */}
            {(analysisResult as any).detailedFeedback?.industryInsights?.length > 0 && (
              <div className="industry-insights">
                <h5>🏢 Industry Insights</h5>
                <ul>
                  {(analysisResult as any).detailedFeedback.industryInsights.map((insight: string, index: number) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Competitive Analysis */}
        {(analysisResult as any).competitiveAnalysis && (
          <div className="competitive-analysis">
            <h4>🏆 Competitive Position</h4>
            <div className="competitive-items">
              <div className="competitive-item">
                <span className="competitive-label">Market Position:</span>
                <span className="competitive-value">{(analysisResult as any).competitiveAnalysis.marketPosition}</span>
              </div>
              <div className="competitive-item">
                <span className="competitive-label">Positioning Strength:</span>
                <span className="competitive-value">{(analysisResult as any).competitiveAnalysis.positioningStrength}/100</span>
              </div>
            </div>
            {(analysisResult as any).competitiveAnalysis.differentiators?.length > 0 && (
              <div className="differentiators">
                <strong>Key Differentiators:</strong>
                <ul>
                  {(analysisResult as any).competitiveAnalysis.differentiators.slice(0, 2).map((diff: string, index: number) => (
                    <li key={index}>{diff}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Improvement Impact */}
            {(analysisResult as any).competitiveAnalysis.improvementImpact?.length > 0 && (
              <div className="improvement-impact">
                <strong>Improvement Impact:</strong>
                <ul>
                  {(analysisResult as any).competitiveAnalysis.improvementImpact.map((impact: string, index: number) => (
                    <li key={index}>{impact}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="results-actions">
        <button className="secondary-button" onClick={onAnalyzeAnother}>
          Analyze Another Resume
        </button>
        <button className="primary-button" onClick={onViewDashboard}>
          View Dashboard
        </button>
      </div>
    </div>
  );
};

export default AnalysisResults; 