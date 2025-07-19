# Backend Deployment Guide

## 🚀 Online Deployment Configuration

### Environment Variables for Production

Create a `.env` file in the backend directory with these settings:

```env
# Python FastAPI Service (Update with your Python server URL)
PYTHON_API_URL=https://your-python-server.onrender.com
PYTHON_API_TIMEOUT=120000

# MongoDB Configuration (Use MongoDB Atlas for production)
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/resume_analyzer

# Authentication (Generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=production

# Security - CORS Configuration
# Your frontend URL from Vercel
CORS_ORIGIN=https://singlepage-resume-checker.vercel.app

# Rate Limiting (More restrictive for production)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=50

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,txt

# Redis (Optional for production)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Email Configuration
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password
EMAIL_FROM="AI Resume Checker" <noreply@airesumechecker.com>
```

## 🎯 Key Configuration Points

### 1. CORS Configuration ✅

```env
CORS_ORIGIN=https://singlepage-resume-checker.vercel.app
```

- **Only your frontend URL** - no need for localhost in production
- Backend will accept requests only from your Vercel frontend

### 2. Python Server URL

```env
PYTHON_API_URL=https://your-python-server.onrender.com
```

- Update this to your actual Python server URL on Render
- Must use HTTPS for production

### 3. MongoDB Atlas (Recommended)

```env
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/resume_analyzer
```

- Use MongoDB Atlas for production database
- Free tier available at [mongodb.com/atlas](https://mongodb.com/atlas)

## 🚀 Deployment Platforms

### Option 1: Render (Recommended)

1. **Connect your GitHub repository**
2. **Set Root Directory**: `backend`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Environment Variables**: Add all variables from above

### Option 2: Railway

1. **Connect your GitHub repository**
2. **Set Root Directory**: `backend`
3. **Environment Variables**: Add all variables from above
4. **Auto-deploy**: Enabled by default

### Option 3: Heroku

1. **Create Heroku app**
2. **Set buildpacks**: Node.js
3. **Environment Variables**: Add all variables from above
4. **Deploy**: `git push heroku main`

## 🔧 Pre-deployment Checklist

### ✅ Environment Variables

- [ ] `CORS_ORIGIN` set to your Vercel frontend URL
- [ ] `PYTHON_API_URL` set to your Render Python server
- [ ] `MONGODB_URL` set to MongoDB Atlas connection string
- [ ] `JWT_SECRET` set to a strong random string
- [ ] `NODE_ENV` set to `production`

### ✅ Dependencies

- [ ] All dependencies in `package.json`
- [ ] `package-lock.json` committed
- [ ] Build script works: `npm run build`

### ✅ Security

- [ ] No hardcoded secrets in code
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] JWT secret is strong and unique

## 🧪 Testing After Deployment

### 1. Health Check

```bash
curl https://your-backend-url.com/api/health
```

### 2. CORS Test

```javascript
// Test from your frontend
fetch("https://your-backend-url.com/api/health")
  .then((response) => response.json())
  .then((data) => console.log("CORS working:", data))
  .catch((error) => console.error("CORS error:", error));
```

### 3. Python API Connection

```bash
curl https://your-backend-url.com/api/health/detailed
```

Should show Python API as healthy.

## 🔍 Troubleshooting

### CORS Errors

- **Symptom**: "CORS policy blocked request"
- **Solution**: Check `CORS_ORIGIN` matches your frontend URL exactly

### Python API Connection Failed

- **Symptom**: "Python API connection failed"
- **Solution**: Verify `PYTHON_API_URL` is correct and accessible

### Database Connection Failed

- **Symptom**: "MongoDB connection failed"
- **Solution**: Check `MONGODB_URL` and network access

### Authentication Issues

- **Symptom**: JWT token errors
- **Solution**: Verify `JWT_SECRET` is set correctly

## 📊 Monitoring

### Health Endpoints

- **Basic**: `/api/health`
- **Detailed**: `/api/health/detailed`
- **Python API**: Included in detailed health check

### Logs

- Check deployment platform logs
- Monitor error rates
- Watch for Python API timeouts

## 🔄 Update Process

1. **Update code** in your repository
2. **Update environment variables** if needed
3. **Redeploy** (automatic with connected repos)
4. **Test** health endpoints
5. **Monitor** for any issues

## 💰 Cost Optimization

- **Render**: Free tier available (750 hours/month)
- **Railway**: Free tier available
- **Heroku**: Free tier discontinued, paid plans start at $7/month
- **MongoDB Atlas**: Free tier available (512MB storage)
