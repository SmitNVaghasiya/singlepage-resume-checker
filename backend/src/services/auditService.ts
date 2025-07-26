import { AuditTrail, IAuditTrail } from '../models/AuditTrail';
import { Notification, INotification } from '../models/Notification';
import { IAdmin } from '../admin';
import { logger } from '../utils/logger';

export interface AuditLogData {
  adminId: string;
  adminUsername: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'success' | 'failure' | 'warning';
  metadata?: Record<string, any>;
}

export interface NotificationData {
  type: 'system' | 'security' | 'performance' | 'user' | 'analysis' | 'backup';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  targetAudience?: 'admin' | 'user' | 'all';
  recipients?: string[];
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

export class AuditService {
  /**
   * Log an admin action to the audit trail
   */
  static async logAction(data: AuditLogData): Promise<IAuditTrail> {
    try {
      const auditLog = new AuditTrail({
        adminId: data.adminId,
        adminUsername: data.adminUsername,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        severity: data.severity || 'low',
        status: data.status || 'success',
        metadata: data.metadata || {}
      });

      const savedLog = await auditLog.save();
      logger.info(`Audit log created: ${data.action} by ${data.adminUsername}`, {
        auditId: savedLog._id,
        action: data.action,
        resource: data.resource
      });

      return savedLog;
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      throw error;
    }
  }

  /**
   * Create a system notification
   */
  static async createNotification(data: NotificationData): Promise<INotification> {
    try {
      const notification = new Notification({
        type: data.type,
        title: data.title,
        message: data.message,
        severity: data.severity,
        category: data.category,
        targetAudience: data.targetAudience || 'admin',
        recipients: data.recipients || [],
        metadata: data.metadata || {},
        expiresAt: data.expiresAt
      });

      const savedNotification = await notification.save();
      logger.info(`Notification created: ${data.title}`, {
        notificationId: savedNotification._id,
        type: data.type,
        severity: data.severity
      });

      return savedNotification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(
    filters: {
      adminId?: string;
      action?: string;
      resource?: string;
      severity?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: IAuditTrail[]; total: number; page: number; totalPages: number }> {
    try {
      const query: any = {};

      if (filters.adminId) query.adminId = filters.adminId;
      if (filters.action) query.action = filters.action;
      if (filters.resource) query.resource = filters.resource;
      if (filters.severity) query.severity = filters.severity;
      if (filters.status) query.status = filters.status;

      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = filters.startDate;
        if (filters.endDate) query.timestamp.$lte = filters.endDate;
      }

      const total = await AuditTrail.countDocuments(query);
      const logs = await AuditTrail.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('adminId', 'username fullName email')
        .exec();

      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Failed to get audit logs:', error);
      throw error;
    }
  }

  /**
   * Get notifications with filtering and pagination
   */
  static async getNotifications(
    filters: {
      type?: string;
      severity?: string;
      category?: string;
      targetAudience?: string;
      isRead?: boolean;
      isArchived?: boolean;
    },
    page: number = 1,
    limit: number = 50
  ): Promise<{ notifications: INotification[]; total: number; page: number; totalPages: number }> {
    try {
      const query: any = {};

      if (filters.type) query.type = filters.type;
      if (filters.severity) query.severity = filters.severity;
      if (filters.category) query.category = filters.category;
      if (filters.targetAudience) query.targetAudience = filters.targetAudience;
      if (filters.isRead !== undefined) query.isRead = filters.isRead;
      if (filters.isArchived !== undefined) query.isArchived = filters.isArchived;

      const total = await Notification.countDocuments(query);
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('recipients', 'username fullName email')
        .populate('readBy', 'username fullName email')
        .exec();

      return {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Failed to get notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(
    notificationId: string,
    adminId: string
  ): Promise<INotification> {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        {
          $addToSet: { readBy: adminId },
          $set: { isRead: true }
        },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification;
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Archive notification
   */
  static async archiveNotification(notificationId: string): Promise<INotification> {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isArchived: true },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification;
    } catch (error) {
      logger.error('Failed to archive notification:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(timeRange: string = '30d'): Promise<any> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const stats = await AuditTrail.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              action: '$action',
              severity: '$severity',
              status: '$status'
            },
            count: { $sum: 1 }
          }
        }
      ]);

      return stats;
    } catch (error) {
      logger.error('Failed to get audit stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs (older than specified days)
   */
  static async cleanupOldLogs(daysToKeep: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      const result = await AuditTrail.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      logger.info(`Cleaned up ${result.deletedCount} old audit logs`);
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('Failed to cleanup old audit logs:', error);
      throw error;
    }
  }
} 