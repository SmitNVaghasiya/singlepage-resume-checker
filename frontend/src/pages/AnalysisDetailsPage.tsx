import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { AnalysisResult } from '../types';
import AnalysisResults from '../components/AnalysisResults';
import Loader from '../components/AnalysisLoading';
import '../styles/components/AnalysisResults.css';
import '../styles/pages/AnalysisDetailsPage.css';

const AnalysisDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.getAnalysisResult(id!);
        if (response.result) {
          setAnalysis(response.result);
        } else {
          setError('Analysis not found.');
        }
      } catch (err) {
        setError('Failed to load analysis details.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [id]);

  if (loading) {
    return <div className="analysis-details-page-full"><Loader analysisProgress={80} currentStageIndex={0} analysisStages={['Loading']} /></div>;
  }

  if (error) {
    return (
      <div className="analysis-details-page-full">
        <div className="error-message">{error}</div>
        <button className="back-btn-full" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="analysis-details-page-full">
      <div className="analysis-details-header-bar">
        <button className="back-btn-full" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
      {analysis && (
        <AnalysisResults
          analysisResult={analysis}
          onAnalyzeAnother={() => navigate('/resumechecker')}
          onViewDashboard={() => navigate('/dashboard')}
        />
      )}
    </div>
  );
};

export default AnalysisDetailsPage; 