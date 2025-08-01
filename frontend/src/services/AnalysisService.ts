import { AnalysisResult, JobInputMethod } from '../types';
import { saveFileForAuth } from '../utils/fileValidation';
import { analysisCookieService } from './AnalysisCookieService';

interface AnalysisStage {
  id: number;
  text: string;
  completed: boolean;
}

// TempFiles interface removed - no longer needed

interface AnalysisServiceProps {
  user: any;
  resumeFile: File | null;
  jobDescription: string;
  jobFile: File | null;
  jobInputMethod: JobInputMethod;
  currentStep: string;
  setRequiresAuth: (requires: boolean) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  addAnalysisToHistory: (result: AnalysisResult) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalysisProgress: (progress: number) => void;
  setCurrentStageIndex: (index: number) => void;
  setShowAuthModal: (show: boolean) => void;
  setCurrentStep: (step: string) => void;
  // Add navigation callback for seamless transitions
  onAnalysisComplete?: (analysisId: string) => void;
  // Add navigation callback for auth redirect
  onAuthRequired?: () => void;
  // Add getter functions to get latest state
  getLatestState: () => {
    user: any;
    resumeFile: File | null;
    jobDescription: string;
    jobFile: File | null;
    jobInputMethod: JobInputMethod;
    currentStep: string;
  };
}

export class AnalysisService {
  private props: AnalysisServiceProps;
  private isAnalysisRunning: boolean = false;

  constructor(props: AnalysisServiceProps) {
    this.props = props;
  }

  public analysisStages: AnalysisStage[] = [
    { id: 1, text: "Preparing analysis", completed: false },
    { id: 2, text: "Uploading files", completed: false },
    { id: 3, text: "Processing with AI", completed: false },
    { id: 4, text: "Finalizing results", completed: false },
    { id: 5, text: "Analysis complete", completed: false },
  ];

