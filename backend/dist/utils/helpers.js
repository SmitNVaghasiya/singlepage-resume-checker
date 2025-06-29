"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractErrorMessage = exports.delay = exports.sanitizeFilename = exports.getFileExtension = exports.formatFileSize = exports.generateAnalysisId = void 0;
const crypto_1 = __importDefault(require("crypto"));
// Generate unique analysis ID
const generateAnalysisId = () => {
    return crypto_1.default.randomBytes(16).toString('hex');
};
exports.generateAnalysisId = generateAnalysisId;
// Format file size
const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0)
        return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};
exports.formatFileSize = formatFileSize;
// Validate file extension
const getFileExtension = (filename) => {
    return filename.split('.').pop()?.toLowerCase() || '';
};
exports.getFileExtension = getFileExtension;
// Sanitize filename
const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};
exports.sanitizeFilename = sanitizeFilename;
// Create delay promise for testing
const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.delay = delay;
// Extract text from error
const extractErrorMessage = (error) => {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'An unknown error occurred';
};
exports.extractErrorMessage = extractErrorMessage;
//# sourceMappingURL=helpers.js.map