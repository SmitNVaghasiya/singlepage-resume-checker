import React, { useState } from "react";
import { formatFileSize } from "../../utils/fileValidation";
import { InlineProgressSteps } from "../ui";
import { AnalysisResult, JobInputMethod } from "../../types";
import { useJobDescriptionLogic } from "./JobDescriptionLogic";
import { Eye } from "lucide-react";
import { FilePreviewModal } from "../file-upload";
import "./JobDescriptionStep.css";

interface JobDescriptionStepProps {
  currentStep: "upload" | "job-description" | "analyze";
  jobInputMethod: JobInputMethod;
  setJobInputMethod: (method: JobInputMethod) => void;
  jobDescription: string;
  setJobDescription: (desc: string) => void;
  jobFile: File | null;
  setJobFile: (file: File | null) => void;
  resumeFile: File | null;
  analysisResult: AnalysisResult | null;
  canProceedToAnalysis: boolean;
  onStepChange: (step: "upload" | "job-description" | "analyze") => void;
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
  onStartAnalysis,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const {
    jobDescriptionError,
    setJobDescriptionError,
    jobFileError,
    setJobFileError,
    wordCount,
    setWordCount,
    shouldValidateText,
    setShouldValidateText,
    validateJobDescription,
    handleTextareaKeyDown,
    handleJobFileInput,
    removeJobFile,
    fileConfig,
  } = useJobDescriptionLogic({
    jobDescription,
    setJobDescription,
    jobFile,
    setJobFile,
    resumeFile,
    canProceedToAnalysis: () => canProceedToAnalysis,
    onStartAnalysis,
  });

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Add Job Description</h2>
        <p>
          Provide the job description to analyze how well your resume matches
        </p>
      </div>
      <div className="job-input-methods">
        <button
          className={`method-button ${
            jobInputMethod === "text" ? "active" : ""
          }`}
          onClick={() => setJobInputMethod("text")}
        >
          📝 Paste Text
        </button>
        <button
          className={`method-button ${
            jobInputMethod === "file" ? "active" : ""
          }`}
          onClick={() => setJobInputMethod("file")}
        >
          📄 Upload File
        </button>
      </div>
      {jobInputMethod === "text" ? (
        <div className="text-input-section">
          <div className="textarea-container">
            <textarea
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                if (shouldValidateText) {
                  setShouldValidateText(false);
                  setJobDescriptionError("");
                }
              }}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Paste the job description here... (Press Enter to validate, Shift+Enter for new line)"
              className={`job-description-textarea ${
                jobDescriptionError ? "error" : ""
              }`}
            />
            <div
              className={`textarea-counter-box ${
                shouldValidateText && wordCount < 50
                  ? "insufficient"
                  : wordCount >= 50
                  ? "sufficient"
                  : ""
              }`}
            >
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
                <span className="textarea-counter-text">{wordCount} / 50</span>
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
          <div
            className={`file-upload-area small ${jobFile ? "has-file" : ""} ${
              jobFileError ? "error" : ""
            }`}
          >
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleJobFileInput}
              style={{
                position: "absolute",
                opacity: 0,
                width: "100%",
                height: "100%",
                cursor: jobFile ? "default" : "pointer",
                pointerEvents: jobFile ? "none" : "auto",
              }}
              id="job-upload"
            />
            <label
              htmlFor="job-upload"
              style={{
                cursor: jobFile ? "default" : "pointer",
                display: "block",
              }}
            >
              {jobFile ? (
                <div className="upload-success">
                  <div className="upload-file-info">
                    <div className="upload-file-icon">
                      <div className="file-icon-uploaded">📄</div>
                    </div>
                    <div className="upload-file-details">
                      <div className="upload-file-name">{jobFile.name}</div>
                      <div className="upload-file-size">
                        {formatFileSize(jobFile.size)}
                      </div>
                    </div>
                    <button
                      className="upload-view-btn"
                      type="button"
                      title="View file"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsPreviewOpen(true);
                      }}
                    >
                      <Eye className="w-5 h-5" />
                    </button>
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
                    <p>PDF, DOCX, TXT • Max 5MB</p>
                  </div>
                </div>
              )}
            </label>
          </div>
          {jobFileError && <div className="error-message">{jobFileError}</div>}
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

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={jobFile}
        title="Job Description Preview"
      />
    </div>
  );
};

export default JobDescriptionStep;
