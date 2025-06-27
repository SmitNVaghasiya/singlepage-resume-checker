import React, { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import '../styles/fileupload.css';

interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  acceptedTypes: string;
  title: string;
  description: string;
  dragText: string;
  supportText: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  file,
  onFileChange,
  acceptedTypes,
  title,
  description,
  dragText,
  supportText
}) => {
  const [dragActive, setDragActive] = useState(false);

  const isValidFile = (file: File) => {
    const validTypes = acceptedTypes.split(',').map(type => type.trim());
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return false;
    }
    
    return validTypes.some(type => {
      if (type === '.pdf') return file.type === 'application/pdf';
      if (type === '.docx') return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (type === '.txt') return file.type === 'text/plain';
      return false;
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFile(droppedFile)) {
        onFileChange(droppedFile);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const pastedFile = items[i].getAsFile();
        if (pastedFile && isValidFile(pastedFile)) {
          onFileChange(pastedFile);
        }
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFile(selectedFile)) {
        onFileChange(selectedFile);
      }
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
  };

  return (
    <div>
      <div className="file-upload-header">
        <h2 className="file-upload-title">{title}</h2>
        <p className="file-upload-description">{description}</p>
      </div>

      <div
        className={`file-drop-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
      >
        <input
          type="file"
          accept={acceptedTypes}
          onChange={handleFileInput}
          className="file-input-hidden"
        />
        
        {file ? (
          <div className="file-info">
            <div className="file-info-row">
              <FileText className="file-icon success" />
              <div className="file-details">
                <p className="file-name">{file.name}</p>
                <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={removeFile}
                className="file-remove-btn"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="file-success-message">
              <p className="file-success-text">✓ File Uploaded Successfully!</p>
            </div>
          </div>
        ) : (
          <div className="file-upload-content">
            <Upload className="file-upload-icon" />
            <div>
              <p className="file-upload-text">{dragText}</p>
              <p className="file-upload-subtext">{supportText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;