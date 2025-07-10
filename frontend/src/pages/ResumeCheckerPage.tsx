import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { AnalysisResult } from '../types';
import InlineProgressSteps from '../components/InlineProgressSteps';
import ResumeUploadStep from '../components/ResumeUploadStep';
import JobDescriptionStep from '../components/JobDescriptionStep';
import AnalysisLoading from '../components/AnalysisLoading';
import AnalysisResults from '../components/AnalysisResults';
import { useAuthHandler, AuthModalWrapper } from '../components/AuthHandler';
import { AnalysisService } from '../services/AnalysisService';
import '../styles/components/AuthModal.css';

const ResumeCheckerPage: React.FC = () => {
  const {
    user,
    currentStep,
    setCurrentStep,
    resumeFile,
    setResumeFile,
    jobDescription,
    setJobDescription,
    jobFile,
    setJobFile,
    addAnalysisToHistory,
    tempFiles,
    setTempFiles,
    setRequiresAuth
  } = useAppContext();

  // Authentication modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Step 2 - Job Description State (needed for coordination)
  const [jobInputMethod, setJobInputMethod] = useState<'text' | 'file'>('text');

  // Step 3 - Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Create analysis service instance
  const analysisService = new AnalysisService({
    user,
    resumeFile,
    jobDescription,
    jobFile,
    jobInputMethod,
    tempFiles,
    setTempFiles,
    setRequiresAuth,
    setAnalysisResult,
    addAnalysisToHistory,
    setIsAnalyzing,
    setAnalysisProgress,
    setCurrentStageIndex,
    setShowAuthModal,
    setCurrentStep: (step: string) => setCurrentStep(step as any)
  });

  // Auth handler
  const {
    handleAuthSuccess,
    handleAuthModalClose,
    handleAnalyzeAnother,
    handleViewDashboard
  } = useAuthHandler({
    showAuthModal,
    setShowAuthModal,
    onStartAnalysis: () => analysisService.startAnalysis()
  });

  const canProceedToAnalysis = () => {
    const hasResume = resumeFile !== null;
    const hasJobDescription = jobInputMethod === 'text' 
      ? jobDescription.trim().length >= 50 
      : jobFile !== null;
    return hasResume && hasJobDescription;
  };

  const startAnalysis = () => {
    analysisService.startAnalysis();
  };

  return (
    <div className="resume-checker-page">
      <div className="container">


        {/* Step 1: Resume Upload */}
        {currentStep === 'upload' && (
          <ResumeUploadStep
            currentStep={currentStep}
            resumeFile={resumeFile}
            jobDescription={jobDescription}
            jobFile={jobFile}
            analysisResult={analysisResult}
            canProceedToAnalysis={canProceedToAnalysis()}
            onStepChange={setCurrentStep}
            onStartAnalysis={startAnalysis}
            setResumeFile={setResumeFile}
          />
        )}

        {/* Step 2: Job Description */}
        {currentStep === 'job-description' && (
          <JobDescriptionStep
            currentStep={currentStep}
            jobInputMethod={jobInputMethod}
            setJobInputMethod={setJobInputMethod}
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            jobFile={jobFile}
            setJobFile={setJobFile}
            resumeFile={resumeFile}
            analysisResult={analysisResult}
            canProceedToAnalysis={canProceedToAnalysis()}
            onStepChange={setCurrentStep}
            onStartAnalysis={startAnalysis}
          />
        )}

        {/* Step 3: Analysis & Results */}
        {currentStep === 'analyze' && (
          <div className="step-content">
            {isAnalyzing ? (
              <AnalysisLoading
                analysisProgress={analysisProgress}
                currentStageIndex={currentStageIndex}
                analysisStages={analysisService.analysisStages}
              />
            ) : analysisResult ? (
              <AnalysisResults
                analysisResult={analysisResult}
                onAnalyzeAnother={handleAnalyzeAnother}
                onViewDashboard={handleViewDashboard}
              />
            ) : null}

            {/* Hide progress steps when analysis is complete */}
            {!analysisResult && (
              <InlineProgressSteps
                currentStep={currentStep}
                resumeFile={resumeFile}
                jobDescription={jobDescription}
                jobFile={jobFile}
                analysisResult={analysisResult}
                canProceedToAnalysis={canProceedToAnalysis()}
                onStepChange={setCurrentStep}
                onStartAnalysis={startAnalysis}
              />
            )}
          </div>
        )}
      </div>

      <AuthModalWrapper
        showAuthModal={showAuthModal}
        onAuthSuccess={handleAuthSuccess}
        onClose={handleAuthModalClose}
        tempFiles={tempFiles}
      />
    </div>
  );
};

export default ResumeCheckerPage;
