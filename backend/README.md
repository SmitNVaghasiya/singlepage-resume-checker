# Resume Checker Backend

A high-performance Node.js backend designed to handle 10,000+ concurrent users for resume analysis.

## Features

- **Scalable Architecture**: Cluster mode support for multi-core utilization
- **High Performance**: Async processing, caching, and optimized middleware
- **Security**: Rate limiting, helmet security headers, input validation
- **File Handling**: Support for PDF, DOC, DOCX, and TXT files
- **Monitoring**: Comprehensive logging and health checks
- **Production Ready**: PM2 configuration for process management

## Tech Stack

- **Node.js** with **TypeScript**
- **Express.js** - Web framework
- **Multer** - File upload handling
- **Axios** - HTTP client for Python API communication
- **Winston** - Logging
- **PM2** - Production process manager
- **Express Rate Limit** - API rate limiting

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Node.js   │────▶│ Python API  │
│    (React)  │     │   Backend   │     │  (FastAPI)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    Cache    │
                    │ (In-Memory) │
                    └─────────────┘
```

## API Endpoints

### Health Check

- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system metrics

### Resume Analysis

- `POST /api/resume/analyze` - Upload resume and job description for analysis
- `GET /api/resume/status/:analysisId` - Check analysis status
- `GET /api/resume/result/:analysisId` - Get analysis results

## Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file:

   ```env
   PORT=5000
   NODE_ENV=development
   PYTHON_API_URL=http://localhost:8000
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Development**

   ```bash
   npm run dev
   ```

4. **Build for Production**

   ```bash
   npm run build
   ```

5. **Run in Production**
   ```bash
   npm run start:prod
   ```

## Performance Optimizations

1. **Clustering**: Utilizes all CPU cores in production
2. **Async Processing**: Non-blocking I/O operations
3. **Caching**: In-memory cache (upgradeable to Redis)
4. **Compression**: Gzip compression for responses
5. **Rate Limiting**: Prevents abuse and ensures fair usage

## Scaling Considerations

### For 10,000+ Concurrent Users:

1. **Infrastructure**:

   - Use a load balancer (nginx/HAProxy)
   - Deploy multiple server instances
   - Use Redis for distributed caching
   - CDN for static assets

2. **Database** (if needed):

   - Connection pooling
   - Read replicas
   - Query optimization

3. **Monitoring**:
   - APM tools (New Relic, DataDog)
   - Error tracking (Sentry)
   - Metrics collection (Prometheus)

## Security Features

- CORS configuration
- Helmet.js security headers
- Rate limiting
- Input validation
- File type validation
- Size limits on uploads

## Error Handling

Comprehensive error handling with:

- Structured error responses
- Proper HTTP status codes
- Error logging
- Graceful degradation

## Development Commands

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Start with PM2
npm run start:prod

# Lint code
npm run lint
```

## Production Deployment

1. Build the application
2. Set environment variables
3. Use PM2 for process management
4. Set up reverse proxy (nginx)
5. Enable SSL/TLS
6. Configure firewall rules

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
