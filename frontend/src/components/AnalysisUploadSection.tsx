import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, ArrowRight } from 'lucide-react';

interface AnalysisUploadSectionProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onContinue: () => void;
}

const AnalysisUploadSection: React.FC<AnalysisUploadSectionProps> = ({
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
    <div className="analysis-upload-section">
      <div
        className={`analysis-upload-dropzone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''} ${uploadError ? 'error' : ''}`}
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
          className="analysis-upload-input"
          id="analysis-resume-upload"
        />
        <label htmlFor="analysis-resume-upload" className="analysis-upload-label">
          {file ? (
            <div className="analysis-upload-success">
              <div className="analysis-file-info">
                <div className="analysis-file-icon-wrapper">
                  <CheckCircle className="analysis-file-icon success" />
                </div>
                <div className="analysis-file-details">
                  <p className="analysis-file-name">{file.name}</p>
                  <p className="analysis-file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis
                  </p>
                </div>
                <button
                  onClick={removeFile}
                  className="analysis-remove-btn"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="analysis-upload-content">
              <div className="analysis-upload-icon-wrapper">
                <Upload className="analysis-upload-icon" />
              </div>
              <div className="analysis-upload-text">
                <p className="analysis-upload-main-text">
                  Drop your resume here or click to browse
                </p>
                <p className="analysis-upload-sub-text">
                  PDF, DOCX • Max 5MB
                </p>
              </div>
            </div>
          )}
        </label>
      </div>

      {uploadError && (
        <div className="analysis-upload-error">
          <p>{uploadError}</p>
        </div>
      )}

      {file && (
        <div className="analysis-upload-actions">
          <button onClick={onContinue} className="btn btn-primary btn-lg analysis-continue-btn">
            <span>Continue to Job Description</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalysisUploadSection; 