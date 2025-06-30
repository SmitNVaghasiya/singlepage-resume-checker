"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRateLimiter = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
// Create a rate limiter factory
const rateLimiter = (options = {}) => {
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs || config_1.config.rateLimitWindowMs,
        max: options.max || config_1.config.rateLimitMaxRequests,
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
            logger_1.logger.warn({
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
exports.rateLimiter = rateLimiter;
// Create a stricter rate limiter for file uploads
exports.uploadRateLimiter = (0, exports.rateLimiter)({
    windowMs: config_1.config.rateLimitWindowMs,
    max: Math.floor(config_1.config.rateLimitMaxRequests / 2), // Half the normal limit
    message: 'You have exceeded the upload rate limit. Please try again later.',
});
//# sourceMappingURL=rateLimiter.js.map