# Vercel CORS Setup Guide

## Environment Variables to Set in Vercel

Make sure to set these environment variables in your Vercel project settings:

### Required Environment Variables

1. **CORS_ORIGIN**: `https://singlepage-resume-checker.vercel.app`
2. **NODE_ENV**: `production`
3. **MONGODB_URL**: Your MongoDB connection string
4. **JWT_SECRET**: Your JWT secret key
5. **PYTHON_API_URL**: Your Python API URL

### How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your backend project
3. Go to Settings → Environment Variables
4. Add each variable with the correct values

## Testing CORS Configuration

After deploying, you can test the CORS configuration using the provided test script:

```bash
cd backend
node test-cors.js
```

## Common Issues and Solutions

### Issue: CORS error in production but works locally

**Solution**:

- Ensure `CORS_ORIGIN` environment variable is set correctly
- Check that the frontend URL matches exactly
- Verify that the backend is deployed with the latest changes

### Issue: Preflight requests failing

**Solution**:

- The updated CORS configuration now handles preflight requests properly
- Make sure the `vercel.json` file includes the correct headers
- Check that the API handler sets CORS headers for OPTIONS requests

### Issue: Credentials not being sent

**Solution**:

- Ensure `Access-Control-Allow-Credentials: true` is set
- Check that the frontend is sending credentials with requests
- Verify that the origin is not set to `*` when using credentials

## Verification Steps

1. Deploy the backend with the updated configuration
2. Set the environment variables in Vercel
3. Run the CORS test script: `node test-cors.js`
4. Test the login functionality from the frontend
5. Check browser developer tools for any remaining CORS errors

## Debugging

If you're still experiencing issues:

1. Check the Vercel function logs for any errors
2. Use the `/api/health/cors-test` endpoint to debug CORS headers
3. Verify that the frontend is using the correct backend URL
4. Ensure all environment variables are properly set

## Frontend Configuration

Make sure your frontend is configured to use the correct backend URL:

```javascript
// In frontend/src/utils/config.ts
export const config = {
  api: {
    baseUrl: "https://singlepage-resume-checker-backend.vercel.app/api",
  },
  // ... other config
};
```

## Notes

- The CORS configuration now includes multiple layers of protection
- Preflight requests are handled both in the CORS middleware and the API handler
- Vercel-specific headers are set in the `vercel.json` configuration
- The configuration allows both development and production environments
