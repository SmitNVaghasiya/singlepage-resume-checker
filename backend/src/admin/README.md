# Admin Module

This directory contains all admin-related functionality separated from the main application code for better organization and maintainability.

## Structure

```
admin/
├── controllers/     # Admin-specific controllers
├── routes/         # Admin route definitions
├── middleware/     # Admin authentication and authorization
├── models/         # Admin data models
├── services/       # Admin-specific services (if any)
├── index.ts        # Module exports
└── README.md       # This file
```

## Components

### Controllers (`controllers/`)
- `adminController.ts` - Handles all admin-related HTTP requests
  - User management (view, update, bulk operations)
  - Analytics and statistics
  - System health monitoring
  - Data export functionality
  - Audit trail management
  - Notification management
  - System configuration management

### Routes (`routes/`)
- `adminRoutes.ts` - Defines all admin API endpoints with proper middleware
  - Authentication routes
  - User management routes
  - Analytics routes
  - System management routes

### Middleware (`middleware/`)
- `adminAuth.ts` - Admin authentication and authorization middleware
  - `authenticateAdmin` - Verifies admin JWT tokens
  - `requirePermission` - Checks specific admin permissions
  - `requireRole` - Role-based access control

### Models (`models/`)
- `Admin.ts` - Admin user model with security features
  - Password hashing and validation
  - Account locking mechanism
  - Permission management
  - Two-factor authentication support

## Usage

### Importing the Admin Module

```typescript
// Import all admin components
import { adminRoutes, authenticateAdmin, Admin } from '../admin';

// Or import specific components
import { adminRoutes } from '../admin';
import { authenticateAdmin } from '../admin/middleware/adminAuth';
```

### Setting up Admin Routes

```typescript
// In your main server file
import { adminRoutes } from './admin';

app.use('/api/admin', adminRoutes);
```

### Using Admin Middleware

```typescript
import { authenticateAdmin, requirePermission } from '../admin';

// Protect routes with admin authentication
router.get('/protected', authenticateAdmin, (req, res) => {
  // Only authenticated admins can access
});

// Check specific permissions
router.get('/users', authenticateAdmin, requirePermission('view_users'), (req, res) => {
  // Only admins with 'view_users' permission can access
});
```

## Admin Permissions

The admin system supports the following permissions:

- `view_users` - View user information
- `manage_users` - Create, update, delete users
- `view_analytics` - Access analytics and statistics
- `view_analyses` - View analysis data
- `view_logs` - Access system logs and health
- `manage_system` - System configuration and maintenance
- `export_data` - Export data from the system
- `bulk_operations` - Perform bulk operations on users
- `audit_trail` - Access audit logs
- `system_config` - Manage system configuration

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Account Locking** - Automatic account lockout after failed attempts
- **Permission-based Access** - Granular permission system
- **Password Security** - Bcrypt hashing with salt
- **Session Management** - Configurable session timeouts
- **IP Whitelisting** - Optional IP-based access control
- **Two-Factor Authentication** - Support for 2FA (framework ready)

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- `GET /api/admin/me` - Get current admin info

### User Management
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:userId` - Get specific user
- `PUT /api/admin/users/:userId/status` - Update user status
- `PUT /api/admin/users/bulk` - Bulk update users

### Analytics
- `GET /api/admin/stats/dashboard` - Dashboard statistics
- `GET /api/admin/stats/analyses` - Analysis statistics
- `GET /api/admin/stats/enhanced` - Enhanced analytics
- `GET /api/admin/analyses/:analysisId` - Get specific analysis

### System Management
- `GET /api/admin/health` - System health check
- `GET /api/admin/health/enhanced` - Enhanced system health
- `GET /api/admin/audit-logs` - Audit trail logs
- `GET /api/admin/notifications` - System notifications
- `GET /api/admin/configs` - System configurations
- `POST /api/admin/data/cleanup` - Data cleanup operations

### Data Export
- `GET /api/admin/export` - Export data (users, analyses, audit logs)

## Benefits of This Structure

1. **Separation of Concerns** - Admin functionality is completely separated from user functionality
2. **Easy Identification** - Clear folder structure makes it easy to identify admin-related code
3. **Maintainability** - Admin code is organized and easy to maintain
4. **Scalability** - Easy to add new admin features without affecting user code
5. **Security** - Isolated admin authentication and authorization
6. **Testing** - Admin functionality can be tested independently

## Migration Notes

This module was created by separating admin functionality from the main application. The original files in the main directories can be safely removed after confirming the new structure works correctly.

Original files that can be removed:
- `src/controllers/adminController.ts`
- `src/routes/adminRoutes.ts`
- `src/middleware/adminAuth.ts`
- `src/models/Admin.ts` 