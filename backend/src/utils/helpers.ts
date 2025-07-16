import * as crypto from 'crypto';
import * as path from 'path';

// Generate unique analysis ID
export const generateAnalysisId = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

// Generate unique request ID for tracking
export const generateRequestId = (): string => {
  return crypto.randomBytes(8).toString('hex');
};

// Format file size in human readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${Math.round(size * 100) / 100} ${sizes[i]}`;
};

// Validate and get file extension
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase().replace('.', '');
};

// Get file mime type category
export const getFileMimeCategory = (mimetype: string): string => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf')) return 'pdf';
  if (mimetype.includes('word') || mimetype.includes('document')) return 'document';
  if (mimetype.includes('text')) return 'text';
  return 'unknown';
};

// Sanitize filename for safe storage
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace unsafe characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 255); // Limit length
};

// Sanitize text input to prevent XSS
export const sanitizeText = (text: string): string => {
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validate URL format
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Check if string is a valid ObjectId (MongoDB)
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Create delay promise for testing/throttling
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Extract error message from various error types
export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  return 'An unknown error occurred';
};

// Format date to ISO string with timezone
export const formatDate = (date: Date | string | number): string => {
  return new Date(date).toISOString();
};

// Format date for human readability
export const formatDateHuman = (date: Date | string | number): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate time difference in milliseconds
export const timeDifference = (start: Date | string | number, end?: Date | string | number): number => {
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  return endTime - startTime;
};

// Format duration in human readable format
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number, suffix = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

// Convert string to title case
export const toTitleCase = (text: string): string => {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

// Generate random string
export const generateRandomString = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(null, args);
    }
  };
};

// Check if value is empty (null, undefined, empty string, empty array, empty object)
export const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Safe JSON parse with fallback
export const safeJsonParse = <T = any>(str: string, fallback: T): T => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

// Hash string using SHA-256
export const hashString = (str: string): string => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

// Mask sensitive data (email, phone, etc.)
export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  if (username.length <= 2) return email;
  const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
  return `${maskedUsername}@${domain}`;
};

// Get client IP from request headers
export const getClientIp = (req: any): string => {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         'unknown';
};

// Validate file type against allowed types
export const isAllowedFileType = (filename: string, allowedTypes: string[]): boolean => {
  const extension = getFileExtension(filename);
  return allowedTypes.includes(extension);
};

// Calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100; // Round to 2 decimal places
};

// Convert bytes to megabytes
export const bytesToMB = (bytes: number): number => {
  return Math.round(bytes / (1024 * 1024) * 100) / 100;
};

// Environment-specific utilities
export const isDevelopment = (): boolean => process.env.NODE_ENV === 'development';
export const isProduction = (): boolean => process.env.NODE_ENV === 'production';
export const isTest = (): boolean => process.env.NODE_ENV === 'test'; 