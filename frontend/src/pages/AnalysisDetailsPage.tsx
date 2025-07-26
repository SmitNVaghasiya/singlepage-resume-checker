import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import { AnalysisResult } from "../types";
import { useAppContext } from "../contexts/AppContext";
import ResumeAnalysisUI from "../components/dashboard/ResumeAnalysisUI";
import "../styles/pages/AnalysisDetailsPage.css";

const AnalysisDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppContext();
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
          setError("Analysis not found or incomplete.");
        }
      } catch (err: any) {
        console.error("Failed to load analysis details:", err);
        setError(err.message || "Failed to load analysis details.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="analysis-details-page-full loading">
        <div className="analysis-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-details-page-full">
        <div className="error-message">{error}</div>
        <button
          className="back-btn-full"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="analysis-details-page-full">
      {analysis && (
        <div
          style={{
            animation: "fadeInUp 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          <ResumeAnalysisUI analysisId={id!} />
        </div>
      )}
    </div>
  );
};

export default AnalysisDetailsPage;
