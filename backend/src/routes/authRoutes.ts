import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getCurrentUser, 
  sendOTP,
  updateProfile,
  updatePassword,
  updateNotificationSettings,
  deleteAccount,
  exportUserData,
  forgotPassword,
  resetPassword
} from '../controllers/authController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Create specific rate limiters for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 OTP requests per minute
  message: {
    error: 'Too Many Requests',
    message: 'Too many OTP requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/send-otp', otpLimiter, sendOTP);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', authenticateToken, logout);
router.put('/profile', authenticateToken, updateProfile);
router.put('/password', authenticateToken, updatePassword);
router.put('/notifications', authenticateToken, updateNotificationSettings);
router.delete('/account', authenticateToken, deleteAccount);
router.post('/export-data', authenticateToken, exportUserData);

// Lightweight token validation endpoint for faster auth checks
router.get('/validate-token', optionalAuth, (req, res) => {
  const userId = (req as any).userId;
  const user = (req as any).user;
  
  if (userId && user) {
    res.status(200).json({
      success: true,
      valid: true,
      userId,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } else {
    res.status(401).json({
      success: false,
      valid: false,
      message: 'Invalid or missing token'
    });
  }
});

export default router; 