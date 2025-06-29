import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Log request
  logger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture the original end function
  const originalEnd = res.end;

  // Override the end function with proper typing
  res.end = function(...args: any[]): Response {
    // Calculate response time
    const responseTime = Date.now() - start;

    // Log response
    logger.info({
      type: 'response',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('content-length'),
    });

    // Call the original end function
    return originalEnd.apply(res, args as any);
  } as any;

  next();
}; 