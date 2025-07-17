import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';
import { database } from '../config/database';

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

// Extend Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: IUser;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    // Check if database is connected
    if (!database.isConnectionActive()) {
      logger.warn('Database not connected - authentication unavailable');
      res.status(503).json({
        success: false,
        message: 'Authentication service temporarily unavailable'
      });
      return;
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable is not set');
      res.status(500).json({
        success: false,
        message: 'Authentication service configuration error'
      });
      return;
    }
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Check if user still exists with timeout
    const user = await Promise.race([
      User.findById(decoded.userId).exec(),
      new Promise<null>((_resolve, reject) => 
        setTimeout(() => reject(new Error('Database operation timeout')), 5000)
      )
    ]) as IUser | null;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check if user's email is verified
    if (!user.isEmailVerified) {
      res.status(401).json({
        success: false,
        message: 'Email not verified'
      });
      return;
    }

    // Attach user info to request
    req.userId = decoded.userId;
    req.user = user;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired'
      });
      return;
    }

    // Handle database timeout errors
    if (error instanceof Error && error.message === 'Database operation timeout') {
      logger.error('Auth middleware database timeout:', error);
      res.status(503).json({
        success: false,
        message: 'Authentication service temporarily unavailable'
      });
      return;
    }

    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next(); // Continue without authentication
      return;
    }

    // Check if database is connected
    if (!database.isConnectionActive()) {
      logger.warn('Database not connected - skipping optional authentication');
      next(); // Continue without authentication
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable is not set');
      next(); // Continue without authentication for optional auth
      return;
    }
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Use timeout for user lookup
    const user = await Promise.race([
      User.findById(decoded.userId).exec(),
      new Promise<null>((_resolve, reject) => 
        setTimeout(() => reject(new Error('Database operation timeout')), 5000)
      )
    ]) as IUser | null;
    
    if (user && user.isEmailVerified) {
      req.userId = decoded.userId;
      req.user = user;
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors, just continue
    logger.debug('Optional auth error (continuing):', error);
    next();
  }
}; 