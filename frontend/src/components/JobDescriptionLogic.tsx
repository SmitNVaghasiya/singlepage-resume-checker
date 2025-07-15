import { useState, useEffect } from 'react';
import { JobInputMethod } from '../types';
import { validateFile } from '../utils/fileValidation';

interface JobDescriptionLogicProps {
  jobDescription: string;
  setJobDescription: (description: string) => void;
  jobFile: File | null;
  setJobFile: (file: File | null) => void;
  resumeFile: File | null;
  canProceedToAnalysis: () => boolean;
  onStartAnalysis: () => void;
}

export const useJobDescriptionLogic = (props: JobDescriptionLogicProps) => {
  const {
    jobDescription,
    setJobDescription,
    jobFile,
    setJobFile,
    resumeFile,
    canProceedToAnalysis,
    onStartAnalysis
  } = props;

  // Step 2 - Job Description State
  const [jobInputMethod, setJobInputMethod] = useState<JobInputMethod>('text');
  const [jobDescriptionError, setJobDescriptionError] = useState<string>('');
  const [jobFileError, setJobFileError] = useState<string>('');
  const [wordCount, setWordCount] = useState(0);
  const [shouldValidateText, setShouldValidateText] = useState(false);

  // File validation config
  const fileConfig = {
    acceptedTypes: ['.pdf', '.docx', '.txt'],
    maxSize: 5 * 1024 * 1024 // 5MB
  };

  // Word count calculation
  useEffect(() => {
    const words = jobDescription.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    
    // Only validate when explicitly requested
    if (shouldValidateText) {
      if (jobDescription.trim() && words.length < 50) {
        setJobDescriptionError('Job description must be at least 50 words');
      } else {
        setJobDescriptionError('');
      }
    }
  }, [jobDescription, shouldValidateText]);

  // Validate text function
  const validateJobDescription = () => {
    setShouldValidateText(true);
    const words = jobDescription.trim().split(/\s+/).filter(word => word.length > 0);
    
    if (jobDescription.trim() && words.length < 50) {
      setJobDescriptionError('Job description must be at least 50 words');
      return false;
    } else {
      setJobDescriptionError('');
      // If validation passes and we have everything needed, proceed to analysis
      if (canProceedToAnalysis()) {
        onStartAnalysis();
      }
      return true;
    }
  };

  // Handle textarea key events
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      validateJobDescription();
    }
  };

  // Step 2: Job Description Handlers
  const handleJobFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validation = validateFile(file, fileConfig);
      
      if (!validation.isValid) {
        setJobFileError(validation.error || 'Invalid file');
        return;
      }

      setJobFile(file);
      setJobFileError('');
      setJobDescription(''); // Clear text input when file is selected
      setJobInputMethod('file'); // Ensure jobInputMethod is set to 'file' when file is uploaded
    }
  };

  const removeJobFile = () => {
    setJobFile(null);
    setJobFileError('');
  };

  const resetJobDescriptionLogic = () => {
    setJobInputMethod('text');
    setWordCount(0);
    setJobDescriptionError('');
    setJobFileError('');
    setShouldValidateText(false);
  };

  return {
    // State
    jobInputMethod,
    setJobInputMethod,
    jobDescriptionError,
    setJobDescriptionError,
    jobFileError,
    setJobFileError,
    wordCount,
    setWordCount,
    shouldValidateText,
    setShouldValidateText,
    
    // Functions
    validateJobDescription,
    handleTextareaKeyDown,
    handleJobFileInput,
    removeJobFile,
    resetJobDescriptionLogic,
    
    // Config
    fileConfig
  };
}; 