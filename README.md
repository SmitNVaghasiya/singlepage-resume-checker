# AI Resume Checker - Comprehensive Project Documentation

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Data Storage & Privacy](#data-storage--privacy)
- [Frontend Modules](#frontend-modules)
- [Backend Modules](#backend-modules)
- [Python AI Server](#python-ai-server)
- [Database Design](#database-design)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Deployment](#deployment)

## 🎯 Project Overview

**AI Resume Checker** is a comprehensive web application that provides intelligent resume analysis and job matching using advanced AI/ML technologies. The system analyzes resumes against job descriptions to provide detailed feedback, scoring, and improvement recommendations.

### Key Features

- **AI-Powered Resume Analysis** - Deep analysis using Groq AI
- **Job Description Matching** - Intelligent keyword and skill matching
- **User Authentication System** - Secure login/registration with email verification
- **Profile Management** - Complete user profile with soft delete functionality
- **Analysis History** - Track all previous analyses with detailed results
- **Data Export** - Export user data for backup
- **Responsive Design** - Modern UI/UX across all devices

## 🏗️ System Architecture

The project follows a **microservices architecture** with three main components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  Python AI      │
│   (React/TS)    │◄──►│   (Node.js)     │◄──►│   Server        │
│                 │    │                 │    │   (FastAPI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   MongoDB       │
                    │   Database      │
                    └─────────────────┘
```

### Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, JWT Authentication
- **AI Server**: Python, FastAPI, Groq AI Integration
- **Database**: MongoDB with Mongoose ODM
- **File Processing**: PDF, DOCX, TXT support

## 💾 Data Storage & Privacy

### Data Retention Strategy

We implement a **soft delete approach** for user accounts to ensure data preservation for business intelligence and account recovery.

#### Why Soft Delete Instead of Hard Delete?

1. **Account Recovery**: Users can recover accidentally deleted accounts
2. **Business Analytics**: Preserve user behavior patterns and analysis data
3. **Customer Support**: Help users who contact support later
4. **Legal Compliance**: Meet data retention requirements
5. **Future Outreach**: Contact users for feedback and new features

#### What Data is Preserved?

- ✅ **User Profile**: Username, email, location, join date
- ✅ **Analysis History**: All resume analyses and results
- ✅ **Resume Content**: Original resume text and files
- ✅ **Job Descriptions**: Associated job descriptions
- ✅ **Scores & Recommendations**: Detailed feedback and scores
- ✅ **Processing History**: Timestamps and analysis metadata

#### What Data is Cleared?

- 🔒 **Sensitive Data**: Passwords, authentication tokens
- 🔒 **Session Data**: Login tokens, reset tokens
- 🔒 **Verification Data**: Email verification tokens

## 🎨 Frontend Modules

### 1. Authentication System (`/frontend/src/components/auth/`)

**Purpose**: Secure user authentication with modern UX patterns

**Key Components**:

- `AuthModal.tsx` - Centralized authentication modal
- `AuthHandler.tsx` - Authentication state management
- Email verification flow
- Password reset functionality

**Features**:

- JWT token management
- Persistent login sessions
- Email verification workflow
- Password strength validation
- OTP-based verification

### 2. File Upload System (`/frontend/src/components/file-upload/`)

**Purpose**: Handle resume and job description file uploads

**Key Components**:

- `FileUpload.tsx` - Main upload interface
- `FilePreviewModal.tsx` - File preview before upload
- `ResumeUploadStep.tsx` - Step-by-step upload process

**Supported Formats**:

- PDF files
- DOCX documents
- TXT text files
- Image files (with OCR)

**Features**:

- Drag & drop interface
- File validation and size limits
- Preview before upload
- Progress tracking
- Error handling

### 3. Job Description Module (`/frontend/src/components/job-description/`)

**Purpose**: Collect and process job descriptions

**Key Components**:

- `JobDescriptionSection.tsx` - Main job description interface
- `JobDescriptionLogic.tsx` - Business logic handler
- `JobDescriptionStep.tsx` - Step-by-step input process

**Features**:

- Text input for job descriptions
- File upload for job description documents
- Paste functionality with formatting
- Real-time validation
- Auto-save functionality

### 4. Analysis System (`/frontend/src/components/analysis/`)

**Purpose**: Display and manage analysis results

**Key Components**:

- `AnalysisLoading.tsx` - Loading states during analysis
- `AnalysisResults.tsx` - Results display
- `AnalysisHistory.tsx` - Historical analyses

**Features**:

- Real-time progress tracking
- Detailed result breakdown
- Interactive score visualization
- Export functionality
- Comparison tools

### 5. Dashboard (`/frontend/src/components/dashboard/`)

**Purpose**: User dashboard for managing analyses and profile

**Key Components**:

- `DashboardAnalysisView.tsx` - Main dashboard view
- `AnalysisSummary.tsx` - Analysis summaries
- `AnalysisTabContent.tsx` - Tabbed content management

**Features**:

- Analysis history overview
- Quick access to recent analyses
- Performance metrics
- Export capabilities

### 6. Profile Management (`/frontend/src/pages/ProfilePage.tsx`)

**Purpose**: Complete user profile management with advanced security

**Key Features**:

#### Profile Information Management

- **Username editing** with validation
- **Full name** management
- **Email address** updates
- **Location** information
- **Member since** date display

#### Security Features

- **Password Change**: Multi-step verification process
  - Current password validation
  - New password with confirmation
  - Password visibility toggles
  - Real-time validation
  - Security against using current password as new password

#### Account Deletion (Soft Delete)

- **Two-step deletion process**:
  1. Warning modal with consequences
  2. Username confirmation modal
- **Username verification**: Must type exact username (with/without @)
- **Data preservation**: All analysis data retained
- **Account recovery**: Possible through admin intervention

#### Settings Management

- **Notification preferences**:
  - Email notifications toggle
  - Security alerts toggle
  - Marketing emails toggle
- **Data export**: Download user data in JSON format
- **Account status**: Visual indication of account state

#### Technical Implementation

- **Tab-based interface**: Profile and Settings tabs
- **Form validation**: Real-time error checking
- **Loading states**: Visual feedback during operations
- **Error handling**: Comprehensive error messages
- **Success feedback**: Confirmation messages

### 7. Layout Components (`/frontend/src/components/layout/`)

**Purpose**: Consistent UI layout and navigation

**Key Components**:

- `Navbar.tsx` - Main navigation
- `Footer.tsx` - Site footer
- `HeroSection.tsx` - Landing page hero
- `Layout.tsx` - Main layout wrapper

## 🔧 Backend Modules

### 1. Authentication Controller (`/backend/src/controllers/authController.ts`)

**Purpose**: Handle all authentication-related operations

**Key Functions**:

- `register()` - User registration with email verification
- `login()` - User login with JWT token generation
- `updateProfile()` - Profile information updates
- `updatePassword()` - Secure password changes
- `deleteAccount()` - Soft delete implementation
- `exportUserData()` - GDPR-compliant data export

**Security Features**:

- Password hashing with bcrypt
- JWT token management
- Email verification workflow
- Rate limiting
- Input validation

### 2. Analysis Controller (`/backend/src/controllers/analysisController.ts`)

**Purpose**: Manage resume analysis operations

**Key Functions**:

- `createAnalysis()` - Initialize new analysis
- `getAnalysis()` - Retrieve analysis results
- `getUserAnalyses()` - Get user's analysis history
- `updateAnalysis()` - Update analysis status

### 3. Resume Controller (`/backend/src/controllers/resumeController.ts`)

**Purpose**: Handle file uploads and processing

**Key Functions**:

- `uploadResume()` - File upload handling
- `processResume()` - Text extraction
- `validateFile()` - File validation

### 4. Middleware (`/backend/src/middleware/`)

**Purpose**: Request processing and security

**Key Middleware**:

- `auth.ts` - JWT authentication
- `fileUpload.ts` - File upload handling
- `rateLimiter.ts` - Rate limiting
- `validation.ts` - Input validation
- `errorHandler.ts` - Error handling

## 🤖 Python AI Server

### Purpose

The Python server handles the core AI/ML analysis using Groq AI for natural language processing and resume analysis.

### Key Components

#### 1. Analysis Engine (`/python_server/app/groq_service.py`)

- **Groq AI Integration**: Advanced language model for analysis
- **Resume Parsing**: Extract structured data from resumes
- **Job Description Analysis**: Process and understand job requirements
- **Matching Algorithm**: Intelligent skill and keyword matching

#### 2. File Processing (`/python_server/app/file_processor.py`)

- **PDF Processing**: Extract text from PDF files
- **DOCX Processing**: Handle Word documents
- **Text Extraction**: OCR for image-based documents
- **Format Validation**: Ensure file compatibility

#### 3. Database Integration (`/python_server/app/database.py`)

- **MongoDB Connection**: Store analysis results
- **Data Models**: Pydantic models for data validation
- **Analysis Storage**: Save complete analysis data

### Analysis Features

- **Keyword Matching**: Identify relevant keywords
- **Skill Analysis**: Technical, soft, and industry skills
- **Experience Assessment**: Years of experience analysis
- **Resume Quality**: Formatting and content evaluation
- **Competitive Analysis**: Market positioning insights
- **Improvement Recommendations**: Actionable feedback

## 🗄️ Database Design

### User Collection

```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  fullName: String,
  location: String,
  isEmailVerified: Boolean,
  status: String (enum: ['active', 'deleted', 'suspended']),
  createdAt: Date,
  updatedAt: Date
}
```

### Analysis Collection

```javascript
{
  _id: ObjectId,
  analysisId: String (unique),
  userId: String (optional),
  resumeFilename: String,
  jobDescriptionFilename: String,
  resumeText: String,
  jobDescriptionText: String,
  result: {
    overallScore: Number,
    matchPercentage: Number,
    jobTitle: String,
    industry: String,
    keywordMatch: Object,
    skillsAnalysis: Object,
    experienceAnalysis: Object,
    resumeQuality: Object,
    competitiveAnalysis: Object,
    detailedFeedback: Object,
    improvementPlan: Object
  },
  status: String (enum: ['processing', 'completed', 'failed']),
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date
}
```

## 🔌 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password
- `DELETE /api/auth/account` - Delete account (soft delete)
- `GET /api/auth/export` - Export user data

### Analysis Endpoints

- `POST /api/analysis/create` - Create new analysis
- `GET /api/analysis/:id` - Get analysis results
- `GET /api/analysis/user/:userId` - Get user analyses
- `PUT /api/analysis/:id` - Update analysis

### Resume Endpoints

- `POST /api/resume/upload` - Upload resume file
- `POST /api/resume/process` - Process resume text

## 🔒 Security Features

### Authentication Security

- **JWT Tokens**: Secure session management
- **Password Hashing**: bcrypt with salt rounds
- **Email Verification**: Required for account activation
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Comprehensive validation

### Data Security

- **Soft Delete**: Preserve data while blocking access
- **Token Clearing**: Remove sensitive tokens on deletion
- **Data Encryption**: Sensitive data encryption
- **Access Control**: Role-based access control

### File Security

- **File Validation**: Type and size validation
- **Virus Scanning**: File security checks
- **Secure Storage**: Encrypted file storage
- **Access Logging**: File access audit trails

## 🚀 Deployment

### Environment Variables

```bash
# Database
MONGODB_URL=mongodb://localhost:27017/resume_checker

# JWT
JWT_SECRET=your_jwt_secret_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# Frontend
FRONTEND_URL=http://localhost:5173

# Python Server
PYTHON_SERVER_URL=http://localhost:8000
```

### Development Setup

1. **Clone Repository**

   ```bash
   git clone <repository-url>
   cd single_resume_checker
   ```

2. **Install Dependencies**

   ```bash
   # Frontend
   cd frontend && npm install

   # Backend
   cd ../backend && npm install

   # Python Server
   cd ../python_server && pip install -r requirements.txt
   ```

3. **Start Services**

   ```bash
   # Frontend (Port 5173)
   cd frontend && npm run dev

   # Backend (Port 3000)
   cd backend && npm run dev

   # Python Server (Port 8000)
   cd python_server && python main.py
   ```

### Production Deployment

- **Frontend**: Vercel, Netlify, or AWS S3
- **Backend**: AWS EC2, Heroku, or DigitalOcean
- **Python Server**: AWS Lambda, Google Cloud Functions
- **Database**: MongoDB Atlas or AWS DocumentDB

## 📊 Business Intelligence

### Data Analytics

The preserved data enables comprehensive business intelligence:

1. **User Behavior Analysis**

   - Most common job titles
   - Popular industries
   - Resume improvement patterns
   - User engagement metrics

2. **Service Optimization**

   - Analysis accuracy tracking
   - Processing time optimization
   - Feature usage statistics
   - User satisfaction metrics

3. **Market Insights**

   - Industry trends
   - Skill demand analysis
   - Salary range insights
   - Job market dynamics

4. **Product Development**
   - Feature request analysis
   - User feedback aggregation
   - Performance optimization
   - New feature validation

## 🔄 Future Enhancements

### Planned Features

- **Account Recovery System**: Admin tools for account restoration
- **Advanced Analytics Dashboard**: Business intelligence tools
- **Bulk Analysis**: Multiple resume processing
- **API Integration**: Third-party job board integration
- **Mobile Application**: Native mobile app
- **AI Model Training**: Custom model development

### Technical Improvements

- **Caching Layer**: Redis for performance optimization
- **Microservices**: Further service decomposition
- **Containerization**: Docker and Kubernetes deployment
- **Monitoring**: Comprehensive logging and monitoring
- **Testing**: Automated testing suite

---

## 📝 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

For internal development, please follow the established coding standards and review process.

## 📞 Support

For technical support or questions, please contact the development team.
