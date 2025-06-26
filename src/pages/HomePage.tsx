import React, { useState } from 'react';
import { Upload, FileText, BarChart3, ArrowRight, ArrowLeft, Zap, Target, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import ProgressSteps from '../components/ProgressSteps';
import FileUpload from '../components/FileUpload';
import LoadingAnalysis from '../components/LoadingAnalysis';
// import AnalysisCard from '../components/AnalysisCard';
import { AnalysisResult, StepItem, JobInputMethod } from '../types';

interface HomePageProps {
  onAnalysisComplete: (analysis: AnalysisResult) => void;
  onNavigateToDashboard: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onAnalysisComplete, onNavigateToDashboard }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [jobFile, setJobFile] = useState<File | null>(null);
  const [jobInputMethod, setJobInputMethod] = useState<JobInputMethod>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const steps: StepItem[] = [
    { title: 'Upload Resume', icon: Upload },
    { title: 'Job Description', icon: FileText },
    { title: 'Analysis Results', icon: BarChart3 }
  ];

  const analysisStages = [
    'Parsing resume content...',
    'Extracting key information...',
    'Analyzing job requirements...',
    'Matching skills and experience...',
    'Generating improvement suggestions...',
    'Finalizing analysis report...'
  ];

  const infoFeatures = [
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

  const faqs = [
    {
      question: "What file formats are supported for resume upload?",
      answer: "We support PDF and DOCX formats for resume uploads. Files should be under 10MB in size for optimal processing."
    },
    {
      question: "How accurate is the AI analysis?",
      answer: "Our AI analysis uses advanced natural language processing to provide highly accurate assessments. The system analyzes content, formatting, keywords, and job compatibility with over 85% accuracy."
    },
    {
      question: "Is my resume data secure and private?",
      answer: "Yes, absolutely. We use enterprise-grade encryption to protect your data. Your resume is processed securely and is not stored permanently on our servers after analysis."
    },
    {
      question: "Can I analyze my resume against multiple job descriptions?",
      answer: "Yes! You can upload different job descriptions and get tailored analysis for each position. This helps you customize your resume for specific roles."
    },
    {
      question: "What kind of improvement suggestions will I receive?",
      answer: "You'll get specific, actionable recommendations including keyword optimization, formatting improvements, content enhancement, and ATS compatibility suggestions."
    },
    {
      question: "How long does the analysis take?",
      answer: "The analysis typically takes 30-60 seconds. Our AI processes your resume content, matches it against job requirements, and generates comprehensive feedback quickly."
    }
  ];

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentStep(2);
    
    // Simulate progressive analysis with stages
    for (let i = 0; i < analysisStages.length; i++) {
      setAnalysisStage(analysisStages[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysisProgress(((i + 1) / analysisStages.length) * 100);
    }
    
    // Mock analysis result
    const newResult: AnalysisResult = {
      id: Date.now().toString(),
      score: 78,
      remarks: "Strong technical background with relevant experience. Resume shows good progression in software development roles with specific achievements in React and Node.js projects.",
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
      matchPercentage: 82,
      resumeName: resumeFile?.name || 'Resume',
      jobTitle: 'Software Developer Position',
      analyzedAt: new Date()
    };
    
    setAnalysisResult(newResult);
    onAnalysisComplete(newResult);
    setIsAnalyzing(false);
    
    // Redirect to dashboard after analysis
    setTimeout(() => {
      onNavigateToDashboard();
    }, 2000);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToStep = (step: number) => {
    if (step === 0 || (step === 1 && resumeFile)) {
      setCurrentStep(step);
    }
  };

  const canAnalyze = () => {
    const hasJobInfo = jobDescription.trim().split(' ').length >= 50 || jobFile;
    return hasJobInfo && resumeFile;
  };

  const wordCount = jobDescription.trim().split(' ').filter(word => word.length > 0).length;

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="pt-24">
      {/* Progress Steps - Only show when resume is uploaded */}
      {resumeFile && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ProgressSteps 
            steps={steps}
            currentStep={currentStep}
            resumeFile={resumeFile}
            onGoToStep={goToStep}
            analysisResult={analysisResult}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Step 0: Resume Upload */}
        {currentStep === 0 && (
          <div className="space-y-8">
            <div className={`grid ${!resumeFile ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8 max-w-6xl mx-auto`}>
              {/* Upload Section */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <FileUpload
                  file={resumeFile}
                  onFileChange={setResumeFile}
                  acceptedTypes=".pdf,.docx"
                  title="Upload Your Resume"
                  description="Upload your resume in PDF or DOCX format to get started"
                  dragText="Drop your resume here, paste (Ctrl+V), or click to browse"
                  supportText="Supports PDF and DOCX files up to 10MB"
                />

                {resumeFile && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={nextStep}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300"
                    >
                      <span>Continue</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Info Section - Only show when no resume uploaded */}
              {!resumeFile && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="text-center mb-8">
                    <img 
                      src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                      alt="AI Analysis" 
                      className="w-full h-48 object-cover rounded-lg mb-6"
                    />
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Perfect Your Resume with AI Analysis</h2>
                    <p className="text-gray-600 mb-8">Get instant feedback on how well your resume matches job requirements. Powered by advanced AI to help you land your dream job.</p>
                  </div>

                  <div className="space-y-6">
                    {infoFeatures.map((feature, index) => {
                      const Icon = feature.icon;
                      const colorClasses = getColorClasses(feature.color);
                      
                      return (
                        <div key={index} className="flex items-start space-x-4">
                          <div className={`p-2 ${colorClasses} rounded-lg`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                            <p className="text-gray-600 text-sm">{feature.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* FAQ Section - Only show on initial step when no resume uploaded */}
            {!resumeFile && (
              <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
                  <div className="space-y-4">
                    {faqs.map((faq, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => toggleFaq(index)}
                          className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200"
                        >
                          <h3 className="font-semibold text-gray-900 pr-4">{faq.question}</h3>
                          {expandedFaq === index ? (
                            <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          )}
                        </button>
                        {expandedFaq === index && (
                          <div className="px-6 pb-4">
                            <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Job Description */}
        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Job Description</h2>
                <p className="text-gray-600">Provide the job description to analyze resume compatibility</p>
              </div>

              {/* Input Method Toggle */}
              <div className="flex justify-center mb-6">
                <div className="bg-gray-100 p-1 rounded-lg flex">
                  <button
                    onClick={() => setJobInputMethod('text')}
                    className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                      jobInputMethod === 'text'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Enter Text
                  </button>
                  <button
                    onClick={() => setJobInputMethod('file')}
                    className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Job Description (minimum 50 words)
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here..."
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    <p className={`text-sm mt-1 ${wordCount >= 50 ? 'text-green-600' : 'text-gray-500'}`}>
                      {wordCount} words {wordCount >= 50 ? '✓' : `(${50 - wordCount} more needed)`}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Job Description File
                    </label>
                    <FileUpload
                      file={jobFile}
                      onFileChange={setJobFile}
                      acceptedTypes=".pdf,.docx,.txt"
                      title="Upload Job Description File"
                      description="Upload the job description in PDF, DOCX, or TXT format"
                      dragText="Drop the job description file here, paste (Ctrl+V), or click to browse"
                      supportText="Supports PDF, DOCX, and TXT files up to 5MB"
                    />
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="flex items-center space-x-2 px-6 py-3 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                
                {canAnalyze() && (
                  <button
                    onClick={handleAnalyze}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    <span>Analyze Resume</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Analysis Results */}
        {currentStep === 2 && (
          <div className="max-w-4xl mx-auto space-y-6">
            {isAnalyzing ? (
              <LoadingAnalysis 
                progress={analysisProgress}
                stage={analysisStage}
              />
            ) : analysisResult && (
              <div className="space-y-6">
                {/* Score Overview */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Analysis Complete!</h2>
                    <p className="text-gray-600">Redirecting to dashboard in a moment...</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                      <div className="text-4xl font-bold text-blue-600 mb-2">{analysisResult.score}</div>
                      <div className="text-gray-600 font-medium">Overall Score</div>
                      <div className="text-sm text-gray-500 mt-1">Out of 100</div>
                    </div>
                    
                    <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <div className="text-4xl font-bold text-green-600 mb-2">{analysisResult.matchPercentage}%</div>
                      <div className="text-gray-600 font-medium">Job Match</div>
                      <div className="text-sm text-gray-500 mt-1">Compatibility</div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={onNavigateToDashboard}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300"
                    >
                      View Full Results
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