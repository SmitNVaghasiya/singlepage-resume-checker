# 🚀 AI Resume Analyzer - Complete Setup Guide

This guide will help you set up the complete AI Resume Analyzer system with frontend, backend, and Python AI service.

## 📋 Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Python 3.8+** - [Download here](https://www.python.org/downloads/)
- **MongoDB** (optional) - [Download here](https://www.mongodb.com/try/download/community)
- **Groq API Key** - [Get here](https://console.groq.com/)

## 🏗️ System Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│ Python API  │
│  (React)    │     │  (Node.js)  │     │ (FastAPI)   │
│ Port: 5173  │     │ Port: 5000  │     │ Port: 8000  │
└─────────────┘     └─────────────┘     └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   MongoDB   │
                     │ (Optional)  │
                     └─────────────┘
```

## 🔧 Step-by-Step Setup

### Step 1: Clone and Prepare

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd single_resume_checker

# Verify the structure
ls -la
# Should show: backend/, frontend/, python_server/
```

### Step 2: Set Up Python AI Service

The Python service handles the AI analysis using Groq's LLaMA model.

```bash
cd python_server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp env.example .env

# Edit .env file with your Groq API key
# Windows:
notepad .env
# Linux/Mac:
nano .env
```

**Configure `.env` file:**

```env
# Required: Your Groq API key
GROQ_API_KEY=your_actual_groq_api_key_here

# Optional: Model configuration
GROQ_MODEL=llama3-70b-8192

# Database (optional)
MONGODB_URL=mongodb://localhost:27017/resume_analyzer

# Server settings
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

**Start Python service:**

```bash
python main.py
```

**Expected output:**

```
✅ All checks passed! Starting FastAPI server...
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 3: Set Up Backend (Node.js)

The backend handles authentication, file uploads, and communication with the Python service.

```bash
cd ../backend

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env file
# Windows:
notepad .env
# Linux/Mac:
nano .env
```

**Configure `.env` file:**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Python FastAPI Service
PYTHON_API_URL=http://localhost:8000
PYTHON_API_TIMEOUT=30000

# Security
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# MongoDB Configuration (optional)
MONGODB_URL=mongodb://localhost:27017/resume_analyzer

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173

# Email Configuration (optional)
EMAIL_USER=
EMAIL_APP_PASSWORD=
EMAIL_FROM="AI Resume Checker" <noreply@airesumechecker.com>
```

**Start backend:**

```bash
npm run dev
```

**Expected output:**

```
Worker 12345 started and listening on port 5000
```

### Step 4: Set Up Frontend (React)

The frontend provides the user interface for resume analysis.

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected output:**

```
Local:   http://localhost:5173/
Network: http://192.168.1.100:5173/
```

## 🧪 Testing the Setup

### Quick Health Check

Run the comprehensive test script:

```bash
# From the root directory
node test-connections.js
```

**Expected output:**

```
🔍 AI Resume Analyzer - Connection Test
============================================================
📡 Testing Individual Services
✅ Frontend: RUNNING
✅ Backend: RUNNING
✅ Python API: RUNNING
✅ Environment Config: Found
✅ Database: connected
✅ Backend → Python: RUNNING
✅ Authentication: RUNNING
✅ File Upload: RUNNING

🎯 Overall Status
✅ All tests passed! (8/8)
🚀 Your AI Resume Analyzer is ready to use!
```

### Manual Testing

1. **Test Python API:**

   ```bash
   curl http://localhost:8000/health
   ```

2. **Test Backend:**

   ```bash
   curl http://localhost:5000/api/health
   ```

3. **Test Frontend:**
   - Open http://localhost:5173 in your browser
   - Should see the AI Resume Analyzer homepage

## 🎯 Using the Application

### 1. Access the Application

Open your browser and go to: **http://localhost:5173**

### 2. Create an Account

1. Click "Get Started" or "Sign Up"
2. Enter your email address
3. Check your email for OTP
4. Complete registration with username and password

### 3. Analyze a Resume

1. **Upload Resume:**

   - Click "Upload Resume"
   - Select a PDF, DOCX, or TXT file
   - Your resume will be processed

2. **Add Job Description:**

   - Choose "Text Input" or "File Upload"
   - Enter job description text or upload a file
   - Click "Continue"

3. **Start Analysis:**

   - Review your inputs
   - Click "Start Analysis"
   - Wait for AI processing (15-45 seconds)

4. **View Results:**
   - Comprehensive analysis report
   - Score out of 100
   - Improvement suggestions
   - Skills analysis

## 🔧 Troubleshooting

### Common Issues

#### 1. Python Service Won't Start

**Problem:** `ModuleNotFoundError` or missing dependencies

**Solution:**

```bash
cd python_server
# Ensure virtual environment is activated
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Reinstall dependencies
pip install -r requirements.txt
```

#### 2. Backend Can't Connect to Python

**Problem:** `ECONNREFUSED` or timeout errors

**Solution:**

1. Ensure Python service is running on port 8000
2. Check `PYTHON_API_URL` in backend `.env`
3. Test Python API directly: `curl http://localhost:8000/health`

#### 3. Frontend Can't Connect to Backend

**Problem:** CORS errors or connection refused

**Solution:**

1. Ensure backend is running on port 5000
2. Check `CORS_ORIGIN` in backend `.env`
3. For development, use `CORS_ORIGIN=*`

#### 4. Authentication Issues

**Problem:** JWT token errors or login failures

**Solution:**

1. Check `JWT_SECRET` in backend `.env`
2. Ensure email service is configured (optional)
3. Check browser console for errors

#### 5. File Upload Issues

**Problem:** Files not uploading or processing

**Solution:**

1. Check file size limits (10MB default)
2. Verify file types (PDF, DOC, DOCX, TXT)
3. Ensure proper multipart form data

### Debug Mode

Enable detailed logging:

```bash
# Backend debug
cd backend
LOG_LEVEL=debug npm run dev

# Python debug
cd python_server
python main.py
```

### Health Checks

```bash
# Test all services
node test-connections.js

# Individual health checks
curl http://localhost:8000/health          # Python API
curl http://localhost:5000/api/health      # Backend
curl http://localhost:5000/api/health/detailed  # Backend with dependencies
```

## 📊 Monitoring

### Logs

- **Backend logs:** `backend/logs/`
- **Python logs:** Console output
- **Frontend logs:** Browser console

### Performance

- **Response times:** Check health endpoints
- **Memory usage:** Monitor via health checks
- **Error rates:** Check logs for errors

## 🔒 Security Considerations

### Development

- Use strong JWT secrets
- Configure CORS properly
- Set up rate limiting
- Validate file uploads

### Production

- Use environment variables for secrets
- Enable HTTPS
- Set up proper logging
- Configure firewall rules
- Use production databases

## 🚀 Production Deployment

### Environment Setup

1. **Set production environment:**

   ```env
   NODE_ENV=production
   ```

2. **Configure production URLs:**

   ```env
   CORS_ORIGIN=https://yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

3. **Set up production database:**
   ```env
   MONGODB_URL=mongodb://your-production-db
   ```

### Deployment Options

#### Option 1: PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start services
cd backend && npm run start:prod
cd python_server && pm2 start main.py --name python-api
```

#### Option 2: Docker

```bash
# Build and run containers
docker-compose up -d
```

#### Option 3: Manual

```bash
# Build frontend
cd frontend && npm run build

# Start services
cd backend && npm start
cd python_server && python main.py
```

## 📝 API Documentation

### Backend API

- **Health:** `GET /api/health`
- **Auth:** `POST /api/auth/login`, `POST /api/auth/register`
- **Analysis:** `POST /api/resume/analyze`
- **Results:** `GET /api/resume/result/:id`

### Python API

- **Health:** `GET /health`
- **Analysis:** `POST /analyze-resume`
- **Docs:** `GET /docs` (Swagger UI)

## 🤝 Support

### Getting Help

1. **Check logs** for error messages
2. **Run health checks** to identify issues
3. **Review this guide** for common solutions
4. **Check GitHub issues** for known problems

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

---

**🎉 Congratulations!** Your AI Resume Analyzer is now set up and ready to use. Start analyzing resumes and helping users improve their job applications!
