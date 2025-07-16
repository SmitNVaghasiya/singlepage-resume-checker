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
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  mongoUri: string;
  logLevel: string;
  logDir: string;
  clusterWorkers: number;
  compressionLevel: number;
}

export const config: Config = {
  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Python API
  pythonApiUrl: process.env.PYTHON_API_URL || 'http://localhost:8000',
  pythonApiTimeout: parseInt(process.env.PYTHON_API_TIMEOUT || '30000', 10),

  // Security
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || '*',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['pdf', 'doc', 'docx', 'txt'],

  // Redis
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  redisPassword: process.env.REDIS_PASSWORD,

  // MongoDB
  mongoUri: process.env.MONGODB_URL || 'mongodb://localhost:27017/resume_analyzer',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || 'logs',

  // Performance
  clusterWorkers: parseInt(process.env.CLUSTER_WORKERS || '0', 10),
  compressionLevel: parseInt(process.env.COMPRESSION_LEVEL || '6', 10),
};

// Validate required configuration
const requiredConfig = ['pythonApiUrl', 'mongoUri'];
for (const key of requiredConfig) {
  if (!config[key as keyof Config]) {
    console.warn(`Missing configuration: ${key} - using default value`);
  }
} 