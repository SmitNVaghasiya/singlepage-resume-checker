import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { validateFile, formatFileSize, getFileTypeIcon } from '../utils/fileValidation';
import { AnalysisResult, JobInputMethod } from '../types';
import InlineProgressSteps from '../components/InlineProgressSteps';

interface AnalysisStage {
  id: number;
  text: string;
  completed: boolean;
}

const ResumeCheckerPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentStep,
    setCurrentStep,
    resumeFile,
    setResumeFile,
    jobDescription,
    setJobDescription,
    jobFile,
    setJobFile,
    addAnalysisToHistory,
    resetAnalysis
  } = useAppContext();

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

    setCurrentStep('analyze');
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentStageIndex(0);

    // Simulate analysis process
    for (let i = 0; i < analysisStages.length; i++) {
      setCurrentStageIndex(i);
      
      // Simulate processing time for each stage
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const progress = ((i + 1) / analysisStages.length) * 100;
      setAnalysisProgress(progress);
    }

    // Generate mock analysis result
    const result: AnalysisResult = {
      id: Date.now().toString(),
      score: Math.floor(Math.random() * 31) + 70, // 70-100
      matchPercentage: Math.floor(Math.random() * 26) + 75, // 75-100
      resumeName: resumeFile?.name || 'Resume',
      jobTitle: 'Software Developer', // Mock job title
      analyzedAt: new Date(),
      remarks: 'Your resume shows strong technical skills and relevant experience.',
      strengths: [
        'Strong technical skills in programming languages',
        'Relevant work experience in software development',
        'Good educational background',
        'Clear and well-structured resume format',
        'Demonstrates problem-solving abilities'
      ],
      improvements: [
        'Add more quantifiable achievements and metrics',
        'Include relevant certifications or training',
        'Expand on leadership and teamwork experiences',
        'Add keywords that match the job description',
        'Consider adding a professional summary section'
      ]
    };

    setAnalysisResult(result);
    addAnalysisToHistory(result);
    setIsAnalyzing(false);
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
                    <div className="score-value">{analysisResult.score}</div>
                    <div className="score-label">Resume Score</div>
                    <div className="score-description">Overall resume quality</div>
                  </div>
                  <div className="score-card match-score">
                    <div className="score-value">{analysisResult.matchPercentage}%</div>
                    <div className="score-label">Job Match</div>
                    <div className="score-description">Compatibility with job requirements</div>
                  </div>
                </div>

                <div className="results-sections">
                  <div className="strengths-section">
                    <h3>🌟 Key Strengths</h3>
                    <ul className="strengths-list">
                      {analysisResult.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="improvements-section">
                    <h3>💡 Improvement Suggestions</h3>
                    <ul className="improvements-list">
                      {analysisResult.improvements.map((improvement, index) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
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
    </div>
  );
};

export default ResumeCheckerPage;
