"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = express_1.default.Router();
// Apply rate limiting to auth routes
const authLimiter = (0, rateLimiter_1.rateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
    message: 'Too many authentication attempts, please try again later.'
});
const otpLimiter = (0, rateLimiter_1.rateLimiter)({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // 3 OTP requests per minute
    message: 'Too many OTP requests, please try again later.'
});
// Public routes
router.post('/send-otp', otpLimiter, authController_1.sendOTP);
router.post('/register', authLimiter, authController_1.register);
router.post('/login', authLimiter, authController_1.login);
router.post('/forgot-password', authLimiter, authController_1.forgotPassword);
router.post('/reset-password', authLimiter, authController_1.resetPassword);
// Protected routes
router.get('/me', auth_1.authenticateToken, authController_1.getCurrentUser);
router.post('/logout', auth_1.authenticateToken, authController_1.logout);
router.put('/profile', auth_1.authenticateToken, authController_1.updateProfile);
router.put('/password', auth_1.authenticateToken, authController_1.updatePassword);
router.put('/notifications', auth_1.authenticateToken, authController_1.updateNotificationSettings);
router.delete('/account', auth_1.authenticateToken, authController_1.deleteAccount);
router.get('/export', auth_1.authenticateToken, authController_1.exportUserData);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map