import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, Eye } from 'lucide-react';
import PasteTip from './PasteTip';
import FilePreviewModal from './FilePreviewModal';

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidFile = useCallback((file: File) => {
    const validTypes = ['.pdf', '.docx', '.txt'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    console.log('Validating file:', file.name, file.type, file.size);
    
    if (file.size > maxSize) {
      setUploadError('File size must be less than 5MB');
      return false;
    }
    
    const isValidType = validTypes.some(type => {
      if (type === '.pdf') return file.type === 'application/pdf';
      if (type === '.docx') return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (type === '.txt') return file.type === 'text/plain';
      return false;
    });

    if (!isValidType) {
      setUploadError('Please upload a PDF, DOCX, or TXT file');
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
    console.log('ResumeUploadSection: Paste event triggered');
    const items = e.clipboardData.items;
    console.log('Clipboard items count:', items.length);
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log('Clipboard item:', item.kind, item.type);
      
      if (item.kind === 'file') {
        const pastedFile = item.getAsFile();
        console.log('Pasted file:', pastedFile?.name, pastedFile?.type, pastedFile?.size);
        
        if (pastedFile && isValidFile(pastedFile)) {
          console.log('File is valid, calling onFileChange');
          onFileChange(pastedFile);
        } else {
          console.log('File is invalid or null');
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
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [isValidFile, onFileChange]);

  const removeFile = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFileChange(null);
    setUploadError(null);
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileChange]);

  const handleUploadClick = useCallback((e: React.MouseEvent) => {
    // Only trigger file input if no file is uploaded
    if (file) {
      e.preventDefault();
      return;
    }
  }, [file]);

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
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileInput}
              className="upload-input-hidden"
              id="resume-upload"
            />
            <label 
              htmlFor="resume-upload" 
              className="upload-label"
              onClick={handleUploadClick}
            >
              {file ? (
                <div className="upload-success">
                  <div className="upload-file-info">
                    <div className="upload-file-icon">
                      <FileText className="file-icon-uploaded" />
                    </div>
                    <div className="upload-file-details">
                      <p className="upload-file-name">{file.name}</p>
                      <p className="upload-file-size">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
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
                      onClick={removeFile}
                      className="upload-remove-btn"
                      type="button"
                      title="Remove file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="upload-success-message">
                    <CheckCircle className="upload-success-icon" />
                    <p>Resume uploaded successfully!</p>
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
                      PDF, DOCX, TXT • Max 5MB
                    </p>
                    <PasteTip />
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

          {/* File Preview Modal */}
          <FilePreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            file={file}
            title="Resume Preview"
          />
        </div>
      </div>
    </div>
  );
};

export default ResumeUploadSection; 