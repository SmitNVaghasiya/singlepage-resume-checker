import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { User, IUser } from '../models/User';
import { emailService } from '../services/emailService';
import { logger } from '../utils/logger';

// In-memory OTP storage (in production, use Redis)
const otpStore = new Map<string, { otp: string; expires: Date; attempts: number }>();

// Generate OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Send OTP for email verification
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if email already exists and is verified
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered and verified'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP (with rate limiting)
    const existingOTP = otpStore.get(email);
    if (existingOTP && existingOTP.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again later.'
      });
    }

    otpStore.set(email, {
      otp,
      expires,
      attempts: existingOTP ? existingOTP.attempts + 1 : 1
    });

    // Send OTP email
    const emailSent = await emailService.sendOTPEmail(email, otp);
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
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
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, otp } = req.body;

    // Validation
    if (!username || !email || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate username
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, and underscores'
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Verify OTP
    const storedOTP = otpStore.get(email.toLowerCase());
    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new verification code.'
      });
    }

    if (storedOTP.expires < new Date()) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new verification code.'
      });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
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
    const token = generateToken(user._id.toString());

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.username);

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
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
export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/username and password are required'
      });
    }

    // Find user by email or username
    // Email is case-insensitive (stored lowercase), username is case-sensitive
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername } // Keep original case for username
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      },
      token
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId; // Set by auth middleware

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout user (optional - mainly for clearing server-side sessions if used)
export const logout = async (req: Request, res: Response) => {
  try {
    // In JWT-based auth, logout is mainly handled client-side by removing the token
    // But we can log the event for security monitoring
    const userId = (req as any).userId;
    
    if (userId) {
      const user = await User.findById(userId);
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