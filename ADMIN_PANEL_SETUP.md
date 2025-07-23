# Admin Panel Setup Guide

## Overview

The admin panel provides comprehensive monitoring and management capabilities for the Resume Checker application. It allows administrators to:

- Monitor user activity and system performance
- Manage user accounts
- Track analysis statistics and trends
- Monitor system health and performance
- Export data and generate reports

## Features

### 🔐 Authentication & Security

- Secure admin login with JWT tokens
- Admin has full system access
- Account lockout protection
- Session management
- **NEW**: Admin profile access restrictions for enhanced security
- **NEW**: Admin accounts cannot be modified through web interface

### 📊 Dashboard Analytics

- Real-time user statistics
- Analysis success rates and performance metrics
- Popular industries and job titles
- Daily/weekly/monthly growth trends
- System health monitoring

### 👥 User Management

- View all registered users with pagination
- Search and filter users by status
- User account status management (active/suspended/deleted)
- User activity tracking
- Analysis count per user

### 📈 Analysis Monitoring

- Track all resume analyses
- Monitor success/failure rates
- View analysis details and results
- Performance metrics and trends
- Error tracking and debugging
- **UPDATED**: Clean interface without technical Analysis ID display

### 🛠️ System Administration

- System health monitoring
- Database connection status
- Memory and CPU usage tracking
- Error log monitoring
- Performance metrics

## Security Enhancements

### 🔒 Admin Account Protection

**New Security Measures:**

1. **Profile Access Restriction**

   - Admins cannot access the user profile page (`/profile`)
   - Automatic redirect to admin dashboard if attempted
   - Prevents password changes through web interface
   - Prevents account deletion through web interface

2. **Account Management Control**

   - Admin accounts can only be managed internally by the organization
   - No web-based admin account modification capabilities
   - Enhanced security against unauthorized admin account changes

3. **Route-Level Protection**
   - Frontend route guards prevent admin access to user-specific pages
   - Backend authentication separation ensures proper access control
   - Multi-layer security implementation

### 🎯 Interface Improvements

**Analysis Dashboard Updates:**

- Removed Analysis ID column for cleaner interface
- Focused on essential information: User, Resume, status, Score, Created, Actions
- Improved readability and user experience
- Technical details hidden from admin view while maintaining functionality

## Setup Instructions

### 1. Backend Setup

#### Create Admin User

Run the following command to create the initial super admin user:

```bash
cd backend
npm run create-admin
```

This will create an admin with the following credentials:

- **Username**: admin
- **Email**: admin@resumechecker.com
- **Password**: Admin@123

⚠️ **IMPORTANT**: Change the password after first login!

⚠️ **SECURITY NOTE**: Admin accounts cannot be modified through the web interface. All admin account changes must be done through internal organization processes.

#### Environment Variables

Ensure your `.env` file includes:

