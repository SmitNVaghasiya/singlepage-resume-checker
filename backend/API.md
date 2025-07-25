# Backend API Endpoints Overview

This document provides a concise overview of all API endpoints exposed by the backend, including their HTTP methods, short descriptions, and the file locations where they are implemented.

---

## 1. Health Check Endpoints

**Location:** `src/routes/healthRoutes.ts`

| Method | Endpoint             | Description                              |
| ------ | -------------------- | ---------------------------------------- |
| GET    | /api/health          | Basic health check (status, uptime, pid) |
| GET    | /api/health/detailed | Detailed health (memory, DB, Python API) |

---

## 2. Authentication Endpoints

**Location:** `src/routes/authRoutes.ts`, `src/controllers/authController.ts`

| Method | Endpoint                  | Description                                 |
| ------ | ------------------------- | ------------------------------------------- |
| POST   | /api/auth/send-otp        | Send OTP for registration                   |
| POST   | /api/auth/register        | Register new user with OTP                  |
| POST   | /api/auth/login           | User login (email/username + password)      |
| POST   | /api/auth/forgot-password | Request password reset                      |
| POST   | /api/auth/reset-password  | Reset password using token                  |
| GET    | /api/auth/me              | Get current user profile (JWT required)     |
| POST   | /api/auth/logout          | Logout (JWT required)                       |
| PUT    | /api/auth/profile         | Update user profile (JWT required)          |
| PUT    | /api/auth/password        | Update password (JWT required)              |
| PUT    | /api/auth/notifications   | Update notification settings (JWT required) |
| DELETE | /api/auth/account         | Delete user account (JWT required)          |
| GET    | /api/auth/export          | Export user data (JWT required)             |

---

## 3. Resume Analysis Endpoints

**Location:** `src/routes/resumeRoutes.ts`, `src/controllers/resumeController.ts`

| Method | Endpoint                                | Description                                          |
| ------ | --------------------------------------- | ---------------------------------------------------- |
| POST   | /api/resume/analyze                     | Analyze resume vs job description (file/text upload) |
| GET    | /api/resume/analysis/:analysisId/status | Get status of a specific analysis                    |
| GET    | /api/resume/status/:analysisId          | (Alt) Get status of a specific analysis              |
| GET    | /api/resume/analysis/:analysisId/result | Get result of a specific analysis                    |
| GET    | /api/resume/history                     | Get user's analysis history (JWT required)           |

---

## 4. Analysis Management Endpoints

**Location:** `src/routes/analysisRoutes.ts`, `src/controllers/analysisController.ts`

| Method | Endpoint                         | Description                                  |
| ------ | -------------------------------- | -------------------------------------------- |
| GET    | /api/analyses                    | Get all analyses (pagination, filtering)     |
| GET    | /api/analyses/stats              | Get analysis statistics                      |
| GET    | /api/analyses/top                | Get top performing analyses                  |
| GET    | /api/analyses/health             | Check database health                        |
| POST   | /api/analyses/:analysisId/export | Export analysis report (email, JWT required) |
| GET    | /api/analyses/:analysisId        | Get specific analysis by ID                  |
| DELETE | /api/analyses/:analysisId        | Delete analysis by ID                        |

---

## 5. Admin Endpoints

**Location:** `src/routes/adminRoutes.ts`, `src/controllers/adminController.ts`

| Method | Endpoint                                         | Description                                |
| ------ | ------------------------------------------------ | ------------------------------------------ |
| POST   | /api/admin/login                                 | Admin login                                |
| GET    | /api/admin/me                                    | Get current admin profile (JWT required)   |
| GET    | /api/admin/users                                 | Get all users (admin, permission required) |
| GET    | /api/admin/users/:userId                         | Get specific user by ID (admin)            |
| PUT    | /api/admin/users/:userId/status                  | Update user status (admin)                 |
| PUT    | /api/admin/users/bulk                            | Bulk update users (admin)                  |
| GET    | /api/admin/stats/dashboard                       | Get dashboard statistics (admin)           |
| GET    | /api/admin/stats/analyses                        | Get analysis statistics (admin)            |
| GET    | /api/admin/analyses/:analysisId                  | Get specific analysis (admin)              |
| GET    | /api/admin/export                                | Export data (users/analyses, admin)        |
| GET    | /api/admin/health                                | Get system health (admin)                  |
| GET    | /api/admin/stats/enhanced                        | Get enhanced dashboard statistics (admin)  |
| GET    | /api/admin/health/enhanced                       | Get enhanced system health (admin)         |
| GET    | /api/admin/audit-logs                            | Get audit logs (admin)                     |
| GET    | /api/admin/notifications                         | Get admin notifications                    |
| PUT    | /api/admin/notifications/:notificationId/read    | Mark notification as read (admin)          |
| PUT    | /api/admin/notifications/:notificationId/archive | Archive notification (admin)               |
| GET    | /api/admin/configs                               | Get system configs (admin)                 |
| PUT    | /api/admin/configs/:key                          | Update system config (admin)               |
| POST   | /api/admin/data/cleanup                          | Cleanup old data (admin)                   |

---

## 6. Contact Endpoints

**Location:** `src/routes/contactRoutes.ts`

| Method | Endpoint     | Description                        |
| ------ | ------------ | ---------------------------------- |
| POST   | /api/contact | Submit contact form (rate limited) |

---

## Notes

- All endpoints prefixed with `/api`.
- Most endpoints return JSON responses.
- JWT authentication required for protected routes (see above).
- File upload for resume analysis uses multipart/form-data.
- See each route/controller file for detailed implementation.
