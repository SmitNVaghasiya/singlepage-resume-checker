import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { validateFile, formatFileSize, getFileTypeIcon } from '../utils/fileValidation';
import { AnalysisResult, JobInputMethod } from '../types';
import InlineProgressSteps from '../components/InlineProgressSteps';
import AuthModal from '../components/AuthModal';
import ResumeUploadStep from '../components/ResumeUploadStep';
import JobDescriptionStep from '../components/JobDescriptionStep';
import AnalysisLoading from '../components/AnalysisLoading';
import AnalysisResults from '../components/AnalysisResults';
import '../styles/components/AuthModal.css';

interface AnalysisStage {
  id: number;
  text: string;
  completed: boolean;
}

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
    addAnalysisToHistory,
    resetAnalysis,
    tempFiles,
    setTempFiles,
    requiresAuth,
    setRequiresAuth
  } = useAppContext();

  // Authentication modal state
  const [showAuthModal, setShowAuthModal] = useState(false);



  // Step 2 - Job Description State
  const [jobInputMethod, setJobInputMethod] = useState<JobInputMethod>('text');
  const [jobDescriptionError, setJobDescriptionError] = useState<string>('');
  const [jobFileError, setJobFileError] = useState<string>('');
  const [wordCount, setWordCount] = useState(0);
  const [shouldValidateText, setShouldValidateText] = useState(false);

  // Step 3 - Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const analysisStages: AnalysisStage[] = [
    { id: 1, text: "Parsing resume content...", completed: false },
    { id: 2, text: "Extracting key information...", completed: false },
    { id: 3, text: "Analyzing job requirements...", completed: false },
    { id: 4, text: "Matching skills and experience...", completed: false },
    { id: 5, text: "Generating improvement suggestions...", completed: false },
    { id: 6, text: "Finalizing analysis report...", completed: false }
  ];

  // File validation config
  const fileConfig = {
    acceptedTypes: ['.pdf', '.docx'],
    maxSize: 5 * 1024 * 1024 // 5MB
  };

  // Word count calculation
  useEffect(() => {
    const words = jobDescription.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    
    // Only validate when explicitly requested
    if (shouldValidateText) {
      if (jobDescription.trim() && words.length < 50) {
        setJobDescriptionError('Job description must be at least 50 words');
      } else {
        setJobDescriptionError('');
      }
    }
  }, [jobDescription, shouldValidateText]);

  // Validate text function
  const validateJobDescription = () => {
    setShouldValidateText(true);
    const words = jobDescription.trim().split(/\s+/).filter(word => word.length > 0);
    
    if (jobDescription.trim() && words.length < 50) {
      setJobDescriptionError('Job description must be at least 50 words');
      return false;
    } else {
      setJobDescriptionError('');
      // If validation passes and we have everything needed, proceed to analysis
      if (canProceedToAnalysis()) {
        startAnalysis();
      }
      return true;
    }
  };

  // Handle textarea key events
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      validateJobDescription();
    }
  };



  // Step 2: Job Description Handlers
  const handleJobFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validation = validateFile(file, fileConfig);
      
      if (!validation.isValid) {
        setJobFileError(validation.error || 'Invalid file');
        return;
      }

      setJobFile(file);
      setJobFileError('');
      setJobDescription(''); // Clear text input when file is selected
    }
  };

  const removeJobFile = () => {
    setJobFile(null);
    setJobFileError('');
  };

  const canProceedToAnalysis = () => {
    const hasResume = resumeFile !== null;
    const hasJobDescription = jobInputMethod === 'text' 
      ? jobDescription.trim().length >= 50 
      : jobFile !== null;
    
    return hasResume && hasJobDescription && !jobDescriptionError && !jobFileError;
  };

  // Step 3: Analysis Handlers
  const startAnalysis = async () => {
    if (!canProceedToAnalysis()) return;

    // Check if user is authenticated
    if (!user) {
      // Upload files temporarily if not already done
      const needsResumeUpload = resumeFile && !tempFiles.resume;
      const needsJobUpload = jobFile && !tempFiles.jobDescription;
      
      if (needsResumeUpload || needsJobUpload) {
        try {
          const { apiService } = await import('../services/api');
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
      const { apiService } = await import('../services/api');

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
        const extractJobTitle = (text: string): string => {
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

        const jobTitle = result.resume_analysis_report?.candidate_information?.position_applied ||
                        result.jobTitle ||
                        (jobInputMethod === 'text' ? extractJobTitle(jobDescription) : jobFile?.name?.replace(/\.[^/.]+$/, "")) ||
                        'Position Analysis';

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
          resume_analysis_report: result.resume_analysis_report || {
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
        },
        
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
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Automatically start analysis with uploaded files
    setTimeout(() => {
      startAnalysis();
    }, 500);
  };

  // Handle auth modal close
  const handleAuthModalClose = () => {
    setShowAuthModal(false);
  };

  const handleAnalyzeAnother = () => {
    resetAnalysis();
    setAnalysisResult(null);
    setAnalysisProgress(0);
    setCurrentStageIndex(0);
    setJobInputMethod('text');
    setWordCount(0);
  };

  const handleViewDashboard = () => {
    navigate('/dashboard');
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
                analysisStages={analysisStages}
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

             {showAuthModal && (
         <AuthModal
           isOpen={showAuthModal}
           onAuthSuccess={handleAuthSuccess}
           onClose={handleAuthModalClose}
           uploadedFiles={
             tempFiles.resume || tempFiles.jobDescription ? {
               resume: tempFiles.resume?.filename,
               jobDescription: tempFiles.jobDescription?.filename
             } : undefined
           }
         />
       )}
    </div>
  );
};

export default ResumeCheckerPage;
