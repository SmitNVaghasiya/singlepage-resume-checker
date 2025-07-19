import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Admin, IAdmin } from '../models/Admin';
import { User } from '../models/User';
import { Analysis } from '../models/Analysis';
import { logger } from '../utils/logger';
import { config } from '../config/config';

interface AdminRequest extends Request {
  admin?: IAdmin;
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
      { adminId: admin._id },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName
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

// Get current admin
export const getCurrentAdmin = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Admin not authenticated'
      });
      return;
    }

    res.status(200).json({
      success: true,
      admin: {
        id: req.admin._id,
        username: req.admin.username,
        email: req.admin.email,
        fullName: req.admin.fullName,
        lastLogin: req.admin.lastLogin
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

// User Management
export const getAllUsers = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const skip = (page - 1) * limit;
    const query: any = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    const users = await User.find(query)
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Get analysis count for each user
    const usersWithAnalysisCount = await Promise.all(
      users.map(async (user) => {
        const analysisCount = await Analysis.countDocuments({ userId: user._id });
        return {
          ...user.toObject(),
          analysisCount
        };
      })
    );

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: usersWithAnalysisCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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

export const getUserById = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -emailVerificationToken -passwordResetToken')
      .exec();

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Get user's analysis count
    const analysisCount = await Analysis.countDocuments({ userId: user._id });

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        analysisCount
      }
    });

  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateUserStatus = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'deleted'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('-password -emailVerificationToken -passwordResetToken');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    logger.info(`Admin ${req.admin?.username} updated user ${user.username} status to ${status}`);

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Analytics and Statistics
export const getDashboardStats = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { timeRange, startDate, endDate } = req.query;
    
    let dateFilter: any = {};
    
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let startTime: Date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default value
      
      switch (timeRange) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '1d':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '15d':
          startTime = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '6m':
          startTime = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          if (startDate && endDate) {
            dateFilter = {
              createdAt: {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
              }
            };
          }
          break;
        default:
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      if (timeRange !== 'custom') {
        dateFilter = { createdAt: { $gte: startTime } };
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today }
    });
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
    });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Analysis statistics with time filter
    const totalAnalyses = await Analysis.countDocuments(dateFilter);
    const completedAnalyses = await Analysis.countDocuments({ 
      ...dateFilter,
      status: 'completed' 
    });
    const failedAnalyses = await Analysis.countDocuments({ 
      ...dateFilter,
      status: 'failed' 
    });
    const analysesToday = await Analysis.countDocuments({
      ...dateFilter,
      createdAt: { $gte: today }
    });
    const analysesThisWeek = await Analysis.countDocuments({
      ...dateFilter,
      createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
    });
    const analysesThisMonth = await Analysis.countDocuments({
      ...dateFilter,
      createdAt: { $gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Success rate
    const successRate = totalAnalyses > 0 ? (completedAnalyses / totalAnalyses) * 100 : 0;

    // Average scores
    const avgScoreResult = await Analysis.aggregate([
      { $match: { ...dateFilter, status: 'completed', 'result.overallScore': { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: '$result.overallScore' } } }
    ]);
    const averageScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

    // Popular industries
    const popularIndustries = await Analysis.aggregate([
      { $match: { ...dateFilter, status: 'completed', 'result.industry': { $exists: true } } },
      { $group: { _id: '$result.industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Popular job titles
    const popularJobTitles = await Analysis.aggregate([
      { $match: { ...dateFilter, status: 'completed', 'result.jobTitle': { $exists: true } } },
      { $group: { _id: '$result.jobTitle', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

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

// Enhanced Analysis Statistics
export const getAnalysesStats = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const { timeRange, startDate, endDate } = req.query;
    
    const skip = (page - 1) * limit;
    const query: any = {};

    if (status) {
      query.status = status;
    }

    // Apply time-based filtering
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let startTime: Date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default value
      
      switch (timeRange) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '1d':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '15d':
          startTime = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '6m':
          startTime = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          if (startDate && endDate) {
            query.createdAt = {
              $gte: new Date(startDate as string),
              $lte: new Date(endDate as string)
            };
          }
          break;
        default:
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      if (timeRange !== 'custom') {
        query.createdAt = { $gte: startTime };
      }
    }

    const analyses = await Analysis.find(query)
      .populate('userId', 'username email fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await Analysis.countDocuments(query);

    // Transform data for frontend
    const transformedAnalyses = analyses.map(analysis => ({
      id: (analysis._id as any).toString(),
      userId: typeof analysis.userId === 'object' && analysis.userId ? (analysis.userId as any).username || 'Unknown' : 'Unknown',
      jobTitle: analysis.result?.jobTitle || 'N/A',
      industry: analysis.result?.industry || 'N/A',
      status: analysis.status,
      overallScore: analysis.result?.overallScore || 'N/A',
      createdAt: analysis.createdAt,
      result: analysis.result
    }));

    res.status(200).json({
      success: true,
      data: transformedAnalyses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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

export const getAnalysisById = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { analysisId } = req.params;

    const analysis = await Analysis.findOne({ analysisId })
      .populate('userId', 'username email fullName')
      .exec();

    if (!analysis) {
      res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      analysis
    });

  } catch (error) {
    logger.error('Get analysis by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// System Health
export const getSystemHealth = async (_req: AdminRequest, res: Response): Promise<void> => {
  try {
    // Database health check
    let dbStatus = 'unknown';
    try {
      const dbStatusResult = await Analysis.db?.db?.admin().ping();
      dbStatus = dbStatusResult ? 'healthy' : 'unhealthy';
    } catch (error) {
      dbStatus = 'error';
      logger.error('Database health check failed:', error);
    }

    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    res.status(200).json({
      success: true,
      health: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        },
        database: {
          status: dbStatus
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

// Data Export
export const exportData = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { type, timeRange, startDate, endDate, format = 'csv' } = req.query;
    
    let dateFilter: any = {};
    
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      let startTime: Date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default value
      
      switch (timeRange) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '1d':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '15d':
          startTime = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '6m':
          startTime = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          if (startDate && endDate) {
            dateFilter = {
              createdAt: {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
              }
            };
          }
          break;
        default:
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      if (timeRange !== 'custom') {
        dateFilter = { createdAt: { $gte: startTime } };
      }
    }

    let data: any[] = [];
    let filename = '';

    if (type === 'users') {
      const users = await User.find(dateFilter)
        .select('-password -emailVerificationToken -passwordResetToken')
        .sort({ createdAt: -1 })
        .exec();

      data = users.map(user => ({
        id: (user._id as any).toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        status: user.status,
        createdAt: user.createdAt
      }));
      filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'analyses') {
      const analyses = await Analysis.find(dateFilter)
        .populate('userId', 'username email fullName')
        .sort({ createdAt: -1 })
        .exec();

      data = analyses.map(analysis => ({
        id: (analysis._id as any).toString(),
        userId: typeof analysis.userId === 'object' && analysis.userId ? (analysis.userId as any).username || 'Unknown' : 'Unknown',
        jobTitle: analysis.result?.jobTitle || 'N/A',
        industry: analysis.result?.industry || 'N/A',
        status: analysis.status,
        overallScore: analysis.result?.overallScore || 'N/A',
        createdAt: analysis.createdAt
      }));
      filename = `analyses_export_${new Date().toISOString().split('T')[0]}.csv`;
    }

    let exportData = '';
    let contentType = '';

    if (format === 'csv') {
      exportData = convertToCSV(data);
      contentType = 'text/csv';
      filename += '.csv';
    } else if (format === 'json') {
      exportData = JSON.stringify(data, null, 2);
      contentType = 'application/json';
      filename += '.json';
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported format'
      });
      return;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);

  } catch (error) {
    logger.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Bulk Operations
export const bulkUpdateUsers = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { userIds, action } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
      return;
    }

    if (!action || !['activate', 'suspend', 'delete'].includes(action)) {
      res.status(400).json({
        success: false,
        message: 'Valid action is required (activate, suspend, delete)'
      });
      return;
    }

    let updateData: any = {};
    
    switch (action) {
      case 'activate':
        updateData = { status: 'active' };
        break;
      case 'suspend':
        updateData = { status: 'suspended' };
        break;
      case 'delete':
        updateData = { status: 'deleted' };
        break;
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updateData
    );

    // Log the bulk action for audit trail
    logger.info(`Admin ${req.admin?.username} performed bulk ${action} on ${userIds.length} users`);

    res.status(200).json({
      success: true,
      message: `Successfully ${action}ed ${result.modifiedCount} users`,
      modifiedCount: result.modifiedCount
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
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}; 