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

The project follows a **microservices architecture** with three main components and a decoupled, async data flow:

```
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Frontend    │    │   Backend     │    │  Python AI    │
│ (React/TS)    │◄──►│ (Node.js/TS)  │◄──►│  Server       │
│               │    │ (Express)     │    │ (FastAPI)     │
└───────────────┘    └───────────────┘    └───────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                ┌─────────────────────┐
                │      MongoDB        │
                │ (Python server owns │
                │   analysis data)    │
                └─────────────────────┘
```

**Data Flow:**

- The **frontend** collects resume and job description (file or text) and sends them to the **backend**.
- The **backend** validates/authenticates, then forwards the files/text (with user JWT) to the **Python AI server**.
- The **Python server** performs AI analysis, stores results in MongoDB, and returns an analysis ID/status.
- The **backend** polls MongoDB (owned by Python server) for analysis results and returns them to the frontend.
- The **backend does not write analysis results directly**; it only reads them after the Python server completes analysis.

### Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, JWT Authentication
- **AI Server**: Python, FastAPI, Groq AI Integration
- **Database**: MongoDB (owned by Python server, accessed read-only by backend)
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

### Backend Role in Analysis (Post-Refactor)

- The backend acts as a **proxy/manager** for analysis requests.
- It authenticates users, validates files, and forwards requests to the Python server (with user JWT).
- **It does not write analysis results to the database**; it only reads results after the Python server stores them.
- The backend polls MongoDB (owned by the Python server) for completed analysis results and returns them to the frontend.

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

The Python server handles the core AI/ML analysis using Groq AI for natural language processing and resume analysis. It is a fully async, secure, and robust microservice, responsible for all analysis logic and result storage.

### Key Features (Post-Refactor)

- **Advanced AI Analysis**: Uses Groq's LLaMA3 model for deep, structured resume analysis
- **Multi-format Support**: Handles PDF, DOCX, and TXT files with fallback extraction
- **AI-Powered Validation**: Validates job descriptions and resumes for content, security, and professionalism
- **Comprehensive Response Schema**: Returns detailed, section-wise feedback, scores, and recommendations
- **Strict Input Validation**: Enforces file size, page count, and word count limits
- **Async Processing**: All major operations are async for performance
- **Database Integration**: MongoDB async integration for storing analysis results
- **Rate Limiting**: In-memory, per-IP daily request limits (default: 15)
- **JWT Authentication**: All analysis endpoints require a valid JWT (userId claim)
- **RESTful API**: FastAPI-based with automatic docs and error handling
- **Enhanced Security**: AI-based security validation, prompt injection protection, and input sanitization

### Main Endpoints

- `POST /api/v1/analyze` — Analyze a resume against a job description (file or text)
- `GET /api/v1/status/{analysisId}` — Get status of an analysis (auth required)
- `GET /api/v1/result/{analysisId}` — Get full analysis result (auth required)
- `GET /api/v1/my-analyses` — List all analyses for the authenticated user
- `GET /api/v1/health` — Health check (service, DB, AI, rate limit stats)

**All endpoints (except health/docs) require JWT Bearer token.**

### Validation & Limits

- **File size:** Max 5MB
- **PDF/DOCX pages:** Max 7
- **Resume tokens:** Max 8000 words
- **Job description:** 50–1000 words
- **Allowed file types:** pdf, docx, txt
- **Rate limit:** 15 requests per IP per day (configurable)

### Security

- **AI-based validation**: All content is checked for prompt injection, malicious input, and professionalism
- **Strict schema enforcement**: All responses match a detailed JSON schema
- **JWT authentication**: All analysis endpoints require a valid JWT
- **Error handling**: Detailed, user-friendly error messages

### Example Response Schema

