import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';

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

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${file ? 'border-green-500 bg-green-50' : ''}
        `}
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
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {file ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-lg font-medium text-green-700">{file.name}</p>
                <p className="text-sm text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <div className="bg-green-100 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">✓ File Uploaded Successfully!</p>
              <p className="text-green-600 text-sm mt-1">Ready to proceed</p>
            </div>
            <button
              onClick={() => onFileChange(null)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Upload Different File
            </button>
          </div>
        ) : (
          <div>
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">{dragText}</p>
            <p className="text-sm text-gray-500">{supportText}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;