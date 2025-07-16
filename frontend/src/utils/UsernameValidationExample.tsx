import React, { useState, useEffect } from 'react';
import { User, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import UsernameValidator, { usernameUtils } from './usernameValidation';

const UsernameValidationExample: React.FC = () => {
  const [username, setUsername] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    type: 'success' | 'warning' | 'error';
  } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [validationMethod, setValidationMethod] = useState<'basic' | 'strict' | 'flexible' | 'social'>('basic');

  // Real-time validation
  useEffect(() => {
    if (username) {
      const result = UsernameValidator.validateRealtime(username);
      setValidationResult(result);
      
      // Get suggestions if validation fails
      if (!result.isValid && username.length >= 2) {
        const suggestionResult = UsernameValidator.validateWithSuggestions(username);
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
        case 'strict':
          result = UsernameValidator.validateStrict(username);
          break;
        case 'flexible':
          result = UsernameValidator.validateFlexible(username);
          break;
        case 'social':
          result = UsernameValidator.validateSocialMedia(username);
          break;
        default:
          result = UsernameValidator.validateBasic(username);
      }
      
      setValidationResult({
        isValid: result.isValid,
        message: result.isValid ? 'Username is valid!' : result.errors[0],
        type: result.isValid ? 'success' : 'error'
      });
    }
  };

  const applySuggestion = (suggestion: string) => {
    setUsername(suggestion);
  };

  const getValidationIcon = () => {
    if (!validationResult) return <User className="w-4 h-4" />;
    
    switch (validationResult.type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <Info className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getMessageColor = () => {
    if (!validationResult) return 'text-gray-500';
    
    switch (validationResult.type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Username Validation Demo</h2>
      
      {/* Validation Method Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Validation Method:</label>
        <select 
          value={validationMethod}
          onChange={(e) => handleValidationMethodChange(e.target.value as typeof validationMethod)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="basic">Basic (letters, numbers, _, -)</option>
          <option value="strict">Strict (letters, numbers only)</option>
          <option value="flexible">Flexible (letters, numbers, _, -, .)</option>
          <option value="social">Social Media (letters, numbers, _, .)</option>
        </select>
      </div>

      {/* Username Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Username:</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {getValidationIcon()}
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              validationResult
                ? validationResult.type === 'success'
                  ? 'border-green-500 focus:ring-green-200'
                  : validationResult.type === 'warning'
                  ? 'border-yellow-500 focus:ring-yellow-200'
                  : 'border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:ring-blue-200'
            }`}
            placeholder="Enter username"
          />
        </div>
        
        {/* Validation Message */}
        {validationResult && (
          <p className={`text-sm mt-1 ${getMessageColor()}`}>
            {validationResult.message}
          </p>
        )}
      </div>

      {/* Character Analysis */}
      {username && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium mb-2">Character Analysis:</h3>
          <div className="space-y-1 text-xs">
            <div>Length: {username.length} characters</div>
            <div>Has spaces: {usernameUtils.hasSpaces(username) ? '❌ Yes' : '✅ No'}</div>
            <div>Starts with letter: {/^[a-zA-Z]/.test(username) ? '✅ Yes' : '❌ No'}</div>
            <div>Contains numbers: {/\d/.test(username) ? '✅ Yes' : '❌ No'}</div>
            <div>Contains special chars: {/[^a-zA-Z0-9]/.test(username) ? '✅ Yes' : '❌ No'}</div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Suggestions:</h3>
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => applySuggestion(suggestion)}
                className="block w-full text-left p-2 text-sm bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 text-blue-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Validation Rules */}
      <div className="text-xs text-gray-600 space-y-1">
        <div className="font-medium">Current Rules ({validationMethod}):</div>
        {validationMethod === 'basic' && (
          <ul className="list-disc list-inside space-y-1">
            <li>3-20 characters long</li>
            <li>Letters, numbers, underscore (_), hyphen (-)</li>
            <li>Must start with a letter</li>
            <li>No spaces allowed</li>
          </ul>
        )}
        {validationMethod === 'strict' && (
          <ul className="list-disc list-inside space-y-1">
            <li>3-15 characters long</li>
            <li>Letters and numbers only</li>
            <li>Must start with a letter</li>
            <li>No special characters</li>
          </ul>
        )}
        {validationMethod === 'flexible' && (
          <ul className="list-disc list-inside space-y-1">
            <li>2-30 characters long</li>
            <li>Letters, numbers, period (.), underscore (_), hyphen (-)</li>
            <li>Cannot start/end with special characters</li>
            <li>No consecutive special characters</li>
          </ul>
        )}
        {validationMethod === 'social' && (
          <ul className="list-disc list-inside space-y-1">
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