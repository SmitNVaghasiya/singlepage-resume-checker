# Resume Checker Backend API Documentation

## 📊 **API Overview**

The Resume Checker Backend provides a comprehensive API for resume analysis, user management, and administrative functions.

- **Base URL**: `http://localhost:5000`
- **Total Endpoints**: 25
- **Authentication**: JWT-based for protected routes
- **File Upload**: Multipart form data for resume analysis

---

## 🔍 **1. Health Check Endpoints**

_No authentication required_

### Basic Health Check

```bash
curl -X GET http://localhost:5000/api/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "pid": 12345
}
```

### Detailed Health Check

```bash
curl -X GET http://localhost:5000/api/health/detailed
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "pid": 12345,
  "pythonApi": {
    "healthy": true,
    "responseTime": 150
  },
  "database": {
    "status": "connected",
    "responseTime": 25
  },
  "memory": {
    "rss": "45MB",
    "heapTotal": "20MB",
    "heapUsed": "15MB"
  },
  "system": {
    "loadAverage": [0.5, 0.3, 0.2],
    "freeMemory": "2048MB",
    "totalMemory": "8192MB"
  }
}
```

---

## 🔐 **2. Authentication Endpoints**

### Public Routes (No Authentication Required)

#### Send OTP for Registration

```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

#### Register New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "password": "securepassword123",
    "otp": "123456"
  }'
```

#### User Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "username": "newuser",
    "email": "user@example.com"
  }
}
```

#### Forgot Password

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

#### Reset Password

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_from_email",
    "password": "newpassword123"
  }'
```

### Protected Routes (Require JWT Token)

#### Get Current User Profile

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update Profile

```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "location": "New York, NY"
  }'
```

#### Update Password

```bash
curl -X PUT http://localhost:5000/api/auth/password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "oldpassword",
    "newPassword": "newpassword123"
  }'
```

#### Update Notification Settings

```bash
curl -X PUT http://localhost:5000/api/auth/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailNotifications": true,
    "marketingEmails": false
  }'
```

#### Delete Account

```bash
curl -X DELETE http://localhost:5000/api/auth/account \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Export User Data

```bash
curl -X GET http://localhost:5000/api/auth/export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📄 **3. Resume Analysis Endpoints**

### Analyze Resume

```bash
curl -X POST http://localhost:5000/api/resume/analyze \
  -F "resume=@/path/to/your/resume.pdf" \
  -F "jobDescription=@/path/to/job-description.pdf" \
  -F "jobDescriptionText=Software Engineer position with 3+ years experience..."
```

**Response:**

```json
{
  "success": true,
  "analysisId": "analysis_12345",
  "status": "processing",
  "message": "Analysis started successfully"
}
```

### Get Analysis Status

```bash
curl -X GET http://localhost:5000/api/resume/analysis/analysis_12345/status
```

**Alternative Status Endpoint:**

```bash
curl -X GET http://localhost:5000/api/resume/status/analysis_12345
```

**Response:**

```json
{
  "analysisId": "analysis_12345",
  "status": "completed",
  "progress": 100,
  "currentStage": "Analysis completed",
  "startedAt": "2024-01-01T12:00:00.000Z",
  "completedAt": "2024-01-01T12:02:30.000Z"
}
```

### Get Analysis Result

```bash
curl -X GET http://localhost:5000/api/resume/analysis/analysis_12345/result
```

**Response:**

```json
{
  "analysisId": "analysis_12345",
  "overallScore": 85,
  "matchPercentage": 78,
  "jobTitle": "Software Engineer",
  "industry": "Technology",
  "keywordMatch": {
    "matched": ["JavaScript", "React", "Node.js"],
    "missing": ["Python", "Docker"],
    "percentage": 75
  },
  "skillsAnalysis": {
    "technical": {
      "required": ["JavaScript", "React", "Node.js", "Python"],
      "present": ["JavaScript", "React", "Node.js"],
      "missing": ["Python"],
      "recommendations": ["Learn Python basics", "Practice Docker"]
    }
  },
  "detailedFeedback": {
    "strengths": [
      {
        "category": "Technical Skills",
        "points": ["Strong JavaScript knowledge", "Good React experience"],
        "impact": "High"
      }
    ],
    "weaknesses": [
      {
        "category": "Missing Skills",
        "points": ["No Python experience", "No Docker knowledge"],
        "impact": "Medium",
        "solutions": ["Take Python course", "Learn Docker basics"]
      }
    ]
  }
}
```

### Get User's Analysis History

