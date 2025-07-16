import React from "react";
import { CheckCircle } from "lucide-react";
import { StepItem } from "../../types";

interface ProgressStepsProps {
  steps: StepItem[];
  currentStep: number;
  resumeFile: File | null;
  analysisResult: unknown;
  onGoToStep: (step: number) => void;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({
  steps,
  currentStep,
  resumeFile,
  analysisResult,
  onGoToStep,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-center space-x-8 mb-12">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted =
            index < currentStep || (index === 2 && analysisResult);
          const canAccess = index === 0 || (index === 1 && resumeFile);

          return (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => canAccess && onGoToStep(index)}
                  disabled={!canAccess}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                    ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : canAccess
                        ? "bg-gray-200 text-gray-500 hover:bg-gray-300"
                        : "bg-gray-100 text-gray-400"
                    }
                    ${canAccess ? "cursor-pointer" : "cursor-not-allowed"}
                  `}
                >
                  {isCompleted && index !== currentStep ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </button>
                <span
                  className={`mt-2 text-sm font-medium ${
                    isActive ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                  w-16 h-0.5 mx-4 transition-colors duration-300
                  ${
                    index < currentStep || (index === 1 && analysisResult)
                      ? "bg-green-500"
                      : "bg-gray-200"
                  }
                `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressSteps;
