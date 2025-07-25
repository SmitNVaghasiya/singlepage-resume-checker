import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import { AnalysisResult } from "../types";
import { InlineProgressSteps } from "../components/ui";
import { ResumeUploadStep } from "../components/file-upload";
import { JobDescriptionStep } from "../components/job-description";
import { AnalysisLoading } from "../components/analysis";
import { AnalysisService } from "../services/AnalysisService";
import "../styles/pages/resume-checker.css";
import { validateResumeFile } from "../utils/fileValidation";

const ResumeCheckerPage: React.FC = () => {
  const navigate = useNavigate();

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
    jobInputMethod,
    setJobInputMethod,
    addAnalysisToHistory,
    resetAnalysis,
    requiresAuth,
    setRequiresAuth,
    isAuthLoading,
  } = useAppContext();

  // Step 3 - Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );

  // Create analysis service instance
  const analysisService = useMemo(
    () =>
      new AnalysisService({
        user,
        resumeFile,
        jobDescription,
        jobFile,
        jobInputMethod,
        currentStep,
        setRequiresAuth,
        setAnalysisResult,
        addAnalysisToHistory,
        setIsAnalyzing,
        setAnalysisProgress,
        setCurrentStageIndex,
        setShowAuthModal: () => {}, // No-op
        setCurrentStep: (step: string) => setCurrentStep(step as any),
        onAnalysisComplete: (analysisId: string) => {
          // Navigate to analysis details page with seamless transition
          navigate(`/dashboard/analysis/${analysisId}`);
        },
        onAuthRequired: () => {
          // Navigate to login page with redirect parameter
          navigate("/login?redirect=/resumechecker");
        },
        // Add getter function to get latest state
        getLatestState: () => ({
          user,
          resumeFile,
          jobDescription,
          jobFile,
          jobInputMethod,
          currentStep,
        }),
      }),
    [
      user,
      resumeFile,
      jobDescription,
      jobFile,
      jobInputMethod,
      currentStep,
      setCurrentStep,
      addAnalysisToHistory,
      setRequiresAuth,
      setAnalysisResult,
      setIsAnalyzing,
      setAnalysisProgress,
      setCurrentStageIndex,
      navigate,
    ]
  );

  const startAnalysis = useCallback(() => {
    analysisService.startAnalysis();
  }, [analysisService]);

  // Define canProceedToAnalysis function before useEffect hooks that use it
  const canProceedToAnalysis = useCallback(() => {
    const hasResume = resumeFile !== null;
    const hasJobDescription =
      jobInputMethod === "text"
        ? jobDescription.trim().length >= 50
        : jobFile !== null;

    console.log("canProceedToAnalysis check:", {
      hasResume,
      hasJobDescription,
      resumeFile: resumeFile?.name,
      jobFile: jobFile?.name,
      jobDescriptionLength: jobDescription.trim().length,
      jobInputMethod,
      currentStep,
    });

    return hasResume && hasJobDescription;
  }, [resumeFile, jobDescription, jobFile, jobInputMethod, currentStep]);

  // Listen for continue analysis event after login (removed - no longer needed)
  // useEffect(() => {
  //   const handleContinueAnalysis = () => {
  //     console.log('Continue analysis event received. User:', user, 'Temp files:', tempFiles);
  //     if (user && (tempFiles && Object.keys(tempFiles).length > 0 || jobDescriptionTextId)) {
  //       console.log('Starting analysis automatically...');
  //       // Auto-start analysis when returning from login
  //       setTimeout(() => {
  //         startAnalysis();
  //       }, 500);
  //     }
  //   };

  //   window.addEventListener('continueAnalysis', handleContinueAnalysis);
  //   return () => {
  //     window.removeEventListener('continueAnalysis', handleContinueAnalysis);
  //   };
  // }, [user, tempFiles, jobDescriptionTextId, startAnalysis]);

  // Debug: Monitor state changes
  useEffect(() => {
    console.log("ResumeCheckerPage state changed:", {
      user: !!user,
      currentStep,
      jobDescription: jobDescription.substring(0, 50) + "...",
      jobInputMethod,
      resumeFile: resumeFile?.name,
      jobFile: jobFile?.name,
      hasPendingAnalysis: !!localStorage.getItem("pendingAnalysis"),
    });
  }, [user, currentStep, jobDescription, jobInputMethod, resumeFile, jobFile]);

  // Check for homepage upload (drag & drop or paste) via localStorage
  useEffect(() => {
    console.log("Checking for homepage upload...", {
      resumeFile: !!resumeFile,
    });
    const fromHomepage = localStorage.getItem("fromHomepageUpload");
    const homepageFileRaw = localStorage.getItem("homepageResumeUpload");
    console.log("localStorage check:", {
      fromHomepage,
      hasFile: !!homepageFileRaw,
    });
    if (fromHomepage && homepageFileRaw && !resumeFile) {
      try {
        const fileData = JSON.parse(homepageFileRaw);
        // Reconstruct File from base64
        const arr = fileData.base64.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const reconstructedFile = new File([u8arr], fileData.name, {
          type: mime,
        });
        // Validate file type (PDF/DOCX only)
        const validation = validateResumeFile(reconstructedFile);
        if (!validation.isValid) {
          alert(
            validation.error ||
              "Invalid file type. Only PDF and DOCX are allowed."
          );
          localStorage.removeItem("fromHomepageUpload");
          localStorage.removeItem("homepageResumeUpload");
          return;
        }
        setResumeFile(reconstructedFile);
        setCurrentStep && setCurrentStep("upload");
        // Clear localStorage after successful file reconstruction
        localStorage.removeItem("fromHomepageUpload");
        localStorage.removeItem("homepageResumeUpload");
      } catch (error) {
        console.error("Error parsing homepage uploaded file:", error);
        localStorage.removeItem("fromHomepageUpload");
        localStorage.removeItem("homepageResumeUpload");
      }
    }
  }, [setResumeFile, setCurrentStep]);

  // Auto-continue analysis when user is authenticated and has temp files (removed - no longer needed)
  // useEffect(() => {
  //   console.log('Auto-continue check:', {
  //     user,
  //     tempFiles,
  //     currentStep,
  //     jobDescription,
  //     jobInputMethod,
  //     resumeFile: resumeFile?.name,
  //     jobFile: jobFile?.name,
  //     hasStartedAnalysis
  //   });

  //   // Don't auto-continue if we're still loading, if there's a pending analysis, or if analysis has already started
  //   if (localStorage.getItem('pendingAnalysis') || hasStartedAnalysis) {
  //     console.log('Auto-continue: Skipping - pending analysis exists or analysis already started');
  //     return;
  //   }

  //   // Only auto-continue if we have temp files and we're on the job-description step
  //   if (user && (tempFiles && Object.keys(tempFiles).length > 0 || jobDescriptionTextId) && currentStep === 'job-description') {
  //     // Check if we have enough data to proceed
  //     const hasResume = tempFiles.resume || resumeFile;
  //     const hasJobDescription = jobInputMethod === 'text'
  //       ? (jobDescription.trim().length >= 50 || !!jobDescriptionTextId)
  //       : (tempFiles.jobDescription || jobFile);

  //     console.log('Auto-continue conditions:', {
  //       hasResume,
  //       hasJobDescription,
  //       tempFilesResume: tempFiles.resume,
  //       tempFilesJobDescription: tempFiles.jobDescription,
  //       jobDescriptionTextId,
  //       resumeFile: resumeFile?.name,
  //       jobFile: jobFile?.name
  //     });

  //     if (hasResume && hasJobDescription) {
  //       console.log('Auto-continue: Starting analysis with tempFiles:', tempFiles);
  //       setHasStartedAnalysis(true);
  //       // Small delay to ensure everything is loaded
  //       setTimeout(() => {
  //         startAnalysis();
  //       }, 1000);
  //     } else {
  //       console.log('Auto-continue: Missing required data - hasResume:', hasResume, 'hasJobDescription:', hasJobDescription);
  //     }
  //   }
  // }, [user, tempFiles, currentStep, jobDescription, jobInputMethod, resumeFile, jobFile, startAnalysis, hasStartedAnalysis, jobDescriptionTextId]);

  // Analysis state management
  useEffect(() => {
    // Handle analysis completion
    if (analysisResult) {
      console.log("Analysis completed successfully");
    }
  }, [analysisResult, isAnalyzing]);

  // Ensure correct step after authentication
  useEffect(() => {
    if (user && !isAuthLoading) {
      // Only auto-advance if we're coming from authentication (pending analysis exists)
      const hasPendingAnalysis = localStorage.getItem("hasPendingAnalysis");

      if (hasPendingAnalysis && resumeFile && currentStep === "upload") {
        console.log("Moving to job-description step after authentication");
        setCurrentStep("job-description");
        // Clear the flag after using it
        localStorage.removeItem("hasPendingAnalysis");
      } else {
        // Don't automatically move to analyze step - let user manually start
        console.log("User authenticated. Ready for manual analysis start.");
      }
    }
  }, [user, isAuthLoading, resumeFile, currentStep, setCurrentStep]);

  // Debug function to check current state
  const debugCurrentState = () => {
    console.log("=== DEBUG CURRENT STATE ===");
    console.log("User:", user);
    console.log("Current Step:", currentStep);
    console.log("Resume File:", resumeFile);
    console.log("Job File:", jobFile);
    console.log("Job Description:", jobDescription.substring(0, 100) + "...");
    console.log("Job Input Method:", jobInputMethod);
    console.log("Can Proceed to Analysis:", canProceedToAnalysis());
    console.log("Pending Analysis:", localStorage.getItem("pendingAnalysis"));
    console.log("=== END DEBUG ===");
  };

  // Add debug function to window for easy access
  React.useEffect(() => {
    (window as any).debugResumeChecker = debugCurrentState;
    (window as any).testAnalysis = () => {
      console.log("=== MANUAL ANALYSIS TEST ===");
      debugCurrentState();
      console.log("Attempting to start analysis...");
      startAnalysis();
    };
    (window as any).debugState = () => {
      console.log("=== CURRENT STATE ===");
      console.log("User:", user);
      console.log("Current Step:", currentStep);
      console.log("Resume File:", resumeFile?.name);
      console.log("Job File:", jobFile?.name);
      console.log("Job Description Length:", jobDescription.length);
      console.log("Job Input Method:", jobInputMethod);
      console.log("Requires Auth:", requiresAuth);
      console.log("Pending Analysis:", localStorage.getItem("pendingAnalysis"));
      console.log(
        "Has Pending Analysis:",
        localStorage.getItem("hasPendingAnalysis")
      );
      console.log("=== END STATE ===");
    };
    (window as any).testFileHandling = async () => {
      console.log("=== TESTING FILE HANDLING ===");
      if (resumeFile) {
        console.log("Testing resume file handling...");
        const { saveFileForAuth, restoreFileFromAuth } = await import(
          "../utils/fileValidation"
        );
        const savedData = await saveFileForAuth(resumeFile);
        console.log("Saved resume file data:", savedData);
        const restoredFile = restoreFileFromAuth(savedData);
        console.log("Restored resume file:", {
          name: restoredFile.name,
          size: restoredFile.size,
          type: restoredFile.type,
        });
        console.log(
          "Original vs Restored match:",
          resumeFile.name === restoredFile.name &&
            resumeFile.size === restoredFile.size &&
            resumeFile.type === restoredFile.type
        );
      } else {
        console.log("No resume file to test");
      }
      console.log("=== END FILE HANDLING TEST ===");
    };
    (window as any).testStepNavigation = (step: string) => {
      console.log("=== TESTING STEP NAVIGATION ===");
      console.log("Current step:", currentStep);
      console.log("Attempting to navigate to:", step);
      console.log("Resume file exists:", !!resumeFile);
      console.log("Job description length:", jobDescription.length);
      console.log("Job file exists:", !!jobFile);
      setCurrentStep(step as any);
      console.log("Step change triggered");
    };
    console.log("Debug functions available:");
    console.log("- window.debugResumeChecker() - Check current state");
    console.log("- window.testAnalysis() - Test analysis with current state");
    console.log("- window.debugState() - Show current state");
    console.log(
      "- window.testFileHandling() - Test file save/restore functionality"
    );
    console.log(
      '- window.testStepNavigation("upload") - Test navigation to upload step'
    );
    console.log(
      '- window.testStepNavigation("job-description") - Test navigation to job description step'
    );
    console.log("- Note: Analysis must be started manually via the UI button");
  }, [
    user,
    currentStep,
    resumeFile,
    jobFile,
    jobDescription,
    jobInputMethod,
    startAnalysis,
  ]);

  return (
    <div className={`resume-checker-page ${isAnalyzing ? "loading" : ""}`}>
      <div
        className="container"
        style={{
          animation: "fadeInUp 1s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: 0,
          animationFillMode: "forwards",
        }}
      >
        {/* Step 1: Resume Upload */}
        {currentStep === "upload" && (
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
        {currentStep === "job-description" && (
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
        {currentStep === "analyze" && (
          <div className="step-content">
            {isAnalyzing ? (
              <AnalysisLoading
                analysisProgress={analysisProgress}
                currentStageIndex={currentStageIndex}
                analysisStages={analysisService.analysisStages}
              />
            ) : null}

            {/* Show progress steps when not analyzing */}
            {!isAnalyzing && (
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
    </div>
  );
};

export default ResumeCheckerPage;
