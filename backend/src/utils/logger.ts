import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { config } from '../config/config';

// Ensure log directory exists (skip in serverless environment)
const logDir = path.join(process.cwd(), config.logDir);
if (!fs.existsSync(logDir) && process.env.NODE_ENV !== 'production') {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Add a custom error format for production
const prodErrorFormat = winston.format((info) => {
  if (process.env.NODE_ENV === 'production' && info.level === 'error') {
    // Remove stack traces and sensitive details
    if (info.stack) delete info.stack;
    if (
      info.error &&
      typeof info.error === 'object' &&
      'message' in info.error &&
      typeof (info.error as any).message === 'string'
    ) {
      info.error = (info.error as any).message;
    } else if (info.error && typeof info.error === 'object') {
      info.error = 'Error';
    }
    // Only keep message, level, timestamp, and requestId if present
    const { message, level, timestamp, requestId } = info;
    return { message, level, timestamp, requestId };
  }
  return info;
});

// Create the logger
export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    prodErrorFormat(),
    logFormat
  ),
  defaultMeta: { service: 'resume-checker-backend' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Add file transports in production (but not in serverless)
if (config.nodeEnv === 'production' && !process.env.VERCEL) {
  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
} 