import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Admin, IAdmin } from '../models/Admin';
import { User } from '../../models/User';
import { Analysis } from '../../models/Analysis';
import { Feedback } from '../../models/Feedback';
import { AuditTrail } from '../../models/AuditTrail';
import { Notification } from '../../models/Notification';
import { SystemConfig } from '../../models/SystemConfig';
import { AuditService } from '../../services/auditService';
import { SystemConfigService } from '../../services/systemConfigService';
import { logger } from '../../utils/logger';
import { config } from '../../config/config';

interface AdminRequest extends Request {
  admin?: IAdmin & { _id: string };
}

// Admin Authentication
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
      return;
    }

    const admin = await Admin.findOne({ username }).exec();

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    if (!admin.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
      return;
    }

    if (admin.isLocked()) {
      res.status(401).json({
        success: false,
        message: 'Account is temporarily locked'
      });
      return;
    }

    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      admin.loginAttempts += 1;
      
      // Lock account after 5 failed attempts for 15 minutes
      if (admin.loginAttempts >= 5) {
        admin.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      
      await admin.save();

      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Reset login attempts on successful login
    admin.loginAttempts = 0;
    admin.lockUntil = undefined;
    admin.lastLogin = new Date();
    await admin.save();

    if (!config.jwtSecret) {
      logger.error('JWT secret not configured');
      res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
      return;
    }

    const token = jwt.sign(
      { userId: admin._id },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    // Log successful login
    await AuditService.logAction({
      adminId: (admin as any)._id.toString(),
      adminUsername: admin.username,
      action: 'admin_login',
      resource: 'admin',
      resourceId: (admin as any)._id.toString(),
      details: {
        username: admin.username,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    });

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          fullName: admin.fullName,
          permissions: admin.permissions,
          lastLogin: admin.lastLogin
        }
      }
    });

  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current admin info
export const getCurrentAdmin = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: req.admin._id,
        username: req.admin.username,
        email: req.admin.email,
        fullName: req.admin.fullName,
        permissions: req.admin.permissions,
        lastLogin: req.admin.lastLogin,
        isActive: req.admin.isActive,
        twoFactorEnabled: req.admin.twoFactorEnabled
      }
    });

  } catch (error) {
    logger.error('Get current admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all users (with pagination and filtering)
export const getAllUsers = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Build filter query
    const filter: any = {};
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      filter.isActive = status === 'active';
    }

    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    // Log the action
    await AuditService.logAction({
      adminId: req.admin!._id.toString(),
      adminUsername: req.admin!.username,
      action: 'view_users',
      resource: 'users',
      details: {
        page,
        limit,
        search,
        status,
        totalResults: totalUsers
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          totalUsers,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user by ID
export const getUserById = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password').exec();

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Log the action
    await AuditService.logAction({
      adminId: req.admin!._id.toString(),
      adminUsername: req.admin!.username,
      action: 'view_user',
      resource: 'user',
      resourceId: userId,
      details: {
        userId,
        userEmail: user.email
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    });

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user status
export const updateUserStatus = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { isActive, reason } = req.body;

    if (typeof isActive !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
      return;
    }

    const user = await User.findById(userId).exec();

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const previousStatus = user.status;
    user.status = isActive ? 'active' : 'suspended';

    await user.save();

    // Log the action
    await AuditService.logAction({
      adminId: req.admin!._id.toString(),
      adminUsername: req.admin!.username,
      action: 'update_user_status',
      resource: 'user',
      resourceId: userId,
      details: {
        userId,
        userEmail: user.email,
        previousStatus,
        newStatus: user.status,
        reason
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    });

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        userId: user._id,
        email: user.email,
        isActive: user.status === 'active'
      }
    });

  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateFilter = { createdAt: { $gte: thirtyDaysAgo } };

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today }
    });
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Analysis statistics
    const totalAnalyses = await Analysis.countDocuments();
    const completedAnalyses = await Analysis.countDocuments({ status: 'completed' });
    const failedAnalyses = await Analysis.countDocuments({ status: 'failed' });
    const analysesToday = await Analysis.countDocuments({
      createdAt: { $gte: today }
    });
    const analysesThisWeek = await Analysis.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    const analysesThisMonth = await Analysis.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Calculate success rate and average score
    const successRate = totalAnalyses > 0 ? completedAnalyses / totalAnalyses : 0;
    const averageScoreResult = await Analysis.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);
    const averageScore = averageScoreResult.length > 0 ? Math.round(averageScoreResult[0].avgScore * 100) / 100 : 0;

    // Popular industries and job titles
    const popularIndustries = await Analysis.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const popularJobTitles = await Analysis.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$jobTitle', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Feedback statistics
    const totalFeedback = await Feedback.countDocuments(dateFilter);
    const helpfulFeedback = await Feedback.countDocuments({ ...dateFilter, helpful: true });
    const feedbackToday = await Feedback.countDocuments({
      ...dateFilter,
      createdAt: { $gte: today }
    });
    const feedbackThisWeek = await Feedback.countDocuments({
      ...dateFilter,
      createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
    });
    const feedbackThisMonth = await Feedback.countDocuments({
      ...dateFilter,
      createdAt: { $gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Average feedback rating
    const avgRatingResult = await Feedback.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const averageRating = avgRatingResult.length > 0 ? Math.round(avgRatingResult[0].avgRating * 10) / 10 : 0;

    // Feedback by status
    const pendingFeedback = await Feedback.countDocuments({ ...dateFilter, status: 'pending' });
    const reviewedFeedback = await Feedback.countDocuments({ ...dateFilter, status: 'reviewed' });

    // Log the action
    await AuditService.logAction({
      adminId: req.admin!._id.toString(),
      adminUsername: req.admin!.username,
      action: 'view_dashboard_stats',
      resource: 'dashboard',
      details: {
        totalUsers,
        totalAnalyses
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    });

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
          newThisMonth: newUsersThisMonth
        },
        analyses: {
          total: totalAnalyses,
          completed: completedAnalyses,
          failed: failedAnalyses,
          successRate: Math.round(successRate * 100) / 100,
          averageScore,
          today: analysesToday,
          thisWeek: analysesThisWeek,
          thisMonth: analysesThisMonth
        },
        feedback: {
          total: totalFeedback,
          helpful: helpfulFeedback,
          helpfulPercentage: totalFeedback > 0 ? Math.round((helpfulFeedback / totalFeedback) * 100) : 0,
          averageRating,
          today: feedbackToday,
          thisWeek: feedbackThisWeek,
          thisMonth: feedbackThisMonth,
          pending: pendingFeedback,
          reviewed: reviewedFeedback
        },
        popularIndustries,
        popularJobTitles
      }
    });

  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get analyses statistics
