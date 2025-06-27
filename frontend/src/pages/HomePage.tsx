import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, BarChart3, FileText, Briefcase, Sparkles, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import FileUpload from '../components/FileUpload';
import LoadingAnalysis from '../components/LoadingAnalysis';
import HeroSection from '../components/HeroSection';
import WhyChooseUs from '../components/WhyChooseUs';
import FAQ from '../components/FAQ';
import ResumeUploadSection from '../components/ResumeUploadSection';
import AnalysisUploadSection from '../components/AnalysisUploadSection';
import { AnalysisResult, JobInputMethod } from '../types';

const HomePage: React.FC = () => {
  const {
    currentStep,
    setCurrentStep,
    resumeFile,
    setResumeFile,
    jobDescription,
    setJobDescription,
    jobFile,
    setJobFile,
    addAnalysisToHistory
  } = useAppContext();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [jobInputMethod, setJobInputMethod] = useState<JobInputMethod>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const analysisStages = [
    'Parsing resume content...',
    'Extracting key information...',
    'Analyzing job requirements...',
    'Matching skills and experience...',
    'Generating improvement suggestions...',
    'Finalizing analysis report...'
  ];

  const handleGetStarted = () => {
    navigate('/resumechecker');
  };

  // Effect to handle route changes and set appropriate step
  useEffect(() => {
    if (location.pathname === '/resumechecker') {
      if (!resumeFile) {
        setCurrentStep('upload');
      } else if (!canAnalyze()) {
        setCurrentStep('job-description');
      }
    }
  }, [location.pathname, resumeFile]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentStep('analyze');
    
    // Simulate progressive analysis with stages
    for (let i = 0; i < analysisStages.length; i++) {
      setAnalysisStage(analysisStages[i]);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalysisProgress(((i + 1) / analysisStages.length) * 100);
    }
    
    // Mock analysis result
    const newResult: AnalysisResult = {
      id: Date.now().toString(),
      score: Math.floor(Math.random() * 30) + 70,
      remarks: "Strong technical background with relevant experience. Resume shows good progression in software development roles with specific achievements.",
      improvements: [
        "Add more quantifiable achievements (e.g., 'Improved application performance by 40%')",
        "Include relevant certifications or training courses",
        "Expand on leadership experience and team collaboration",
        "Add keywords from the job description to improve ATS compatibility"
      ],
      strengths: [
        "Excellent technical skills matching job requirements",
        "Clear career progression and growth",
        "Strong educational background",
        "Relevant project experience demonstrated"
      ],
      matchPercentage: Math.floor(Math.random() * 25) + 75,
      resumeName: resumeFile?.name || 'Resume',
      jobTitle: 'Software Developer Position',
      analyzedAt: new Date()
    };
    
    addAnalysisToHistory(newResult);
    setIsAnalyzing(false);
    
    // Redirect to dashboard after analysis
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  const canAnalyze = () => {
    const hasJobInfo = jobDescription.trim().split(' ').length >= 50 || jobFile;
    return hasJobInfo && resumeFile;
  };

  const wordCount = jobDescription.trim().split(' ').filter(word => word.length > 0).length;

  // File upload handlers
  const isValidFile = (file: File) => {
    const validTypes = ['.pdf', '.docx'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (file.size > maxSize) {
      setUploadError('File size must be less than 5MB');
      return false;
    }
    
    const isValidType = validTypes.some(type => {
      if (type === '.pdf') return file.type === 'application/pdf';
      if (type === '.docx') return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      return false;
    });

    if (!isValidType) {
      setUploadError('Please upload a PDF or DOCX file');
      return false;
    }

    setUploadError(null);
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFile(droppedFile)) {
        setResumeFile(droppedFile);
        setCurrentStep('job-description');
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFile(selectedFile)) {
        setResumeFile(selectedFile);
        setCurrentStep('job-description');
      }
    }
  };

  const removeFile = () => {
    setResumeFile(null);
    setUploadError(null);
    setCurrentStep('upload');
  };

  // Show different content based on route
  if (location.pathname === '/') {
    // Landing page with hero section and info
    return (
      <div className="homepage-modern">
        <HeroSection onGetStarted={handleGetStarted} />
        <div id="upload-section">
          <ResumeUploadSection
            file={resumeFile}
            onFileChange={(file) => {
              setResumeFile(file);
              if (file) {
                navigate('/resumechecker');
              }
            }}
            onContinue={() => {
              setCurrentStep('job-description');
              navigate('/resumechecker');
            }}
          />
        </div>
        <WhyChooseUs />
        <FAQ />
      </div>
    );
  }

  // Show analysis flow when file is uploaded
  return (
    <div className="resume-checker-modern">
      {/* Background */}
      <div className="checker-background">
        <div className="checker-gradient-orb checker-orb-1"></div>
        <div className="checker-gradient-orb checker-orb-2"></div>
        <div className="checker-grid-pattern"></div>
      </div>

      {/* Header */}
      <div className="checker-header">
        <div className="container">
          <div className="checker-header-content">
            <div className="checker-header-info">
              <h1 className="checker-title">AI Resume Analysis</h1>
              <p className="checker-subtitle">Get instant feedback and improve your resume with AI-powered insights</p>
            </div>
            <div className="checker-header-stats">
              <div className="header-stat">
                <Sparkles className="header-stat-icon" />
                <span className="header-stat-text">AI Powered</span>
              </div>
              <div className="header-stat">
                <BarChart3 className="header-stat-icon" />
                <span className="header-stat-text">Instant Results</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="progress-section">
        <div className="container">
          <div className="progress-steps-enhanced">
            <div className={`progress-step-enhanced ${currentStep === 'upload' || resumeFile ? 'completed' : ''} ${currentStep === 'upload' ? 'active' : ''}`}>
              <div className="step-indicator">
                <div className="step-number">
                  {resumeFile && currentStep !== 'upload' ? (
                    <CheckCircle className="step-check-icon" />
                  ) : (
                    <span>1</span>
                  )}
                </div>
                <div className="step-pulse"></div>
              </div>
              <div className="step-content">
                <h3 className="step-title">Upload Resume</h3>
                <p className="step-description">Upload your resume file</p>
              </div>
            </div>

            <div className="progress-connector">
              <div className={`connector-line ${resumeFile ? 'completed' : ''}`}></div>
            </div>

            <div className={`progress-step-enhanced ${currentStep === 'job-description' || canAnalyze() ? 'completed' : ''} ${currentStep === 'job-description' ? 'active' : ''}`}>
              <div className="step-indicator">
                <div className="step-number">
                  {canAnalyze() && currentStep !== 'job-description' ? (
                    <CheckCircle className="step-check-icon" />
                  ) : (
                    <span>2</span>
                  )}
                </div>
                <div className="step-pulse"></div>
              </div>
              <div className="step-content">
                <h3 className="step-title">Job Details</h3>
                <p className="step-description">Add job requirements</p>
              </div>
            </div>

            <div className="progress-connector">
              <div className={`connector-line ${canAnalyze() ? 'completed' : ''}`}></div>
            </div>

            <div className={`progress-step-enhanced ${currentStep === 'analyze' ? 'active' : ''}`}>
              <div className="step-indicator">
                <div className="step-number">
                  <span>3</span>
                </div>
                <div className="step-pulse"></div>
              </div>
              <div className="step-content">
                <h3 className="step-title">Analysis</h3>
                <p className="step-description">AI analysis results</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container checker-content">
        {/* Step 1: Resume Upload */}
        {currentStep === 'upload' && (
          <div className="checker-step-card">
            <div className="step-card-header">
              <div className="step-icon-wrapper resume">
                <FileText className="step-icon" />
              </div>
              <div className="step-header-content">
                <h2 className="step-card-title">Upload Your Resume</h2>
                <p className="step-card-subtitle">
                  Upload your resume to begin the AI-powered analysis process
                </p>
              </div>
            </div>

            <div className="step-card-body">
              <div
                className={`modern-upload-zone ${dragActive ? 'drag-active' : ''} ${resumeFile ? 'has-file' : ''} ${uploadError ? 'error' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                tabIndex={0}
              >
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileInput}
                  className="upload-input-hidden"
                  id="modern-resume-upload"
                />
                <label htmlFor="modern-resume-upload" className="upload-zone-label">
                  {resumeFile ? (
                    <div className="upload-success-state">
                      <div className="success-icon-wrapper">
                        <CheckCircle className="success-icon" />
                      </div>
                      <div className="file-info">
                        <h4 className="file-name">{resumeFile.name}</h4>
                        <p className="file-details">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis
                        </p>
                      </div>
                      <button
                        onClick={removeFile}
                        className="remove-file-btn"
                        type="button"
                      >
                        <span>Remove</span>
                      </button>
                    </div>
                  ) : (
                    <div className="upload-empty-state">
                      <div className="upload-icon-wrapper">
                        <Upload className="upload-icon" />
                      </div>
                      <div className="upload-text-content">
                        <h4 className="upload-main-text">
                          Drop your resume here or click to browse
                        </h4>
                        <p className="upload-sub-text">
                          Supports PDF and DOCX files up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              {uploadError && (
                <div className="upload-error-message">
                  <AlertCircle className="error-icon" />
                  <span>{uploadError}</span>
                </div>
              )}

              {resumeFile && (
                <div className="step-actions">
                  <button 
                    onClick={() => setCurrentStep('job-description')} 
                    className="primary-action-btn"
                  >
                    <span>Continue to Job Details</span>
                    <ArrowRight className="btn-icon" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Job Description */}
        {currentStep === 'job-description' && (
          <div className="checker-step-card">
            <div className="step-card-header">
              <div className="step-icon-wrapper job">
                <Briefcase className="step-icon" />
              </div>
              <div className="step-header-content">
                <h2 className="step-card-title">Add Job Requirements</h2>
                <p className="step-card-subtitle">
                  Provide the job description to get personalized analysis and matching insights
                </p>
              </div>
            </div>

            <div className="step-card-body">
              <div className="job-input-methods">
                <div className="input-method-toggle">
                  <button
                    className={`method-btn ${jobInputMethod === 'text' ? 'active' : ''}`}
                    onClick={() => setJobInputMethod('text')}
                  >
                    <FileText className="method-icon" />
                    <span>Paste Job Description</span>
                  </button>
                  <button
                    className={`method-btn ${jobInputMethod === 'file' ? 'active' : ''}`}
                    onClick={() => setJobInputMethod('file')}
                  >
                    <Upload className="method-icon" />
                    <span>Upload Job File</span>
                  </button>
                </div>

                {jobInputMethod === 'text' ? (
                  <div className="text-input-area">
                    <div className="textarea-wrapper">
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the complete job description here, including requirements, responsibilities, and qualifications..."
                        className="job-description-textarea"
                        rows={12}
                      />
                      <div className={`word-counter ${wordCount >= 50 ? 'valid' : 'invalid'}`}>
                        <span className="word-count">{wordCount} words</span>
                        <span className="word-requirement">
                          {wordCount >= 50 ? '✓ Sufficient detail' : 'Need at least 50 words'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="file-upload-area">
                    <div className="job-file-upload">
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setJobFile(e.target.files[0]);
                          }
                        }}
                        className="upload-input-hidden"
                        id="job-file-upload"
                      />
                      <label htmlFor="job-file-upload" className="job-upload-label">
                        {jobFile ? (
                          <div className="job-file-success">
                            <CheckCircle className="file-success-icon" />
                            <div className="job-file-info">
                              <span className="job-file-name">{jobFile.name}</span>
                              <span className="job-file-size">
                                {(jobFile.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                            <button
                              onClick={() => setJobFile(null)}
                              className="remove-job-file-btn"
                              type="button"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="job-upload-empty">
                            <Upload className="job-upload-icon" />
                            <div className="job-upload-text">
                              <h4>Upload Job Description File</h4>
                              <p>PDF, DOCX, or TXT files accepted</p>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="step-actions">
                <button 
                  onClick={() => setCurrentStep('upload')}
                  className="secondary-action-btn"
                >
                  <ArrowLeft className="btn-icon" />
                  <span>Back to Resume</span>
                </button>
                <button 
                  onClick={handleAnalyze}
                  disabled={!canAnalyze()}
                  className="primary-action-btn"
                >
                  <span>Start Analysis</span>
                  <Sparkles className="btn-icon" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Analysis */}
        {currentStep === 'analyze' && (
          <div className="checker-step-card analysis-card">
            {isAnalyzing ? (
              <LoadingAnalysis 
                progress={analysisProgress}
                stage={analysisStage}
              />
            ) : (
              <div className="analysis-complete-state">
                <div className="completion-icon-wrapper">
                  <CheckCircle className="completion-icon" />
                </div>
                <h3 className="completion-title">Analysis Complete!</h3>
                <p className="completion-description">
                  Your resume has been analyzed successfully. Redirecting to results...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;