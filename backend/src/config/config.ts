import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  port: number;
  nodeEnv: string;
  pythonApiUrl: string;
  pythonApiTimeout: number;
  corsOrigin: string | string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  allowedResumeFileTypes: string[];
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  logLevel: string;
  logDir: string;
  clusterWorkers: number;
  compressionLevel: number;
  // Token limits for Groq API
  maxInputTokens: number;
  maxOutputTokens: number;
  maxTotalTokens: number;
  // Duplicate request prevention
  duplicateRequestWindowMs: number;
  duplicateRequestMaxRetries: number;
}

export const config: Config = {
  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Python API - Optimized for Vercel deployment
  pythonApiUrl: process.env.PYTHON_API_URL || 'https://singlepage-resume-checker.onrender.com',
  pythonApiTimeout: parseInt(process.env.PYTHON_API_TIMEOUT || '120000', 10), // Increased to 2 minutes

  // Security - Optimized for Vercel
  corsOrigin: process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim().replace(/\/$/, '')) || [
    'https://singlepage-resume-checker.vercel.app',
    'https://singlepage-resume-checker-backend.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // File Upload - Optimized for serverless
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  allowedFileTypes: ['pdf', 'docx', 'txt'], // For job description
  allowedResumeFileTypes: ['pdf', 'docx'], // For resume

  // Redis - Optional for Vercel
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  redisPassword: process.env.REDIS_PASSWORD,

  // MongoDB - Required for Vercel
  mongoUri: process.env.MONGODB_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/resume_analyzer',

  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Logging - Optimized for Vercel
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || 'logs',

  // Performance - Optimized for serverless
  clusterWorkers: 0, // Disabled for serverless
  compressionLevel: parseInt(process.env.COMPRESSION_LEVEL || '6', 10),

  // Token limits for Groq API
  maxInputTokens: parseInt(process.env.MAX_INPUT_TOKENS || '4096', 10),
  maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS || '1024', 10),
  maxTotalTokens: parseInt(process.env.MAX_TOTAL_TOKENS || '5000', 10),

  // Duplicate request prevention
  duplicateRequestWindowMs: parseInt(process.env.DUPLICATE_REQUEST_WINDOW_MS || '300000', 10), // 5 minutes
  duplicateRequestMaxRetries: parseInt(process.env.DUPLICATE_REQUEST_MAX_RETRIES || '3', 10),
};

// Validate required configuration for Vercel
const requiredConfig = ['pythonApiUrl', 'mongoUri'];
for (const key of requiredConfig) {
  if (!config[key as keyof Config]) {
    console.warn(`Missing configuration: ${key} - using default value`);
  }
}

// Log configuration for debugging
if (config.nodeEnv === 'development') {
  console.log('Configuration loaded:', {
    nodeEnv: config.nodeEnv,
    port: config.port,
    pythonApiUrl: config.pythonApiUrl,
    corsOrigin: config.corsOrigin,
    mongoUri: config.mongoUri ? '***configured***' : '***missing***'
  });
} 