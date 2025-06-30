"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
exports.config = {
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
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/resume_analyzer',
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
    if (!exports.config[key]) {
        throw new Error(`Missing required configuration: ${key}`);
    }
}
//# sourceMappingURL=config.js.map