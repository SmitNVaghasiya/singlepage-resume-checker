import rateLimit, { Options } from 'express-rate-limit';
import { config } from '../config/config';
import { logger } from '../utils/logger';

// Create a rate limiter factory
export const rateLimiter = (options: Partial<Options> = {}) => {
  return rateLimit({
    windowMs: options.windowMs || config.rateLimitWindowMs,
    max: options.max || config.rateLimitMaxRequests,
    message: options.message || {
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
        message: options.message || 'You have exceeded the rate limit. Please try again later.',
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health';
    },
  });
};

// Create a stricter rate limiter for file uploads
export const uploadRateLimiter = rateLimiter({
  windowMs: config.rateLimitWindowMs,
  max: Math.floor(config.rateLimitMaxRequests / 2), // Half the normal limit
  message: 'You have exceeded the upload rate limit. Please try again later.',
}); 