import * as nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Using Gmail SMTP (free option)
    // You can also use other free services like Outlook, Yahoo, etc.
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password (not regular password)
      }
    });

    // Alternative: Using Ethereal (for testing)
    if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
      this.setupEtherealTransporter();
    }
  }

  private async setupEtherealTransporter() {
    try {
      // Create test account for development
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      logger.info('Using Ethereal test email service for development');
      logger.info(`Test email credentials: ${testAccount.user} / ${testAccount.pass}`);
    } catch (error) {
      logger.error('Failed to setup Ethereal email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"AI Resume Checker" <noreply@airesumechecker.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info('Email sent successfully');
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      } else {
        logger.info(`Email sent to ${options.to}: ${info.messageId}`);
      }

      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async sendOTPEmail(email: string, otp: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - AI Resume Checker</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 2rem; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 1.5rem; }
          .content { padding: 2rem; }
          .otp-box { background: #f8fafc; border: 2px solid #e5e7eb; border-radius: 0.75rem; padding: 1.5rem; text-align: center; margin: 1.5rem 0; }
          .otp-code { font-size: 2rem; font-weight: bold; color: #3b82f6; letter-spacing: 0.2em; margin: 0.5rem 0; }
          .footer { background: #f8fafc; padding: 1rem 2rem; text-align: center; color: #6b7280; font-size: 0.875rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 AI Resume Checker</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Welcome to AI Resume Checker! Please use the verification code below to complete your registration:</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #374151;">Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">This code will expire in 10 minutes</p>
            </div>
            
            <p>If you didn't request this verification, please ignore this email.</p>
            
            <p>Best regards,<br>The AI Resume Checker Team</p>
          </div>
          <div class="footer">
            <p>© 2024 AI Resume Checker. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      AI Resume Checker - Email Verification
      
      Your verification code is: ${otp}
      
      This code will expire in 10 minutes.
      
      If you didn't request this verification, please ignore this email.
    `;

    return this.sendEmail({
      to: email,
      subject: '🔐 Verify Your Email - AI Resume Checker',
      html,
      text
    });
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to AI Resume Checker</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 2rem; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 1.5rem; }
          .content { padding: 2rem; }
          .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; margin: 1rem 0; }
          .footer { background: #f8fafc; padding: 1rem 2rem; text-align: center; color: #6b7280; font-size: 0.875rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to AI Resume Checker!</h1>
          </div>
          <div class="content">
            <h2>Hello ${username}!</h2>
            <p>Thank you for joining AI Resume Checker! Your account has been successfully created and verified.</p>
            
            <p>You can now:</p>
            <ul>
              <li>Upload and analyze your resume</li>
              <li>Get AI-powered feedback and suggestions</li>
              <li>Compare your resume against job descriptions</li>
              <li>Track your analysis history</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="button">
                Get Started Now
              </a>
            </div>
            
            <p>If you have any questions, feel free to contact our support team.</p>
            
            <p>Best regards,<br>The AI Resume Checker Team</p>
          </div>
          <div class="footer">
            <p>© 2024 AI Resume Checker. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🎉 Welcome to AI Resume Checker!',
      html
    });
  }

  async sendPasswordResetEmail(email: string, username: string, resetLink: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - AI Resume Checker</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #ef4444, #f97316); padding: 2rem; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 1.5rem; }
          .content { padding: 2rem; }
          .reset-box { background: #fef2f2; border: 2px solid #fecaca; border-radius: 0.75rem; padding: 1.5rem; margin: 1.5rem 0; }
          .reset-button { display: inline-block; background: linear-gradient(135deg, #ef4444, #f97316); color: white; padding: 0.875rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; margin: 1rem 0; }
          .footer { background: #f8fafc; padding: 1rem 2rem; text-align: center; color: #6b7280; font-size: 0.875rem; }
          .warning { color: #dc2626; font-size: 0.875rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 AI Resume Checker</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${username},</p>
            <p>We received a request to reset your password for your AI Resume Checker account. If you requested this, please click the button below to reset your password:</p>
            
            <div class="reset-box">
              <div style="text-align: center;">
                <a href="${resetLink}" class="reset-button">
                  Reset Your Password
                </a>
              </div>
              <p class="warning">⚠️ This link will expire in 30 minutes for security reasons.</p>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f8fafc; padding: 1rem; border-radius: 0.5rem; font-family: monospace; font-size: 0.875rem;">
              ${resetLink}
            </p>
            
            <p><strong>If you didn't request this password reset:</strong></p>
            <ul>
              <li>You can safely ignore this email</li>
              <li>Your password will remain unchanged</li>
              <li>Consider changing your password if you suspect unauthorized access</li>
            </ul>
            
            <p>Best regards,<br>The AI Resume Checker Team</p>
          </div>
          <div class="footer">
            <p>© 2024 AI Resume Checker. All rights reserved.</p>
            <p>This password reset link will expire in 30 minutes.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      AI Resume Checker - Password Reset Request
      
      Hello ${username},
      
      We received a request to reset your password for your AI Resume Checker account.
      
      Reset your password by clicking this link:
      ${resetLink}
      
      This link will expire in 30 minutes for security reasons.
      
      If you didn't request this password reset, you can safely ignore this email.
      Your password will remain unchanged.
      
      Best regards,
      The AI Resume Checker Team
    `;

    return this.sendEmail({
      to: email,
      subject: '🔒 Reset Your Password - AI Resume Checker',
      html,
      text
    });
  }
}

export const emailService = new EmailService(); 