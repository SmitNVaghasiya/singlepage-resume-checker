import React, { useState, useEffect } from 'react';
import { validateFile, formatFileSize } from '../utils/fileValidation';
import InlineProgressSteps from './InlineProgressSteps';
import { AnalysisResult, JobInputMethod } from '../types';
import '../styles/components/JobDescriptionStep.css';

interface JobDescriptionStepProps {
  currentStep: 'upload' | 'job-description' | 'analyze';
  jobInputMethod: JobInputMethod;
  setJobInputMethod: (method: JobInputMethod) => void;
  jobDescription: string;
  setJobDescription: (desc: string) => void;
  jobFile: File | null;
  setJobFile: (file: File | null) => void;
  resumeFile: File | null;
  analysisResult: AnalysisResult | null;
  canProceedToAnalysis: boolean;
  onStepChange: (step: 'upload' | 'job-description' | 'analyze') => void;
  onStartAnalysis: () => void;
}

const JobDescriptionStep: React.FC<JobDescriptionStepProps> = ({
  currentStep,
  jobInputMethod,
  setJobInputMethod,
  jobDescription,
  setJobDescription,
  jobFile,
  setJobFile,
  resumeFile,
  analysisResult,
  canProceedToAnalysis,
  onStepChange,
  onStartAnalysis
}) => {
  const [jobDescriptionError, setJobDescriptionError] = useState('');
  const [jobFileError, setJobFileError] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [shouldValidateText, setShouldValidateText] = useState(false);

  // File validation config
  const fileConfig = {
    acceptedTypes: ['.pdf', '.docx'],
    maxSize: 5 * 1024 * 1024 // 5MB
  };

  useEffect(() => {
    const words = jobDescription.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    if (shouldValidateText) {
      if (jobDescription.trim() && words.length < 50) {
        setJobDescriptionError('Job description must be at least 50 words');
      } else {
        setJobDescriptionError('');
      }
    }
  }, [jobDescription, shouldValidateText]);

  const validateJobDescription = () => {
    setShouldValidateText(true);
    const words = jobDescription.trim().split(/\s+/).filter(word => word.length > 0);
    if (jobDescription.trim() && words.length < 50) {
      setJobDescriptionError('Job description must be at least 50 words');
      return false;
    } else {
      setJobDescriptionError('');
      if (canProceedToAnalysis) {
        onStartAnalysis();
      }
      return true;
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      validateJobDescription();
    }
  };

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
      setJobDescription('');
    }
  };

  const removeJobFile = () => {
    setJobFile(null);
    setJobFileError('');
  };

  return (
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
                if (shouldValidateText) {
                  setShouldValidateText(false);
                  setJobDescriptionError('');
                }
              }}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Paste the job description here... (Press Enter to validate, Shift+Enter for new line)"
              className={`job-description-textarea ${jobDescriptionError ? 'error' : ''}`}
            />
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
        canProceedToAnalysis={canProceedToAnalysis}
        onStepChange={onStepChange}
        onStartAnalysis={onStartAnalysis}
      />
    </div>
  );
};

export default JobDescriptionStep; 