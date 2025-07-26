# Admin Module

This module contains all admin-related functionality for the Resume Checker application. It's completely separated from the user-facing code to ensure proper security and maintainability.

## Structure

The admin module follows a flat structure for simplicity:

```
backend/src/admin/
├── index.ts                    # Main exports
├── Admin.ts                    # Admin model
├── adminAuth.ts                # Authentication middleware
├── adminController.ts          # Admin controllers
├── adminRoutes.ts              # Admin routes
├── adminAnalyticsService.ts    # Analytics service
├── adminUserService.ts         # User management service
├── types.ts                    # TypeScript interfaces
├── config.ts                   # Admin configuration
├── utils.ts                    # Utility functions
└── README.md                   # This file
```

## Features

### Authentication & Authorization

- Admin login/logout
- JWT-based authentication
- Permission-based access control
- Account lockout protection
- Password expiry management

### User Management

- View all users with pagination
- User details and analytics
- Activate/deactivate users
- Bulk user operations
- User activity tracking

### Analytics & Statistics

- Dashboard statistics
- User growth trends
- Analysis performance metrics
- System health monitoring
- Enhanced analytics

### System Management

- System configuration
- Audit trail management
- Notification management
- Data export functionality
- System cleanup operations

## Usage

### Importing the Admin Module

```typescript
// Import all admin components
import {
  adminRoutes,
  authenticateAdmin,
  Admin,
  AdminAnalyticsService,
  ADMIN_CONFIG,
} from "../admin";

// Or import specific components
import { adminRoutes } from "../admin";
import { authenticateAdmin } from "../admin/adminAuth";
```

### Setting up Admin Routes

```typescript
// In your main server file
import { adminRoutes } from "./admin";
app.use("/api/admin", adminRoutes);
```

### Using Admin Middleware

```typescript
import { authenticateAdmin, requirePermission } from "../admin";

// Protect routes with admin authentication
router.get("/protected", authenticateAdmin, (req, res) => {
  // Only authenticated admins can access
});

// Check specific permissions
router.get(
  "/users",
  authenticateAdmin,
  requirePermission("view_users"),
  (req, res) => {
    // Only admins with 'view_users' permission can access
  }
);
```

### Admin Configuration

```typescript
import { ADMIN_CONFIG } from "../admin";

// Access admin configuration
const maxLoginAttempts = ADMIN_CONFIG.auth.maxLoginAttempts;
const defaultPermissions = ADMIN_CONFIG.defaultPermissions;
```

## API Endpoints

### Authentication

- `POST /api/admin/login` - Admin login
- `GET /api/admin/me` - Get current admin info

### User Management

- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get user details
- `PUT /api/admin/users/:userId/status` - Update user status
- `PUT /api/admin/users/bulk` - Bulk user operations

### Analytics

- `GET /api/admin/stats/dashboard` - Dashboard statistics
- `GET /api/admin/stats/analyses` - Analysis statistics
- `GET /api/admin/stats/enhanced` - Enhanced analytics

### System Management

- `GET /api/admin/health` - System health
- `GET /api/admin/configs` - System configurations
- `PUT /api/admin/configs/:key` - Update configuration
- `POST /api/admin/data/cleanup` - Data cleanup

### Audit & Notifications

- `GET /api/admin/audit-logs` - Audit logs
- `GET /api/admin/notifications` - Notifications
- `PUT /api/admin/notifications/:id/read` - Mark notification as read

### Data Export

- `GET /api/admin/export` - Export data

## Permissions

The admin module uses a permission-based access control system:

- `view_users` - View user information
- `manage_users` - Manage user accounts
- `view_analytics` - View analytics and statistics
- `view_analyses` - View analysis data
- `view_logs` - View system logs
- `manage_system` - Manage system settings
- `export_data` - Export data
- `bulk_operations` - Perform bulk operations
- `audit_trail` - Access audit trail
- `system_config` - Manage system configuration

## Security Features

- JWT token authentication
- Account lockout after failed attempts
- Password expiry management
- IP whitelist support
- Two-factor authentication ready
- Audit trail for all actions
- Permission-based access control

## Utilities

The module provides utility functions for common admin operations:

```typescript
import {
  hasPermission,
  sanitizeAdminData,
  generateAuditData,
  getAdminRole,
} from "../admin";

// Check permissions
const canViewUsers = hasPermission(admin, "view_users");

// Sanitize admin data for API responses
const safeAdminData = sanitizeAdminData(admin);

// Generate audit log data
const auditData = generateAuditData(admin, "user_update", "user", userId);

// Get admin role
const role = getAdminRole(admin);
```

## Configuration

Admin-specific configuration is centralized in `config.ts`:

- Authentication settings
- Permission definitions
- Pagination defaults
- Export settings
- Analytics configuration
- System health thresholds

## Integration

The admin module is designed to be completely self-contained and can be easily integrated into any Express.js application. It maintains its own models, services, and utilities while providing a clean API for external consumption.
