import React, { useState, useEffect } from "react";
import { User, CheckCircle, AlertTriangle, Info } from "lucide-react";
import UsernameValidator, { usernameUtils } from "./usernameValidation";
import "./UsernameValidationExample.css";

const UsernameValidationExample: React.FC = () => {
  const [username, setUsername] = useState("");
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    type: "success" | "warning" | "error";
  } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [validationMethod, setValidationMethod] = useState<
    "basic" | "strict" | "flexible" | "social"
  >("basic");

  // Real-time validation
  useEffect(() => {
    if (username) {
      const result = UsernameValidator.validateRealtime(username);
      setValidationResult(result);

      // Get suggestions if validation fails
      if (!result.isValid && username.length >= 2) {
        const suggestionResult =
          UsernameValidator.validateWithSuggestions(username);
        setSuggestions(suggestionResult.suggestions || []);
      } else {
        setSuggestions([]);
      }
    } else {
      setValidationResult(null);
      setSuggestions([]);
    }
  }, [username]);

  const handleValidationMethodChange = (method: typeof validationMethod) => {
    setValidationMethod(method);
    // Re-validate with new method
    if (username) {
      let result;
      switch (method) {
        case "strict":
          result = UsernameValidator.validateStrict(username);
          break;
        case "flexible":
          result = UsernameValidator.validateFlexible(username);
          break;
        case "social":
          result = UsernameValidator.validateSocialMedia(username);
          break;
        default:
          result = UsernameValidator.validateBasic(username);
      }

      setValidationResult({
        isValid: result.isValid,
        message: result.isValid ? "Username is valid!" : result.errors[0],
        type: result.isValid ? "success" : "error",
      });
    }
  };

  const applySuggestion = (suggestion: string) => {
    setUsername(suggestion);
  };

  const getValidationIcon = () => {
    if (!validationResult) return <User className="username-input-icon" />;

    switch (validationResult.type) {
      case "success":
        return <CheckCircle className="username-input-icon success" />;
      case "warning":
        return <Info className="username-input-icon warning" />;
      case "error":
        return <AlertTriangle className="username-input-icon error" />;
      default:
        return <User className="username-input-icon" />;
    }
  };

  const getInputClassName = () => {
    const baseClass = "username-input";
    if (!validationResult) return baseClass;

    switch (validationResult.type) {
      case "success":
        return `${baseClass} success`;
      case "warning":
        return `${baseClass} warning`;
      case "error":
        return `${baseClass} error`;
      default:
        return baseClass;
    }
  };

  const getMessageClassName = () => {
    const baseClass = "validation-message";
    if (!validationResult) return baseClass;

    switch (validationResult.type) {
      case "success":
        return `${baseClass} success`;
      case "warning":
        return `${baseClass} warning`;
      case "error":
        return `${baseClass} error`;
      default:
        return baseClass;
    }
  };

  return (
    <div className="username-validation-demo">
      <h2 className="username-validation-title">Username Validation Demo</h2>

      {/* Validation Method Selector */}
      <div className="validation-method-section">
        <label className="validation-method-label">Validation Method:</label>
        <select
          value={validationMethod}
          onChange={(e) =>
            handleValidationMethodChange(
              e.target.value as typeof validationMethod
            )
          }
          className="validation-method-select"
        >
          <option value="basic">Basic (letters, numbers, _, -)</option>
          <option value="strict">Strict (letters, numbers only)</option>
          <option value="flexible">Flexible (letters, numbers, _, -, .)</option>
          <option value="social">Social Media (letters, numbers, _, .)</option>
        </select>
      </div>

      {/* Username Input */}
      <div className="username-input-section">
        <label className="username-input-label">Username:</label>
        <div className="username-input-wrapper">
          <div className="username-input-icon-wrapper">
            {getValidationIcon()}
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={getInputClassName()}
            placeholder="Enter username"
          />
        </div>

        {/* Validation Message */}
        {validationResult && (
          <p className={getMessageClassName()}>{validationResult.message}</p>
        )}
      </div>

      {/* Character Analysis */}
      {username && (
        <div className="character-analysis">
          <h3 className="character-analysis-title">Character Analysis:</h3>
          <div className="character-analysis-content">
            <div>Length: {username.length} characters</div>
            <div>
              Has spaces:{" "}
              {usernameUtils.hasSpaces(username) ? "❌ Yes" : "✅ No"}
            </div>
            <div>
              Starts with letter:{" "}
              {/^[a-zA-Z]/.test(username) ? "✅ Yes" : "❌ No"}
            </div>
            <div>
              Contains numbers: {/\d/.test(username) ? "✅ Yes" : "❌ No"}
            </div>
            <div>
              Contains special chars:{" "}
              {/[^a-zA-Z0-9]/.test(username) ? "✅ Yes" : "❌ No"}
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestions-section">
          <h3 className="suggestions-title">Suggestions:</h3>
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => applySuggestion(suggestion)}
                className="suggestion-button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Validation Rules */}
      <div className="validation-rules">
        <div className="validation-rules-title">
          Current Rules ({validationMethod}):
        </div>
        {validationMethod === "basic" && (
          <ul className="validation-rules-list">
            <li>3-20 characters long</li>
            <li>Letters, numbers, underscore (_), hyphen (-)</li>
            <li>Must start with a letter</li>
            <li>No spaces allowed</li>
          </ul>
        )}
        {validationMethod === "strict" && (
          <ul className="validation-rules-list">
            <li>3-15 characters long</li>
            <li>Letters and numbers only</li>
            <li>Must start with a letter</li>
            <li>No special characters</li>
          </ul>
        )}
        {validationMethod === "flexible" && (
          <ul className="validation-rules-list">
            <li>2-30 characters long</li>
            <li>Letters, numbers, period (.), underscore (_), hyphen (-)</li>
            <li>Cannot start/end with special characters</li>
            <li>No consecutive special characters</li>
          </ul>
        )}
        {validationMethod === "social" && (
          <ul className="validation-rules-list">
            <li>1-30 characters long</li>
            <li>Letters, numbers, underscore (_), period (.)</li>
            <li>Cannot start/end with period</li>
            <li>No consecutive periods</li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default UsernameValidationExample;
