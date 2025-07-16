import { useEffect } from 'react';
import { PasteService, PasteServiceConfig } from '../../services/PasteService';

export const usePasteHandler = (config: PasteServiceConfig) => {
  useEffect(() => {
    const handlePaste = PasteService.createGlobalPasteHandler(config);
    
    // Add global paste event listener
    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [config.currentStep, config.hasResumeFile, config.jobInputMethod, config.pathname]);
}; 