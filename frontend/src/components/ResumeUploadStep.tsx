import React, { useState, useCallback } from "react";
import { validateFile, formatFileSize } from "../utils/fileValidation";
import InlineProgressSteps from "./InlineProgressSteps";
import { AnalysisResult } from "../types";
import { Eye } from "lucide-react";
import FilePreviewModal from "./FilePreviewModal";
import "../styles/components/ResumeUploadStep.css";

interface ResumeUploadStepProps {
  currentStep: "upload" | "job-description" | "analyze";
  resumeFile: File | null;
  jobDescription: string;
  jobFile: File | null;
  analysisResult: AnalysisResult | null;
  canProceedToAnalysis: boolean;
  onStepChange: (step: "upload" | "job-description" | "analyze") => void;
  onStartAnalysis: () => void;
  setResumeFile: (file: File | null) => void;
}

const ResumeUploadStep: React.FC<ResumeUploadStepProps> = ({
  currentStep,
  resumeFile,
  jobDescription,
  jobFile,
  analysisResult,
  canProceedToAnalysis,
  onStepChange,
  onStartAnalysis,
  setResumeFile,
}) => {
  // Step 1 - Resume Upload State
  const [dragActive, setDragActive] = useState(false);
  const [resumeError, setResumeError] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [hasManuallyNavigatedBack, setHasManuallyNavigatedBack] =
    useState(false);

  // File validation config
  const fileConfig = {
    acceptedTypes: [".pdf", ".docx"],
    maxSize: 5 * 1024 * 1024, // 5MB
  };

  // Track if user manually navigated back to this step
  React.useEffect(() => {
    if (currentStep === "upload" && resumeFile) {
      setHasManuallyNavigatedBack(true);
    }
  }, [currentStep, resumeFile]);

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
      setResumeError(validation.error || "Invalid file");
      return;
    }

    setResumeFile(file);
    setResumeError("");

    // Only auto-advance if user hasn't manually navigated back
    // If user manually went back to upload step, don't auto-advance
    if (!hasManuallyNavigatedBack) {
      setTimeout(() => {
        onStepChange("job-description");
      }, 500);
    }
  };

  const handleResumeFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleResumeFile(files[0]);
    }
  };

  const removeResumeFile = () => {
    setResumeFile(null);
    setResumeError("");
    setHasManuallyNavigatedBack(false); // Reset the flag when file is removed
  };

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Upload Your Resume</h2>
        <p>Upload your resume to get started with AI-powered analysis</p>
      </div>

      <div
        className={`file-upload-area ${dragActive ? "drag-active" : ""} ${
          resumeFile ? "has-file" : ""
        } ${resumeError ? "error" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleResumeFileInput}
          style={{
            position: "absolute",
            opacity: 0,
            width: "100%",
            height: "100%",
            cursor: resumeFile ? "default" : "pointer",
            pointerEvents: resumeFile ? "none" : "auto",
          }}
          id="resume-upload"
        />
        <label
          htmlFor="resume-upload"
          style={{
            cursor: resumeFile ? "default" : "pointer",
            display: "block",
          }}
        >
          {resumeFile ? (
            <div className="upload-success">
              <div className="upload-file-info">
                <div className="upload-file-icon">
                  <div className="file-icon-uploaded">📄</div>
                </div>
                <div className="upload-file-details">
                  <div className="upload-file-name">{resumeFile.name}</div>
                  <div className="upload-file-size">
                    {formatFileSize(resumeFile.size)}
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
                <h3>
                  Drop your resume here, paste (Ctrl+V), or click to browse
                </h3>
                <p>PDF, DOCX • Max 5MB</p>
              </div>
            </div>
          )}
        </label>
      </div>

      {resumeError && <div className="error-message">{resumeError}</div>}

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={resumeFile}
        title="Resume Preview"
      />

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

export default ResumeUploadStep;
