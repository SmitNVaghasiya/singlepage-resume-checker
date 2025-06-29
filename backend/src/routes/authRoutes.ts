import express from 'express';
import { 
  register, 
  login, 
  logout, 
  getCurrentUser, 
  sendOTP 
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

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', authenticateToken, logout);

export default router; 