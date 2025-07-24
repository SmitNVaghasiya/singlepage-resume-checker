import { Request, Response } from 'express';
import { Feedback, IFeedback } from '../models/Feedback';
import { Analysis } from '../models/Analysis';
import { User, IUser } from '../models/User';
import { AuditService } from '../services/auditService';
import { logger } from '../utils/logger';
// Removed uuid import - using crypto.randomUUID() instead

interface AuthRequest extends Request {
  user?: IUser;
  admin?: { _id: string; username?: string };
}

// Submit feedback for an analysis
export const submitFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { analysisId, rating, helpful, suggestions, category } = req.body;
    const userId = req.user?._id?.toString();

    // Validate required fields
    if (!analysisId || !rating || helpful === undefined || !suggestions) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: analysisId, rating, helpful, suggestions'
      });
      return;
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
      return;
    }

    // Validate suggestions length
    if (suggestions.length > 1000) {
      res.status(400).json({
        success: false,
        message: 'Suggestions must be less than 1000 characters'
      });
      return;
    }

    // Check if analysis exists
    const analysis = await Analysis.findOne({ analysisId }).exec();
    if (!analysis) {
      res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
      return;
    }

    // Check if user already submitted feedback for this analysis
    const existingFeedback = await Feedback.findOne({ 
      analysisId, 
      userId: userId || null 
    }).exec();

    if (existingFeedback) {
      res.status(409).json({
        success: false,
        message: 'Feedback already submitted for this analysis'
      });
      return;
    }

    // Create feedback
    const feedback = new Feedback({
      feedbackId: crypto.randomUUID(),
      analysisId,
      userId,
      rating,
      helpful,
      suggestions,
      category: category || 'general',
      status: 'pending'
    });

    await feedback.save();

    // Log the feedback submission (removed AuditService call as it's for admin actions only)

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedbackId: feedback.feedbackId
      }
    });

  } catch (error) {
    logger.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get feedback for an analysis (for users to see their own feedback)
export const getFeedbackByAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { analysisId } = req.params;
    const userId = req.user?._id?.toString();

    if (!analysisId) {
      res.status(400).json({
        success: false,
        message: 'Analysis ID is required'
      });
      return;
    }

    const feedback = await Feedback.findOne({ 
      analysisId, 
      userId: userId || null 
    }).exec();

    if (!feedback) {
      res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: feedback
    });

  } catch (error) {
    logger.error('Error getting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Admin: Get all feedback with pagination and filters
export const getAllFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      rating,
      helpful,
      startDate,
      endDate,
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (rating) filter.rating = parseInt(rating as string);
    if (helpful !== undefined) filter.helpful = helpful === 'true';

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    if (search) {
      filter.$or = [
        { suggestions: { $regex: search, $options: 'i' } },
        { adminNotes: { $regex: search, $options: 'i' } }
      ];
    }

    // Get feedback with analysis details
    const feedback = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .exec();

    // Get total count for pagination
    const total = await Feedback.countDocuments(filter);

    // Get analysis details for each feedback
    const feedbackWithAnalysis = await Promise.all(
      feedback.map(async (fb) => {
        const analysis = await Analysis.findOne({ analysisId: fb.analysisId })
          .select('resumeFilename jobDescriptionFilename jobTitle industry createdAt')
          .exec();

        return {
          ...fb.toObject(),
          analysis: analysis || null
        };
      })
    );

    res.status(200).json({
      success: true,
      data: feedbackWithAnalysis,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    logger.error('Error getting all feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Admin: Get feedback statistics
export const getFeedbackStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
    }

    const filter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Get various statistics
    const [
      totalFeedback,
      averageRating,
      helpfulCount,
      notHelpfulCount,
      statusCounts,
      categoryCounts,
      ratingDistribution
    ] = await Promise.all([
      Feedback.countDocuments(filter),
      Feedback.aggregate([
        { $match: filter },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]),
      Feedback.countDocuments({ ...filter, helpful: true }),
      Feedback.countDocuments({ ...filter, helpful: false }),
      Feedback.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Feedback.aggregate([
        { $match: filter },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Feedback.aggregate([
        { $match: filter },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const stats = {
      totalFeedback,
      averageRating: averageRating[0]?.avgRating || 0,
      helpfulPercentage: totalFeedback > 0 ? (helpfulCount / totalFeedback) * 100 : 0,
      statusBreakdown: statusCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      categoryBreakdown: categoryCounts.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      ratingDistribution: ratingDistribution.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error getting feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Admin: Update feedback status and add notes
export const updateFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { feedbackId } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.admin?._id;

    if (!feedbackId) {
      res.status(400).json({
        success: false,
        message: 'Feedback ID is required'
      });
      return;
    }

    const feedback = await Feedback.findOne({ feedbackId }).exec();
    if (!feedback) {
      res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
      return;
    }

    // Update fields
    if (status) {
      feedback.status = status;
      if (status === 'reviewed' || status === 'addressed') {
        feedback.reviewedAt = new Date();
        feedback.reviewedBy = adminId;
      }
    }

    if (adminNotes !== undefined) {
      feedback.adminNotes = adminNotes;
    }

    await feedback.save();

    // Log the admin action
    await AuditService.logAction({
      adminId: adminId || 'unknown',
      adminUsername: req.admin?.username || 'admin',
      action: 'feedback_updated',
      resource: 'feedback',
      resourceId: feedbackId,
      details: {
        feedbackId,
        status,
        adminNotes
      },
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    });

    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      data: feedback
    });

  } catch (error) {
    logger.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Admin: Get feedback by ID
export const getFeedbackById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { feedbackId } = req.params;

    if (!feedbackId) {
      res.status(400).json({
        success: false,
        message: 'Feedback ID is required'
      });
      return;
    }

    const feedback = await Feedback.findOne({ feedbackId }).exec();
    if (!feedback) {
      res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
      return;
    }

    // Get analysis details
    const analysis = await Analysis.findOne({ analysisId: feedback.analysisId })
      .select('resumeFilename jobDescriptionFilename jobTitle industry createdAt result')
      .exec();

    res.status(200).json({
      success: true,
      data: {
        ...feedback.toObject(),
        analysis: analysis || null
      }
    });

  } catch (error) {
    logger.error('Error getting feedback by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 