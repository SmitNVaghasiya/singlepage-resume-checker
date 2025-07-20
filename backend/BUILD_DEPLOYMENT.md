# Backend Build & Deployment Guide

## Overview

This guide covers building and deploying the backend to Vercel, including fixing the health endpoint issues.

## Build Process

### 1. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Production Build

```bash
# Build for production (includes Vercel compatibility)
npm run build

# This will:
# 1. Compile TypeScript to JavaScript
# 2. Copy vercel.ts to dist/vercel.js for Vercel deployment
```

### 3. Vercel-Specific Build

```bash
# Build specifically for Vercel
npm run build:vercel
```

## Deployment to Vercel

### 1. Environment Variables

Set these environment variables in your Vercel project:

```env
# Database
MONGODB_URL=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Python API
PYTHON_API_URL=https://your-python-api-url.com

# CORS
CORS_ORIGIN=https://singlepage-resume-checker.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
NODE_ENV=production
```

### 2. Vercel Configuration

Vercel will automatically detect and configure the deployment based on:

- The `api/vercel.ts` file (serverless function handler)
- The `package.json` build scripts
- The `dist` output directory

No manual `vercel.json` configuration is needed.

### 3. Deploy

```bash
# Deploy to Vercel
vercel --prod
```

## Health Endpoint Analysis

### Authentication Status

**The `/api/health` endpoint does NOT require authentication.**

Here's why:

1. **No Auth Middleware**: Health routes are registered without authentication middleware
2. **Rate Limiting Excluded**: Health endpoints are explicitly excluded from rate limiting
3. **Public Access**: Designed for monitoring and load balancer health checks

### Health Endpoints Available

1. **Basic Health Check**: `GET /api/health`

   - Returns: status, timestamp, uptime, process ID
   - No authentication required
   - No rate limiting

2. **Detailed Health Check**: `GET /api/health/detailed`
   - Returns: comprehensive system information
   - Includes database and Python API health
   - No authentication required
   - No rate limiting

### Testing Health Endpoint

```bash
# Test basic health
curl https://singlepage-resume-checker-backend-psxxoaojd.vercel.app/api/health

# Test detailed health
curl https://singlepage-resume-checker-backend-psxxoaojd.vercel.app/api/health/detailed

# Using the test script
node test-health-endpoint.js
```

## Troubleshooting

### Build Issues

1. **Missing vercel.js file**

   ```bash
   # Ensure build script runs correctly
   npm run build:vercel
   ```

2. **TypeScript compilation errors**
   ```bash
   # Check for TypeScript errors
   npx tsc --noEmit
   ```

### Deployment Issues

1. **Environment variables not set**

   - Check Vercel dashboard for environment variables
   - Ensure all required variables are configured

2. **CORS issues**

   - Verify CORS_ORIGIN is set correctly
   - Check frontend URL is included in allowed origins

3. **Database connection issues**
   - Verify MONGODB_URL is correct
   - Check MongoDB network access

### Health Endpoint Issues

1. **404 Not Found**

   - Check if vercel.js file exists in dist/
   - Verify Vercel auto-generated configuration

2. **500 Internal Server Error**

   - Check Vercel function logs
   - Verify environment variables are set

3. **CORS errors**
   - Health endpoint should not have CORS issues
   - Check if request is coming from allowed origin

## Monitoring

### Health Check Monitoring

Set up monitoring for the health endpoint:

```bash
# Basic monitoring script
while true; do
  curl -f https://singlepage-resume-checker-backend-psxxoaojd.vercel.app/api/health || echo "Health check failed"
  sleep 60
done
```

### Logs

Check Vercel function logs for debugging:

```bash
# View Vercel logs
vercel logs
```

## Security Considerations

1. **Health endpoints are public** - This is intentional for monitoring
2. **No sensitive data exposed** - Health checks only return system metrics
3. **Rate limiting excluded** - Prevents monitoring tools from being blocked
4. **CORS configured** - Only allows requests from configured origins

## Performance

1. **Health checks are lightweight** - Minimal resource usage
2. **No database queries** - Basic health check doesn't hit database
3. **Cached responses** - Consider implementing caching for detailed health checks
4. **Timeout handling** - Health checks have reasonable timeouts
