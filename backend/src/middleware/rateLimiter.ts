import rateLimit, { Options } from 'express-rate-limit';
import { config } from '../config/config';
import { logger } from '../utils/logger';

// Create a pre-configured rate limiter instance
export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use x-forwarded-for if behind proxy, otherwise use req.ip
    return req.headers['x-forwarded-for']?.toString() || req.ip || 'unknown';
  },
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
    // Skip rate limiting for health checks and OPTIONS requests
    return req.path.startsWith('/api/health') || req.method === 'OPTIONS';
  },
});

// Create a stricter rate limiter for file uploads
export const uploadRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: Math.floor(config.rateLimitMaxRequests / 2), // Half the normal limit
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the upload rate limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.toString() || req.ip || 'unknown';
  },
  handler: (req, res) => {
    logger.warn({
      message: 'Upload rate limit exceeded',
      ip: req.ip,
      url: req.url,
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have exceeded the upload rate limit. Please try again later.',
    });
  },
  skip: (req) => {
    return req.path.startsWith('/api/health') || req.method === 'OPTIONS';
  },
}); 