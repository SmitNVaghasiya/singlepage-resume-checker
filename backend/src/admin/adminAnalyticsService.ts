import { User } from '../models/User';
import { Analysis } from '../models/Analysis';
import { Feedback } from '../models/Feedback';
import { AuditTrail } from '../models/AuditTrail';
import { Notification } from '../models/Notification';
import { SystemConfig } from '../models/SystemConfig';
import { logger } from '../utils/logger';

export class AdminAnalyticsService {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getDashboardStats() {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // User statistics
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const newUsers24h = await User.countDocuments({ createdAt: { $gte: last24Hours } });
      const newUsers7d = await User.countDocuments({ createdAt: { $gte: last7Days } });
      const newUsers30d = await User.countDocuments({ createdAt: { $gte: last30Days } });

      // Analysis statistics
      const totalAnalyses = await Analysis.countDocuments();
      const completedAnalyses = await Analysis.countDocuments({ status: 'completed' });
      const failedAnalyses = await Analysis.countDocuments({ status: 'failed' });
      const pendingAnalyses = await Analysis.countDocuments({ status: 'pending' });
      const analyses24h = await Analysis.countDocuments({ createdAt: { $gte: last24Hours } });
      const analyses7d = await Analysis.countDocuments({ createdAt: { $gte: last7Days } });

      // Feedback statistics
      const totalFeedback = await Feedback.countDocuments();
      const positiveFeedback = await Feedback.countDocuments({ rating: { $gte: 4 } });
      const negativeFeedback = await Feedback.countDocuments({ rating: { $lte: 2 } });

      // System statistics
      const totalAuditLogs = await AuditTrail.countDocuments();
      const totalNotifications = await Notification.countDocuments();
      const unreadNotifications = await Notification.countDocuments({ isRead: false });