```bash
curl -X GET http://localhost:5000/api/resume/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 **4. Analysis Management Endpoints**

### Get All Analyses (with pagination)

```bash
curl -X GET "http://localhost:5000/api/analyses?page=1&limit=10&status=completed&sortBy=createdAt&sortOrder=desc"
```

### Get Analysis Statistics

```bash
curl -X GET http://localhost:5000/api/analyses/stats
```

**Response:**

```json
{
  "totalAnalyses": 150,
  "completedAnalyses": 140,
  "processingAnalyses": 5,
  "failedAnalyses": 5,
  "averageScore": 78.5,
  "recentAnalyses": 25
}
```

### Get Top Performing Analyses

```bash
curl -X GET http://localhost:5000/api/analyses/top?limit=10
```

### Check Database Health

```bash
curl -X GET http://localhost:5000/api/analyses/health
```

### Export Analysis Report

```bash
curl -X POST http://localhost:5000/api/analyses/analysis_12345/export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Specific Analysis by ID

```bash
curl -X GET http://localhost:5000/api/analyses/analysis_12345
```

### Delete Analysis by ID

```bash
curl -X DELETE http://localhost:5000/api/analyses/analysis_12345
```

---

## 👨‍💼 **5. Admin Endpoints**

_All admin endpoints require admin authentication_

### Admin Login

```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin_password"
  }'
```

### Get Current Admin

```bash
curl -X GET http://localhost:5000/api/admin/me \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Get All Users

```bash
curl -X GET "http://localhost:5000/api/admin/users?page=1&limit=20&status=active" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Get Specific User

```bash
curl -X GET http://localhost:5000/api/admin/users/user_12345 \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Update User Status

```bash
curl -X PUT http://localhost:5000/api/admin/users/user_12345/status \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "suspended",
    "reason": "Violation of terms of service"
  }'
```

### Bulk Update Users

```bash
curl -X PUT http://localhost:5000/api/admin/users/bulk \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user_1", "user_2", "user_3"],
    "updates": {
      "status": "active"
    }
  }'
```

### Get Dashboard Statistics

```bash
curl -X GET http://localhost:5000/api/admin/stats/dashboard \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Get Analysis Statistics

```bash
curl -X GET http://localhost:5000/api/admin/stats/analyses \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Get Specific Analysis (Admin View)

```bash
curl -X GET http://localhost:5000/api/admin/analyses/analysis_12345 \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Export Data

```bash
curl -X GET "http://localhost:5000/api/admin/export?type=users&format=csv" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Get System Health

```bash
curl -X GET http://localhost:5000/api/admin/health \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

## 📧 **6. Contact Endpoints**

### Submit Contact Form

```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "General Inquiry",
    "message": "I have a question about your resume analysis service. How accurate are the results?"
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Contact form submitted successfully. We will get back to you soon!"
}
```

---

## 🧪 **Quick Testing Guide**

### 1. Test Basic Connectivity

```bash
# Test if server is running
curl -X GET http://localhost:5000/api/health
```

### 2. Test API Information

```bash
# Get API overview
curl -X GET http://localhost:5000/api
```

### 3. Test Detailed Health

```bash
# Check all services
curl -X GET http://localhost:5000/api/health/detailed
```

### 4. Test Authentication Flow

```bash
# 1. Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 2. Register (use OTP from email)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "otp": "123456"
  }'

# 3. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 📝 **Important Notes**

### Authentication

- JWT tokens are required for protected endpoints
- Tokens are returned after successful login/registration
- Include token in `Authorization: Bearer <token>` header

### File Uploads

- Resume analysis uses multipart form data
- Supported file types: PDF, DOC, DOCX, TXT
- Maximum file size: 10MB

### Rate Limiting

- Most endpoints have rate limiting applied
- Auth endpoints: 10 requests per 15 minutes
- OTP requests: 3 requests per minute
- Contact form: 5 requests per 15 minutes

### Error Responses

```json
{
  "error": "Error Type",
  "message": "Human readable error message",
  "statusCode": 400,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/endpoint"
}
```

### Environment Variables

- `PORT`: Server port (default: 5000)
- `MONGODB_URL`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `PYTHON_API_URL`: Python AI service URL
- `CORS_ORIGIN`: Allowed origins for CORS

---

## 🔧 **Postman Collection**

You can import these endpoints into Postman by creating a new collection and adding the requests above. Remember to:

1. Set the base URL variable to `http://localhost:5000`
2. Create environment variables for tokens
3. Set up pre-request scripts for authentication headers
4. Use form-data for file upload endpoints

---

_Last updated: January 2024_
_API Version: 1.0.0_
