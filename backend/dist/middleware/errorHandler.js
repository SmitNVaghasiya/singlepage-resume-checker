"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, _next) => {
    // Log error details
    logger_1.logger.error({
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    // Set default error status
    const status = err.status || err.statusCode || 500;
    // Handle specific error types
    if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({
            error: 'File too large',
            message: 'The uploaded file exceeds the maximum allowed size',
        });
        return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        res.status(400).json({
            error: 'Invalid file',
            message: 'Unexpected file field',
        });
        return;
    }
    // Handle validation errors
    if (err.name === 'ValidationError') {
        res.status(400).json({
            error: 'Validation Error',
            message: err.message,
        });
        return;
    }
    // Handle timeout errors
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        res.status(504).json({
            error: 'Gateway Timeout',
            message: 'The request took too long to process',
        });
        return;
    }
    // Generic error response
    res.status(status).json({
        error: status === 500 ? 'Internal Server Error' : err.message,
        message: status === 500
            ? 'An unexpected error occurred. Please try again later.'
            : err.message,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map