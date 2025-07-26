import { Request, Response } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

import { User, IUser } from '../models/User';
import { Admin, IAdmin } from '../admin/models/Admin';
import { emailService } from '../services/emailService';
import { emailValidationService } from '../services/emailValidationService';
import { logger } from '../utils/logger';
import { database } from '../config/database';

// In-memory OTP storage (in production, use Redis)
const otpStore = new Map<string, { otp: string; expires: Date; attempts: number }>();

// Generate OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret: Secret = process.env.JWT_SECRET || 'fallback-secret';
  const options: SignOptions = { expiresIn: process.env.JWT_EXPIRES_IN as any || '7d' };
  return jwt.sign({ userId: userId }, secret, options);
};

// Send OTP for email verification
export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required'
      });
      return;
    }

    // Comprehensive email validation
    const emailValidation = await emailValidationService.validateEmail(email);
    if (!emailValidation.isValid) {
      res.status(400).json({
        success: false,
        message: emailValidation.message
      });
      return;
    }

    // Check if email already exists and is verified
    const existingUser = await User.findOne({ email: email.toLowerCase() }).exec() as IUser | null;
    if (existingUser && existingUser.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already registered and verified'
      });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP (with rate limiting)
    const existingOTP = otpStore.get(email);
    if (existingOTP && existingOTP.attempts >= 5) {
      res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again later.'
      });
      return;
    }

    otpStore.set(email, {
      otp,
      expires,
      attempts: existingOTP ? existingOTP.attempts + 1 : 1
    });

    // Send OTP email
    const emailSent = await emailService.sendOTPEmail(email, otp);
    
    if (!emailSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
      return;
    }

    logger.info(`OTP sent to ${email}`);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email'
    });

  } catch (error) {
    logger.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Register user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, otp } = req.body;

    // Validation
    if (!username || !email || !password || !otp) {
      res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
      return;
    }

    // Validate username
    if (username.length < 3 || username.length > 30) {
      res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters'
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, and underscores'
      });
      return;
    }

    // Validate email
    const emailValidation = await emailValidationService.validateEmail(email);
    if (!emailValidation.isValid) {
      res.status(400).json({
        success: false,
        message: emailValidation.message
      });
      return;
    }

    // Validate password
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
      return;
    }

    // Verify OTP
    const storedOTP = otpStore.get(email.toLowerCase());
    if (!storedOTP) {
      res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new verification code.'
      });
      return;
    }

    if (storedOTP.expires < new Date()) {
      otpStore.delete(email.toLowerCase());
      res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new verification code.'
      });
      return;
    }

    if (storedOTP.otp !== otp) {
      res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    }).exec() as IUser | null;

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        res.status(400).json({
          success: false,
          message: 'Email is already registered'
        });
        return;
      } else {
        res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
        return;
      }
    }

    // Create user
    const user = new User({
      username,
      email: email.toLowerCase(),
      password,
      isEmailVerified: true // Since OTP is verified
    });

    await user.save();

    // Clean up OTP
    otpStore.delete(email.toLowerCase());

    // Generate JWT token
    const token = generateToken(String(user._id));

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.username);

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        location: user.location,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      },
      token
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      res.status(400).json({
        success: false,
        message: 'Email/username and password are required'
      });
      return;
    }

    // Check if database is connected
    if (!database.isConnectionActive()) {
      logger.error('Database not connected during login attempt');
      res.status(503).json({
        success: false,
        message: 'Authentication service temporarily unavailable. Please try again later.'
      });
      return;
    }

    // First, check if it's an admin login
    const admin = await Admin.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername }
      ]
    }).exec() as IAdmin | null;

    if (admin) {
      // Check if admin account is active and not locked
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

      // Check admin password
      const isAdminPasswordValid = await admin.comparePassword(password);
      if (isAdminPasswordValid) {
        // Reset login attempts on successful login
        admin.loginAttempts = 0;
        admin.lockUntil = undefined;
        admin.lastLogin = new Date();
        await admin.save();

        // Generate admin JWT token
        const adminToken = jwt.sign(
          { adminId: admin._id },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '24h' }
        );

        logger.info(`Admin logged in: ${admin.email}`);

        res.status(200).json({
          success: true,
          message: 'Admin login successful',
          isAdmin: true,
          admin: {
            id: admin._id,
            username: admin.username,
            email: admin.email,
            fullName: admin.fullName
          },
          token: adminToken
        });
        return;
      } else {
        // Increment login attempts for admin
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
    }

    // If not admin, proceed with regular user login
    const user = await Promise.race([
      User.findOne({
        $or: [
          { email: emailOrUsername.toLowerCase() },
          { username: emailOrUsername } // Keep original case for username
        ]
      }).exec(),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Database operation timeout')), 8000)
      )
    ]) as IUser | null;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
      return;
    }

    // Check if account is active
    if (user.status !== 'active') {
      res.status(401).json({
        success: false,
        message: 'Account is not active. Please contact support if you believe this is an error.'
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(String(user._id));

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      isAdmin: false,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        location: user.location,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      },
      token
    });

  } catch (error) {
    // Handle database timeout errors
    if (error instanceof Error && error.message === 'Database operation timeout') {
      logger.error('Login database timeout:', error);
      res.status(503).json({
        success: false,
        message: 'Authentication service temporarily unavailable. Please try again later.'
      });
      return;
    }

    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId; // Set by auth middleware

    // Check if database is connected
    if (!database.isConnectionActive()) {
      logger.error('Database not connected during getCurrentUser attempt');
      res.status(503).json({
        success: false,
        message: 'Authentication service temporarily unavailable'
      });
      return;
    }

    const user = await Promise.race([
      User.findById(userId).exec(),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Database operation timeout')), 5000)
      )
    ]) as IUser | null;

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check if account is active
    if (user.status !== 'active') {
      res.status(401).json({
        success: false,
        message: 'Account is not active. Please contact support if you believe this is an error.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        location: user.location,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    // Handle database timeout errors
    if (error instanceof Error && error.message === 'Database operation timeout') {
      logger.error('GetCurrentUser database timeout:', error);
      res.status(503).json({
        success: false,
        message: 'Authentication service temporarily unavailable'
      });
      return;
    }

    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout user (optional - mainly for clearing server-side sessions if used)
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // In JWT-based auth, logout is mainly handled client-side by removing the token
    // But we can log the event for security monitoring
    const userId = (req as any).userId;
    
    if (userId) {
      const user = await User.findById(userId).exec() as IUser | null;
      if (user) {
        logger.info(`User logged out: ${user.email}`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { username, fullName, email, location } = req.body;

    if (!username || !email) {
      res.status(400).json({
        success: false,
        message: 'Username and email are required'
      });
      return;
    }

    // Validate username
    if (username.length < 3 || username.length > 30) {
      res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters'
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, and underscores'
      });
      return;
    }

    // Validate email
    const emailValidation = await emailValidationService.validateEmail(email);
    if (!emailValidation.isValid) {
      res.status(400).json({
        success: false,
        message: emailValidation.message
      });
      return;
    }

    // Check if username or email already exists for other users
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: userId } },
        {
          $or: [
            { email: email.toLowerCase() },
            { username: username }
          ]
        }
      ]
    }).exec() as IUser | null;

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        res.status(400).json({
          success: false,
          message: 'Email is already registered to another account'
        });
        return;
      } else {
        res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
        return;
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        username, 
        email: email.toLowerCase(),
        ...(fullName !== undefined && { fullName }),
        ...(location !== undefined && { location })
      },
      { new: true }
    ).exec() as IUser | null;

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    logger.info(`User profile updated: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        location: user.location,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update password
export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
      return;
    }

    // Get user
    const user = await User.findById(userId).exec() as IUser | null;
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    // Check if the new password is the same as current password
    const isSameAsCurrentPassword = await user.comparePassword(newPassword);
    if (isSameAsCurrentPassword) {
      res.status(400).json({
        success: false,
        message: 'You cannot use your current password as the new password. Please choose a different password.'
      });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password updated for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    logger.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update notification settings (placeholder - can be extended with actual notification preferences)
export const updateNotificationSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    // const { analysisNotifications, accountActivityNotifications, marketingEmails } = req.body; // Removed unused variables

    // For now, we'll just acknowledge the settings update
    // In a real implementation, you'd store these preferences in the user model or a separate settings collection
    
    logger.info(`Notification settings updated for user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully'
    });

  } catch (error) {
    logger.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete user account
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    // Get user first to log the deletion
    const user = await User.findById(userId).exec() as IUser | null;
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Soft delete - mark account as deleted instead of hard delete
    // This allows for data recovery and future analytics
    await User.findByIdAndUpdate(userId, {
      status: 'deleted',
      // Optionally clear sensitive data
      password: 'deleted_account',
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
      passwordResetToken: undefined,
      passwordResetExpires: undefined
    });

    // IMPORTANT: Analysis data is preserved for:
    // 1. Account recovery - users can restore their analysis history
    // 2. Business analytics - understand user behavior and improve service
    // 3. Customer support - help users who contact support later
    // 4. Future outreach - contact users for feedback or new features
    // Analysis data includes: resume content, job descriptions, scores, recommendations

    logger.info(`User account deleted: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Export user data
export const exportUserData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    // Get user data
    const user = await User.findById(userId).exec() as IUser | null;
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Import Analysis model for fetching analysis history
    const { Analysis } = require('../models/Analysis');
    const { Feedback } = require('../models/Feedback');

    // Get user's analysis history
    const analyses = await Analysis.find({ userId: userId })
      .sort({ createdAt: -1 })
      .exec();

    // Get user's feedback submissions
    const feedbacks = await Feedback.find({ userId: userId })
      .sort({ createdAt: -1 })
      .exec();

    // Transform analyses to include full details
    const transformedAnalyses = analyses.map((analysis: any) => ({
      id: analysis._id,
      analysisId: analysis.analysisId,
      resumeFilename: analysis.resumeFilename,
      jobDescriptionFilename: analysis.jobDescriptionFilename,
      jobDescriptionText: analysis.jobDescriptionText,
      resumeText: analysis.resumeText,
      result: analysis.result,
      status: analysis.status,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
      processingTime: analysis.processingTime,
      industry: analysis.industry,
      jobTitle: analysis.jobTitle
    }));

    // Transform feedback to include full details
    const transformedFeedbacks = feedbacks.map((feedback: any) => ({
      id: feedback._id,
      analysisId: feedback.analysisId,
      rating: feedback.rating,
      helpful: feedback.helpful,
      suggestions: feedback.suggestions,
      category: feedback.category,
      status: feedback.status,
      adminNotes: feedback.adminNotes,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt
    }));

    // Calculate statistics
    const totalAnalyses = analyses.length;
    const completedAnalyses = analyses.filter((a: any) => a.status === 'completed').length;
    const averageScore = analyses.length > 0 
      ? analyses.reduce((sum: number, a: any) => {
          const score = a.result?.score_out_of_100 || a.result?.overallScore || 0;
          return sum + score;
        }, 0) / analyses.length 
      : 0;

    const userData = {
      profile: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        location: user.location,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      statistics: {
        totalAnalyses,
        completedAnalyses,
        averageScore: Math.round(averageScore * 100) / 100,
        totalFeedbacks: feedbacks.length
      },
      analyses: transformedAnalyses,
      feedbacks: transformedFeedbacks,
      exportedAt: new Date().toISOString(),
      note: 'This export contains your complete profile information, analysis history, and feedback submissions.'
    };

    logger.info(`Complete data export requested by user: ${user.email}`, {
      totalAnalyses,
      totalFeedbacks: feedbacks.length
    });

    res.status(200).json(userData);

  } catch (error) {
    logger.error('Export user data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required'
      });
      return;
    }

    // Comprehensive email validation
    const emailValidation = await emailValidationService.validateEmail(email);
    if (!emailValidation.isValid) {
      res.status(400).json({
        success: false,
        message: emailValidation.message
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).exec() as IUser | null;
    
    // Always return success for security (don't reveal if email exists)
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
      return;
    }

    // Check if user email is verified
    if (!user.isEmailVerified) {
      res.status(400).json({
        success: false,
        message: 'Please verify your email address first before resetting password'
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour instead of 30 minutes

    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpires;
    await user.save();

    logger.info(`Password reset token generated for: ${user.email}, expires at: ${resetTokenExpires}`);

    // Send password reset email
    const resetLink = `${process.env.FRONTEND_URL || 'https://singlepage-resume-checker.vercel.app'}/reset-password?token=${resetToken}`;
    const emailSent = await emailService.sendPasswordResetEmail(user.email, user.username, resetLink);
    
    if (!emailSent) {
      // Clean up the reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again.'
      });
      return;
    }

    logger.info(`Password reset requested for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    logger.info(`Password reset attempt with token: ${token ? token.substring(0, 10) + '...' : 'null'}`);

    if (!token || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
      return;
    }

    // First, find all users with the reset token (for debugging)
    const allUsersWithToken = await User.findOne({ passwordResetToken: token }).exec() as IUser | null;
    logger.info(`Users found with token: ${allUsersWithToken ? 'Yes' : 'No'}`);
    
    if (allUsersWithToken) {
      logger.info(`Token expiry: ${allUsersWithToken.passwordResetExpires}, Current time: ${new Date()}, Valid: ${allUsersWithToken.passwordResetExpires && allUsersWithToken.passwordResetExpires > new Date()}`);
    }

    // Find user by reset token and check expiry
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    }).exec() as IUser | null;

    if (!user) {
      // More specific error message
      const expiredUser = await User.findOne({ passwordResetToken: token }).exec() as IUser | null;
      if (expiredUser) {
        logger.info(`Token expired for user: ${expiredUser.email}`);
        res.status(400).json({
          success: false,
          message: 'Password reset token has expired. Please request a new password reset link.'
        });
        return;
      } else {
        logger.info(`No user found with token: ${token.substring(0, 10)}...`);
        res.status(400).json({
          success: false,
          message: 'Invalid password reset token. Please request a new password reset link.'
        });
        return;
      }
    }

    logger.info(`Found user for password reset: ${user.email}`);

    // Check if the new password is the same as current password
    const isSameAsCurrentPassword = await user.comparePassword(newPassword);
    if (isSameAsCurrentPassword) {
      logger.info(`User attempted to use current password as new password: ${user.email}`);
      res.status(400).json({
        success: false,
        message: 'You cannot use your current password as the new password. Please choose a different password.'
      });
      return;
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    logger.info(`Password reset successful for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 