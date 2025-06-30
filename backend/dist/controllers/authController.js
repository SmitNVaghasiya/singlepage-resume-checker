"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.exportUserData = exports.deleteAccount = exports.updateNotificationSettings = exports.updatePassword = exports.updateProfile = exports.logout = exports.getCurrentUser = exports.login = exports.register = exports.sendOTP = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../models/User");
const emailService_1 = require("../services/emailService");
const logger_1 = require("../utils/logger");
// In-memory OTP storage (in production, use Redis)
const otpStore = new Map();
// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
// Generate JWT token
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};
// Send OTP for email verification
const sendOTP = async (req, res) => {
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
        const existingUser = await User_1.User.findOne({ email: email.toLowerCase() });
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
        const emailSent = await emailService_1.emailService.sendOTPEmail(email, otp);
        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email. Please try again.'
            });
        }
        logger_1.logger.info(`OTP sent to ${email}`);
        res.status(200).json({
            success: true,
            message: 'Verification code sent to your email'
        });
    }
    catch (error) {
        logger_1.logger.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.sendOTP = sendOTP;
// Register user
const register = async (req, res) => {
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
        const existingUser = await User_1.User.findOne({
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
            }
            else {
                return res.status(400).json({
                    success: false,
                    message: 'Username is already taken'
                });
            }
        }
        // Create user
        const user = new User_1.User({
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
        await emailService_1.emailService.sendWelcomeEmail(user.email, user.username);
        logger_1.logger.info(`New user registered: ${user.email}`);
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
    }
    catch (error) {
        logger_1.logger.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.register = register;
// Login user
const login = async (req, res) => {
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
        const user = await User_1.User.findOne({
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
        logger_1.logger.info(`User logged in: ${user.email}`);
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
    }
    catch (error) {
        logger_1.logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.login = login;
// Get current user
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId; // Set by auth middleware
        const user = await User_1.User.findById(userId);
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
    }
    catch (error) {
        logger_1.logger.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getCurrentUser = getCurrentUser;
// Logout user (optional - mainly for clearing server-side sessions if used)
const logout = async (req, res) => {
    try {
        // In JWT-based auth, logout is mainly handled client-side by removing the token
        // But we can log the event for security monitoring
        const userId = req.userId;
        if (userId) {
            const user = await User_1.User.findById(userId);
            if (user) {
                logger_1.logger.info(`User logged out: ${user.email}`);
            }
        }
        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    }
    catch (error) {
        logger_1.logger.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.logout = logout;
// Update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { username, email } = req.body;
        if (!username || !email) {
            return res.status(400).json({
                success: false,
                message: 'Username and email are required'
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
        // Check if username or email already exists for other users
        const existingUser = await User_1.User.findOne({
            $and: [
                { _id: { $ne: userId } },
                {
                    $or: [
                        { email: email.toLowerCase() },
                        { username: username }
                    ]
                }
            ]
        });
        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already registered to another account'
                });
            }
            else {
                return res.status(400).json({
                    success: false,
                    message: 'Username is already taken'
                });
            }
        }
        // Update user
        const user = await User_1.User.findByIdAndUpdate(userId, {
            username,
            email: email.toLowerCase()
        }, { new: true });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        logger_1.logger.info(`User profile updated: ${user.email}`);
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateProfile = updateProfile;
// Update password
const updatePassword = async (req, res) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All password fields are required'
            });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New passwords do not match'
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }
        // Get user
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        // Check if the new password is the same as current password
        const isSameAsCurrentPassword = await user.comparePassword(newPassword);
        if (isSameAsCurrentPassword) {
            return res.status(400).json({
                success: false,
                message: 'You cannot use your current password as the new password. Please choose a different password.'
            });
        }
        // Update password
        user.password = newPassword;
        await user.save();
        logger_1.logger.info(`Password updated for user: ${user.email}`);
        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Update password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updatePassword = updatePassword;
// Update notification settings (placeholder - can be extended with actual notification preferences)
const updateNotificationSettings = async (req, res) => {
    try {
        const userId = req.userId;
        const { analysisNotifications, accountActivityNotifications, marketingEmails } = req.body;
        // For now, we'll just acknowledge the settings update
        // In a real implementation, you'd store these preferences in the user model or a separate settings collection
        logger_1.logger.info(`Notification settings updated for user: ${userId}`);
        res.status(200).json({
            success: true,
            message: 'Notification settings updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Update notification settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateNotificationSettings = updateNotificationSettings;
// Delete user account
const deleteAccount = async (req, res) => {
    try {
        const userId = req.userId;
        // Get user first to log the deletion
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // In a real implementation, you might want to:
        // 1. Delete related data (analyses, etc.)
        // 2. Soft delete instead of hard delete
        // 3. Send confirmation email
        // 4. Add a grace period before actual deletion
        // For now, we'll do a hard delete
        await User_1.User.findByIdAndDelete(userId);
        logger_1.logger.info(`User account deleted: ${user.email}`);
        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteAccount = deleteAccount;
// Export user data
const exportUserData = async (req, res) => {
    try {
        const userId = req.userId;
        // Get user data
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // In a real implementation, you'd also fetch:
        // - User's analysis history
        // - Any other related data
        // For now, we'll export basic user data
        const userData = {
            profile: {
                id: user._id,
                username: user.username,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            },
            exportedAt: new Date().toISOString(),
            note: 'This export contains your basic profile information. Analysis data export will be available in a future update.'
        };
        logger_1.logger.info(`Data export requested by user: ${user.email}`);
        res.status(200).json(userData);
    }
    catch (error) {
        logger_1.logger.error('Export user data error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.exportUserData = exportUserData;
// Forgot password
const forgotPassword = async (req, res) => {
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
        // Find user by email
        const user = await User_1.User.findOne({ email: email.toLowerCase() });
        // Always return success for security (don't reveal if email exists)
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }
        // Check if user email is verified
        if (!user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Please verify your email address first before resetting password'
            });
        }
        // Generate reset token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour instead of 30 minutes
        // Save reset token to user
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = resetTokenExpires;
        await user.save();
        logger_1.logger.info(`Password reset token generated for: ${user.email}, expires at: ${resetTokenExpires}`);
        // Send password reset email
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        const emailSent = await emailService_1.emailService.sendPasswordResetEmail(user.email, user.username, resetLink);
        if (!emailSent) {
            // Clean up the reset token if email fails
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
            return res.status(500).json({
                success: false,
                message: 'Failed to send password reset email. Please try again.'
            });
        }
        logger_1.logger.info(`Password reset requested for: ${user.email}`);
        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        });
    }
    catch (error) {
        logger_1.logger.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.forgotPassword = forgotPassword;
// Reset password
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        logger_1.logger.info(`Password reset attempt with token: ${token ? token.substring(0, 10) + '...' : 'null'}`);
        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }
        // First, find all users with the reset token (for debugging)
        const allUsersWithToken = await User_1.User.findOne({ passwordResetToken: token });
        logger_1.logger.info(`Users found with token: ${allUsersWithToken ? 'Yes' : 'No'}`);
        if (allUsersWithToken) {
            logger_1.logger.info(`Token expiry: ${allUsersWithToken.passwordResetExpires}, Current time: ${new Date()}, Valid: ${allUsersWithToken.passwordResetExpires && allUsersWithToken.passwordResetExpires > new Date()}`);
        }
        // Find user by reset token and check expiry
        const user = await User_1.User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() }
        });
        if (!user) {
            // More specific error message
            const expiredUser = await User_1.User.findOne({ passwordResetToken: token });
            if (expiredUser) {
                logger_1.logger.info(`Token expired for user: ${expiredUser.email}`);
                return res.status(400).json({
                    success: false,
                    message: 'Password reset token has expired. Please request a new password reset link.'
                });
            }
            else {
                logger_1.logger.info(`No user found with token: ${token.substring(0, 10)}...`);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid password reset token. Please request a new password reset link.'
                });
            }
        }
        logger_1.logger.info(`Found user for password reset: ${user.email}`);
        // Check if the new password is the same as current password
        const isSameAsCurrentPassword = await user.comparePassword(newPassword);
        if (isSameAsCurrentPassword) {
            logger_1.logger.info(`User attempted to use current password as new password: ${user.email}`);
            return res.status(400).json({
                success: false,
                message: 'You cannot use your current password as the new password. Please choose a different password.'
            });
        }
        // Update password and clear reset token
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        logger_1.logger.info(`Password reset successful for: ${user.email}`);
        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. You can now log in with your new password.'
        });
    }
    catch (error) {
        logger_1.logger.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=authController.js.map