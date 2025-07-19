import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { extractErrorMessage } from '../utils/helpers';

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  details?: any;
}

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  requestId?: string;
  timestamp: string;
  path: string;
  details?: any;
}

class ErrorHandler {
  public static handle(
    err: ErrorWithStatus,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    const requestId = req.headers['x-request-id'] as string;
    const errorResponse = ErrorHandler.createErrorResponse(err, req, requestId);

    // Log error with context
    ErrorHandler.logError(err, req, requestId);

    // Don't expose sensitive information in production
    if (process.env.NODE_ENV === 'production' && errorResponse.statusCode === 500) {
      errorResponse.message = 'An unexpected error occurred. Please try again later.';
      delete errorResponse.details;
    }

    res.status(errorResponse.statusCode).json(errorResponse);
  }

  private static createErrorResponse(
    err: ErrorWithStatus,
    req: Request,
    requestId?: string
  ): ErrorResponse {
    const baseResponse: ErrorResponse = {
      error: err.name || 'Error',
      message: extractErrorMessage(err),
      statusCode: ErrorHandler.getStatusCode(err),
      requestId,
      timestamp: new Date().toISOString(),
      path: req.path,
    };

    // Handle specific error types
    if (ErrorHandler.isFileError(err)) {
      return ErrorHandler.handleFileError(err, baseResponse);
    }

    if (ErrorHandler.isValidationError(err)) {
      return ErrorHandler.handleValidationError(err, baseResponse);
    }

    if (ErrorHandler.isTimeoutError(err)) {
      return ErrorHandler.handleTimeoutError(err, baseResponse);
    }

    if (ErrorHandler.isDatabaseError(err)) {
      return ErrorHandler.handleDatabaseError(err, baseResponse);
    }

    if (ErrorHandler.isRateLimitError(err)) {
      return ErrorHandler.handleRateLimitError(err, baseResponse);
    }

    return baseResponse;
  }

  private static getStatusCode(err: ErrorWithStatus): number {
    if (err.status) return err.status;
    if (err.statusCode) return err.statusCode;

    // Default status codes based on error type
    if (ErrorHandler.isFileError(err)) return 400;
    if (ErrorHandler.isValidationError(err)) return 400;
    if (ErrorHandler.isTimeoutError(err)) return 504;
    if (ErrorHandler.isDatabaseError(err)) return 503;
    if (ErrorHandler.isRateLimitError(err)) return 429;

    return 500;
  }

  private static isFileError(err: ErrorWithStatus): boolean {
    return [
      'LIMIT_FILE_SIZE',
      'LIMIT_FILE_COUNT',
      'LIMIT_FIELD_KEY',
      'LIMIT_FIELD_VALUE',
      'LIMIT_FIELD_COUNT',
      'LIMIT_UNEXPECTED_FILE',
      'MISSING_FIELD_NAME',
      'MALFORMED_FILE',
    ].includes(err.code || '');
  }

  private static isValidationError(err: ErrorWithStatus): boolean {
    return [
      'ValidationError',
      'ValidatorError',
      'CastError',
      'VALIDATION_ERROR',
    ].includes(err.name || '');
  }

  private static isTimeoutError(err: ErrorWithStatus): boolean {
    return (
      err.code === 'ECONNABORTED' ||
      err.code === 'ETIMEDOUT' ||
      err.message.toLowerCase().includes('timeout')
    );
  }

  private static isDatabaseError(err: ErrorWithStatus): boolean {
    return [
      'MongoError',
      'MongooseError',
      'MongoServerError',
      'MongoNetworkError',
      'DATABASE_ERROR',
    ].includes(err.name || '');
  }

  private static isRateLimitError(err: ErrorWithStatus): boolean {
    return err.code === 'RATE_LIMIT_ERROR' || err.message.toLowerCase().includes('rate limit');
  }

  private static handleFileError(
    err: ErrorWithStatus,
    baseResponse: ErrorResponse
  ): ErrorResponse {
    const fileErrorMessages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'File size exceeds the maximum allowed limit',
      LIMIT_FILE_COUNT: 'Too many files uploaded',
      LIMIT_FIELD_KEY: 'Field name too long',
      LIMIT_FIELD_VALUE: 'Field value too long',
      LIMIT_FIELD_COUNT: 'Too many fields',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field received',
      MISSING_FIELD_NAME: 'Missing field name',
      MALFORMED_FILE: 'Malformed file data',
    };

    return {
      ...baseResponse,
      error: 'File Upload Error',
      message: fileErrorMessages[err.code || ''] || 'File upload failed',
      statusCode: err.code === 'LIMIT_FILE_SIZE' ? 413 : 400,
    };
  }

  private static handleValidationError(
    err: ErrorWithStatus,
    baseResponse: ErrorResponse
  ): ErrorResponse {
    return {
      ...baseResponse,
      error: 'Validation Error',
      message: 'Input validation failed',
      details: err.details || err.message,
    };
  }

  private static handleTimeoutError(
    _err: ErrorWithStatus,
    baseResponse: ErrorResponse
  ): ErrorResponse {
    return {
      ...baseResponse,
      error: 'Gateway Timeout',
      message: 'The request took too long to process. Please try again later.',
      statusCode: 504,
    };
  }

  private static handleDatabaseError(
    _err: ErrorWithStatus,
    baseResponse: ErrorResponse
  ): ErrorResponse {
    return {
      ...baseResponse,
      error: 'Database Error',
      message: 'A database error occurred. Please try again later.',
      statusCode: 503,
    };
  }

  private static handleRateLimitError(
    _err: ErrorWithStatus,
    baseResponse: ErrorResponse
  ): ErrorResponse {
    return {
      ...baseResponse,
      error: 'Rate Limit Exceeded',
      message: 'Too many requests. Please try again later.',
      statusCode: 429,
    };
  }

  private static logError(
    _err: ErrorWithStatus,
    req: Request,
    requestId?: string
  ): void {
    const errorContext = {
      error: {
        name: _err.name,
        message: _err.message,
        code: _err.code,
        status: _err.status || _err.statusCode,
        stack: _err.stack,
      },
      request: {
        id: requestId,
        method: req.method,
        path: req.path,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        contentType: req.get('content-type'),
        contentLength: req.get('content-length'),
      },
      timestamp: new Date().toISOString(),
    };

    // Log based on error severity
    if (errorContext.error.status && errorContext.error.status < 500) {
      logger.warn('Client error occurred', errorContext);
    } else {
      logger.error('Server error occurred', errorContext);
    }
  }
}

// Export the error handler function
export const errorHandler = ErrorHandler.handle; 