export const getAnalysesStats = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get analyses by status
    const analysesByStatus = await Analysis.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get daily analysis counts
    const dailyAnalyses = await Analysis.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get top users by analysis count
    const topUsers = await Analysis.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          email: '$user.email',
          fullName: '$user.fullName',
          analysisCount: '$count'
        }
      }
    ]);

    // Calculate total analyses
    const totalAnalyses = dailyAnalyses.reduce((sum, day) => sum + day.count, 0);

    // Log the action
    await AuditService.logAction({
      adminId: req.admin!._id.toString(),
      adminUsername: req.admin!.username,
      action: 'view_analyses_stats',
      resource: 'analyses',
      details: {
        period: days,
        totalAnalyses
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    });

    res.status(200).json({
      success: true,
      data: {
        period: days,
        analysesByStatus,
        dailyAnalyses,
        topUsers
      }
    });

  } catch (error) {
    logger.error('Get analyses stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get analysis by ID
export const getAnalysisById = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { analysisId } = req.params;

    const analysis = await Analysis.findById(analysisId)
      .populate('userId', 'email fullName')
      .exec();

    if (!analysis) {
      res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
      return;
    }

    // Log the action
    await AuditService.logAction({
      adminId: req.admin!._id.toString(),
      adminUsername: req.admin!.username,
      action: 'view_analysis',
      resource: 'analysis',
      resourceId: analysisId,
      details: {
        analysisId,
        userId: analysis.userId?.toString() || 'anonymous'
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    });

    res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Get analysis by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get system health
export const getSystemHealth = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    
    // Database connection status
    const dbStatus = 'connected'; // This would be checked against actual DB connection
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryStatus = memoryUsage.heapUsed / memoryUsage.heapTotal < 0.8 ? 'healthy' : 'warning';
    
    // Uptime
    const uptime = process.uptime();
    
    // Recent errors (this would be implemented with actual error tracking)
    const recentErrors = 0;
    
    // Update system health config
    await SystemConfigService.setConfig('system_health', {
      lastHealthCheck: now,
      status: 'healthy',
      uptime,
      memoryUsage: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      }
    }, {
      type: 'object',
      description: 'System health status',
      category: 'system'
    }, req.admin!._id.toString());

    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: now,
        database: {
          status: dbStatus,
          connected: true
        },
        memory: {
          status: memoryStatus,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss
        },
        uptime: {
          seconds: uptime,
          formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
        },
        errors: {
          recent: recentErrors,
          status: recentErrors < 10 ? 'healthy' : 'warning'
        }
      }
    });

  } catch (error) {
    logger.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Export data
export const exportData = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { type, format = 'json', filters } = req.query;
    
    if (!type) {
      res.status(400).json({
        success: false,
        message: 'Export type is required'
      });
      return;
    }

    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'users':
        data = await User.find().select('-password').lean().exec();
        filename = `users_export_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'analyses':
        data = await Analysis.find()
          .populate('userId', 'email fullName')
          .lean()
          .exec();
        filename = `analyses_export_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'audit_logs':
        data = await AuditTrail.find().lean().exec();
        filename = `audit_logs_export_${new Date().toISOString().split('T')[0]}`;
        break;
        
      default:
        res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
        return;
    }

    // Log the export action
    await AuditService.logAction({
      adminId: req.admin!._id.toString(),
      adminUsername: req.admin!.username,
      action: 'export_data',
      resource: type,
      details: {
        type,
        source: 'admin_export',
        totalRecords: data.length,
        format: 'csv'
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    });

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json(data);
    }

  } catch (error) {
    logger.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Bulk update users
export const bulkUpdateUsers = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { userIds, updates } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
      return;
    }

    if (!updates || typeof updates !== 'object') {
      res.status(400).json({
        success: false,
        message: 'Updates object is required'
      });
      return;
    }

    // Validate allowed update fields
    const allowedFields = ['isActive', 'emailVerified'];
    const updateFields = Object.keys(updates);
    const invalidFields = updateFields.filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Invalid update fields: ${invalidFields.join(', ')}`
      });
      return;
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: updates }
    );

    // Log the action
    await AuditService.logAction({
      adminId: req.admin!._id.toString(),
      adminUsername: req.admin!.username,
      action: 'bulk_update_users',
      resource: 'users',
      details: {
        userIds,
        updates,
        modifiedCount: result.modifiedCount
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    });

    res.status(200).json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} users`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    logger.error('Bulk update users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

// Get enhanced analytics
export const getEnhancedAnalytics = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { period = '30', groupBy = 'day' } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // User growth analytics
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m',
              date: '$createdAt'
            }
          },
          newUsers: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Analysis trends
    const analysisTrends = await Analysis.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m',
                date: '$createdAt'
              }
            },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          totalAnalyses: { $sum: '$count' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // User engagement metrics
    const userEngagement = await Analysis.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          analysisCount: { $sum: 1 },
          lastAnalysis: { $max: '$createdAt' }
        }
      },
      {
        $group: {
          _id: null,
          totalActiveUsers: { $sum: 1 },
          avgAnalysesPerUser: { $avg: '$analysisCount' },
          maxAnalysesPerUser: { $max: '$analysisCount' },
          minAnalysesPerUser: { $min: '$analysisCount' }
        }
      }
    ]);

    // System performance metrics
    const systemMetrics = {
      averageResponseTime: 150, // This would be calculated from actual metrics
      errorRate: 0.02, // This would be calculated from actual error logs
      uptime: 99.9, // This would be calculated from actual uptime tracking
      activeConnections: 25 // This would be calculated from actual connection tracking
    };

    // Calculate totals
    const totalAnalyses = analysisTrends.reduce((sum, trend) => sum + trend.totalAnalyses, 0);
    const totalUsers = userGrowth.reduce((sum, growth) => sum + growth.newUsers, 0);

    // Log the action
    await AuditService.logAction({
      adminId: req.admin!._id.toString(),
      adminUsername: req.admin!.username,
      action: 'view_enhanced_analytics',
      resource: 'analytics',
      details: {
        period: days,
        groupBy,
        totalAnalyses,
        totalUsers
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    });

    res.status(200).json({
      success: true,
      data: {
        period: days,
        groupBy,
        userGrowth,
        analysisTrends,
        userEngagement: userEngagement[0] || {
          totalActiveUsers: 0,
          avgAnalysesPerUser: 0,
          maxAnalysesPerUser: 0,
          minAnalysesPerUser: 0
        },
        systemMetrics
      }
    });

  } catch (error) {
    logger.error('Get enhanced analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get audit logs
export const getAuditLogs = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string;
    const adminId = req.query.adminId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (action) filter.action = action;
    if (adminId) filter.adminId = adminId;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditTrail.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('adminId', 'username email')
      .exec();

    const totalLogs = await AuditTrail.countDocuments(filter);
    const totalPages = Math.ceil(totalLogs / limit);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          totalLogs,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get notifications
export const getNotifications = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const isRead = req.query.isRead as string;

    const skip = (page - 1) * limit;
    const filter: any = {};

    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const totalNotifications = await Notification.countDocuments(filter);
    const totalPages = Math.ceil(totalNotifications / limit);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          totalNotifications,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId).exec();

    if (!notification) {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
      return;
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Archive notification
export const archiveNotification = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId).exec();

    if (!notification) {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
      return;
    }

    notification.isArchived = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification archived',
      data: notification
    });

  } catch (error) {
    logger.error('Archive notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get system configs
export const getSystemConfigs = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const configs = await SystemConfig.find().exec();

    res.status(200).json({
      success: true,
      data: configs
    });

  } catch (error) {
    logger.error('Get system configs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update system config
export const updateSystemConfig = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (!key || value === undefined) {
      res.status(400).json({
        success: false,
        message: 'Config key and value are required'
      });
      return;
    }

    const existingConfig = await SystemConfigService.getConfig(key);
    const config = await SystemConfigService.setConfig(key, value, {
      type: typeof value === 'string' ? 'string' : typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'object',
      description: description || 'System configuration',
      category: 'system'
    }, req.admin!._id.toString());

    // Log the action
    await AuditService.logAction({
      adminId: req.admin!._id.toString(),
      adminUsername: req.admin!.username,
      action: 'update_system_config',
      resource: 'system_config',
      resourceId: key,
      details: {
        key,
        value,
        description,
        previousValue: existingConfig?.value
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    });

    res.status(200).json({
      success: true,
      message: 'System config updated successfully',
      data: config
    });

  } catch (error) {
    logger.error('Update system config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Cleanup data
export const cleanupData = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { type, days } = req.body;

    if (!type || !days) {
      res.status(400).json({
        success: false,
        message: 'Cleanup type and days are required'
      });
      return;
    }

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    switch (type) {
      case 'old_analyses':
        const result = await Analysis.deleteMany({
          createdAt: { $lt: cutoffDate },
          status: { $in: ['completed', 'failed'] }
        });
        deletedCount = result.deletedCount;
        break;

      case 'old_audit_logs':
        const auditResult = await AuditTrail.deleteMany({
          timestamp: { $lt: cutoffDate }
        });
        deletedCount = auditResult.deletedCount;
        break;

      case 'old_notifications':
        const notificationResult = await Notification.deleteMany({
          createdAt: { $lt: cutoffDate },
          isRead: true,
          isArchived: true
        });
        deletedCount = notificationResult.deletedCount;
        break;

      default:
        res.status(400).json({
          success: false,
          message: 'Invalid cleanup type'
        });
        return;
    }

    // Log the action
    await AuditService.logAction({
      adminId: req.admin!._id.toString(),
      adminUsername: req.admin!.username,
      action: 'cleanup_data',
      resource: type,
      details: {
        type,
        days,
        deletedCount
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    });

    res.status(200).json({
      success: true,
      message: `Successfully cleaned up ${deletedCount} ${type}`,
      data: {
        type,
        days,
        deletedCount,
        cutoffDate
      }
    });

  } catch (error) {
    logger.error('Cleanup data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Enhanced System Health
export const getEnhancedSystemHealth = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    // Database health
    const dbStats = { dataSize: 0, storageSize: 0, indexes: 0 }; // Simplified for now
    
    // Collection stats
    const userCount = await User.countDocuments();
    const analysisCount = await Analysis.countDocuments();
    const auditLogCount = await AuditTrail.countDocuments();
    const notificationCount = await Notification.countDocuments();
    const configCount = await SystemConfig.countDocuments();

    // Recent activity
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const recentAnalyses = await Analysis.countDocuments({
      createdAt: { $gte: lastHour }
    });
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: lastHour }
    });

    // Error rates
    const failedAnalyses = await Analysis.countDocuments({
      status: 'failed',
      createdAt: { $gte: lastHour }
    });
    const errorRate = recentAnalyses > 0 ? (failedAnalyses / recentAnalyses) * 100 : 0;

    // System performance
    const avgAnalysisTime = await Analysis.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          avgTime: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } }
        }
      }
    ]);

    const systemHealth = {
      database: {
        collections: {
          users: userCount,
          analyses: analysisCount,
          auditLogs: auditLogCount,
          notifications: notificationCount,
          configs: configCount
        },
        storage: {
          dataSize: dbStats.dataSize,
          storageSize: dbStats.storageSize,
          indexes: dbStats.indexes
        }
      },
      activity: {
        recentAnalyses,
        recentUsers,
        errorRate: Math.round(errorRate * 100) / 100,
        avgAnalysisTimeMs: avgAnalysisTime[0]?.avgTime || 0
      },
      status: 'healthy',
      timestamp: new Date()
    };

    // Log the health check
    await AuditService.logAction({
      adminId: req.admin!._id.toString(),
      adminUsername: req.admin!.username,
      action: 'view_system_health',
      resource: 'system',
      details: systemHealth,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      severity: 'low'
    });

    res.status(200).json({
      success: true,
      data: systemHealth
    });

  } catch (error) {
    logger.error('Enhanced system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system health'
    });
  }
}; 