import React from "react";
import { Loader } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 24,
  className = "",
  text,
}) => {
  return (
    <div className={`loading-spinner-container ${className}`}>
      <Loader size={size} className="loading-spinner-icon" />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
