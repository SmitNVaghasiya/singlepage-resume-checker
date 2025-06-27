import React, { useState } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle, Briefcase, X } from 'lucide-react';

export type JobInputMethod = 'text' | 'file';

interface JobDescriptionSectionProps {
  jobDescription: string;
  setJobDescription: (description: string) => void;
  jobFile: File | null;
  setJobFile: (file: File | null) => void;
  jobInputMethod: JobInputMethod;
  setJobInputMethod: (method: JobInputMethod) => void;
  onBack: () => void;
  onAnalyze: () => void;
  canAnalyze: boolean;
}

const JobDescriptionSection: React.FC<JobDescriptionSectionProps> = ({
  jobDescription,
  setJobDescription,
  jobFile,
  setJobFile,
  jobInputMethod,
  setJobInputMethod,
  onBack,
  onAnalyze,
  canAnalyze
}) => {
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const wordCount = jobDescription.trim().split(/\s+/).filter(word => word.length > 0).length;
  const minWords = 50;
  const isTextValid = wordCount >= minWords;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a PDF, DOCX, or TXT file');
      return;
    }

    if (file.size > maxSize) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploadError(null);
    setJobFile(file);
  };

  const removeFile = () => {
    setJobFile(null);
    setUploadError(null);
  };

  return (
    <div className="job-description-section">
      {/* Header */}
      <div className="job-section-header">
        <div className="job-header-icon">
          <Briefcase className="h-6 w-6" />
        </div>
        <div className="job-header-content">
          <h2 className="job-section-title">Job Description</h2>
          <p className="job-section-subtitle">
            Provide the job description to analyze your resume against
          </p>
        </div>
      </div>

      {/* Input Method Toggle */}
      <div className="job-input-toggle">
        <button
          className={`job-toggle-btn ${jobInputMethod === 'text' ? 'active' : ''}`}
          onClick={() => setJobInputMethod('text')}
        >
          <FileText className="h-4 w-4" />
          <span>Type Text</span>
        </button>
        <button
          className={`job-toggle-btn ${jobInputMethod === 'file' ? 'active' : ''}`}
          onClick={() => setJobInputMethod('file')}
        >
          <Upload className="h-4 w-4" />
          <span>Upload File</span>
        </button>
      </div>

      {/* Input Content */}
      <div className="job-input-content">
        {jobInputMethod === 'text' ? (
          <div className="job-text-input">
            <div className="job-textarea-container">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here. Include responsibilities, requirements, skills, and qualifications. (Ctrl+V supported)"
                className="job-textarea"
                rows={12}
              />
              <div className={`job-word-counter ${isTextValid ? 'valid' : 'invalid'}`}>
                <div className="word-info">
                  <span className="word-count">{wordCount} characters (minimum 50 required)</span>
                  {isTextValid ? (
                    <div className="validation-status valid">
                      <CheckCircle className="h-4 w-4" />
                      <span>Sufficient detail</span>
                    </div>
                  ) : (
                    <div className="validation-status invalid">
                      <AlertCircle className="h-4 w-4" />
                      <span>Need at least {minWords - wordCount} more characters</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="job-file-input">
            <div className="job-file-upload-area">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="job-file-input-hidden"
                id="job-file-upload"
              />
              
              {jobFile ? (
                <div className="job-file-selected">
                  <div className="job-file-info">
                    <div className="job-file-icon">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div className="job-file-details">
                      <h4 className="job-file-name">{jobFile.name}</h4>
                      <p className="job-file-size">
                        {(jobFile.size / 1024).toFixed(1)} KB • {jobFile.type.split('/')[1].toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="job-file-remove"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label htmlFor="job-file-upload" className="job-file-upload-label">
                  <div className="job-file-upload-content">
                    <div className="job-upload-icon">
                      <Upload className="h-12 w-12" />
                    </div>
                    <div className="job-upload-text">
                      <h3>Drop your job description here or click to browse</h3>
                      <p>PDF, DOCX, or TXT files • Max 5MB</p>
                    </div>
                  </div>
                </label>
              )}
            </div>
            
            {uploadError && (
              <div className="job-upload-error">
                <AlertCircle className="h-4 w-4" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="job-section-actions">
        <button
          onClick={onBack}
          className="job-back-btn"
        >
          <span>Back to Resume</span>
        </button>
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className={`job-analyze-btn ${canAnalyze ? 'enabled' : 'disabled'}`}
        >
          <span>Start Analysis</span>
          <div className="btn-sparkle">✨</div>
        </button>
      </div>
    </div>
  );
};

export default JobDescriptionSection; 