import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Admin, IAdmin } from '../models/Admin';
import { logger } from '../../utils/logger';
import { config } from '../../config/config';

interface AdminRequest extends Request {
  admin?: IAdmin;
}

export const authenticateAdmin = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
      return;
    }

    const token = authHeader.substring(7);
    
    if (!config.jwtSecret) {
      logger.error('JWT secret not configured');
      res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { adminId: string };
    const admin = await Admin.findById(decoded.adminId).exec();

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
      return;
    }

    if (!admin.isActive) {
      res.status(401).json({
        success: false,
        message: 'Admin account is deactivated'
      });
      return;
    }

    if (admin.isLocked()) {
      res.status(401).json({
        success: false,
        message: 'Admin account is temporarily locked'
      });
      return;
    }

    req.admin = admin;
    next();

  } catch (error) {
    logger.error('Admin authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid admin token'
    });
  }
};

// Permission check - verify admin has specific permission
export const requirePermission = (permission: string) => {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
      return;
    }

    // Check if admin has the required permission
    if (!req.admin.hasPermission(permission)) {
      res.status(403).json({
        success: false,
        message: `Permission denied: ${permission} required`
      });
      return;
    }

    next();
  };
};

// Simplified role check - admin has all roles
export const requireRole = (_roles: string[]) => {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
      return;
    }

    // Admin has all roles
    next();
  };
}; 