      // Performance metrics
      const avgAnalysisTime = await Analysis.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            avgTime: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } }
          }
        }
      ]);

      const successRate = totalAnalyses > 0 ? (completedAnalyses / totalAnalyses) * 100 : 0;
      const avgRating = await Feedback.aggregate([
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' }
          }
        }
      ]);

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          new24h: newUsers24h,
          new7d: newUsers7d,
          new30d: newUsers30d,
          growthRate: newUsers7d > 0 ? ((newUsers24h / newUsers7d) * 100).toFixed(2) : '0'
        },
        analyses: {
          total: totalAnalyses,
          completed: completedAnalyses,
          failed: failedAnalyses,
          pending: pendingAnalyses,
          last24h: analyses24h,
          last7d: analyses7d,
          successRate: Math.round(successRate * 100) / 100,
          avgTimeMs: avgAnalysisTime[0]?.avgTime || 0
        },
        feedback: {
          total: totalFeedback,
          positive: positiveFeedback,
          negative: negativeFeedback,
          avgRating: avgRating[0]?.avgRating || 0,
          satisfactionRate: totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0
        },
        system: {
          auditLogs: totalAuditLogs,
          notifications: totalNotifications,
          unreadNotifications,
          uptime: process.uptime()
        },
        trends: {
          userGrowth: await this.getUserGrowthTrend(),
          analysisTrend: await this.getAnalysisTrend(),
          performanceTrend: await this.getPerformanceTrend()
        }
      };
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get user growth trend over time
   */
  static async getUserGrowthTrend() {
    try {
      const now = new Date();
      const days = 30;
      const trend = [];

      for (let i = days - 1; i >= 0; i--) {
        const startDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const endDate = new Date(now.getTime() - (i - 1) * 24 * 60 * 60 * 1000);
        
        const count = await User.countDocuments({
          createdAt: { $gte: startDate, $lt: endDate }
        });

        trend.push({
          date: startDate.toISOString().split('T')[0],
          count
        });
      }

      return trend;
    } catch (error) {
      logger.error('Error getting user growth trend:', error);
      return [];
    }
  }

  /**
   * Get analysis trend over time
   */
  static async getAnalysisTrend() {
    try {
      const now = new Date();
      const days = 30;
      const trend = [];

      for (let i = days - 1; i >= 0; i--) {
        const startDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const endDate = new Date(now.getTime() - (i - 1) * 24 * 60 * 60 * 1000);
        
        const total = await Analysis.countDocuments({
          createdAt: { $gte: startDate, $lt: endDate }
        });

        const completed = await Analysis.countDocuments({
          createdAt: { $gte: startDate, $lt: endDate },
          status: 'completed'
        });

        const failed = await Analysis.countDocuments({
          createdAt: { $gte: startDate, $lt: endDate },
          status: 'failed'
        });

        trend.push({
          date: startDate.toISOString().split('T')[0],
          total,
          completed,
          failed,
          successRate: total > 0 ? (completed / total) * 100 : 0
        });
      }

      return trend;
    } catch (error) {
      logger.error('Error getting analysis trend:', error);
      return [];
    }
  }

  /**
   * Get performance trend over time
   */
  static async getPerformanceTrend() {
    try {
      const now = new Date();
      const days = 7;
      const trend = [];

      for (let i = days - 1; i >= 0; i--) {
        const startDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const endDate = new Date(now.getTime() - (i - 1) * 24 * 60 * 60 * 1000);
        
        const avgTime = await Analysis.aggregate([
          {
            $match: {
              status: 'completed',
              createdAt: { $gte: startDate, $lt: endDate }
            }
          },
          {
            $group: {
              _id: null,
              avgTime: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } }
            }
          }
        ]);

        trend.push({
          date: startDate.toISOString().split('T')[0],
          avgTimeMs: avgTime[0]?.avgTime || 0
        });
      }

      return trend;
    } catch (error) {
      logger.error('Error getting performance trend:', error);
      return [];
    }
  }

  /**
   * Get enhanced analytics with detailed breakdowns
   */
  static async getEnhancedAnalytics() {
    try {
      const dashboardStats = await this.getDashboardStats();
      
      // Additional detailed analytics
      const userDemographics = await this.getUserDemographics();
      const analysisBreakdown = await this.getAnalysisBreakdown();
      const systemMetrics = await this.getSystemMetrics();

      return {
        ...dashboardStats,
        demographics: userDemographics,
        analysisBreakdown,
        systemMetrics
      };
    } catch (error) {
      logger.error('Error getting enhanced analytics:', error);
      throw error;
    }
  }

  /**
   * Get user demographics
   */
  static async getUserDemographics() {
    try {
      const totalUsers = await User.countDocuments();
      
      // Registration method breakdown
      const emailUsers = await User.countDocuments({ email: { $exists: true, $ne: '' } });
      const googleUsers = await User.countDocuments({ googleId: { $exists: true, $ne: null } });
      
      // Active vs inactive
      const activeUsers = await User.countDocuments({ isActive: true });
      const inactiveUsers = totalUsers - activeUsers;

      return {
        total: totalUsers,
        registrationMethod: {
          email: emailUsers,
          google: googleUsers,
          other: totalUsers - emailUsers - googleUsers
        },
        status: {
          active: activeUsers,
          inactive: inactiveUsers
        }
      };
    } catch (error) {
      logger.error('Error getting user demographics:', error);
      return {};
    }
  }

  /**
   * Get analysis breakdown by type and status
   */
  static async getAnalysisBreakdown() {
    try {
      const totalAnalyses = await Analysis.countDocuments();
      
      // Status breakdown
      const statusBreakdown = await Analysis.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Type breakdown (if analysis type exists)
      const typeBreakdown = await Analysis.aggregate([
        {
          $group: {
            _id: '$analysisType',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        total: totalAnalyses,
        byStatus: statusBreakdown,
        byType: typeBreakdown
      };
    } catch (error) {
      logger.error('Error getting analysis breakdown:', error);
      return {};
    }
  }

  /**
   * Get system metrics
   */
  static async getSystemMetrics() {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      return {
        memory: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss,
          heapUsagePercentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        process: {
          uptime: process.uptime(),
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid
        }
      };
    } catch (error) {
      logger.error('Error getting system metrics:', error);
      return {};
    }
  }
} 