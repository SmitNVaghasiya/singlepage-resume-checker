# Render Deployment Guide

## Prerequisites

1. **Groq API Key**: Get your API key from [Groq Console](https://console.groq.com/)
2. **MongoDB Database**: Set up a MongoDB database (Atlas recommended for production)
3. **Render Account**: Sign up at [render.com](https://render.com)

## Deployment Steps

### 1. Prepare Your Repository

Ensure your `python_server` folder contains:

- ✅ `main.py` (FastAPI application)
- ✅ `requirements.txt` (dependencies)
- ✅ `render.yaml` (deployment configuration)
- ✅ All application files (`app/`, `routes/`, etc.)

### 2. Deploy on Render

#### Option A: Using render.yaml (Recommended)

1. Push your code to GitHub/GitLab
2. Connect your repository to Render
3. Render will automatically detect the `render.yaml` file
4. Set the required environment variables in Render dashboard

#### Option B: Manual Configuration

1. Create a new Web Service on Render
2. Connect your repository
3. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3.11

### 3. Set Environment Variables

In Render dashboard, set these environment variables:

| Variable       | Description               | Required | Example                  |
| -------------- | ------------------------- | -------- | ------------------------ |
| `GROQ_API_KEY` | Your Groq API key         | ✅       | `gsk_...`                |
| `MONGODB_URL`  | MongoDB connection string | ✅       | `mongodb+srv://...`      |
| `GROQ_MODEL`   | AI model to use           | ❌       | `llama3-8b-8192`         |
| `CORS_ORIGINS` | Allowed origins           | ❌       | `https://yourdomain.com` |

### 4. MongoDB Setup (Recommended: MongoDB Atlas)

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Get your connection string
3. Add it as `MONGODB_URL` in Render environment variables

### 5. Test Your Deployment

Once deployed, test these endpoints:

- **Health Check**: `https://your-app.onrender.com/api/v1/health`
- **API Docs**: `https://your-app.onrender.com/docs`
- **Root**: `https://your-app.onrender.com/`

## Environment Variables Reference

### Required Variables

- `GROQ_API_KEY`: Your Groq API key for AI analysis
- `MONGODB_URL`: MongoDB connection string

### Optional Variables

- `GROQ_MODEL`: AI model (default: `llama3-8b-8192`)
- `CORS_ORIGINS`: Comma-separated origins (default: `*`)
- `PORT`: Port number (auto-set by Render)

## Troubleshooting

### Common Issues

1. **Build Fails**: Check `requirements.txt` for any missing dependencies
2. **Runtime Errors**: Check Render logs for detailed error messages
3. **Database Connection**: Ensure MongoDB URL is correct and accessible
4. **API Key Issues**: Verify Groq API key is valid and has sufficient credits

### Logs and Monitoring

- View logs in Render dashboard
- Monitor health endpoint: `/api/v1/health`
- Check rate limiting stats in health response

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **CORS**: Set specific origins in production, not `*`
3. **Rate Limiting**: Current limit is 15 requests/day per IP
4. **File Uploads**: Limited to 5MB, validated file types only

## Cost Optimization

- **Free Tier**: 750 hours/month (sufficient for development/testing)
- **Paid Plans**: Start at $7/month for always-on service
- **Groq Costs**: Pay per API call (very affordable for resume analysis)
