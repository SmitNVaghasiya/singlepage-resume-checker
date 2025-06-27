import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, BarChart3, ArrowRight, ArrowLeft, Zap, Target, Lightbulb, CheckCircle, Play } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import FileUpload from '../components/FileUpload';
import LoadingAnalysis from '../components/LoadingAnalysis';
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
  const [jobInputMethod, setJobInputMethod] = useState<JobInputMethod>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');

  const steps = [
    { id: 'upload', title: 'Upload Resume', icon: Upload },
    { id: 'job-description', title: 'Job Description', icon: FileText },
    { id: 'analyze', title: 'Analyze', icon: BarChart3 }
  ];

  const analysisStages = [
    'Parsing resume content...',
    'Extracting key information...',
    'Analyzing job requirements...',
    'Matching skills and experience...',
    'Generating improvement suggestions...',
    'Finalizing analysis report...'
  ];

  const features = [
    {
      icon: Zap,
      title: 'Instant Analysis',
      description: 'Get comprehensive resume analysis in seconds',
      color: 'blue'
    },
    {
      icon: Target,
      title: 'Job Matching',
      description: 'See how well your resume matches specific job requirements',
      color: 'green'
    },
    {
      icon: Lightbulb,
      title: 'Improvement Tips',
      description: 'Get actionable suggestions to improve your resume',
      color: 'purple'
    }
  ];

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
      score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
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
      matchPercentage: Math.floor(Math.random() * 25) + 75, // Random match between 75-100%
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

  const getStepNumber = (stepId: string) => {
    return steps.findIndex(step => step.id === stepId) + 1;
  };

  return (
    <div className="page-container">
      {/* Hero Section - Only show when no resume uploaded */}
      {!resumeFile && currentStep === 'upload' && (
        <div className="hero-section">
          <div className="hero-content container">
            <h1 className="hero-title">Perfect Your Resume with AI</h1>
            <p className="hero-subtitle">
              Get instant, professional feedback on your resume. Our advanced AI analyzes your experience 
              against job requirements and provides actionable insights to help you land your dream job.
            </p>
            
            <div className="hero-features">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="hero-feature">
                    <div className="hero-feature-icon-wrapper">
                      <Icon className="hero-feature-icon" />
                    </div>
                    <h3 className="hero-feature-title">{feature.title}</h3>
                    <p className="hero-feature-description">{feature.description}</p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="hero-cta"
            >
              <Play className="h-5 w-5" />
              Start Analysis
            </button>
          </div>
        </div>
      )}

      {/* Progress Steps - Show when resume is uploaded */}
      {resumeFile && (
        <div className="container py-8">
          <div className="progress-steps-container">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = (step.id === 'upload' && resumeFile) || 
                                (step.id === 'job-description' && resumeFile && canAnalyze()) ||
                                (step.id === 'analyze' && isAnalyzing);
              const canAccess = step.id === 'upload' || 
                              (step.id === 'job-description' && resumeFile) ||
                              (step.id === 'analyze' && canAnalyze());
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => canAccess && setCurrentStep(step.id as any)}
                      disabled={!canAccess}
                      className={`
                        step-circle relative
                        ${isActive ? 'active' : isCompleted ? 'completed' : 'pending'}
                        ${canAccess ? 'cursor-pointer' : 'cursor-not-allowed'}
                      `}
                    >
                      {isCompleted && !isActive ? (
                        <CheckCircle className="h-8 w-8" />
                      ) : (
                        <Icon className="h-8 w-8" />
                      )}
                      <span className="absolute -top-2 -right-2 bg-white text-gray-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-current">
                        {getStepNumber(step.id)}
                      </span>
                    </button>
                    <span className={`mt-3 text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      step-line w-16 mx-4
                      ${isCompleted && index < steps.findIndex(s => s.id === currentStep) ? 'completed' : ''}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container pb-16" id="upload-section">
        {/* Step 1: Resume Upload */}
        {currentStep === 'upload' && (
          <div className="max-w-4xl mx-auto">
            <div className="card">
              <div className="card-header text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Resume</h2>
                <p className="text-gray-600">Upload your resume to get started with AI-powered analysis</p>
              </div>
              <div className="card-body">
                <FileUpload
                  file={resumeFile}
                  onFileChange={setResumeFile}
                  acceptedTypes=".pdf,.docx"
                  title=""
                  description="Drop your resume here or click to browse • PDF, DOCX • Max 5MB"
                  dragText="Drop your resume here, paste (Ctrl+V), or click to browse"
                  supportText="PDF, DOCX • Max 5MB"
                />

                {resumeFile && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setCurrentStep('job-description')}
                      className="btn btn-primary btn-lg"
                    >
                      <span>Continue to Job Description</span>
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Job Description */}
        {currentStep === 'job-description' && (
          <div className="max-w-4xl mx-auto">
            <div className="card">
              <div className="card-header text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Job Description</h2>
                <p className="text-gray-600">Provide the job description to analyze resume compatibility</p>
              </div>
              <div className="card-body">
                {/* Input Method Toggle */}
                <div className="flex justify-center mb-8">
                  <div className="bg-gray-100 p-1 rounded-lg flex">
                    <button
                      onClick={() => setJobInputMethod('text')}
                      className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                        jobInputMethod === 'text'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Enter Text
                    </button>
                    <button
                      onClick={() => setJobInputMethod('file')}
                      className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                        jobInputMethod === 'file'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Upload File
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {jobInputMethod === 'text' ? (
                    <div className="input-group">
                      <label className="input-label">
                        Enter Job Description (minimum 50 words)
                      </label>
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here..."
                        rows={12}
                        className="input-field resize-none"
                      />
                      <p className={`text-sm ${wordCount >= 50 ? 'text-green-600' : 'text-gray-500'}`}>
                        {wordCount} words {wordCount >= 50 ? '✓' : `(${50 - wordCount} more needed)`}
                      </p>
                    </div>
                  ) : (
                    <FileUpload
                      file={jobFile}
                      onFileChange={setJobFile}
                      acceptedTypes=".pdf,.docx,.txt"
                      title=""
                      description="Drop job description file here or click to browse • PDF, DOCX, TXT • Max 5MB"
                      dragText="Drop job description here or paste (Ctrl+V)"
                      supportText="PDF, DOCX, TXT • Max 5MB"
                    />
                  )}
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setCurrentStep('upload')}
                    className="btn btn-ghost"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                  
                  {canAnalyze() && (
                    <button
                      onClick={handleAnalyze}
                      className="btn btn-primary btn-lg"
                    >
                      <span>Analyze Resume</span>
                      <BarChart3 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Analysis */}
        {currentStep === 'analyze' && (
          <div className="max-w-4xl mx-auto">
            {isAnalyzing ? (
              <LoadingAnalysis 
                progress={analysisProgress}
                stage={analysisStage}
              />
            ) : (
              <div className="card text-center">
                <div className="card-body">
                  <div className="mb-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Analysis Complete!</h2>
                    <p className="text-gray-600 mb-8">Your resume has been analyzed successfully. Redirecting to dashboard...</p>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="btn btn-primary btn-lg"
                    >
                      View Results
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStep('upload');
                        setResumeFile(null);
                        setJobDescription('');
                        setJobFile(null);
                      }}
                      className="btn btn-secondary btn-lg"
                    >
                      Analyze Another Resume
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;