```json
{
  "job_description_validity": "Valid",
  "resume_validity": "Valid",
  "resume_eligibility": "Eligible",
  "score_out_of_100": 77,
  "short_conclusion": "Candidate is a promising fit for the role with some room for polish.",
  "chance_of_selection_percentage": 70,
  "resume_improvement_priority": [
    "Add TensorFlow or PyTorch experience to resume",
    "Fix grammar and formatting issues",
    "Add GitHub links to projects",
    "Include specific technical details in AI/ML projects"
  ],
  "overall_fit_summary": "Resume shows strong Python foundation and genuine AI/ML interest with practical projects, but lacks explicit mention of deep learning frameworks (TensorFlow/PyTorch) and detailed technical implementation metrics in existing AI projects.",
  "resume_analysis_report": {
    /* ... see python_server/response_schema.json ... */
  }
}
```

### Project Structure

```
python_server/
├── main.py                 # FastAPI app (init, middleware, error handling)
├── app/
│   ├── models.py           # Pydantic models (response, DB)
│   ├── file_processor.py   # File handling, validation
│   ├── groq_service.py     # AI service integration
│   ├── config.py           # Config, validation limits
│   ├── database.py         # DB operations
│   └── middleware.py       # Rate limiting, JWT extraction
├── routes/
│   ├── analysis_routes.py  # Analysis endpoints
│   └── health_routes.py    # Health endpoints
├── requirements.txt        # Dependencies
├── response_schema.json    # Example response schema
├── sample_response.json    # Example response
└── README.md               # Python server docs
```

### Environment Variables

- `GROQ_API_KEY`: Groq API key (required)
- `GROQ_MODEL`: AI model (default: llama3-8b-8192)
- `MONGODB_URL`: MongoDB connection string (required)
- `MONGODB_DATABASE`: MongoDB database name (default: resume_analyzer)
- `MONGODB_COLLECTION`: MongoDB collection name (default: analyses)
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)
- `MAX_REQUESTS_PER_DAY`: Daily rate limit per IP (default: 15)
- `JWT_SECRET`: JWT secret for authentication
- `JWT_EXPIRES_IN`: JWT expiration (default: 30d)

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

### Authentication Endpoints (Backend)

- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — User login
- `POST /api/auth/logout` — User logout
- `GET /api/auth/me` — Get current user
- `PUT /api/auth/profile` — Update profile
- `PUT /api/auth/password` — Change password
- `DELETE /api/auth/account` — Delete account (soft delete)
- `GET /api/auth/export` — Export user data

### Analysis Endpoints (Backend)

- `POST /api/resume/analyze` — Analyze resume (requires auth)
- `GET /api/resume/status/:analysisId` — Get analysis status
- `GET /api/resume/result/:analysisId` — Get analysis result
- `GET /api/resume/history` — Get analysis history

### Python AI Server Endpoints

- `POST /api/v1/analyze` — Analyze resume (file or text, JWT required)
- `GET /api/v1/status/{analysisId}` — Get analysis status (JWT required)
- `GET /api/v1/result/{analysisId}` — Get analysis result (JWT required)
- `GET /api/v1/my-analyses` — List all analyses for user (JWT required)
- `GET /api/v1/health` — Health check

### Validation & Security

- **All analysis endpoints require JWT authentication**
- **Strict input validation**: file size, type, page/word count
- **AI-based security**: prompt injection protection, content validation
- **Rate limiting**: 15 requests per IP per day (configurable)

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
# Backend
MONGODB_URL=mongodb://localhost:27017/resume_checker
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
PYTHON_API_URL=http://localhost:8000
PYTHON_API_TIMEOUT=120000

# Python Server
GROQ_API_KEY=your_actual_groq_api_key_here
GROQ_MODEL=llama3-8b-8192
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=resume_analyzer
MONGODB_COLLECTION=analyses
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d
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

3. **Start Services (in order)**

   ```bash
   # Python Server (Port 8000)
   cd python_server && python main.py

   # Backend (Port 3000)
   cd ../backend && npm run dev

   # Frontend (Port 5173)
   cd ../frontend && npm run dev
   ```

### Production Deployment

- **Frontend**: Vercel, Netlify, or AWS S3
- **Backend**: AWS EC2, Heroku, or DigitalOcean
- **Python Server**: Render, AWS Lambda, Google Cloud Functions
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
