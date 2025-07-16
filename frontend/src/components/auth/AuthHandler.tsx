import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../contexts/AppContext";
import { AuthModal } from "./";

interface AuthHandlerProps {
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  onStartAnalysis: () => void;
}

export const useAuthHandler = (props: AuthHandlerProps) => {
  const { setShowAuthModal, onStartAnalysis } = props;
  const navigate = useNavigate();
  const { resetAnalysis } = useAppContext();

  // Handle successful authentication
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Automatically start analysis with uploaded files
    setTimeout(() => {
      onStartAnalysis();
    }, 500);
  };

  // Handle auth modal close
  const handleAuthModalClose = () => {
    setShowAuthModal(false);
  };

  const handleAnalyzeAnother = () => {
    resetAnalysis();
  };

  const handleViewDashboard = () => {
    navigate("/dashboard");
  };

  return {
    handleAuthSuccess,
    handleAuthModalClose,
    handleAnalyzeAnother,
    handleViewDashboard,
  };
};

interface AuthModalWrapperProps {
  showAuthModal: boolean;
  onAuthSuccess: () => void;
  onClose: () => void;
  tempFiles: {
    resume?: { tempId: string; filename: string };
    jobDescription?: { tempId: string; filename: string };
  };
}

export const AuthModalWrapper: React.FC<AuthModalWrapperProps> = ({
  showAuthModal,
  onAuthSuccess,
  onClose,
  tempFiles,
}) => {
  if (!showAuthModal) return null;

  return (
    <AuthModal
      isOpen={showAuthModal}
      onAuthSuccess={onAuthSuccess}
      onClose={onClose}
      uploadedFiles={
        tempFiles.resume || tempFiles.jobDescription
          ? {
              resume: tempFiles.resume?.filename,
              jobDescription: tempFiles.jobDescription?.filename,
            }
          : undefined
      }
    />
  );
};
