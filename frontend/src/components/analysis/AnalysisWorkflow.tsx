import React from "react";
import { useAppContext } from "../../contexts/AppContext";
import { ResumeUploadSection } from "../file-upload";
import { JobDescriptionStep } from "../job-description";
import "./AnalysisWorkflow.css";

const AnalysisWorkflow: React.FC = () => {
  const {
    currentStep,
    setCurrentStep,
    resumeFile,
    setResumeFile,
    jobDescription,
    setJobDescription,
    jobFile,
    setJobFile,
    jobInputMethod,
    setJobInputMethod,
    currentAnalysis,
  } = useAppContext();

  // Helper function to check if we can proceed to analysis
  const canProceedToAnalysis = () => {
    return !!(resumeFile && (jobDescription.trim() || jobFile));
  };

  // Helper function to handle step changes
  const handleStepChange = (step: "upload" | "job-description" | "analyze") => {
    setCurrentStep(step);
  };

  // Helper function to start analysis
  const handleStartAnalysis = () => {
    // This would typically trigger the analysis process
    // For now, we'll just move to the analyze step
    setCurrentStep("analyze");
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "upload":
        return (
          <ResumeUploadSection
            file={resumeFile}
            onFileChange={setResumeFile}
            onContinue={() => handleStepChange("job-description")}
          />
        );
      case "job-description":
        return (
          <JobDescriptionStep
            currentStep={currentStep}
            jobInputMethod={jobInputMethod}
            setJobInputMethod={setJobInputMethod}
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            jobFile={jobFile}
            setJobFile={setJobFile}
            resumeFile={resumeFile}
            analysisResult={currentAnalysis}
            canProceedToAnalysis={canProceedToAnalysis()}
            onStepChange={handleStepChange}
            onStartAnalysis={handleStartAnalysis}
          />
        );
      default:
        return (
          <ResumeUploadSection
            file={resumeFile}
            onFileChange={setResumeFile}
            onContinue={() => handleStepChange("job-description")}
          />
        );
    }
  };

  return <div className="analysis-workflow">{renderCurrentStep()}</div>;
};

export default AnalysisWorkflow;
