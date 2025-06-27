import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';

interface ResumeUploadSectionProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onContinue: () => void;
}

const ResumeUploadSection: React.FC<ResumeUploadSectionProps> = ({
  file,
  onFileChange,
  onContinue
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isValidFile = useCallback((file: File) => {
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
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFile(droppedFile)) {
        onFileChange(droppedFile);
      }
    }
  }, [isValidFile, onFileChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const pastedFile = items[i].getAsFile();
        if (pastedFile && isValidFile(pastedFile)) {
          onFileChange(pastedFile);
        }
      }
    }
  }, [isValidFile, onFileChange]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFile(selectedFile)) {
        onFileChange(selectedFile);
      }
    }
  }, [isValidFile, onFileChange]);

  const removeFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
    setUploadError(null);
  }, [onFileChange]);

  return (
    <div className="upload-section">
      <div className="container">
        <div className="upload-card">
          <div className="upload-header">
            <h2 className="upload-title">Upload Your Resume</h2>
            <p className="upload-subtitle">
              Upload your resume to get started with AI-powered analysis
            </p>
          </div>

          <div
            className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''} ${uploadError ? 'error' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onPaste={handlePaste}
            tabIndex={0}
          >
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileInput}
              className="upload-input-hidden"
              id="resume-upload"
            />
            <label htmlFor="resume-upload" className="upload-label">
              {file ? (
                <div className="upload-success">
                  <div className="upload-file-info">
                    <CheckCircle className="upload-success-icon" />
                    <div className="upload-file-details">
                      <p className="upload-file-name">{file.name}</p>
                      <p className="upload-file-size">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={removeFile}
                      className="upload-remove-btn"
                      type="button"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="upload-success-message">
                    <p>✓ Resume uploaded successfully!</p>
                  </div>
                </div>
              ) : (
                <div className="upload-content">
                  <div className="upload-icon-wrapper">
                    <Upload className="upload-icon" />
                  </div>
                  <div className="upload-text">
                    <p className="upload-main-text">
                      Drop your resume here, paste (Ctrl+V), or click to browse
                    </p>
                    <p className="upload-sub-text">
                      PDF, DOCX • Max 5MB
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>

          {uploadError && (
            <div className="upload-error">
              <p>{uploadError}</p>
            </div>
          )}

          {file && (
            <div className="upload-actions">
              <button onClick={onContinue} className="btn btn-primary btn-lg">
                <span>Continue to Job Description</span>
                <FileText className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeUploadSection; 