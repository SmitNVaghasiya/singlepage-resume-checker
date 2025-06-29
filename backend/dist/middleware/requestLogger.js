"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = require("../utils/logger");
const requestLogger = (req, res, next) => {
    const start = Date.now();
    // Log request
    logger_1.logger.info({
        type: 'request',
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    // Capture the original end function
    const originalEnd = res.end;
    // Override the end function with proper typing
    res.end = function (...args) {
        // Calculate response time
        const responseTime = Date.now() - start;
        // Log response
        logger_1.logger.info({
            type: 'response',
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            contentLength: res.get('content-length'),
        });
        // Call the original end function
        return originalEnd.apply(res, args);
    };
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=requestLogger.js.map