import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { AnalysisResult } from "../types";
import { User, apiService } from "../services/api";
import { usePasteHandler } from "../hooks/shared/usePasteHandler";
import { base64ToFile, restoreFileFromAuth } from "../utils/fileValidation";
import { useLocation } from "react-router-dom";
import { analysisCookieService } from "../services/AnalysisCookieService";
import { performanceMonitor } from "../utils/performanceMonitor";

type AnalysisStep = "upload" | "job-description" | "analyze";

interface AppContextType {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthLoading: boolean;

  // Analysis state
  analysisHistory: AnalysisResult[];
  currentAnalysis: AnalysisResult | null;

  // Step state
  currentStep: AnalysisStep;
  setCurrentStep: (step: AnalysisStep) => void;

  // File state
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  jobDescription: string;
  setJobDescription: (description: string) => void;
  jobFile: File | null;
  setJobFile: (file: File | null) => void;
  jobInputMethod: "text" | "file";
  setJobInputMethod: (method: "text" | "file") => void;

  // Actions
  addAnalysisToHistory: (analysis: AnalysisResult) => void;
  resetAnalysis: () => void;
  logout: () => void;
  requiresAuth: boolean;
  setRequiresAuth: (requires: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // User state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [pendingAuthRequest, setPendingAuthRequest] = useState<Promise<any> | null>(null);

  // Analysis state
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(
    null
  );

  // Single page analysis state
  const [currentStep, setCurrentStep] = useState<AnalysisStep>("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [jobInputMethod, setJobInputMethod] = useState<"text" | "file">("text");

  const location = useLocation();

  // Initialize paste handler
  usePasteHandler({
    currentStep,
    pathname: window.location.pathname,
    hasResumeFile: !!resumeFile,
    jobInputMethod,
    setResumeFile,
    setJobFile,
    setJobInputMethod,
    setCurrentStep: (step: string) => setCurrentStep(step as AnalysisStep),
  });

  // Helper function to convert base64 to File object
  const base64ToFile = (
    base64Data: string,
    filename: string,
    mimeType: string
  ): File => {
    const arr = base64Data.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || mimeType;
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Helper function to convert File to base64 for storage
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Save resume checker state to localStorage
  const saveResumeCheckerState = async () => {
    try {
      const stateToSave: any = {
        currentStep,
        jobDescription,
        jobInputMethod,
        timestamp: Date.now(),
      };

      // Save file data if files exist
      if (resumeFile) {
        try {
          const resumeFileData = await fileToBase64(resumeFile);
          stateToSave.resumeFile = {
            name: resumeFile.name,
            type: resumeFile.type,
            size: resumeFile.size,
            data: resumeFileData,
          };
        } catch (error) {
          console.warn("Failed to save resume file data:", error);
          // Save metadata only
          stateToSave.resumeFile = {
            name: resumeFile.name,
            type: resumeFile.type,
            size: resumeFile.size,
          };
        }
      }

      if (jobFile) {
        try {
          const jobFileData = await fileToBase64(jobFile);
          stateToSave.jobFile = {
            name: jobFile.name,
            type: jobFile.type,
            size: jobFile.size,
            data: jobFileData,
          };
        } catch (error) {
          console.warn("Failed to save job file data:", error);
          // Save metadata only
          stateToSave.jobFile = {
            name: jobFile.name,
            type: jobFile.type,
            size: jobFile.size,
          };
        }
      }

      localStorage.setItem("resumeCheckerState", JSON.stringify(stateToSave));
      console.log("Resume checker state saved:", stateToSave);
    } catch (error) {
      console.error("Failed to save resume checker state:", error);
    }
  };

  // Load resume checker state from localStorage
  const loadResumeCheckerState = () => {
    try {
      const savedState = localStorage.getItem("resumeCheckerState");
      if (!savedState) {
        console.log("No saved resume checker state found");
        return;
      }

      const stateData = JSON.parse(savedState);
      console.log("Loading saved resume checker state:", stateData);

      // Check if the saved state is not too old (24 hours)
      const isStateValid =
        Date.now() - stateData.timestamp < 24 * 60 * 60 * 1000;
      if (!isStateValid) {
        console.log("Saved state is too old, clearing it");
        localStorage.removeItem("resumeCheckerState");
        return;
      }

      // Restore basic state
      setCurrentStep(stateData.currentStep || "upload");
      setJobDescription(stateData.jobDescription || "");
      setJobInputMethod(stateData.jobInputMethod || "text");

      // Restore resume file if it exists
      if (stateData.resumeFile) {
        if (stateData.resumeFile.data) {
          try {
            const reconstructedResumeFile = base64ToFile(
              stateData.resumeFile.data,
              stateData.resumeFile.name,
              stateData.resumeFile.type
            );
            setResumeFile(reconstructedResumeFile);
            console.log("Resume file restored:", reconstructedResumeFile.name);
          } catch (error) {
            console.error("Failed to restore resume file:", error);
            // Create placeholder file
            const placeholderFile = new File([""], stateData.resumeFile.name, {
              type: stateData.resumeFile.type,
            });
            setResumeFile(placeholderFile);
          }
        } else {
          // Create placeholder file if no data
          const placeholderFile = new File([""], stateData.resumeFile.name, {
            type: stateData.resumeFile.type,
          });
          setResumeFile(placeholderFile);
        }
      }

      // Restore job file if it exists
      if (stateData.jobFile) {
        if (stateData.jobFile.data) {
          try {
            const reconstructedJobFile = base64ToFile(
              stateData.jobFile.data,
              stateData.jobFile.name,
              stateData.jobFile.type
            );
            setJobFile(reconstructedJobFile);
            console.log("Job file restored:", reconstructedJobFile.name);
          } catch (error) {
            console.error("Failed to restore job file:", error);
            // Create placeholder file
            const placeholderFile = new File([""], stateData.jobFile.name, {
              type: stateData.jobFile.type,
            });
            setJobFile(placeholderFile);
          }
        } else {
          // Create placeholder file if no data
          const placeholderFile = new File([""], stateData.jobFile.name, {
            type: stateData.jobFile.type,
          });
          setJobFile(placeholderFile);
        }
      }

      console.log("Resume checker state restored successfully");
    } catch (error) {
      console.error("Failed to load resume checker state:", error);
      // Clear corrupted state
      localStorage.removeItem("resumeCheckerState");
    }
  };

  // Save state whenever it changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only save if we're on the resume checker page
      if (location.pathname === "/resumechecker") {
        saveResumeCheckerState();
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [
    currentStep,
    jobDescription,
    jobInputMethod,
    resumeFile,
    jobFile,
    location.pathname,
  ]);

  // Load state on component mount and clear when navigating away
  useEffect(() => {
    if (location.pathname === "/resumechecker") {
      loadResumeCheckerState();
    } else {
      // Clear resume checker state when navigating away from the page
      // But only if we're not in the middle of an analysis
      const currentState = localStorage.getItem("resumeCheckerState");
      if (currentState) {
        try {
          const stateData = JSON.parse(currentState);
          // Only clear if the state is old (more than 1 hour) or if we're not on analyze step
          const isStateOld = Date.now() - stateData.timestamp > 60 * 60 * 1000;
          const isAnalyzing = stateData.currentStep === "analyze";

          if (isStateOld || !isAnalyzing) {
            localStorage.removeItem("resumeCheckerState");
            console.log(
              "Cleared resume checker state - navigating away from page"
            );
          }
        } catch (error) {
          // Clear corrupted state
          localStorage.removeItem("resumeCheckerState");
        }
      }
    }
  }, [location.pathname]);

  // Check for existing authentication on app load
  useEffect(() => {
    // Log performance improvements on app start
    performanceMonitor.logImprovements();

    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      const isDashboardRoute = location.pathname.startsWith("/dashboard");
      
      if (token) {
        try {
          // Prevent multiple simultaneous auth requests
          if (pendingAuthRequest) {
            await pendingAuthRequest;
            return;
          }

          const authPromise = apiService.validateToken();
          setPendingAuthRequest(authPromise);
          
          const tokenValidation = await authPromise;
          setPendingAuthRequest(null);

          if (tokenValidation.valid && tokenValidation.user) {
            setUser(tokenValidation.user);
            
            // Only load analysis history if on dashboard route to reduce initial load time
            if (isDashboardRoute) {
              // Load history in background without blocking UI
              loadAnalysisHistory().catch(console.warn);
            }

            // Check if we need to continue analysis after login
            const pendingAnalysis = localStorage.getItem("pendingAnalysis");
            console.log("Checking for pending analysis:", pendingAnalysis);
            
            if (pendingAnalysis) {
              try {
                const analysisData = JSON.parse(pendingAnalysis);
                console.log("Restoring pending analysis:", analysisData);

                // Restore analysis state
                setResumeFile(analysisData.resumeFile);
                setJobFile(analysisData.jobFile);
                setCurrentStep(analysisData.currentStep);
                setJobDescription(analysisData.jobDescription);
                setJobInputMethod(analysisData.jobInputMethod);

                // Log final state after all restoration
                console.log("Final state after file restoration:", {
                  finalResumeFile: resumeFile?.name,
                  finalJobFile: jobFile?.name,
                  finalStep: currentStep,
                  finalJobDescription: jobDescription.substring(0, 50) + "...",
                  finalJobInputMethod: jobInputMethod,
                });

                setRequiresAuth(false);

                console.log("Analysis state restored successfully.");

                // State restored successfully - user can now continue manually
                console.log(
                  "Analysis state restored successfully. User can continue manually."
                );
              } catch (error) {
                console.warn("Failed to restore pending analysis:", error);
                localStorage.removeItem("pendingAnalysis");
              }
            }
          }
        } catch (error) {
          console.warn("Failed to validate token:", error);
          localStorage.removeItem("authToken");
          setPendingAuthRequest(null);
        }
      } else if (isDashboardRoute) {
        // Only load analysis history for demo purposes on dashboard/history pages
        // Load in background without blocking UI
        loadAnalysisHistory().catch(console.warn);
      }
      setIsAuthLoading(false);
    };

    checkAuth();
  }, [location.pathname]);

  // Check for pending analysis when user state changes
  useEffect(() => {
    if (user && !isAuthLoading) {
      const pendingAnalysis = localStorage.getItem("pendingAnalysis");
      const hasPendingAnalysis = localStorage.getItem("hasPendingAnalysis");

      console.log("User state changed - checking for pending analysis:", {
        hasPendingAnalysis,
        pendingAnalysis: !!pendingAnalysis,
      });

      if (pendingAnalysis && hasPendingAnalysis) {
        try {
          const analysisData = JSON.parse(pendingAnalysis);
          console.log("Restoring analysis data after user state change:", {
            ...analysisData,
            jobDescriptionLength: analysisData.jobDescription?.length,
            resumeFileSize: analysisData.resumeFile?.size,
            jobFileSize: analysisData.jobFile?.size,
            timestamp: analysisData.timestamp,
          });

          // Clear the pending analysis first to prevent double restoration
          localStorage.removeItem("pendingAnalysis");
          localStorage.removeItem("hasPendingAnalysis");

          // Restore the analysis state
          setCurrentStep(analysisData.currentStep || "job-description");
          setJobDescription(analysisData.jobDescription || "");
          setJobInputMethod(analysisData.jobInputMethod || "text");

          // Restore resume file if it exists
          if (analysisData.resumeFile) {
            console.log(
              "Resume file metadata found after user state change:",
              analysisData.resumeFile
            );
            // Reconstruct actual File object from base64 data
            if (analysisData.resumeFile.data) {
              try {
                const reconstructedResumeFile = base64ToFile(
                  analysisData.resumeFile.data,
                  analysisData.resumeFile.name,
                  analysisData.resumeFile.type
                );
                setResumeFile(reconstructedResumeFile);
                console.log(
                  "Resume file reconstructed after user state change:",
                  {
                    name: reconstructedResumeFile.name,
                    size: reconstructedResumeFile.size,
                    type: reconstructedResumeFile.type,
                  }
                );
              } catch (error) {
                console.error(
                  "Failed to reconstruct resume file after user state change:",
                  error
                );
                // Fallback to placeholder
                const placeholderResumeFile = new File(
                  [""],
                  analysisData.resumeFile.name,
                  { type: analysisData.resumeFile.type }
                );
                setResumeFile(placeholderResumeFile);
                console.log(
                  "Using placeholder resume file after reconstruction failure:",
                  placeholderResumeFile.name
                );
              }
            } else {
              // Fallback to placeholder if no data
              const placeholderResumeFile = new File(
                [""],
                analysisData.resumeFile.name,
                { type: analysisData.resumeFile.type }
              );
              setResumeFile(placeholderResumeFile);
              console.log(
                "Using placeholder resume file (no data):",
                placeholderResumeFile.name
              );
            }
          }

          // Restore job description file if it exists
          if (analysisData.jobFile) {
            console.log(
              "Job file metadata found after user state change:",
              analysisData.jobFile
            );
            // Reconstruct actual File object from base64 data
            if (analysisData.jobFile.data) {
              try {
                const reconstructedJobFile = restoreFileFromAuth(
                  analysisData.jobFile
                );
                setJobFile(reconstructedJobFile);
                setJobInputMethod("file"); // Set input method to file when job file is restored
                console.log("Job file reconstructed after user state change:", {
                  name: reconstructedJobFile.name,
                  size: reconstructedJobFile.size,
                  type: reconstructedJobFile.type,
                });
              } catch (error) {
                console.error(
                  "Failed to reconstruct job file after user state change:",
                  error
                );
                // Fallback to placeholder
                const placeholderJobFile = new File(
                  [""],
                  analysisData.jobFile.name,
                  { type: analysisData.jobFile.type }
                );
                setJobFile(placeholderJobFile);
                setJobInputMethod("file"); // Set input method to file even for placeholder
                console.log(
                  "Using placeholder job file after reconstruction failure:",
                  placeholderJobFile.name
                );
              }
            } else {
              // Fallback to placeholder if no data
              const placeholderJobFile = new File(
                [""],
                analysisData.jobFile.name,
                { type: analysisData.jobFile.type }
              );
              setJobFile(placeholderJobFile);
              setJobInputMethod("file"); // Set input method to file for placeholder
              console.log(
                "Using placeholder job file (no data):",
                placeholderJobFile.name
              );
            }
          }

          setRequiresAuth(false);

          console.log(
            "Analysis state restored after user state change. Final state:",
            {
              currentStep: analysisData.currentStep,
              hasResumeFile: !!analysisData.resumeFile,
              hasJobFile: !!analysisData.jobFile,
              jobDescriptionLength: analysisData.jobDescription?.length,
              jobInputMethod: analysisData.jobInputMethod,
            }
          );

          // If we have a resume file, make sure we're on the job-description step
          if (
            analysisData.resumeFile &&
            analysisData.currentStep === "upload"
          ) {
            setCurrentStep("job-description");
          }

          // Don't auto-start analysis - let user manually click the button
          console.log(
            "Analysis state restored. User can now manually start analysis when ready."
          );
        } catch (error) {
          console.warn(
            "Failed to restore pending analysis after user state change:",
            error
          );
          localStorage.removeItem("pendingAnalysis");
          localStorage.removeItem("hasPendingAnalysis");
        }
      }
    }
  }, [user, isAuthLoading]);

  // Function to load analysis history
  const loadAnalysisHistory = async () => {
    // Don't load if already loading
    if (isHistoryLoading) {
      return;
    }

    try {
      setIsHistoryLoading(true);
      const historyResponse = await apiService.getAnalysisHistory(1, 20); // Reduced from 50 to 20 for faster loading
      console.log("Raw history response:", historyResponse);

      // Convert AnalysisHistoryItem to AnalysisResult format for compatibility
      const convertedHistory: AnalysisResult[] = historyResponse.analyses.map(
        (item) => {
          console.log("Processing history item:", item);
          // Ensure date is properly handled
          let analyzedDate: Date;
          try {
            analyzedDate = new Date(item.analyzedAt);
            // Check if date is valid
            if (isNaN(analyzedDate.getTime())) {
              analyzedDate = new Date(); // Fallback to current date
            }
          } catch {
            analyzedDate = new Date(); // Fallback to current date
          }

          const convertedItem: AnalysisResult = {
            id: item.id,
            analysisId: item.analysisId,
            resumeFilename: item.resumeFilename || "Resume",
            jobTitle: item.jobTitle || "Position Analysis",
            analyzedAt: analyzedDate,
            score_out_of_100: item.score_out_of_100 || item.overallScore || 0,
            overallScore: item.overallScore || item.score_out_of_100 || 0,
            chance_of_selection_percentage: item.chance_of_selection_percentage || 0,
            short_conclusion: "Analysis completed successfully",
            overall_fit_summary: "Fit summary available",
            resume_improvement_priority: [],
            resume_analysis_report: {
              candidate_information: {
                name: "",
                position_applied: item.jobTitle || "Position Analysis",
                experience_level: "",
                current_status: "",
              },
              strengths_analysis: {
                technical_skills: [],
                project_portfolio: [],
                educational_background: [],
              },
              weaknesses_analysis: {
                critical_gaps_against_job_description: [],
                technical_deficiencies: [],
                resume_presentation_issues: [],
                soft_skills_gaps: [],
                missing_essential_elements: {},
              },
              section_wise_detailed_feedback: {
                contact_information: {
                  current_state: "",
                  strengths: [],
                  improvements: [],
                },
                profile_summary: {
                  current_state: "",
                  strengths: [],
                  improvements: [],
                },
                education: {
                  current_state: "",
                  strengths: [],
                  improvements: [],
                },
                skills: { current_state: "", strengths: [], improvements: [] },
                projects: {
                  current_state: "",
                  strengths: [],
                  improvements: [],
                },
                missing_sections: {},
              },
              improvement_recommendations: {
                immediate_resume_additions: [],
                immediate_priority_actions: [],
                short_term_development_goals: [],
                medium_term_objectives: [],
              },
              soft_skills_enhancement_suggestions: {
                communication_skills: [],
                teamwork_and_collaboration: [],
                leadership_and_initiative: [],
                problem_solving_approach: [],
              },
              final_assessment: {
                eligibility_status: "Qualified",
                hiring_recommendation: "",
                key_interview_areas: [],
                onboarding_requirements: [],
                long_term_potential: "",
              },
            },
            job_description_validity: "Valid",
            resume_eligibility: "Eligible",
            candidateStrengths: [],
            developmentAreas: [],
          };

          console.log("Converted analysis item:", {
            id: item.id,
            score_out_of_100: item.score_out_of_100 || item.overallScore || 0,
            overallScore: item.overallScore,
            chance_of_selection_percentage: item.chance_of_selection_percentage,
            final_score_out_of_100: convertedItem.score_out_of_100,
          });

          return convertedItem;
        }
      );

      setAnalysisHistory(convertedHistory);
      console.log(
        "Analysis history loaded:",
        convertedHistory.length,
        "analyses"
      );
      if (convertedHistory.length > 0) {
        console.log("Sample analysis score data:", {
          score_out_of_100: convertedHistory[0].score_out_of_100,
          chance_of_selection_percentage:
            convertedHistory[0].chance_of_selection_percentage,
          overallScore: convertedHistory[0].overallScore,
        });
      }
    } catch (error) {
      console.warn("Failed to load analysis history:", error);
      // Don't throw error to avoid breaking the app
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const addAnalysisToHistory = (analysis: AnalysisResult) => {
    // Ensure the analysis has proper metadata
    const enrichedAnalysis: AnalysisResult = {
      ...analysis,
      // Ensure we have proper IDs
      id: analysis.id || analysis.analysisId || Date.now().toString(),
      analysisId: analysis.analysisId || analysis.id || Date.now().toString(),

      // Ensure we have a proper date
      analyzedAt: analysis.analyzedAt || new Date(),

      // Ensure we have proper scores mapped from new format to legacy
      overallScore: analysis.score_out_of_100 || analysis.overallScore || 0,
      matchPercentage:
        analysis.chance_of_selection_percentage ||
        analysis.matchPercentage ||
        0,

      // Ensure we have job title - try multiple sources
      jobTitle:
        analysis.resume_analysis_report?.candidate_information
          ?.position_applied ||
        analysis.jobTitle ||
        "Position Analysis",

      // Map other fields for compatibility
      overallRecommendation:
        analysis.short_conclusion || analysis.overallRecommendation || "",

      // Ensure candidate strengths are available
      candidateStrengths: analysis.resume_analysis_report?.strengths_analysis
        ? [
            ...analysis.resume_analysis_report.strengths_analysis
              .technical_skills,
            ...analysis.resume_analysis_report.strengths_analysis
              .project_portfolio,
            ...analysis.resume_analysis_report.strengths_analysis
              .educational_background,
          ]
        : analysis.candidateStrengths || [],

      // Ensure development areas are available
      developmentAreas:
        analysis.resume_improvement_priority || analysis.developmentAreas || [],
    };

    setCurrentAnalysis(enrichedAnalysis);
    setAnalysisHistory((prev) => [enrichedAnalysis, ...prev]);

    // Clear resume checker state after successful analysis
    localStorage.removeItem("resumeCheckerState");

    // Also reload the full history to get the latest data
    loadAnalysisHistory().catch(console.warn);
  };

  const resetAnalysis = () => {
    // Don't reset if there's a pending analysis (user is in the middle of login flow)
    const pendingAnalysis = localStorage.getItem("pendingAnalysis");
    if (pendingAnalysis) {
      console.log("ResetAnalysis: Skipping - pending analysis exists");
      return;
    }

    setCurrentAnalysis(null);
    setCurrentStep("upload");
    setResumeFile(null);
    setJobDescription("");
    setJobFile(null);
    setJobInputMethod("text");
    setRequiresAuth(false);
    // Clear any pending analysis
    localStorage.removeItem("pendingAnalysis");
    // Clear resume checker state
    localStorage.removeItem("resumeCheckerState");
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.warn("Logout error:", error);
    }
    setUser(null);
    resetAnalysis();

    // Clear analysis cookies on logout
    analysisCookieService.clearAllAnalyses();
  };

  const value: AppContextType = {
    user,
    setUser,
    isAuthLoading,
    analysisHistory,
    currentAnalysis,
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
    logout,
    requiresAuth,
    setRequiresAuth,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
