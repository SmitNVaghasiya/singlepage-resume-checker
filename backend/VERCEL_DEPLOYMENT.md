# Vercel Deployment Guide for Backend

## 🚀 Quick Deployment Steps

### 1. **Prepare Your Repository**

```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. **Deploy to Vercel**

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set **Root Directory** to `backend`
5. Set **Build Command** to `npm install && npm run build`
6. Set **Output Directory** to `dist`
7. Set **Install Command** to `npm install`

### 3. **Environment Variables**

Add these environment variables in Vercel dashboard:

```env
# Python FastAPI Service (Render)
PYTHON_API_URL=https://singlepage-resume-checker.onrender.com
PYTHON_API_TIMEOUT=120000

# MongoDB Configuration (Atlas)
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/resume_analyzer

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=production

# Security - CORS Configuration
CORS_ORIGIN=https://singlepage-resume-checker-6ppaqdnzt-smit-vaghasiyas-projects.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=50

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,txt

# Email Configuration
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password
EMAIL_FROM="AI Resume Checker" <noreply@airesumechecker.com>

# Logging
LOG_LEVEL=info

# Performance (Optimized for serverless)
CLUSTER_WORKERS=0
COMPRESSION_LEVEL=6
```

## 🔧 **Configuration Details**

### **Vercel Settings**

- **Framework Preset**: Node.js
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Root Directory**: `backend`

### **Function Configuration**

- **Max Duration**: 30 seconds (set in vercel.json)
- **Memory**: 1024 MB (default)
- **Region**: Auto (or choose closest to your users)

## 🧪 **Testing After Deployment**

### 1. **Health Check**

```bash
curl https://your-vercel-backend-url.vercel.app/api/health
```

### 2. **Python API Connection**

```bash
curl https://your-vercel-backend-url.vercel.app/api/health/detailed
```

### 3. **CORS Test**

```javascript
// Test from your frontend
fetch("https://your-vercel-backend-url.vercel.app/api/health")
  .then((response) => response.json())
  .then((data) => console.log("CORS working:", data))
  .catch((error) => console.error("CORS error:", error));
```

## 🔍 **Troubleshooting**

### **Build Failures**

- Check if `npm run build` works locally
- Verify all dependencies are in `package.json`
- Check TypeScript compilation errors

### **Runtime Errors**

- Check Vercel function logs
- Verify environment variables are set correctly
- Check MongoDB connection string

### **CORS Issues**

- Verify `CORS_ORIGIN` matches your frontend URL exactly
- Check if frontend is making requests to correct backend URL

### **Python API Connection**

- Verify `PYTHON_API_URL` is correct
- Check if Render service is running
- Test Python API directly

## 📊 **Monitoring**

### **Vercel Analytics**

- Function execution times
- Error rates
- Cold start performance

### **Custom Logging**

- Check Vercel function logs
- Monitor Python API response times
- Track database connection issues

## 🔄 **Update Process**

1. **Update code** in your repository
2. **Update environment variables** if needed
3. **Redeploy** (automatic with connected repos)
4. **Test** health endpoints
5. **Monitor** for any issues

## 💰 **Cost Optimization**

- **Vercel Hobby**: Free tier available
- **Vercel Pro**: $20/month for more features
- **MongoDB Atlas**: Free tier available
- **Render**: Free tier for Python API

## 🚨 **Important Notes**

1. **Serverless Limitations**:

   - No persistent connections
   - Cold starts on first request
   - 30-second function timeout

2. **Database Optimization**:

   - Connection pooling reduced for serverless
   - Shorter idle times
   - Faster connection establishment

3. **Python API Integration**:
   - Increased timeout for Render service
   - Retry mechanisms in place
   - Error handling for network issues

## 📞 **Support**

If you encounter issues:

1. Check Vercel function logs
2. Test endpoints individually
3. Verify environment variables
4. Check MongoDB Atlas connection
5. Test Python API directly