```env
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 2. Frontend Setup

The admin panel is integrated into the existing login system. Access it at:

- **Login**: Use the regular login page at `/login` with admin credentials
- **Dashboard**: `/admin/dashboard` (redirects automatically after admin login)

### 3. API Endpoints

The admin panel uses the following API endpoints:

#### Authentication

- `POST /api/admin/login` - Admin login
- `GET /api/admin/me` - Get current admin

#### User Management

- `GET /api/admin/users` - Get all users (with pagination)
- `GET /api/admin/users/:userId` - Get specific user
- `PUT /api/admin/users/:userId/status` - Update user status

#### Analytics

- `GET /api/admin/stats/dashboard` - Dashboard statistics
- `GET /api/admin/stats/analyses` - Analysis statistics
- `GET /api/admin/analyses/:analysisId` - Get specific analysis

#### System Health

- `GET /api/admin/health` - System health check

## Usage Guide

### 1. Accessing the Admin Panel

1. Navigate to `/login` (the regular login page)
2. Enter your admin credentials (username: `admin`, password: `Admin@123`)
3. You'll be automatically redirected to the admin dashboard

### 2. Dashboard Overview

The dashboard provides:

- **Statistics Cards**: Key metrics at a glance
- **Popular Industries**: Most analyzed industries
- **Popular Job Titles**: Most analyzed job titles
- **Recent Activity**: Latest user and analysis activity

### 3. User Management

- **View Users**: Browse all registered users
- **Search**: Find users by username, email, or name
- **Filter**: Filter by account status
- **Manage**: Update user status (active/suspended/deleted)

### 4. Analysis Monitoring

- **View Analyses**: Browse all resume analyses
- **Track Performance**: Monitor success rates and scores
- **Debug Issues**: View failed analyses and errors
- **Export Data**: Download analysis reports
- **Clean Interface**: Focused on essential information without technical clutter

### 5. System Health

- **Monitor status**: Check system health
- **View Metrics**: CPU, memory, and database usage
- **Track Performance**: System response times
- **Error Logs**: View system errors and warnings

## Security Considerations

### 1. Access Control

- Admin panel is completely separate from user authentication
- Uses dedicated admin JWT tokens
- Admin has full system access
- **NEW**: Admin profile access is restricted for enhanced security
- **NEW**: Route-level protection prevents unauthorized access

### 2. Admin Account Security

- **Profile Access**: Admins cannot access user profile pages
- **Password Changes**: Must be done through internal processes
- **Account Deletion**: Cannot be performed through web interface
- **Account Management**: Restricted to organization-level control

### 3. Rate Limiting

- Admin endpoints are rate-limited
- Failed login attempts trigger account lockout
- Session management prevents token hijacking

### 4. Data Protection

- Sensitive user data is protected
- Admin actions are logged for audit trails
- Secure password hashing and validation
- **NEW**: Admin account data is protected from web-based modification

## Troubleshooting

### Common Issues

1. **Can't access admin panel**

   - Ensure admin user is created
   - Check JWT_SECRET in environment variables
   - Verify MongoDB connection

2. **Login fails**

   - Check admin credentials
   - Verify account is not locked
   - Check server logs for errors

3. **Data not loading**

   - Check API endpoints are accessible
   - Check network connectivity

4. **Admin redirected from profile page**
   - **Expected behavior**: Admins are automatically redirected to admin dashboard
   - This is a security feature to prevent admin account modification through web interface

### Debug Mode

Enable debug logging in the backend:

```bash
LOG_LEVEL=debug npm run dev
```

### Health Checks

Check admin API health:

```bash
curl http://localhost:5000/api/admin/health
```

## Customization

### Adding New Analytics

1. Extend the admin controller in `backend/src/controllers/adminController.ts`
2. Add new API endpoints
3. Update the frontend service in `frontend/src/services/AdminService.ts`
4. Add UI components to display new data

### Styling Customization

The admin panel uses CSS modules and supports:

- Light/dark theme switching
- Responsive design
- Custom color schemes
- Component-level styling

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review server logs
3. Verify environment configuration
4. Test API endpoints directly

## Future Enhancements

Planned features:

- Real-time notifications
- Advanced analytics and reporting
- Bulk user operations
- System configuration management
- Audit trail and logging
- Email notifications for admin actions
- Advanced search and filtering
- Data export functionality

## Security Best Practices

### For Organizations

1. **Admin Account Management**

   - Use strong, unique passwords for admin accounts
   - Implement password rotation policies
   - Monitor admin login attempts
   - Keep admin credentials secure and separate from regular user accounts

2. **Access Control**

   - Limit admin access to authorized personnel only
   - Implement role-based access control if needed
   - Regular security audits of admin activities
   - Monitor for suspicious admin actions

3. **Data Protection**
   - Regular backups of admin and user data
   - Encrypt sensitive information
   - Implement data retention policies
   - Monitor for data breaches or unauthorized access

### For Administrators

1. **Account Security**

   - Never share admin credentials
   - Use secure networks when accessing admin panel
   - Log out after each session
   - Report any suspicious activity immediately

2. **Best Practices**
   - Regular review of user activities
   - Monitor system health and performance
   - Keep track of analysis trends and issues
   - Document any system changes or interventions