  public async startAnalysis(): Promise<void> {
    // Prevent multiple simultaneous analysis attempts
    if (this.isAnalysisRunning) {
      console.log('Analysis already running, skipping...');
      return;
    }
    
    this.isAnalysisRunning = true;
    
    // Get the latest state instead of using constructor props
    const latestState = this.props.getLatestState();
    const {
      user,
      resumeFile,
      jobDescription,
      jobFile,
      jobInputMethod,
      currentStep
    } = latestState;

    const {
      setRequiresAuth,
      setAnalysisResult,
      addAnalysisToHistory,
      setIsAnalyzing,
      setAnalysisProgress,
      setCurrentStageIndex,
      setShowAuthModal,
      setCurrentStep,
      onAnalysisComplete,
      onAuthRequired
    } = this.props;

    try {
      // Validate that we have the required data
      console.log('Starting analysis with state:', {
        hasUser: !!user,
        hasResumeFile: !!resumeFile,
        hasJobFile: !!jobFile,
        hasJobDescription: !!jobDescription,
        jobInputMethod,
        currentStep,
        resumeFileName: resumeFile?.name,
        jobFileName: jobFile?.name
      });

      // Additional validation logging
      if (!resumeFile) {
        console.error('CRITICAL: No resume file found!', {
          resumeFile: resumeFile,
          localStoragePendingAnalysis: localStorage.getItem('pendingAnalysis')
        });
      }

      // Check if user is authenticated
      if (!user) {
        console.log('User not authenticated, saving state and redirecting to login');
        
        // Validate that we have the minimum required data before saving
        if (!resumeFile) {
          throw new Error('Resume file is required. Please upload a resume file and try again.');
        }

        const hasJobDescription = jobInputMethod === 'text' 
          ? (jobDescription.trim().length >= 50)
          : (jobFile !== null);

        if (!hasJobDescription) {
          throw new Error('Job description is required. Please provide a job description and try again.');
        }
        
        // Save current analysis state before redirecting
        const pendingAnalysis = {
          currentStep: currentStep || 'job-description',
          jobDescription: jobDescription || '',
          jobInputMethod: jobInputMethod || 'text',
          // Store file data as base64 for reconstruction after login
          resumeFile: resumeFile ? await saveFileForAuth(resumeFile) : null,
          jobFile: jobFile ? await saveFileForAuth(jobFile) : null,
          timestamp: Date.now() // Add timestamp for debugging
        };
        
        console.log('Saving pending analysis:', {
          ...pendingAnalysis,
          jobDescriptionLength: pendingAnalysis.jobDescription.length,
          jobDescriptionPreview: pendingAnalysis.jobDescription.substring(0, 100) + '...',
          resumeFileSize: pendingAnalysis.resumeFile?.size,
          jobFileSize: pendingAnalysis.jobFile?.size
        });
        
        localStorage.setItem('pendingAnalysis', JSON.stringify(pendingAnalysis));
        
        // Set flag to indicate we have pending analysis
        localStorage.setItem('hasPendingAnalysis', 'true');
        
        // Redirect to login page
        onAuthRequired?.();
        return;
      }

      setCurrentStep('analyze');
      setIsAnalyzing(true);

      // Import the API service
      const { apiService } = await import('./api');

      let analysisResponse;

      // Use current files for analysis (no temp files needed)
      console.log('Analysis: Using current files:', {
        hasResumeFile: !!resumeFile,
        hasJobFile: !!jobFile,
        jobInputMethod,
        resumeFileName: resumeFile?.name,
        jobFileName: jobFile?.name
      });
      
      // Validate that we have a resume file
      if (!resumeFile) {
        console.error('No resume file available for analysis');
        throw new Error('Resume file is required. Please upload a resume file and try again.');
      }
      
      if (resumeFile) {
        console.log('Using current files for analysis:', {
          resumeFileName: resumeFile.name,
          jobFileName: jobFile?.name,
          jobDescriptionText: jobInputMethod === 'text' ? jobDescription : undefined
        });
        // Prepare analysis request with current files
        const analysisRequest = {
          resumeFile: resumeFile,
          ...(jobInputMethod === 'text' 
            ? { jobDescriptionText: jobDescription }
            : { jobDescriptionFile: jobFile! }
          )
        };

        // Start analysis
        analysisResponse = await apiService.analyzeResume(analysisRequest);
      } else {
        // This should never happen due to the validation above, but just in case
        throw new Error('Resume file is required. Please upload a resume file and try again.');
      }
      
      // Poll for results
      const result = await apiService.pollForResult(analysisResponse.analysisId);

      // Extract job title from job description text if available
      const jobTitle = this.extractJobTitle(result, jobDescription, jobFile, jobInputMethod);

      // Handle both new comprehensive format and legacy format
      const analysisResult: AnalysisResult = {
        // New comprehensive format fields
        job_description_validity: result.job_description_validity || 'Valid',
        resume_eligibility: result.resume_eligibility || 'Eligible',
        score_out_of_100: result.score_out_of_100 || result.overallScore || (result as any).score || 0,
        short_conclusion: result.short_conclusion || result.overallRecommendation || 'Analysis completed successfully.',
        chance_of_selection_percentage: result.chance_of_selection_percentage || result.matchPercentage || 0,
        resume_improvement_priority: result.resume_improvement_priority || [],
        overall_fit_summary: result.overall_fit_summary || '',
        resume_analysis_report: result.resume_analysis_report || this.getDefaultAnalysisReport(result),
        
        // Legacy compatibility fields for existing components
        id: analysisResponse.analysisId,
        analysisId: analysisResponse.analysisId,
        resumeFilename: resumeFile?.name || 'Resume',
        jobDescriptionFilename: jobInputMethod === 'file' ? (jobFile?.name || 'Job Description File') : 'Text Input',
        jobTitle: jobTitle,
        industry: result.industry || 'General',
        analyzedAt: new Date(),
        processingTime: result.processingTime,
        
        // Legacy fields that map to new structure
        overallScore: result.score_out_of_100 || result.overallScore || (result as any).score,
        matchPercentage: result.chance_of_selection_percentage || result.matchPercentage,
        overallRecommendation: result.short_conclusion || result.overallRecommendation,
        candidateStrengths: result.resume_analysis_report?.strengths_analysis ? [
          ...result.resume_analysis_report.strengths_analysis.technical_skills,
          ...result.resume_analysis_report.strengths_analysis.project_portfolio,
          ...result.resume_analysis_report.strengths_analysis.educational_background
        ] : (result.candidateStrengths || (result as any).strengths || []),
        developmentAreas: result.resume_improvement_priority || (result.developmentAreas || (result as any).weaknesses || [])
      };

      setAnalysisResult(analysisResult);
      addAnalysisToHistory(analysisResult);
      
      // Store analysis result in cookie for faster future access
      analysisCookieService.storeAnalysis(analysisResponse.analysisId, analysisResult);
      
      setIsAnalyzing(false);

      // Clear any pending analysis from localStorage
      localStorage.removeItem('pendingAnalysis');
      localStorage.removeItem('hasPendingAnalysis');
      setRequiresAuth(false);

      // Navigate immediately without unnecessary delays
      console.log('Analysis completed successfully, navigating to results...');
      onAnalysisComplete?.(analysisResponse.analysisId);

    } catch (error) {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);
      
      // Show error to user
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed. Please try again.';
      
      // Check if it's an authentication error
      if (errorMessage.includes('Access token is required') || errorMessage.includes('Authentication')) {
        setShowAuthModal(true);
      } else if (errorMessage.includes('Security validation failed:')) {
        // Handle security validation errors
        const cleanMessage = errorMessage.replace('Security validation failed: ', '');
        alert(`Security validation failed: ${cleanMessage}\n\nPlease ensure your job description and resume contain only legitimate professional information related to employment and career development.`);
        // Reset to job description step so user can fix the issue
        setCurrentStep('job-description');
      } else if (errorMessage.includes('Invalid job description:')) {
        // Handle job description validation errors
        const cleanMessage = errorMessage.replace('Invalid job description: ', '');
        alert(`Invalid job description: ${cleanMessage}\n\nPlease provide a proper job posting that includes:\n• Job title and company name\n• Specific job responsibilities and duties\n• Required qualifications and experience\n• Technical requirements (if applicable)`);
        // Reset to job description step so user can fix the issue
        setCurrentStep('job-description');
      } else if (errorMessage.includes('Invalid resume:')) {
        // Handle resume validation errors
        const cleanMessage = errorMessage.replace('Invalid resume: ', '');
        alert(`Invalid resume: ${cleanMessage}\n\nPlease provide a proper professional resume that includes:\n• Your personal information (name, contact details)\n• Work experience and professional history\n• Educational background and qualifications\n• Skills and technical competencies\n• Projects and achievements`);
        // Reset to upload step so user can fix the issue
        setCurrentStep('upload');
      } else if (errorMessage.includes('Validation error:')) {
        // Handle general validation errors
        const cleanMessage = errorMessage.replace('Validation error: ', '');
        alert(`Validation error: ${cleanMessage}\n\nPlease check your input and try again.`);
        // Reset to job description step so user can fix the issue
        setCurrentStep('job-description');
      } else {
        alert(`Analysis failed: ${errorMessage}`);
        // Reset to job description step
        setCurrentStep('job-description');
      }
    } finally {
      this.isAnalysisRunning = false;
    }
  }



  private extractJobTitle(result: any, jobDescription: string, jobFile: File | null, jobInputMethod: JobInputMethod): string {
    const extractJobTitleFromText = (text: string): string => {
      if (!text) return 'Position Analysis';
      
      // Look for common job title patterns
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const firstLine = lines[0] || '';
      
      // If first line looks like a job title (not too long, contains common keywords)
      if (firstLine.length < 100 && (
        /\b(developer|engineer|manager|analyst|coordinator|specialist|lead|senior|junior|intern)\b/i.test(firstLine) ||
        /\b(position|role|job|opening|opportunity)\b/i.test(firstLine) ||
        firstLine.split(' ').length <= 6
      )) {
        return firstLine;
      }
      
      // Look for "Position:" or "Job Title:" patterns
      for (const line of lines) {
        const match = line.match(/(?:position|job title|role|title)\s*:?\s*(.+)/i);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      
      return 'Position Analysis';
    };

    return result.resume_analysis_report?.candidate_information?.position_applied ||
           result.jobTitle ||
           (jobInputMethod === 'text' ? extractJobTitleFromText(jobDescription) : jobFile?.name?.replace(/\.[^/.]+$/, "")) ||
           'Position Analysis';
  }

  private getDefaultAnalysisReport(result: any) {
    return {
      candidate_information: {
        name: 'Candidate',
        position_applied: result.jobTitle || 'Target Position',
        experience_level: 'Not specified',
        current_status: 'Not specified'
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
        eligibility_status: result.resume_eligibility || 'Qualified',
        hiring_recommendation: '',
        key_interview_areas: [],
        onboarding_requirements: [],
        long_term_potential: ''
      }
    };
  }
} 