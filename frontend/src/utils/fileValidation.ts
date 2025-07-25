export interface FileValidationConfig {
  acceptedTypes: string[];
  maxSize: number; // in bytes
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// Resume-specific validation (PDF/DOCX only)
export const validateResumeFile = (file: File): FileValidationResult => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than 5MB`
    };
  }
  
  const isValidType = file.type === 'application/pdf' || 
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (!isValidType) {
    return {
      isValid: false,
      error: `Please upload a PDF or DOCX file for resume`
    };
  }

  return { isValid: true };
};

// Job description-specific validation (PDF/DOCX/TXT)
export const validateJobDescriptionFile = (file: File): FileValidationResult => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than 5MB`
    };
  }
  
  const isValidType = file.type === 'application/pdf' || 
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'text/plain';

  if (!isValidType) {
    return {
      isValid: false,
      error: `Please upload a PDF, DOCX, or TXT file for job description`
    };
  }

  return { isValid: true };
};

// Legacy function for backward compatibility (deprecated - use specific functions above)
export const validateFile = (
  file: File,
  config: FileValidationConfig,
  allowTxt: boolean = false // new parameter
): FileValidationResult => {
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
    if (type === '.docx')
      return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (type === '.txt' && allowTxt) return file.type === 'text/plain';
    return file.name.toLowerCase().endsWith(type);
  });
  if (!isValidType) {
    return {
      isValid: false,
      error: `Please upload a ${config.acceptedTypes.filter(t => allowTxt || t !== '.txt').join(', ')} file`
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

// Utility to convert File to base64 data URL
export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Utility to convert base64 data URL back to File object
export const base64ToFile = (base64Data: string, filename: string, mimeType: string): File => {
  try {
    const arr = base64Data.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || mimeType;
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (error) {
    console.error('Error converting base64 to file:', error);
    // Return a placeholder file if conversion fails
    return new File([''], filename, { type: mimeType });
  }
};

// Utility to save file data for authentication flow
export const saveFileForAuth = async (file: File): Promise<{
  name: string;
  size: number;
  type: string;
  data: string;
}> => {
  const base64 = await readFileAsDataURL(file);
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    data: base64
  };
};

// Utility to restore file from saved data
export const restoreFileFromAuth = (fileData: {
  name: string;
  size: number;
  type: string;
  data: string;
}): File => {
  return base64ToFile(fileData.data, fileData.name, fileData.type);
}; 