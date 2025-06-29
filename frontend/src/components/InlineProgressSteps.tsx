import React from 'react';

interface InlineProgressStepsProps {
  currentStep: 'upload' | 'job-description' | 'analyze';
  resumeFile: File | null;
  jobDescription: string;
  jobFile: File | null;
  analysisResult: any;
  canProceedToAnalysis: boolean;
  onStepChange: (step: 'upload' | 'job-description' | 'analyze') => void;
  onStartAnalysis?: () => void;
}

const InlineProgressSteps: React.FC<InlineProgressStepsProps> = ({
  currentStep,
  resumeFile,
  jobDescription,
  jobFile,
  analysisResult,
  canProceedToAnalysis,
  onStepChange,
  onStartAnalysis
}) => {
  const steps = [
    {
      id: 'upload',
      title: 'Upload Resume',
      icon: '📄',
      completed: !!resumeFile
    },
    {
      id: 'job-description',
      title: 'Job Description',
      icon: '💼',
      completed: (jobDescription.trim().length >= 50 || !!jobFile)
    },
    {
      id: 'analyze',
      title: 'Analysis & Results',
      icon: '📊',
      completed: !!analysisResult
    }
  ];

  const handleStepClick = (stepId: string) => {
    if (stepId === 'upload') {
      onStepChange('upload');
    } else if (stepId === 'job-description' && resumeFile) {
      onStepChange('job-description');
    } else if (stepId === 'analyze' && canProceedToAnalysis) {
      if (currentStep !== 'analyze') {
        onStartAnalysis?.();
      } else {
        onStepChange('analyze');
      }
    }
  };

  const canAccessStep = (stepId: string) => {
    if (stepId === 'upload') return true;
    if (stepId === 'job-description') return !!resumeFile;
    if (stepId === 'analyze') return canProceedToAnalysis;
    return false;
  };

  return (
    <div className="inline-progress-steps">
      <div className="steps-container">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = step.completed;
          const canAccess = canAccessStep(step.id);
          
          return (
            <div key={step.id} className="step-wrapper">
              <button
                className={`step-button ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${!canAccess ? 'disabled' : ''}`}
                onClick={() => handleStepClick(step.id)}
                disabled={!canAccess}
              >
                <div className="step-icon">
                  {isCompleted && !isActive ? '✓' : step.icon}
                </div>
                <div className="step-info">
                  <div className="step-title">{step.title}</div>
                </div>
              </button>
              {index < steps.length - 1 && (
                <div className={`step-connector ${isCompleted ? 'completed' : ''}`}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InlineProgressSteps; 