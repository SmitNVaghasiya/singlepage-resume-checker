import { User } from '../../models/User';
import { Analysis } from '../../models/Analysis';
import { Feedback } from '../../models/Feedback';
import { AuditTrail } from '../../models/AuditTrail';
import { logger } from '../../utils/logger';

export class AdminUserService {
  /**
   * Get all users with pagination and filtering
   */
  static async getAllUsers(page: number = 1, limit: number = 10, filters: any = {}) {
    try {
      const skip = (page - 1) * limit;
      
      // Build query based on filters
      const query: any = {};
      
      if (filters.search) {
        query.$or = [
          { username: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
          { firstName: { $regex: filters.search, $options: 'i' } },
          { lastName: { $regex: filters.search, $options: 'i' } }
        ];
      }
      
      if (filters.status !== undefined) {
        query.isActive = filters.status === 'active';
      }
      
      if (filters.role) {
        query.role = filters.role;
      }
      
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) {
          query.createdAt.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.createdAt.$lte = new Date(filters.dateTo);
        }
      }

      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await User.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID with detailed information
   */
  static async getUserById(userId: string) {
    try {
      const user = await User.findById(userId).select('-password').lean();
      
      if (!user) {
        throw new Error('User not found');
      }

      // Get user statistics
      const analysisCount = await Analysis.countDocuments({ userId });
      const completedAnalyses = await Analysis.countDocuments({ 
        userId, 
        status: 'completed' 
      });
      const feedbackCount = await Feedback.countDocuments({ userId });
      
      // Get recent activity
      const recentAnalyses = await Analysis.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('status createdAt analysisType')
        .lean();

      const recentFeedback = await Feedback.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('rating comment createdAt')
        .lean();

      return {
        user,
        statistics: {
          totalAnalyses: analysisCount,
          completedAnalyses,
          successRate: analysisCount > 0 ? (completedAnalyses / analysisCount) * 100 : 0,
          feedbackCount
        },
        recentActivity: {
          analyses: recentAnalyses,
          feedback: recentFeedback
        }
      };
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Update user status (active/inactive)
   */
  static async updateUserStatus(userId: string, isActive: boolean, adminId: string) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const oldStatus = user.status;
      user.status = isActive ? 'active' : 'suspended';
      await user.save();

      // Log the action
      await AuditTrail.create({
        adminId,
        action: 'update_user_status',
        resource: 'user',
        resourceId: userId,
        details: {
          userId,
          oldStatus,
          newStatus: isActive,
          reason: isActive ? 'Account activated' : 'Account deactivated'
        },
        ipAddress: 'admin',
        userAgent: 'admin',
        severity: 'medium'
      });

      return {
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isActive: user.status === 'active'
        }
      };
    } catch (error) {
      logger.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Bulk update users
   */
  static async bulkUpdateUsers(userIds: string[], updates: any, adminId: string) {
    try {
      const results = [];
      const errors = [];

      for (const userId of userIds) {
        try {
          const user = await User.findById(userId);
          
          if (!user) {
            errors.push({ userId, error: 'User not found' });
            continue;
          }

          // Apply updates
          Object.keys(updates).forEach(key => {
            if (key !== 'password' && key !== '_id' && key in user) {
              (user as any)[key] = updates[key];
            }
          });

          await user.save();

          // Log the action
          await AuditTrail.create({
            adminId,
            action: 'bulk_update_user',
            resource: 'user',
            resourceId: userId,
            details: {
              userId,
              updates,
              reason: 'Bulk update operation'
            },
            ipAddress: 'admin',
            userAgent: 'admin',
            severity: 'medium'
          });

          results.push({
            userId,
            success: true,
            message: 'User updated successfully'
          });
        } catch (error) {
          errors.push({ userId, error: (error as Error).message });
        }
      }

      return {
        success: true,
        results,
        errors,
        summary: {
          total: userIds.length,
          successful: results.length,
          failed: errors.length
        }
      };
    } catch (error) {
      logger.error('Error in bulk update users:', error);
      throw error;
    }
  }

  /**
   * Delete user and all associated data
   */
  static async deleteUser(userId: string, adminId: string) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Delete associated data
      await Analysis.deleteMany({ userId });
      await Feedback.deleteMany({ userId });
      
      // Log the deletion
      await AuditTrail.create({
        adminId,
        action: 'delete_user',
        resource: 'user',
        resourceId: userId,
        details: {
          userId,
          username: user.username,
          email: user.email,
          reason: 'Admin deletion'
        },
        ipAddress: 'admin',
        userAgent: 'admin',
        severity: 'high'
      });

      // Delete the user
      await User.findByIdAndDelete(userId);

      return {
        success: true,
        message: 'User and all associated data deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(userId: string) {
    try {
      const user = await User.findById(userId).select('-password').lean();
      
      if (!user) {
        throw new Error('User not found');
      }

      // Analysis statistics
      const analyses = await Analysis.find({ userId }).lean();
      const completedAnalyses = analyses.filter(a => a.status === 'completed');
      const failedAnalyses = analyses.filter(a => a.status === 'failed');
      
      // Feedback statistics
      const feedback = await Feedback.find({ userId }).lean();
      const avgRating = feedback.length > 0 
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length 
        : 0;

      // Activity timeline
      const activityTimeline = await this.getUserActivityTimeline(userId);

      return {
        user,
        analytics: {
          analyses: {
            total: analyses.length,
            completed: completedAnalyses.length,
            failed: failedAnalyses.length,
            successRate: analyses.length > 0 ? (completedAnalyses.length / analyses.length) * 100 : 0,
            avgTime: this.calculateAverageAnalysisTime(completedAnalyses)
          },
          feedback: {
            total: feedback.length,
            avgRating: Math.round(avgRating * 100) / 100,
            positive: feedback.filter(f => f.rating >= 4).length,
            negative: feedback.filter(f => f.rating <= 2).length
          },
          activity: {
            lastLogin: user.updatedAt, // Using updatedAt as proxy for last activity
            accountAge: Date.now() - new Date(user.createdAt).getTime(),
            totalSessions: 0 // User model doesn't track login count
          }
        },
        timeline: activityTimeline
      };
    } catch (error) {
      logger.error('Error getting user analytics:', error);
      throw error;
    }
  }

  /**
   * Get user activity timeline
   */
  static async getUserActivityTimeline(userId: string) {
    try {
      const timeline: any[] = [];

      // Get analyses
      const analyses = await Analysis.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      analyses.forEach(analysis => {
        timeline.push({
          type: 'analysis',
          date: analysis.createdAt,
          status: analysis.status,
          details: `Analysis ${analysis.status}`
        });
      });

      // Get feedback
      const feedback = await Feedback.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      feedback.forEach(fb => {
        timeline.push({
          type: 'feedback',
          date: fb.createdAt,
          rating: fb.rating,
          details: `Feedback submitted (${fb.rating}/5)`
        });
      });

      // Sort by date
      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return timeline.slice(0, 30); // Return last 30 activities
    } catch (error) {
      logger.error('Error getting user activity timeline:', error);
      return [];
    }
  }

  /**
   * Calculate average analysis time
   */
  private static calculateAverageAnalysisTime(analyses: any[]) {
    if (analyses.length === 0) return 0;
    
    const totalTime = analyses.reduce((sum, analysis) => {
      const duration = new Date(analysis.updatedAt).getTime() - new Date(analysis.createdAt).getTime();
      return sum + duration;
    }, 0);
    
    return Math.round(totalTime / analyses.length);
  }

  /**
   * Search users
   */
  static async searchUsers(query: string, limit: number = 10) {
    try {
      const users = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { fullName: { $regex: query, $options: 'i' } }
        ]
      })
        .select('username email fullName status createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return users;
    } catch (error) {
      logger.error('Error searching users:', error);
      throw error;
    }
  }
} 