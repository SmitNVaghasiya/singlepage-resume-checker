import rateLimit from 'express-rate-limit';
import { config } from '../config/config';
import { logger } from '../utils/logger';

// Create a rate limiter
export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      message: 'Rate limit exceeded',
      ip: req.ip,
      url: req.url,
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have exceeded the rate limit. Please try again later.',
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
});

// Create a stricter rate limiter for file uploads
export const uploadRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: Math.floor(config.rateLimitMaxRequests / 2), // Half the normal limit
  message: {
    error: 'Too Many Upload Requests',
    message: 'You have exceeded the upload rate limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      message: 'Upload rate limit exceeded',
      ip: req.ip,
      url: req.url,
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      error: 'Too Many Upload Requests',
      message: 'You have exceeded the upload rate limit. Please try again later.',
    });
  },
}); 