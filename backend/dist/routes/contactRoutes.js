"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const rateLimiter_1 = require("../middleware/rateLimiter");
const emailService_1 = require("../services/emailService");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
// Contact form submission endpoint
router.post('/', (0, rateLimiter_1.rateLimiter)({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 requests per 15 minutes
[
    (0, express_validator_1.body)('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('subject').trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be between 5 and 200 characters'),
    (0, express_validator_1.body)('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters'),
], async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
            return;
        }
        const { name, email, subject, message } = req.body;
        // Log the contact form submission
        logger_1.logger.info('Contact form submission received', {
            name,
            email,
            subject,
            messageLength: message.length
        });
        // Send email notification to support team
        const emailContent = `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <hr>
        <p><em>This message was sent through the AI Resume Checker contact form.</em></p>
      `;
        // Send email to support team
        await emailService_1.emailService.sendEmail({
            to: 'support@airesumechecker.com', // Replace with your actual support email
            subject: `Contact Form: ${subject}`,
            html: emailContent
        });
        // Send confirmation email to user
        const confirmationContent = `
        <h2>Thank you for contacting us!</h2>
        <p>Hi ${name},</p>
        <p>We have received your message and will get back to you within 24 hours.</p>
        <p><strong>Your message:</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          <strong>Subject:</strong> ${subject}<br>
          <strong>Message:</strong><br>
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p>Best regards,<br>AI Resume Checker Support Team</p>
      `;
        await emailService_1.emailService.sendEmail({
            to: email,
            subject: 'We received your message - AI Resume Checker',
            html: confirmationContent
        });
        res.status(200).json({
            message: 'Contact form submitted successfully. We will get back to you soon!'
        });
    }
    catch (error) {
        logger_1.logger.error('Error processing contact form submission:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to submit contact form. Please try again later.'
        });
    }
});
exports.default = router;
//# sourceMappingURL=contactRoutes.js.map