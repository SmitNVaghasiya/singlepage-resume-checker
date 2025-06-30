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
import { authenticateToken } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Apply rate limiting to auth routes
const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many authentication attempts, please try again later.'
});

const otpLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 OTP requests per minute
  message: 'Too many OTP requests, please try again later.'
});

// Public routes
router.post('/send-otp', otpLimiter, sendOTP);
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', authenticateToken, logout);
router.put('/profile', authenticateToken, updateProfile);
router.put('/password', authenticateToken, updatePassword);
router.put('/notifications', authenticateToken, updateNotificationSettings);
router.delete('/account', authenticateToken, deleteAccount);
router.get('/export', authenticateToken, exportUserData);

export default router; 