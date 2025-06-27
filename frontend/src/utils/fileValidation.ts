export interface FileValidationConfig {
  acceptedTypes: string[];
  maxSize: number; // in bytes
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFile = (file: File, config: FileValidationConfig): FileValidationResult => {
  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`
    };
  }
  
  // Check file type
  const isValidType = config.acceptedTypes.some(type => {
    if (type === '.pdf') return file.type === 'application/pdf';
    if (type === '.docx') return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (type === '.txt') return file.type === 'text/plain';
    return file.name.toLowerCase().endsWith(type);
  });

  if (!isValidType) {
    return {
      isValid: false,
      error: `Please upload a ${config.acceptedTypes.join(', ')} file`
    };
  }

  return { isValid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileTypeIcon = (file: File): string => {
  if (file.type === 'application/pdf') return '📄';
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '📝';
  if (file.type === 'text/plain') return '📃';
  return '📄';
}; 