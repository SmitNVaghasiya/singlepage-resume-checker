# Email Setup Guide

## Free Email Service Setup for OTP

### Option 1: Gmail (Recommended for Production)

1. **Create a Gmail account** or use an existing one
2. **Enable 2-Factor Authentication** on your Gmail account
3. **Generate an App Password**:

   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

4. **Update your `.env` file**:
   ```env
   EMAIL_USER=your-gmail-address@gmail.com
   EMAIL_APP_PASSWORD=your-16-character-app-password
   EMAIL_FROM="AI Resume Checker" <noreply@airesumechecker.com>
   ```

### Option 2: Development Testing (Ethereal)

For development/testing, if you don't set `EMAIL_USER`, the system will automatically use Ethereal Email:

1. **Leave EMAIL_USER empty** in your `.env` file
2. **Check the console logs** when the server starts - it will show test email credentials
3. **Preview emails** using the URL shown in console logs

### Option 3: Other Free Services

You can also use:

- **Outlook/Hotmail**: Similar to Gmail setup
- **Yahoo Mail**: Enable app passwords in security settings
- **Zoho Mail**: Free tier available

### Environment Variables

Add these to your `.env` file:

```env
# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
EMAIL_FROM="AI Resume Checker" <noreply@airesumechecker.com>

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

### Testing

1. Start your backend server
2. Try registering a new user
3. Check your email for the OTP
4. If using Ethereal, check the console for the preview URL

### Security Notes

- Never commit your actual email credentials to version control
- Use environment variables for all sensitive data
- In production, consider using dedicated email services like SendGrid, Mailgun, or AWS SES for higher reliability
