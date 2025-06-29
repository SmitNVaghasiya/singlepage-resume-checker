"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRateLimiter = exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
// Create a rate limiter
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimitWindowMs,
    max: config_1.config.rateLimitMaxRequests,
    message: {
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.logger.warn({
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
exports.uploadRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimitWindowMs,
    max: Math.floor(config_1.config.rateLimitMaxRequests / 2), // Half the normal limit
    message: {
        error: 'Too Many Upload Requests',
        message: 'You have exceeded the upload rate limit. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.logger.warn({
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
//# sourceMappingURL=rateLimiter.js.map