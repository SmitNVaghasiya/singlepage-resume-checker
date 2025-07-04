import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { validateFile, formatFileSize, getFileTypeIcon } from '../utils/fileValidation';
import { AnalysisResult, JobInputMethod } from '../types';
import InlineProgressSteps from '../components/InlineProgressSteps';
import AuthModal from '../components/AuthModal';
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

  // Step 1 - Resume Upload State
  const [dragActive, setDragActive] = useState(false);
  const [resumeError, setResumeError] = useState<string>('');

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

  // Step 1: Resume Upload Handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleResumeFile(files[0]);
    }
  }, []);

  const handleResumeFile = (file: File) => {
    const validation = validateFile(file, fileConfig);
    
    if (!validation.isValid) {
      setResumeError(validation.error || 'Invalid file');
      return;
    }

    setResumeFile(file);
    setResumeError('');
    
    // Auto-advance to step 2
    setTimeout(() => {
      setCurrentStep('job-description');
    }, 500);
  };

  const handleResumeFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleResumeFile(files[0]);
    }
  };

  const removeResumeFile = () => {
    setResumeFile(null);
    setResumeError('');
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
    
    return hasResume && hasJobDescription && !resumeError && !jobDescriptionError && !jobFileError;
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
          <div className="step-content">
            <div className="step-header">
              <h2>Upload Your Resume</h2>
              <p>Upload your resume to get started with AI-powered analysis</p>
            </div>

            <div 
              className={`file-upload-area ${dragActive ? 'drag-active' : ''} ${resumeFile ? 'has-file' : ''} ${resumeError ? 'error' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleResumeFileInput}
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: resumeFile ? 'default' : 'pointer', pointerEvents: resumeFile ? 'none' : 'auto' }}
                id="resume-upload"
              />
              <label htmlFor="resume-upload" style={{ cursor: resumeFile ? 'default' : 'pointer', display: 'block' }}>
                {resumeFile ? (
                  <div className="upload-success">
                    <div className="upload-file-info">
                      <div className="upload-file-icon">
                        <div className="file-icon-uploaded">📄</div>
                      </div>
                      <div className="upload-file-details">
                        <div className="upload-file-name">{resumeFile.name}</div>
                        <div className="upload-file-size">{formatFileSize(resumeFile.size)}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeResumeFile();
                        }}
                        className="upload-remove-btn"
                        type="button"
                        title="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="upload-success-message">
                      <div className="upload-success-icon">✓</div>
                      <p>Resume uploaded successfully!</p>
                    </div>
                  </div>
                ) : (
                  <div className="upload-content">
                    <div className="upload-icon-wrapper">
                      <div className="upload-icon">📄</div>
                    </div>
                    <div className="upload-text">
                      <h3>Drop your resume here, paste (Ctrl+V), or click to browse</h3>
                      <p>PDF, DOCX • Max 5MB</p>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {resumeError && (
              <div className="error-message">{resumeError}</div>
            )}

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
          </div>
        )}

        {/* Step 2: Job Description */}
        {currentStep === 'job-description' && (
          <div className="step-content">
            <div className="step-header">
              <h2>Add Job Description</h2>
              <p>Provide the job description to analyze how well your resume matches</p>
            </div>

            <div className="job-input-methods">
              <button 
                className={`method-button ${jobInputMethod === 'text' ? 'active' : ''}`}
                onClick={() => setJobInputMethod('text')}
              >
                📝 Paste Text
              </button>
              <button 
                className={`method-button ${jobInputMethod === 'file' ? 'active' : ''}`}
                onClick={() => setJobInputMethod('file')}
              >
                📄 Upload File
              </button>
            </div>

            {jobInputMethod === 'text' ? (
              <div className="text-input-section">
                <div className="textarea-container">
                  <textarea
                    value={jobDescription}
                    onChange={(e) => {
                      setJobDescription(e.target.value);
                      // Clear validation state when user starts typing again
                      if (shouldValidateText) {
                        setShouldValidateText(false);
                        setJobDescriptionError('');
                      }
                    }}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder="Paste the job description here... (Press Enter to validate, Shift+Enter for new line)"
                    className={`job-description-textarea ${jobDescriptionError ? 'error' : ''}`}
                  />
                  
                  {/* Word counter/button inside textarea */}
                  <div className={`textarea-counter-box ${shouldValidateText && wordCount < 50 ? 'insufficient' : wordCount >= 50 ? 'sufficient' : ''}`}>
                    {wordCount >= 50 ? (
                      <button
                        type="button"
                        onClick={validateJobDescription}
                        className="textarea-validate-button"
                        title="Validate job description"
                      >
                        →
                      </button>
                    ) : (
                      <span className="textarea-counter-text">
                        {wordCount} / 50 
                      </span>
                    )}
                  </div>
                  
                  {/* Error message below textarea */}
                  <div className="word-counter-error-container">
                    {shouldValidateText && wordCount < 50 && (
                      <span className="word-count-error">
                        Job description must be at least 50 words
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="file-input-section">
                <div className={`file-upload-area small ${jobFile ? 'has-file' : ''} ${jobFileError ? 'error' : ''}`}>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleJobFileInput}
                    style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: jobFile ? 'default' : 'pointer', pointerEvents: jobFile ? 'none' : 'auto' }}
                    id="job-upload"
                  />
                  <label htmlFor="job-upload" style={{ cursor: jobFile ? 'default' : 'pointer', display: 'block' }}>
                    {jobFile ? (
                      <div className="upload-success">
                        <div className="upload-file-info">
                          <div className="upload-file-icon">
                            <div className="file-icon-uploaded">📄</div>
                          </div>
                          <div className="upload-file-details">
                            <div className="upload-file-name">{jobFile.name}</div>
                            <div className="upload-file-size">{formatFileSize(jobFile.size)}</div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeJobFile();
                            }}
                            className="upload-remove-btn"
                            type="button"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="upload-success-message">
                          <div className="upload-success-icon">✓</div>
                          <p>Job description uploaded successfully!</p>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-content">
                        <div className="upload-icon-wrapper">
                          <div className="upload-icon">📄</div>
                        </div>
                        <div className="upload-text">
                          <h4>Upload Job Description</h4>
                          <p>PDF, DOCX • Max 5MB</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                {jobFileError && (
                  <div className="error-message">{jobFileError}</div>
                )}
              </div>
            )}

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
          </div>
        )}

        {/* Step 3: Analysis & Results */}
        {currentStep === 'analyze' && (
          <div className="step-content">
            {isAnalyzing ? (
              <div className="analysis-loading">
                <div className="loading-header">
                  <h2>Analyzing Your Resume</h2>
                  <p>Please wait while we analyze your resume against the job description</p>
                </div>

                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${analysisProgress}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">{Math.round(analysisProgress)}%</div>
                </div>

                <div className="analysis-stages">
                  {analysisStages.map((stage, index) => (
                    <div 
                      key={stage.id}
                      className={`stage ${index <= currentStageIndex ? 'active' : ''} ${index < currentStageIndex ? 'completed' : ''}`}
                    >
                      <div className="stage-indicator">
                        {index < currentStageIndex ? '✓' : index === currentStageIndex ? '⟳' : '○'}
                      </div>
                      <div className="stage-text">{stage.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : analysisResult ? (
              <div className="analysis-results">
                <div className="results-header">
                  <h2>Analysis Complete!</h2>
                  <p>Here's how your resume performs against the job description</p>
                </div>

                <div className="score-cards">
                  <div className="score-card resume-score">
                    <div className="score-value">{analysisResult.score_out_of_100 || analysisResult.overallScore || (analysisResult as any).score || 0}</div>
                    <div className="score-label">Resume Score</div>
                    <div className="score-description">Overall resume quality</div>
                  </div>
                  <div className="score-card match-score">
                    <div className="score-value">{analysisResult.chance_of_selection_percentage || analysisResult.matchPercentage || 0}%</div>
                    <div className="score-label">Selection Chance</div>
                    <div className="score-description">Probability of selection</div>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="status-indicators">
                  <div className="status-item">
                    <span className="status-icon">✅</span>
                    <span>Resume: {analysisResult.resume_eligibility || 'Eligible'}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">🎯</span>
                    <span>Job Description: {analysisResult.job_description_validity || 'Valid'}</span>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="ai-summary">
                  <h3>🤖 AI Analysis Summary</h3>
                  <p>{analysisResult.short_conclusion || analysisResult.overallRecommendation || 'Analysis completed successfully.'}</p>
                  
                  {analysisResult.overall_fit_summary && (
                    <div className="fit-summary-box">
                      <h4>Overall Fit Assessment</h4>
                      <p>{analysisResult.overall_fit_summary}</p>
                    </div>
                  )}
                </div>

                {/* Candidate Information Section */}
                {analysisResult.resume_analysis_report?.candidate_information && (
                  <div className="candidate-info-section">
                    <h3>👤 Candidate Profile</h3>
                    <div className="candidate-info-grid">
                      <div className="info-item">
                        <span className="info-label">Name:</span>
                        <span className="info-value">{analysisResult.resume_analysis_report.candidate_information.name}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Position Applied:</span>
                        <span className="info-value">{analysisResult.resume_analysis_report.candidate_information.position_applied}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Experience Level:</span>
                        <span className="info-value">{analysisResult.resume_analysis_report.candidate_information.experience_level}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Current Status:</span>
                        <span className="info-value">{analysisResult.resume_analysis_report.candidate_information.current_status}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="results-sections">
                  <div className="strengths-section">
                    <h3>🌟 Key Strengths</h3>
                    
                    {/* Technical Skills */}
                    {analysisResult.resume_analysis_report?.strengths_analysis?.technical_skills?.length > 0 && (
                      <div className="strength-category">
                        <h4>💻 Technical Skills</h4>
                        <ul className="strengths-list">
                          {analysisResult.resume_analysis_report.strengths_analysis.technical_skills.map((skill: string, index: number) => (
                            <li key={`tech-${index}`}>{skill}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Project Portfolio */}
                    {analysisResult.resume_analysis_report?.strengths_analysis?.project_portfolio?.length > 0 && (
                      <div className="strength-category">
                        <h4>📂 Project Portfolio</h4>
                        <ul className="strengths-list">
                          {analysisResult.resume_analysis_report.strengths_analysis.project_portfolio.map((project: string, index: number) => (
                            <li key={`proj-${index}`}>{project}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Educational Background */}
                    {analysisResult.resume_analysis_report?.strengths_analysis?.educational_background?.length > 0 && (
                      <div className="strength-category">
                        <h4>🎓 Educational Background</h4>
                        <ul className="strengths-list">
                          {analysisResult.resume_analysis_report.strengths_analysis.educational_background.map((edu: string, index: number) => (
                            <li key={`edu-${index}`}>{edu}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Fallback for legacy format */}
                    {!analysisResult.resume_analysis_report?.strengths_analysis && (
                      <ul className="strengths-list">
                        {(analysisResult.candidateStrengths || (analysisResult as any).candidateStrengths || (analysisResult as any).strengths || []).slice(0, 5).map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="improvements-section">
                    <h3>💡 Areas for Improvement</h3>
                    
                    {/* Priority Improvements */}
                    {analysisResult.resume_improvement_priority?.length > 0 && (
                      <div className="improvement-category">
                        <h4>🎯 Priority Actions</h4>
                        <ul className="improvements-list">
                          {analysisResult.resume_improvement_priority.map((improvement: string, index: number) => (
                            <li key={`priority-${index}`}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weaknesses Analysis */}
                    {analysisResult.resume_analysis_report?.weaknesses_analysis && (
                      <>
                        {/* Critical Gaps */}
                        {analysisResult.resume_analysis_report.weaknesses_analysis.critical_gaps_against_job_description?.length > 0 && (
                          <div className="improvement-category">
                            <h4>⚠️ Critical Gaps</h4>
                            <ul className="improvements-list critical">
                              {analysisResult.resume_analysis_report.weaknesses_analysis.critical_gaps_against_job_description.slice(0, 3).map((gap: string, index: number) => (
                                <li key={`gap-${index}`}>{gap}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Technical Deficiencies */}
                        {analysisResult.resume_analysis_report.weaknesses_analysis.technical_deficiencies?.length > 0 && (
                          <div className="improvement-category">
                            <h4>🔧 Technical Skills to Add</h4>
                            <ul className="improvements-list">
                              {analysisResult.resume_analysis_report.weaknesses_analysis.technical_deficiencies.slice(0, 3).map((deficiency: string, index: number) => (
                                <li key={`tech-def-${index}`}>{deficiency}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Resume Presentation Issues */}
                        {analysisResult.resume_analysis_report.weaknesses_analysis.resume_presentation_issues?.length > 0 && (
                          <div className="improvement-category">
                            <h4>📝 Resume Format Issues</h4>
                            <ul className="improvements-list">
                              {analysisResult.resume_analysis_report.weaknesses_analysis.resume_presentation_issues.slice(0, 2).map((issue: string, index: number) => (
                                <li key={`pres-${index}`}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}

                    {/* Fallback for legacy format */}
                    {!analysisResult.resume_improvement_priority && !analysisResult.resume_analysis_report?.weaknesses_analysis && (
                      <ul className="improvements-list">
                        {(analysisResult.developmentAreas || (analysisResult as any).suggestions || []).slice(0, 5).map((improvement: string, index: number) => (
                          <li key={index}>{improvement}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Improvement Recommendations */}
                {analysisResult.resume_analysis_report?.improvement_recommendations && (
                  <div className="recommendations-section">
                    <h3>📈 Improvement Roadmap</h3>
                    
                    {/* Immediate Actions */}
                    {analysisResult.resume_analysis_report.improvement_recommendations.immediate_resume_additions?.length > 0 && (
                      <div className="recommendation-category">
                        <h4>⚡ Immediate Resume Updates</h4>
                        <ul className="recommendation-list">
                          {analysisResult.resume_analysis_report.improvement_recommendations.immediate_resume_additions.slice(0, 4).map((action: string, index: number) => (
                            <li key={`imm-${index}`}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Priority Actions */}
                    {analysisResult.resume_analysis_report.improvement_recommendations.immediate_priority_actions?.length > 0 && (
                      <div className="recommendation-category">
                        <h4>🎯 Priority Actions</h4>
                        <ul className="recommendation-list">
                          {analysisResult.resume_analysis_report.improvement_recommendations.immediate_priority_actions.slice(0, 3).map((action: string, index: number) => (
                            <li key={`priority-action-${index}`}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Short Term Goals */}
                    {analysisResult.resume_analysis_report.improvement_recommendations.short_term_development_goals?.length > 0 && (
                      <div className="recommendation-category">
                        <h4>📅 Short-term Goals (1-3 months)</h4>
                        <ul className="recommendation-list">
                          {analysisResult.resume_analysis_report.improvement_recommendations.short_term_development_goals.slice(0, 3).map((goal: string, index: number) => (
                            <li key={`short-${index}`}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Final Assessment */}
                {analysisResult.resume_analysis_report?.final_assessment && (
                  <div className="final-assessment-section">
                    <h3>🎯 Final Assessment</h3>
                    
                    <div className="assessment-status">
                      <span className="status-label">Eligibility Status:</span>
                      <span className={`status-value ${analysisResult.resume_analysis_report.final_assessment.eligibility_status.includes('Qualified') ? 'qualified' : 'needs-work'}`}>
                        {analysisResult.resume_analysis_report.final_assessment.eligibility_status}
                      </span>
                    </div>

                    {analysisResult.resume_analysis_report.final_assessment.hiring_recommendation && (
                      <div className="hiring-recommendation">
                        <h4>💼 Hiring Recommendation</h4>
                        <p>{analysisResult.resume_analysis_report.final_assessment.hiring_recommendation}</p>
                      </div>
                    )}

                    {analysisResult.resume_analysis_report.final_assessment.key_interview_areas?.length > 0 && (
                      <div className="interview-areas">
                        <h4>🎤 Key Interview Focus Areas</h4>
                        <ul className="interview-list">
                          {analysisResult.resume_analysis_report.final_assessment.key_interview_areas.slice(0, 4).map((area: string, index: number) => (
                            <li key={`interview-${index}`}>{area}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysisResult.resume_analysis_report.final_assessment.long_term_potential && (
                      <div className="long-term-potential">
                        <h4>🚀 Long-term Potential</h4>
                        <p>{analysisResult.resume_analysis_report.final_assessment.long_term_potential}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Analysis Details */}
                <div className="analysis-details-grid">
                  {/* Resume Quality Scores */}
                  {(analysisResult as any).resumeQuality && (
                    <div className="quality-scores">
                      <h4>📊 Resume Quality Breakdown</h4>
                      <div className="quality-items">
                        <div className="quality-item">
                          <span className="quality-label">Content:</span>
                          <span className="quality-score">{(analysisResult as any).resumeQuality.content.score}/100</span>
                        </div>
                        <div className="quality-item">
                          <span className="quality-label">Formatting:</span>
                          <span className="quality-score">{(analysisResult as any).resumeQuality.formatting.score}/100</span>
                        </div>
                        <div className="quality-item">
                          <span className="quality-label">Structure:</span>
                          <span className="quality-score">{(analysisResult as any).resumeQuality.structure.score}/100</span>
                        </div>
                      </div>
                    </div>
                  )}

                                        {/* AI Insights */}
                      {(analysisResult as any).aiInsights?.length > 0 && (
                        <div className="ai-insights">
                          <h4>🧠 AI Insights</h4>
                          <ul className="insights-list">
                            {(analysisResult as any).aiInsights.slice(0, 3).map((insight: string, index: number) => (
                              <li key={index}>{insight}</li>
                            ))}
                          </ul>
                          
                          {/* Industry Insights */}
                          {(analysisResult as any).detailedFeedback?.industryInsights?.length > 0 && (
                            <div className="industry-insights">
                              <h5>🏢 Industry Insights</h5>
                              <ul>
                                {(analysisResult as any).detailedFeedback.industryInsights.map((insight: string, index: number) => (
                                  <li key={index}>{insight}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                  {/* Competitive Analysis */}
                  {(analysisResult as any).competitiveAnalysis && (
                    <div className="competitive-analysis">
                      <h4>🏆 Competitive Position</h4>
                      <div className="competitive-items">
                        <div className="competitive-item">
                          <span className="competitive-label">Market Position:</span>
                          <span className="competitive-value">{(analysisResult as any).competitiveAnalysis.marketPosition}</span>
                        </div>
                        <div className="competitive-item">
                          <span className="competitive-label">Positioning Strength:</span>
                          <span className="competitive-value">{(analysisResult as any).competitiveAnalysis.positioningStrength}/100</span>
                        </div>
                      </div>
                                                {(analysisResult as any).competitiveAnalysis.differentiators?.length > 0 && (
                            <div className="differentiators">
                              <strong>Key Differentiators:</strong>
                              <ul>
                                {(analysisResult as any).competitiveAnalysis.differentiators.slice(0, 2).map((diff: string, index: number) => (
                                  <li key={index}>{diff}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Improvement Impact */}
                          {(analysisResult as any).competitiveAnalysis.improvementImpact?.length > 0 && (
                            <div className="improvement-impact">
                              <strong>Improvement Impact:</strong>
                              <ul>
                                {(analysisResult as any).competitiveAnalysis.improvementImpact.map((impact: string, index: number) => (
                                  <li key={index}>{impact}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                    </div>
                  )}
                </div>

                <div className="results-actions">
                  <button className="secondary-button" onClick={handleAnalyzeAnother}>
                    Analyze Another Resume
                  </button>
                  <button className="primary-button" onClick={handleViewDashboard}>
                    View Dashboard
                  </button>
                </div>
              </div>
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
