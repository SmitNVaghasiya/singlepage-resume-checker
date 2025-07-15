export interface PasteServiceConfig {
  currentStep?: string;
  pathname: string;
  hasResumeFile: boolean;
  jobInputMethod: string;
  setResumeFile: (file: File | null) => void;
  setJobFile: (file: File | null) => void;
  setJobInputMethod?: (method: 'text' | 'file') => void;
  setCurrentStep: (step: string) => void;
}

export class PasteService {
  private static validTypes = ['.pdf', '.docx', '.txt'];
  private static maxSize = 5 * 1024 * 1024; // 5MB

  static validateFile(file: File): { isValid: boolean; error?: string } {
    console.log('Validating file:', file.name, file.type, file.size);
    
    if (file.size > this.maxSize) {
      return { isValid: false, error: 'File size must be less than 5MB' };
    }
    
    const isValidType = this.validTypes.some(type => {
      if (type === '.pdf') return file.type === 'application/pdf';
      if (type === '.docx') return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (type === '.txt') return file.type === 'text/plain';
      return false;
    });

    if (!isValidType) {
      return { isValid: false, error: 'Please upload a PDF, DOCX, or TXT file' };
    }

    return { isValid: true };
  }

  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  static handleGlobalPaste(file: File, config: PasteServiceConfig): void {
    console.log('Global paste handler called with file:', file.name, file.type, file.size);
    
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    // Check if we're on the homepage - more reliable detection
    const isOnHomepage = config.pathname === '/' || config.pathname === '/home' || 
                        window.location.pathname === '/' || window.location.pathname === '/home';
    
    console.log('Paste routing check:', {
      currentStep: config.currentStep,
      pathname: config.pathname,
      windowPathname: window.location.pathname,
      isOnHomepage,
      hasResumeFile: config.hasResumeFile,
      jobInputMethod: config.jobInputMethod
    });
    
    if (isOnHomepage) {
      console.log('Homepage paste detected - skipping global handler (handled locally)');
      return; // Homepage paste is handled locally by HomePage component
    } else if (config.currentStep === 'upload' || !config.hasResumeFile) {
      console.log('Routing to resume upload paste handler');
      this.handleResumeUploadPaste(file, config);
    } else if (config.currentStep === 'job-description' && config.jobInputMethod === 'file') {
      console.log('Routing to job file paste handler');
      this.handleJobFilePaste(file, config);
    } else {
      console.log('No appropriate target for pasted file - falling back to resume upload');
      // Fallback: treat as resume upload if no clear target
      this.handleResumeUploadPaste(file, config);
    }
  }



  private static handleResumeUploadPaste(file: File, config: PasteServiceConfig): void {
    console.log('Setting resume file via global paste');
    config.setResumeFile(file);
    // Auto-advance to job description step
    setTimeout(() => {
      config.setCurrentStep('job-description');
    }, 500);
  }

  private static handleJobFilePaste(file: File, config: PasteServiceConfig): void {
    console.log('Setting job file via global paste');
    config.setJobFile(file);
    // Set jobInputMethod to 'file' when a job file is pasted
    if (config.setJobInputMethod) {
      config.setJobInputMethod('file');
    }
  }

  private static showSuccessMessage(title: string, subtitle: string): void {
    const successMessage = document.createElement('div');
    successMessage.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
    `;
    successMessage.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">✅</span>
        <div>
          <div style="font-weight: 600; margin-bottom: 2px;">${title}</div>
          <div style="font-size: 14px; opacity: 0.9;">${subtitle}</div>
        </div>
      </div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(successMessage);
    
    // Remove message after delay
    setTimeout(() => {
      if (document.body.contains(successMessage)) {
        document.body.removeChild(successMessage);
      }
    }, 2000);
  }

  static createGlobalPasteHandler(config: PasteServiceConfig) {
    return (e: ClipboardEvent) => {
      console.log('Global paste event detected');
      
      // Check if we're in a text input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        console.log('Paste in text input - allowing default behavior');
        return; // Allow default paste behavior for text inputs
      }
      
      const items = e.clipboardData?.items;
      if (!items) {
        console.log('No clipboard items found');
        return;
      }
      
      console.log('Clipboard items:', items.length);
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log('Clipboard item:', item.kind, item.type);
        
        if (item.kind === 'file') {
          const pastedFile = item.getAsFile();
          if (pastedFile) {
            console.log('File found in clipboard:', pastedFile.name, pastedFile.type, pastedFile.size);
            e.preventDefault();
            this.handleGlobalPaste(pastedFile, config);
            return;
          }
        }
      }
    };
  }
} 