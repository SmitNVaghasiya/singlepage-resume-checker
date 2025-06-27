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
import JobDescriptionSection from '../components/JobDescriptionSection';
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
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

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
    setAnalysisResult(newResult);
    setIsAnalyzing(false);
  };

  const canAnalyze = () => {
    const hasJobInfo = jobDescription.trim().split(' ').length >= 50 || !!jobFile;
    return hasJobInfo && !!resumeFile;
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

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleStartNew = () => {
    setResumeFile(null);
    setJobDescription('');
    setJobFile(null);
    setAnalysisResult(null);
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

  // Resume Checker Page - Simple & Clean Design
  return (
    <div className="resume-checker-simple">
      <div className="container">
        {/* Progress Steps */}
        <div className="progress-steps-simple">
          <div className={`step-simple ${currentStep === 'upload' || resumeFile ? 'completed' : ''} ${currentStep === 'upload' ? 'active' : ''}`}>
            <div className="step-circle-simple">
              {resumeFile && currentStep !== 'upload' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
            </div>
            <span className="step-label-simple">Upload Resume</span>
          </div>
          
          <div className="step-connector-simple"></div>
          
          <div className={`step-simple ${currentStep === 'job-description' || canAnalyze() ? 'completed' : ''} ${currentStep === 'job-description' ? 'active' : ''}`}>
            <div className="step-circle-simple">
              {canAnalyze() && currentStep !== 'job-description' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>
            <span className="step-label-simple">Job Description</span>
          </div>
          
          <div className="step-connector-simple"></div>
          
          <div className={`step-simple ${currentStep === 'analyze' ? 'active' : ''} ${analysisResult ? 'completed' : ''}`}>
            <div className="step-circle-simple">
              {analysisResult ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <BarChart3 className="h-5 w-5" />
              )}
            </div>
            <span className="step-label-simple">Analyze</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="content-area-simple">
          
          {/* Step 1: Resume Upload */}
          {currentStep === 'upload' && (
            <div className="step-content-simple">
              <div className="step-header-simple">
                <div className="step-icon-simple">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="step-title-simple">Upload Your Resume</h2>
                  <p className="step-subtitle-simple">Upload your resume in PDF or DOCX format</p>
                </div>
              </div>

              <div
                className={`upload-area-simple ${dragActive ? 'drag-active' : ''} ${resumeFile ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileInput}
                  className="file-input-hidden"
                  id="resume-upload"
                />
                
                {resumeFile ? (
                  <div className="file-uploaded">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <div className="file-info">
                      <h4 className="file-name">{resumeFile.name}</h4>
                      <p className="file-size">
                        {(resumeFile.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis
                      </p>
                    </div>
                    <button onClick={removeFile} className="remove-btn">
                      Remove
                    </button>
                  </div>
                ) : (
                  <label htmlFor="resume-upload" className="upload-label">
                    <Upload className="h-16 w-16 text-gray-400" />
                    <h3 className="upload-title">Drop your resume here or click to browse</h3>
                    <p className="upload-subtitle">Paste with Ctrl+V</p>
                    <p className="upload-formats">PDF, DOCX • Max 5MB</p>
                  </label>
                )}
              </div>

              {uploadError && (
                <div className="error-message-simple">
                  <AlertCircle className="h-5 w-5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {resumeFile && (
                <div className="step-actions-simple">
                  <button 
                    onClick={() => setCurrentStep('job-description')} 
                    className="btn-primary-simple"
                  >
                    Continue to Job Description
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Job Description */}
          {currentStep === 'job-description' && (
            <div className="step-content-simple">
              <JobDescriptionSection
                jobDescription={jobDescription}
                setJobDescription={setJobDescription}
                jobFile={jobFile}
                setJobFile={setJobFile}
                jobInputMethod={jobInputMethod}
                setJobInputMethod={setJobInputMethod}
                onBack={() => setCurrentStep('upload')}
                onAnalyze={handleAnalyze}
                canAnalyze={canAnalyze()}
              />
            </div>
          )}

          {/* Step 3: Analysis */}
          {currentStep === 'analyze' && (
            <div className="step-content-simple">
              {isAnalyzing ? (
                <div className="analyzing-content">
                  <h2 className="analyzing-title">Analyzing Your Resume</h2>
                  <p className="analyzing-subtitle">Our AI is carefully examining your resume and matching it against the job requirements</p>
                  <LoadingAnalysis 
                    progress={analysisProgress}
                    stage={analysisStage}
                  />
                </div>
              ) : analysisResult ? (
                <div className="analysis-results">
                  <div className="results-header">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                    <div>
                      <h2 className="results-title">Analysis Complete!</h2>
                      <p className="results-subtitle">Here's your detailed resume analysis</p>
                    </div>
                  </div>

                  <div className="results-grid">
                    <div className="result-card">
                      <div className="result-score">
                        <span className="score-number">{analysisResult.score}</span>
                        <span className="score-label">Resume Score</span>
                      </div>
                    </div>
                    
                    <div className="result-card">
                      <div className="result-score">
                        <span className="score-number">{analysisResult.matchPercentage}%</span>
                        <span className="score-label">Job Match</span>
                      </div>
                    </div>
                  </div>

                  <div className="result-section">
                    <h3 className="section-title">Key Strengths</h3>
                    <ul className="strengths-list">
                      {analysisResult.strengths.map((strength, index) => (
                        <li key={index} className="strength-item">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="result-section">
                    <h3 className="section-title">Improvement Suggestions</h3>
                    <ul className="improvements-list">
                      {analysisResult.improvements.map((improvement, index) => (
                        <li key={index} className="improvement-item">
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="results-actions">
                    <button 
                      onClick={handleStartNew}
                      className="btn-secondary-simple"
                    >
                      Analyze Another Resume
                    </button>
                    <button 
                      onClick={handleGoToDashboard}
                      className="btn-primary-simple"
                    >
                      View Dashboard
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;