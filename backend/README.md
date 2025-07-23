# AI Resume Analyzer - Backend

High-performance Node.js backend for the AI Resume Analyzer application.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- MongoDB (Atlas or local, for storing analysis results)
- Python server running (see `python_server/`)

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

   Edit `.env` with your configuration (see below for details).

4. **Start development server:**

   ```bash
   npm run dev
   ```

## 📋 Environment Configuration

The backend is now optimized for both traditional server and serverless (Vercel) deployments. All configuration is via environment variables.

### Required Variables

```env
# Python FastAPI Service
PYTHON_API_URL=https://your-python-api-url.onrender.com
PYTHON_API_TIMEOUT=120000

# MongoDB Configuration
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/resume_analyzer

# Authentication
JWT_SECRET=your-very-long-random-secret
JWT_EXPIRES_IN=30d
```

### Optional Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Security
CORS_ORIGIN=https://your-frontend-url.vercel.app
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=pdf,doc,docx,txt

# Logging
LOG_LEVEL=info
LOG_DIR=logs

# Performance
CLUSTER_WORKERS=0
COMPRESSION_LEVEL=6

# Email Configuration (Gmail SMTP or Ethereal for dev)
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password
EMAIL_FROM="AI Resume Checker" <noreply@airesumechecker.com>
FRONTEND_URL=https://your-frontend-url.vercel.app

# Redis (optional, for caching/rate limiting)
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=
```

See `env.example` for a full list and descriptions.

## 🏗️ Architecture & Refactor Highlights

### Modernized, Serverless-Ready Architecture

- **Serverless/Server Dual Mode:**
  - Runs as a traditional Express server or as a Vercel serverless function (see `api/index.ts` and `api/vercel.ts`).
  - Global app instance caching for cold start reduction in serverless.
- **Optimized Database Connection:**
  - Connection pooling and timeouts tuned for serverless (see `src/config/database.ts`).
  - Graceful degradation if DB unavailable (in dev mode).
- **Configurable CORS:**
  - Multiple origins supported, trailing slash normalization.
- **Centralized Config:**
  - All config in `src/config/config.ts`, loaded from `.env`.
- **Improved Logging:**
  - Winston logger, log level and directory configurable.
- **Rate Limiting:**
  - Global and upload-specific rate limiting, fully configurable.
- **File Uploads:**
  - Multer-based, file type/size validation, serverless compatible.
- **Health & Monitoring:**
  - `/api/health` and `/api/health/detailed` endpoints for uptime, DB, Python API, memory, and system metrics.
- **Error Handling:**
  - Centralized, consistent error responses.
- **Email:**
  - Gmail SMTP for production, Ethereal for dev/testing (auto fallback).

### Directory Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── middleware/       # Express middleware
├── models/           # Database models
├── routes/           # API routes
├── services/         # Business logic
├── utils/            # Utility functions
├── index.ts          # Application entry point
└── server.ts         # Server configuration
```

## 🔌 API Endpoints

See [`API.md`](./API.md) and [`API_ENDPOINTS.md`](./API_ENDPOINTS.md) for full details and examples.

### Main Categories

- **Authentication:**
  - Register, login, logout, OTP, password reset, profile, notifications, account deletion, export
- **Resume Analysis:**
  - Analyze resume, get status/result/history
- **Analysis Management:**
  - List, stats, top, export, delete
- **Admin:**
  - Admin-only endpoints
- **Health & Monitoring:**
  - Health checks, metrics
- **Contact:**
  - Contact form

## 🔧 Development

### Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint         # Run ESLint
```

### Workflow

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
   curl http://localhost:5000/api/health
   curl http://localhost:5000/api/health/detailed
   ```

## 🧪 Testing

- Unit and integration tests: see `src/services/__tests__/`
- Run with `npm test`, `npm run test:unit`, `npm run test:integration`

## 🐛 Troubleshooting

See error messages and logs in `logs/` (or Vercel logs if serverless).

- **Python API connection failed:** Check Python server and `PYTHON_API_URL`.
- **MongoDB connection failed:** Check DB and `MONGODB_URL`.
- **Auth issues:** Check `JWT_SECRET`, token expiry, header format.
- **File upload issues:** Check file size/type, form data.
- **CORS issues:** Check `CORS_ORIGIN`.

## 📊 Monitoring

- Logs: `logs/` directory (or Vercel logs)
- Metrics: `/api/health/detailed`

## 🔒 Security

- Rate limiting (configurable)
- CORS (configurable)
- JWT authentication
- Secure password hashing
- File upload validation

## 📝 API Documentation

- See [`API.md`](./API.md) and [`API_ENDPOINTS.md`](./API_ENDPOINTS.md) for endpoint details, request/response examples, and error formats.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
