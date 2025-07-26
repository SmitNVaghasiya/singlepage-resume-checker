import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Admin, IAdmin } from './Admin';
import { logger } from '../utils/logger';
import { config } from '../config/config';

import { AdminRequest } from './types';

export const authenticateAdmin = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin token required'
      });
      return;
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin token required'
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { adminId: string };
    const admin = await Admin.findById(decoded.adminId).exec();

    if (!admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid admin token'
      });
      return;
    }

    if (!admin.isActive) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin account is deactivated'
      });
      return;
    }

    if (admin.isLocked()) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin account is locked'
      });
      return;
    }

    if (admin.isPasswordExpired()) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin password has expired'
      });
      return;
    }

    req.admin = admin as IAdmin & { _id: string };
    next();
  } catch (error) {
    logger.error('Admin authentication error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid admin token'
    });
  }
};

export const requirePermission = (permission: string) => {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin authentication required'
      });
      return;
    }

    if (!req.admin.hasPermission(permission)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Permission '${permission}' required`
      });
      return;
    }

    next();
  };
};

export const requireRole = (_roles: string[]) => {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin authentication required'
      });
      return;
    }

    // For now, all admins have the same role
    // This can be extended later with role-based permissions
    next();
  };
}; 