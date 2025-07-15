import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AnalysisResult } from '../types';
import { User, apiService } from '../services/api';
import { usePasteHandler } from '../hooks/usePasteHandler';

type AnalysisStep = 'upload' | 'job-description' | 'analyze';

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
  jobInputMethod: 'text' | 'file';
  setJobInputMethod: (method: 'text' | 'file') => void;
  
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
    throw new Error('useAppContext must be used within an AppProvider');
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
  
  // Analysis state
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  
  // Single page analysis state
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [jobInputMethod, setJobInputMethod] = useState<'text' | 'file'>('text');

  // Authentication state
  const [requiresAuth, setRequiresAuth] = useState(false);

  // Initialize paste handler
  usePasteHandler({
    currentStep,
    pathname: window.location.pathname,
    hasResumeFile: !!resumeFile,
    jobInputMethod,
    setResumeFile,
    setJobFile,
    setJobInputMethod,
    setCurrentStep: (step: string) => setCurrentStep(step as AnalysisStep)
  });

  // Helper function to convert base64 to File object
  const base64ToFile = (base64Data: string, filename: string, mimeType: string): File => {
    const arr = base64Data.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || mimeType;
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
          // Load analysis history after authentication
          await loadAnalysisHistory();
          
          // Check if we need to continue analysis after login
          const pendingAnalysis = localStorage.getItem('pendingAnalysis');
          console.log('Checking for pending analysis:', pendingAnalysis);
          if (pendingAnalysis) {
            try {
              const analysisData = JSON.parse(pendingAnalysis);
              console.log('Restoring analysis data:', analysisData);
              
              // Clear the pending analysis first to prevent double restoration
              localStorage.removeItem('pendingAnalysis');
              
              // Log the current state before restoration
              console.log('State before restoration:', {
                currentResumeFile: resumeFile?.name,
                currentJobFile: jobFile?.name
              });
              
              // Restore the analysis state
              setCurrentStep(analysisData.currentStep || 'job-description');
              setJobDescription(analysisData.jobDescription || '');
              setJobInputMethod(analysisData.jobInputMethod || 'text');
              
              console.log('State after restoration setup:', {
                restoredStep: analysisData.currentStep || 'job-description',
                restoredJobDescription: analysisData.jobDescription || '',
                restoredJobDescriptionLength: (analysisData.jobDescription || '').length,
                restoredJobInputMethod: analysisData.jobInputMethod || 'text'
              });
              
              // Restore file objects if they exist in tempFiles
              // Note: We can't restore the actual File objects from localStorage,
              // but we can restore the metadata and the tempFiles should contain the uploaded files
              if (analysisData.resumeFile) {
                console.log('Resume file metadata found:', analysisData.resumeFile);
                // Reconstruct actual File object from base64 data
                if (analysisData.resumeFile.data) {
                  try {
                    const reconstructedResumeFile = base64ToFile(
                      analysisData.resumeFile.data,
                      analysisData.resumeFile.name,
                      analysisData.resumeFile.type
                    );
                    setResumeFile(reconstructedResumeFile);
                    console.log('Resume file reconstructed successfully:', {
                      name: reconstructedResumeFile.name,
                      size: reconstructedResumeFile.size,
                      type: reconstructedResumeFile.type
                    });
                  } catch (error) {
                    console.error('Failed to reconstruct resume file:', error);
                    // Fallback to placeholder
                    const placeholderResumeFile = new File(
                      [''], 
                      analysisData.resumeFile.name,
                      { type: analysisData.resumeFile.type }
                    );
                    setResumeFile(placeholderResumeFile);
                    console.log('Using placeholder resume file:', placeholderResumeFile.name);
                  }
                } else {
                  // Fallback to placeholder if no data
                  const placeholderResumeFile = new File(
                    [''], 
                    analysisData.resumeFile.name,
                    { type: analysisData.resumeFile.type }
                  );
                  setResumeFile(placeholderResumeFile);
                  console.log('Using placeholder resume file (no data):', placeholderResumeFile.name);
                }
              } else {
                console.log('No resume file metadata found in analysis data');
              }

              // Restore job description file if it exists
              if (analysisData.jobFile) {
                console.log('Job file metadata found:', analysisData.jobFile);
                // Reconstruct actual File object from base64 data
                if (analysisData.jobFile.data) {
                  try {
                    const reconstructedJobFile = base64ToFile(
                      analysisData.jobFile.data,
                      analysisData.jobFile.name,
                      analysisData.jobFile.type
                    );
                    setJobFile(reconstructedJobFile);
                    setJobInputMethod('file'); // Set input method to file when job file is restored
                    console.log('Job file reconstructed:', reconstructedJobFile.name, reconstructedJobFile.size);
                  } catch (error) {
                    console.error('Failed to reconstruct job file:', error);
                    // Fallback to placeholder
                    const placeholderJobFile = new File(
                      [''], 
                      analysisData.jobFile.name,
                      { type: analysisData.jobFile.type }
                    );
                    setJobFile(placeholderJobFile);
                    setJobInputMethod('file'); // Set input method to file even for placeholder
                  }
                } else {
                  // Fallback to placeholder if no data
                  const placeholderJobFile = new File(
                    [''], 
                    analysisData.jobFile.name,
                    { type: analysisData.jobFile.type }
                  );
                  setJobFile(placeholderJobFile);
                  setJobInputMethod('file'); // Set input method to file for placeholder
                }
              }
                
              // If we have a resume file, make sure we're on the job-description step
              if (analysisData.currentStep === 'upload') {
                setCurrentStep('job-description');
              }
              
              // Log final state after all restoration
              console.log('Final state after file restoration:', {
                finalResumeFile: resumeFile?.name,
                finalJobFile: jobFile?.name,
                finalStep: currentStep,
                finalJobDescription: jobDescription.substring(0, 50) + '...',
                finalJobInputMethod: jobInputMethod
              });
              
              setRequiresAuth(false);
              
              console.log('Analysis state restored successfully.');
              
              // State restored successfully - user can now continue manually
              console.log('Analysis state restored successfully. User can continue manually.');
            } catch (error) {
              console.warn('Failed to restore pending analysis:', error);
              localStorage.removeItem('pendingAnalysis');
            }
          }
        } catch (error) {
          console.warn('Failed to get current user:', error);
          localStorage.removeItem('authToken');
        }
      } else {
        // Load analysis history even without authentication (for demo purposes)
        await loadAnalysisHistory();
      }
      setIsAuthLoading(false);
    };

    checkAuth();
  }, []);

  // Check for pending analysis when user state changes
  useEffect(() => {
    if (user && !isAuthLoading) {
      const pendingAnalysis = localStorage.getItem('pendingAnalysis');
      console.log('User state changed - checking for pending analysis:', pendingAnalysis);
      if (pendingAnalysis) {
        try {
          const analysisData = JSON.parse(pendingAnalysis);
          console.log('Restoring analysis data after user state change:', analysisData);
          
          // Clear the pending analysis first to prevent double restoration
          localStorage.removeItem('pendingAnalysis');
          
          // Restore the analysis state
          setCurrentStep(analysisData.currentStep || 'job-description');
          setJobDescription(analysisData.jobDescription || '');
          setJobInputMethod(analysisData.jobInputMethod || 'text');
          
          // Restore resume file if it exists
          if (analysisData.resumeFile) {
            console.log('Resume file metadata found after user state change:', analysisData.resumeFile);
            // Reconstruct actual File object from base64 data
            if (analysisData.resumeFile.data) {
              try {
                const reconstructedResumeFile = base64ToFile(
                  analysisData.resumeFile.data,
                  analysisData.resumeFile.name,
                  analysisData.resumeFile.type
                );
                setResumeFile(reconstructedResumeFile);
                console.log('Resume file reconstructed after user state change:', reconstructedResumeFile.name, reconstructedResumeFile.size);
              } catch (error) {
                console.error('Failed to reconstruct resume file after user state change:', error);
                // Fallback to placeholder
                const placeholderResumeFile = new File(
                  [''], 
                  analysisData.resumeFile.name,
                  { type: analysisData.resumeFile.type }
                );
                setResumeFile(placeholderResumeFile);
              }
            } else {
              // Fallback to placeholder if no data
              const placeholderResumeFile = new File(
                [''], 
                analysisData.resumeFile.name,
                { type: analysisData.resumeFile.type }
              );
              setResumeFile(placeholderResumeFile);
            }
          }

          // Restore job description file if it exists
          if (analysisData.jobFile) {
            console.log('Job file metadata found after user state change:', analysisData.jobFile);
            // Reconstruct actual File object from base64 data
            if (analysisData.jobFile.data) {
              try {
                const reconstructedJobFile = base64ToFile(
                  analysisData.jobFile.data,
                  analysisData.jobFile.name,
                  analysisData.jobFile.type
                );
                setJobFile(reconstructedJobFile);
                setJobInputMethod('file'); // Set input method to file when job file is restored
                console.log('Job file reconstructed after user state change:', reconstructedJobFile.name, reconstructedJobFile.size);
              } catch (error) {
                console.error('Failed to reconstruct job file after user state change:', error);
                // Fallback to placeholder
                const placeholderJobFile = new File(
                  [''], 
                  analysisData.jobFile.name,
                  { type: analysisData.jobFile.type }
                );
                setJobFile(placeholderJobFile);
                setJobInputMethod('file'); // Set input method to file even for placeholder
              }
            } else {
              // Fallback to placeholder if no data
              const placeholderJobFile = new File(
                [''], 
                analysisData.jobFile.name,
                { type: analysisData.jobFile.type }
              );
              setJobFile(placeholderJobFile);
              setJobInputMethod('file'); // Set input method to file for placeholder
            }
          }
          
          setRequiresAuth(false);
          
          console.log('Analysis state restored after user state change.');
          
          // If we have a resume file, make sure we're on the job-description step
          if (analysisData.resumeFile && analysisData.currentStep === 'upload') {
            setCurrentStep('job-description');
          }
        } catch (error) {
          console.warn('Failed to restore pending analysis after user state change:', error);
          localStorage.removeItem('pendingAnalysis');
        }
      }
    }
  }, [user, isAuthLoading]);

  // Function to load analysis history
  const loadAnalysisHistory = async () => {
    try {
      const historyResponse = await apiService.getAnalysisHistory(1, 50); // Get recent analyses
      // Convert AnalysisHistoryItem to AnalysisResult format for compatibility
      const convertedHistory: AnalysisResult[] = historyResponse.analyses.map(item => {
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

        return {
          // Basic required fields
          job_description_validity: 'Valid',
          resume_eligibility: 'Eligible', 
          score_out_of_100: item.overallScore || 0,
          short_conclusion: 'Analysis completed successfully.',
          chance_of_selection_percentage: 0,
          resume_improvement_priority: [],
          overall_fit_summary: '',
          
          // Detailed analysis report structure
          resume_analysis_report: {
            candidate_information: {
              name: '',
              position_applied: item.jobTitle || 'Position Analysis',
              experience_level: '',
              current_status: ''
            },
            strengths_analysis: {
              technical_skills: [],
              project_portfolio: [],
              educational_background: []
            },
            weaknesses_analysis: {
              critical_gaps_against_job_description: [],
              technical_deficiencies: [],
              resume_presentation_issues: [],
              soft_skills_gaps: [],
              missing_essential_elements: []
            },
            section_wise_detailed_feedback: {
              contact_information: { current_state: '', strengths: [], improvements: [] },
              profile_summary: { current_state: '', strengths: [], improvements: [] },
              education: { current_state: '', strengths: [], improvements: [] },
              skills: { current_state: '', strengths: [], improvements: [] },
              projects: { current_state: '', strengths: [], improvements: [] },
              missing_sections: {}
            },
            improvement_recommendations: {
              immediate_resume_additions: [],
              immediate_priority_actions: [],
              short_term_development_goals: [],
              medium_term_objectives: []
            },
            soft_skills_enhancement_suggestions: {
              communication_skills: [],
              teamwork_and_collaboration: [],
              leadership_and_initiative: [],
              problem_solving_approach: []
            },
            final_assessment: {
              eligibility_status: 'Qualified',
              hiring_recommendation: '',
              key_interview_areas: [],
              onboarding_requirements: [],
              long_term_potential: ''
            }
          },
          
          // Metadata
          id: item.id,
          analysisId: item.analysisId,
          resumeFilename: item.resumeFilename || 'Resume',
          jobTitle: item.jobTitle || 'Position Analysis',
          overallScore: item.overallScore || 0,
          matchPercentage: 0, // Will be loaded when viewing details
          industry: 'General', // Default value
          analyzedAt: analyzedDate,
          
          // Legacy compatibility fields
          keywordMatch: { matched: [], missing: [], percentage: 0, suggestions: [] },
          skillsAnalysis: {
            technical: { required: [], present: [], missing: [], recommendations: [] },
            soft: { required: [], present: [], missing: [], recommendations: [] },
            industry: { required: [], present: [], missing: [], recommendations: [] }
          },
          experienceAnalysis: {
            yearsRequired: 0,
            yearsFound: 0,
            relevant: true,
            experienceGaps: [],
            strengthAreas: [],
            improvementAreas: []
          },
          resumeQuality: {
            formatting: { score: 0, issues: [], suggestions: [] },
            content: { score: 0, issues: [], suggestions: [] },
            length: { score: 0, wordCount: 0, recommendations: [] },
            structure: { score: 0, missingSections: [], suggestions: [] }
          },
          competitiveAnalysis: {
            positioningStrength: 0,
            competitorComparison: [],
            differentiators: [],
            marketPosition: '',
            improvementImpact: []
          },
          detailedFeedback: {
            strengths: [],
            weaknesses: [],
            quickWins: [],
            industryInsights: []
          },
          improvementPlan: {
            immediate: [],
            shortTerm: [],
            longTerm: []
          },
          overallRecommendation: '',
          aiInsights: [],
          candidateStrengths: [],
          developmentAreas: [],
          confidence: 85
        };
      });
      
      setAnalysisHistory(convertedHistory);
    } catch (error) {
      console.warn('Failed to load analysis history:', error);
      // Don't throw error to avoid breaking the app
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
      matchPercentage: analysis.chance_of_selection_percentage || analysis.matchPercentage || 0,
      
      // Ensure we have job title - try multiple sources
      jobTitle: analysis.resume_analysis_report?.candidate_information?.position_applied || 
                analysis.jobTitle || 
                'Position Analysis',
      
      // Map other fields for compatibility
      overallRecommendation: analysis.short_conclusion || analysis.overallRecommendation || '',
      
      // Ensure candidate strengths are available
      candidateStrengths: analysis.resume_analysis_report?.strengths_analysis ? [
        ...analysis.resume_analysis_report.strengths_analysis.technical_skills,
        ...analysis.resume_analysis_report.strengths_analysis.project_portfolio,
        ...analysis.resume_analysis_report.strengths_analysis.educational_background
      ] : (analysis.candidateStrengths || []),
      
      // Ensure development areas are available
      developmentAreas: analysis.resume_improvement_priority || analysis.developmentAreas || []
    };

    setCurrentAnalysis(enrichedAnalysis);
    setAnalysisHistory((prev) => [enrichedAnalysis, ...prev]);
    
    // Also reload the full history to get the latest data
    loadAnalysisHistory().catch(console.warn);
  };

  const resetAnalysis = () => {
    // Don't reset if there's a pending analysis (user is in the middle of login flow)
    const pendingAnalysis = localStorage.getItem('pendingAnalysis');
    if (pendingAnalysis) {
      console.log('ResetAnalysis: Skipping - pending analysis exists');
      return;
    }
    
    setCurrentAnalysis(null);
    setCurrentStep('upload');
    setResumeFile(null);
    setJobDescription('');
    setJobFile(null);
    setJobInputMethod('text');
    setRequiresAuth(false);
    // Clear any pending analysis
    localStorage.removeItem('pendingAnalysis');
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    }
    setUser(null);
    resetAnalysis();
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

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}; 