// Username Validation Utility
// Comprehensive validation methods for usernames

export interface UsernameValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions?: string[];
}

export interface UsernameValidationOptions {
  minLength?: number;
  maxLength?: number;
  allowNumbers?: boolean;
  allowSpecialChars?: boolean;
  allowedSpecialChars?: string[];
  caseSensitive?: boolean;
  requireLetter?: boolean;
}

export class UsernameValidator {
  private static readonly DEFAULT_OPTIONS: UsernameValidationOptions = {
    minLength: 3,
    maxLength: 20,
    allowNumbers: true,
    allowSpecialChars: true,
    allowedSpecialChars: ['_', '-', '.'],
    caseSensitive: false,
    requireLetter: true
  };

  /**
   * Basic validation - Most common approach
   * Allows: letters, numbers, underscore
   * Pattern: /^[a-zA-Z0-9_]+$/
   */
  static validateBasic(username: string): UsernameValidationResult {
    const errors: string[] = [];
    
    // Check length
    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    if (username.length > 20) {
      errors.push('Username must be no more than 20 characters long');
    }
    
    // Check allowed characters
    const basicPattern = /^[a-zA-Z0-9_]+$/;
    if (!basicPattern.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
    
    // Must start with a letter
    if (!/^[a-zA-Z]/.test(username)) {
      errors.push('Username must start with a letter');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Strict validation - Very restrictive
   * Only letters and numbers, must start with letter
   * Pattern: /^[a-zA-Z][a-zA-Z0-9]*$/
   */
  static validateStrict(username: string): UsernameValidationResult {
    const errors: string[] = [];
    
    // Check length
    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    if (username.length > 15) {
      errors.push('Username must be no more than 15 characters long');
    }
    
    // Only letters and numbers
    const strictPattern = /^[a-zA-Z][a-zA-Z0-9]*$/;
    if (!strictPattern.test(username)) {
      errors.push('Username can only contain letters and numbers, and must start with a letter');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Flexible validation - More permissive
   * Allows: letters, numbers, underscore, hyphen, period
   * Pattern: /^[a-zA-Z0-9._-]+$/
   */
  static validateFlexible(username: string): UsernameValidationResult {
    const errors: string[] = [];
    
    // Check length
    if (username.length < 2) {
      errors.push('Username must be at least 2 characters long');
    }
    if (username.length > 30) {
      errors.push('Username must be no more than 30 characters long');
    }
    
    // Check allowed characters
    const flexiblePattern = /^[a-zA-Z0-9._-]+$/;
    if (!flexiblePattern.test(username)) {
      errors.push('Username can only contain letters, numbers, periods, underscores, and hyphens');
    }
    
    // Can't start or end with special characters
    if (/^[._-]|[._-]$/.test(username)) {
      errors.push('Username cannot start or end with special characters');
    }
    
    // No consecutive special characters
    if (/[._-]{2,}/.test(username)) {
      errors.push('Username cannot have consecutive special characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Social media style validation - Like Instagram/Twitter
   * Allows: letters, numbers, underscore, period
   * Pattern: /^[a-zA-Z0-9_.]+$/
   */
  static validateSocialMedia(username: string): UsernameValidationResult {
    const errors: string[] = [];
    
    // Check length
    if (username.length < 1) {
      errors.push('Username is required');
    }
    if (username.length > 30) {
      errors.push('Username must be no more than 30 characters long');
    }
    
    // Check allowed characters
    const socialPattern = /^[a-zA-Z0-9_.]+$/;
    if (!socialPattern.test(username)) {
      errors.push('Username can only contain letters, numbers, underscores, and periods');
    }
    
    // Can't start or end with period
    if (/^\.|\.$/.test(username)) {
      errors.push('Username cannot start or end with a period');
    }
    
    // Can't have consecutive periods
    if (/\.{2,}/.test(username)) {
      errors.push('Username cannot have consecutive periods');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Custom validation with configurable options
   */
  static validateCustom(username: string, options: UsernameValidationOptions = {}): UsernameValidationResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const errors: string[] = [];
    
    // Check length
    if (username.length < opts.minLength!) {
      errors.push(`Username must be at least ${opts.minLength} characters long`);
    }
    if (username.length > opts.maxLength!) {
      errors.push(`Username must be no more than ${opts.maxLength} characters long`);
    }
    
    // Build pattern based on options
    let pattern = '^[a-zA-Z';
    
    if (opts.allowNumbers) {
      pattern += '0-9';
    }
    
    if (opts.allowSpecialChars && opts.allowedSpecialChars) {
      // Escape special regex characters
      const escapedChars = opts.allowedSpecialChars
        .map(char => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('');
      pattern += escapedChars;
    }
    
    pattern += ']+$';
    
    const regex = new RegExp(pattern);
    if (!regex.test(username)) {
      const allowedChars = ['letters'];
      if (opts.allowNumbers) allowedChars.push('numbers');
      if (opts.allowSpecialChars) allowedChars.push(opts.allowedSpecialChars!.join(', '));
      errors.push(`Username can only contain: ${allowedChars.join(', ')}`);
    }
    
    // Require at least one letter
    if (opts.requireLetter && !/[a-zA-Z]/.test(username)) {
      errors.push('Username must contain at least one letter');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for common issues and provide suggestions
   */
  static validateWithSuggestions(username: string): UsernameValidationResult {
    const result = this.validateBasic(username);
    const suggestions: string[] = [];
    
    if (!result.isValid) {
      // Generate suggestions based on common issues
      let cleanUsername = username.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '');
      
      if (cleanUsername.length < 3) {
        cleanUsername += Math.random().toString(36).substring(2, 5);
      }
      
      if (cleanUsername.length > 20) {
        cleanUsername = cleanUsername.substring(0, 20);
      }
      
      if (!/^[a-zA-Z]/.test(cleanUsername)) {
        cleanUsername = 'user' + cleanUsername;
      }
      
      suggestions.push(cleanUsername);
      suggestions.push(cleanUsername + '_' + Math.floor(Math.random() * 99));
      suggestions.push(cleanUsername + Math.floor(Math.random() * 999));
    }
    
    return {
      ...result,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  /**
   * Real-time validation for input fields
   */
  static validateRealtime(username: string): {
    isValid: boolean;
    message: string;
    type: 'success' | 'warning' | 'error';
  } {
    if (username.length === 0) {
      return { isValid: false, message: 'Username is required', type: 'error' };
    }
    
    if (username.length < 3) {
      return { isValid: false, message: `${3 - username.length} more characters needed`, type: 'warning' };
    }
    
    const result = this.validateBasic(username);
    if (!result.isValid) {
      return { isValid: false, message: result.errors[0], type: 'error' };
    }
    
    return { isValid: true, message: 'Username looks good!', type: 'success' };
  }
}

// Utility functions for common checks
export const usernameUtils = {
  /**
   * Check if username contains spaces
   */
  hasSpaces: (username: string): boolean => /\s/.test(username),
  
  /**
   * Check if username has only allowed characters
   */
  hasOnlyAllowedChars: (username: string, allowedPattern: RegExp): boolean => allowedPattern.test(username),
  
  /**
   * Remove disallowed characters
   */
  sanitize: (username: string): string => username.replace(/[^a-zA-Z0-9_]/g, ''),
  
  /**
   * Generate username suggestions
   */
  generateSuggestions: (baseUsername: string, count: number = 3): string[] => {
    const sanitized = baseUsername.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    const suggestions: string[] = [];
    
    for (let i = 0; i < count; i++) {
      suggestions.push(sanitized + '_' + Math.floor(Math.random() * 999));
    }
    
    return suggestions;
  }
};

// Common validation patterns
export const USERNAME_PATTERNS = {
  // Basic: letters, numbers, underscore
  BASIC: /^[a-zA-Z0-9_]+$/,
  
  // Strict: letters and numbers only, start with letter
  STRICT: /^[a-zA-Z][a-zA-Z0-9]*$/,
  
  // Social: letters, numbers, underscore, period
  SOCIAL: /^[a-zA-Z0-9_.]+$/,
  
  // Email-like: letters, numbers, underscore, hyphen, period
  EMAIL_LIKE: /^[a-zA-Z0-9._-]+$/,
  
  // No spaces
  NO_SPACES: /^\S+$/,
  
  // Must start with letter
  STARTS_WITH_LETTER: /^[a-zA-Z]/,
  
  // No consecutive special chars
  NO_CONSECUTIVE_SPECIAL: /^(?!.*[._-]{2})/
};

export default UsernameValidator; 