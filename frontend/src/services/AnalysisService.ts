import { AnalysisResult, JobInputMethod } from '../types';

interface AnalysisStage {
  id: number;
  text: string;
  completed: boolean;
}

interface TempFiles {
  resume?: { tempId: string; filename: string };
  jobDescription?: { tempId: string; filename: string };
}

interface AnalysisServiceProps {
  user: any;
  resumeFile: File | null;
  jobDescription: string;
  jobFile: File | null;
  jobInputMethod: JobInputMethod;
  tempFiles: TempFiles;
  setTempFiles: (files: TempFiles) => void;
  setRequiresAuth: (requires: boolean) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  addAnalysisToHistory: (result: AnalysisResult) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalysisProgress: (progress: number) => void;
  setCurrentStageIndex: (index: number) => void;
  setShowAuthModal: (show: boolean) => void;
  setCurrentStep: (step: string) => void;
}

export class AnalysisService {
  private props: AnalysisServiceProps;

  constructor(props: AnalysisServiceProps) {
    this.props = props;
  }

  public analysisStages: AnalysisStage[] = [
    { id: 1, text: "Parsing resume content...", completed: false },
    { id: 2, text: "Extracting key information...", completed: false },
    { id: 3, text: "Analyzing job requirements...", completed: false },
    { id: 4, text: "Matching skills and experience...", completed: false },
    { id: 5, text: "Generating improvement suggestions...", completed: false },
    { id: 6, text: "Finalizing analysis report...", completed: false }
  ];

  public async startAnalysis(): Promise<void> {
    const {
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
      setCurrentStep
    } = this.props;

    // Check if user is authenticated
    if (!user) {
      // Upload files temporarily if not already done
      const needsResumeUpload = resumeFile && !tempFiles.resume;
      const needsJobUpload = jobFile && !tempFiles.jobDescription;
      
      if (needsResumeUpload || needsJobUpload) {
        try {
          const { apiService } = await import('./api');
          const tempUploadResponse = await apiService.uploadTempFiles(
            needsResumeUpload ? resumeFile : undefined,
            needsJobUpload ? jobFile : undefined
          );
          
          // Merge with existing temp files
          setTempFiles({
            ...tempFiles,
            ...tempUploadResponse.tempFiles
          });
          setRequiresAuth(true);
        } catch (error) {
          console.error('Failed to upload temporary files:', error);
          alert('Failed to upload files. Please try again.');
          return;
        }
      }
      
      // Show authentication modal
      setShowAuthModal(true);
      return;
    }

    setCurrentStep('analyze');
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentStageIndex(0);

    try {
      // Import the API service
      const { apiService } = await import('./api');

      // Stage 1: Preparing analysis
      setCurrentStageIndex(0);
      setAnalysisProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stage 2: Uploading files
      setCurrentStageIndex(1);
      setAnalysisProgress(25);

      let analysisResponse;

      // Use temporary files if available, otherwise use current files
      if (tempFiles.resume || tempFiles.jobDescription) {
        analysisResponse = await apiService.analyzeResumeWithTempFiles(
          tempFiles.resume?.tempId,
          tempFiles.jobDescription?.tempId,
          jobInputMethod === 'text' ? jobDescription : undefined,
          resumeFile || undefined,
          jobFile || undefined
        );
      } else {
        // Prepare analysis request with current files
        const analysisRequest = {
          resumeFile: resumeFile!,
          ...(jobInputMethod === 'text' 
            ? { jobDescriptionText: jobDescription }
            : { jobDescriptionFile: jobFile! }
          )
        };

        // Start analysis
        analysisResponse = await apiService.analyzeResume(analysisRequest);
      }
      
      // Stage 3: Processing with AI
      setCurrentStageIndex(2);
      setAnalysisProgress(50);

      // Poll for results
      const result = await apiService.pollForResult(analysisResponse.analysisId);

      // Stage 4: Finalizing results
      setCurrentStageIndex(3);
      setAnalysisProgress(90);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Complete
      setAnalysisProgress(100);

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
        resumeFilename: resumeFile?.name || tempFiles.resume?.filename || 'Resume',
        jobDescriptionFilename: jobInputMethod === 'file' ? (jobFile?.name || tempFiles.jobDescription?.filename) : 'Text Input',
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
      setIsAnalyzing(false);

      // Clear temporary files after successful analysis
      setTempFiles({});
      setRequiresAuth(false);

    } catch (error) {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);
      
      // Show error to user
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed. Please try again.';
      
      // Check if it's an authentication error
      if (errorMessage.includes('Access token is required') || errorMessage.includes('Authentication')) {
        setShowAuthModal(true);
      } else {
        alert(`Analysis failed: ${errorMessage}`);
        // Reset to job description step
        setCurrentStep('job-description');
      }
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