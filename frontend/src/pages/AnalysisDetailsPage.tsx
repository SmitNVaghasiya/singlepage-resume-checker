import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import ViewDetailsUI2 from "../components/dashboard/view_DetailsUi_2";
import "../styles/pages/AnalysisDetailsPage.css";

const AnalysisDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, setCurrentStep } = useAppContext();

  // Reset analysis state when navigating to analysis details page
  useEffect(() => {
    // Set current step to a non-analyzing state to prevent loading screen
    setCurrentStep("upload");

    // Clear any pending analysis state from localStorage
    localStorage.removeItem("pendingAnalysis");
    localStorage.removeItem("hasPendingAnalysis");
  }, [setCurrentStep]);

  if (!id) {
    return (
      <div className="analysis-details-page-full">
        <div className="error-message">Invalid analysis ID</div>
        {/* <button
          className="back-btn-full"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button> */}
      </div>
    );
  }

  return (
    <div className="analysis-details-page-full">
      <div
        style={{
          animation: "fadeInUp 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: 0,
          animationFillMode: "forwards",
        }}
      >
        <ViewDetailsUI2 analysisId={id} />
      </div>
    </div>
  );
};

export default AnalysisDetailsPage;
