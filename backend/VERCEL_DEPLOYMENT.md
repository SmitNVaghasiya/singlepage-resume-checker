# Vercel Deployment Guide for Resume Checker Backend

## 🚀 **Quick Deploy to Vercel**

This backend is fully optimized for Vercel serverless deployment. Follow these steps to deploy:

### 1. **Prerequisites**

- Vercel account
- MongoDB Atlas database
- Python API server (deployed on Render/Heroku)
- GitHub repository with this code

### 2. **Deploy to Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from backend directory)
cd backend
vercel --prod
```

### 3. **Environment Variables Setup**

Set these environment variables in your Vercel project dashboard:

```env
# Required for Vercel
NODE_ENV=production
PORT=3000

# Database (MongoDB Atlas)
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/resume_analyzer

# Python API (Render/Heroku)
PYTHON_API_URL=https://your-python-server.onrender.com
PYTHON_API_TIMEOUT=30000

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# CORS (Your frontend URL)
CORS_ORIGIN=https://singlepage-resume-checker.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,txt

# Logging
LOG_LEVEL=info
```

## 🔧 **Configuration Details**

### **Vercel-Specific Optimizations**

1. **Serverless Function Configuration**

   - Max duration: 30 seconds
   - Memory: Auto-optimized
   - Cold start: Minimized with app caching

2. **Database Connection**

   - Optimized for serverless with connection pooling
   - Automatic reconnection handling
   - Graceful degradation if database unavailable

3. **CORS Configuration**
   - Pre-configured for Vercel domains
   - Supports multiple frontend URLs
   - Handles preflight requests

### **Build Process**

The build process is optimized for Vercel:

```json
{
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "dist"
}
```

This compiles TypeScript and prepares the serverless function.

## 📊 **Performance Optimizations**

### **1. App Caching**

- Express app instance is cached globally
- Reduces cold start times
- Improves response times for subsequent requests

### **2. Database Optimization**

- Connection pooling optimized for serverless
- Minimal connection count (maxPoolSize: 1)
- Fast connection establishment

### **3. Memory Management**

- Automatic cleanup of expired connections
- Efficient error handling
- Minimal memory footprint

## 🔍 **Monitoring & Debugging**

### **Health Endpoints**

```bash
# Basic health check
curl https://your-vercel-app.vercel.app/api/health

# Detailed health check
curl https://your-vercel-app.vercel.app/api/health/detailed
```

### **Vercel Logs**

```bash
# View function logs
vercel logs

# View real-time logs
vercel logs --follow
```

### **Function Analytics**

- Monitor in Vercel dashboard
- Track execution times
- Monitor error rates
- View cold start performance

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **Build Failures**

   ```bash
   # Check build locally
   npm run build

   # Verify TypeScript compilation
   npx tsc --noEmit
   ```

2. **Database Connection Issues**

   - Verify MONGODB_URL is correct
   - Check MongoDB Atlas network access
   - Ensure IP whitelist includes Vercel

3. **CORS Errors**

   - Verify CORS_ORIGIN matches frontend URL
   - Check for trailing slashes
   - Ensure HTTPS URLs

4. **Function Timeouts**
   - Optimize database queries
   - Implement request caching
   - Consider function configuration in Vercel dashboard

### **Debug Mode**

Enable debug logging by setting:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 🔒 **Security Considerations**

### **Environment Variables**

- Never commit secrets to Git
- Use Vercel's environment variable encryption
- Rotate JWT secrets regularly

### **CORS Security**

- Restrict origins to specific domains
- Avoid wildcard (\*) in production
- Validate all incoming requests

### **Rate Limiting**

- Configure appropriate limits for your use case
- Monitor for abuse patterns
- Implement progressive rate limiting

## 📈 **Scaling Considerations**

### **Automatic Scaling**

- Vercel automatically scales based on demand
- No manual configuration required
- Global edge deployment

### **Database Scaling**

- Use MongoDB Atlas for automatic scaling
- Monitor connection pool usage
- Implement read replicas if needed

### **API Limits**

- Vercel Hobby: 100GB-hours/month
- Vercel Pro: 1000GB-hours/month
- Monitor usage in dashboard

## 🔄 **Update Process**

### **Automatic Deployments**

1. Push changes to GitHub
2. Vercel automatically builds and deploys
3. Preview deployments for pull requests
4. Production deployment for main branch

### **Manual Deployments**

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Rollback to previous version
vercel --prod --force
```

## 📞 **Support**

### **Vercel Support**

- Documentation: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions
- Status: https://vercel-status.com

### **Backend-Specific Issues**

- Check logs in Vercel dashboard
- Monitor function execution times
- Verify environment variables

---

## ✅ **Deployment Checklist**

- [ ] Environment variables configured
- [ ] MongoDB Atlas database set up
- [ ] Python API server deployed
- [ ] CORS origins configured
- [ ] JWT secret generated
- [ ] Build process tested locally
- [ ] Health endpoints working
- [ ] Database connection verified
- [ ] File upload functionality tested
- [ ] Authentication flow working
- [ ] Rate limiting configured
- [ ] Error handling verified
- [ ] Logging configured
- [ ] Monitoring set up

---

**Last Updated**: January 2024  
**Version**: 2.0.0  
**Compatibility**: Vercel 2.0+
