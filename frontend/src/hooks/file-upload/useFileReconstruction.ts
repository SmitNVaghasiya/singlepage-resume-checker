import { useEffect } from 'react';
import { base64ToFile } from '../../utils/fileValidation';

type AnalysisStep = "upload" | "job-description" | "analyze";

interface UseFileReconstructionProps {
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  setCurrentStep: (step: AnalysisStep) => void;
}

export const useFileReconstruction = (props: UseFileReconstructionProps) => {
  useEffect(() => {
    const reconstructFiles = async () => {
      try {
        const pendingAnalysis = localStorage.getItem('pendingAnalysis');
        if (pendingAnalysis) {
          const parsed = JSON.parse(pendingAnalysis);
          
          // Reconstruct resume file if it exists
          if (parsed.resumeFile && !props.resumeFile) {
            const reconstructedFile = await base64ToFile(
              parsed.resumeFile.data,
              parsed.resumeFile.name,
              parsed.resumeFile.type
            );
            props.setResumeFile(reconstructedFile);
          }

          // Set current step if available
          if (parsed.currentStep) {
            props.setCurrentStep(parsed.currentStep as AnalysisStep);
          }
        }
      } catch (error) {
        console.error('Error reconstructing files:', error);
      }
    };

    reconstructFiles();
  }, [props.resumeFile, props.setResumeFile, props.setCurrentStep]);
}; 