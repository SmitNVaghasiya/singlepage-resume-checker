# AI Resume Analyzer - Backend

High-performance Node.js backend for the AI Resume Analyzer application.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- MongoDB (optional, for storing analysis results)
- Python server running on port 8000

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create environment file:**

   ```bash
   cp env.example .env
   ```

3. **Configure environment variables:**

   ```bash
   # Edit .env file with your configuration
   nano .env
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 📋 Environment Configuration

### Required Variables

```env
# Python FastAPI Service
PYTHON_API_URL=http://localhost:8000
PYTHON_API_TIMEOUT=30000

# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017/resume_analyzer

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### Optional Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Security
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,txt

# Redis (for caching and rate limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Configuration
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password
EMAIL_FROM="AI Resume Checker" <noreply@airesumechecker.com>
```

## 🏗️ Architecture

### Directory Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── middleware/       # Express middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── index.ts         # Application entry point
└── server.ts        # Server configuration
```

### Key Components

- **Express Server**: RESTful API with middleware stack
- **MongoDB Integration**: Mongoose ODM for data persistence
- **Python API Service**: Communication with AI analysis service
- **Authentication**: JWT-based user authentication
- **File Upload**: Multer middleware for file handling
- **Rate Limiting**: Express rate limiter for API protection
- **Error Handling**: Centralized error handling middleware
- **Logging**: Winston logger for structured logging

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/send-otp` - Send OTP for registration
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Resume Analysis

- `POST /api/resume/analyze` - Analyze resume (requires auth)
- `GET /api/resume/status/:analysisId` - Get analysis status
- `GET /api/resume/result/:analysisId` - Get analysis result
- `GET /api/resume/history` - Get analysis history

### Analysis Management

- `GET /api/analyses` - Get all analyses with pagination
- `GET /api/analyses/:analysisId` - Get specific analysis
- `DELETE /api/analyses/:analysisId` - Delete analysis
- `GET /api/analyses/stats` - Get analysis statistics
- `POST /api/analyses/:analysisId/export` - Export analysis report

### Health & Monitoring

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health check with dependencies

### Contact

- `POST /api/contact` - Submit contact form

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint         # Run ESLint
```

### Development Workflow

1. **Start the Python server first:**

   ```bash
   cd ../python_server
   python main.py
   ```

2. **Start the backend:**

   ```bash
   npm run dev
   ```

3. **Test the API:**

   ```bash
   # Test health endpoint
   curl http://localhost:5000/api/health

   # Test detailed health (includes Python API check)
   curl http://localhost:5000/api/health/detailed
   ```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run integration tests only
npm run test:integration

# Run unit tests only
npm run test:unit
```

### Test Structure

- `**/*.test.ts` - Unit tests
- `**/*.integration.test.ts` - Integration tests
- `test-setup.ts` - Test configuration

## 🐛 Troubleshooting

### Common Issues

#### 1. Python API Connection Failed

**Symptoms:** Analysis requests fail with "Python API connection failed"

**Solutions:**

- Ensure Python server is running on port 8000
- Check `PYTHON_API_URL` in `.env` file
- Verify Python server health: `curl http://localhost:8000/health`

#### 2. MongoDB Connection Failed

**Symptoms:** Database operations fail

**Solutions:**

- Ensure MongoDB is running
- Check `MONGODB_URL` in `.env` file
- For local development: `mongod --dbpath /path/to/data`

#### 3. Authentication Issues

**Symptoms:** JWT token errors

**Solutions:**

- Check `JWT_SECRET` in `.env` file
- Ensure token is not expired
- Verify token format in Authorization header

#### 4. File Upload Issues

**Symptoms:** File upload fails

**Solutions:**

- Check file size limits in `MAX_FILE_SIZE`
- Verify allowed file types in `ALLOWED_FILE_TYPES`
- Ensure proper multipart form data

#### 5. CORS Issues

**Symptoms:** Frontend can't connect to backend

**Solutions:**

- Check `CORS_ORIGIN` in `.env` file
- Ensure frontend URL is included in CORS origins
- For development: use `CORS_ORIGIN=*`

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

### Health Checks

Check service health:

```bash
# Basic health
curl http://localhost:5000/api/health

# Detailed health (includes dependencies)
curl http://localhost:5000/api/health/detailed
```

## 📊 Monitoring

### Logs

Logs are stored in the `logs/` directory:

- `combined.log` - All logs
- `error.log` - Error logs only

### Metrics

The application exposes health metrics via `/api/health/detailed`:

- Server uptime
- Memory usage
- CPU usage
- Database connection status
- Python API connection status

## 🔒 Security

### Rate Limiting

- Global rate limiting: 100 requests per minute
- Upload rate limiting: 10 requests per minute
- Configurable via environment variables

### CORS

- Configurable origins via `CORS_ORIGIN`
- Credentials enabled
- Preflight requests supported

### Authentication

- JWT-based authentication
- Token expiration configurable
- Secure password hashing with bcrypt

### File Upload Security

- File type validation
- File size limits
- Virus scanning (if configured)

## 🚀 Production Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production MongoDB
3. Set secure `JWT_SECRET`
4. Configure production CORS origins
5. Set up proper logging

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start with PM2
npm run start:prod

# Monitor
pm2 monit

# View logs
pm2 logs
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

## 📝 API Documentation

For detailed API documentation, visit:

- Swagger UI: `http://localhost:5000/api/docs` (if enabled)
- Health Check: `http://localhost:5000/api/health/detailed`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
