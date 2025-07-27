import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import resumeRoutes from './routes/resumeRoutes';
import healthRoutes from './routes/healthRoutes';
import { analysisRoutes } from './routes/analysisRoutes';
import authRoutes from './routes/authRoutes';
import contactRoutes from './routes/contactRoutes';
import { adminRoutes } from './admin';
import feedbackRoutes from './routes/feedbackRoutes';
import { config } from './config/config';
import { logger } from './utils/logger';
import { database } from './config/database';

interface ServerOptions {
  enableDatabase?: boolean;
  enableRateLimit?: boolean;
  serverless?: boolean;
}

class Server {
  private app: Express;
  private server?: any;
  private isDatabaseConnected = false;

  constructor() {
    this.app = express();
    this.setupGracefulShutdown();
  }

  public async create(options: ServerOptions = {}): Promise<Express> {
    const { enableDatabase = true, enableRateLimit = true, serverless = false } = options;

    try {
      // Initialize database connection
      if (enableDatabase) {
        await this.initializeDatabase(serverless);
      }

      // Setup middleware
      this.setupSecurityMiddleware();
      this.setupRequestMiddleware();
      this.setupBodyParsing();
      this.setupLogging();
      
      // Setup routes BEFORE rate limiting
      this.setupRoutes();
      
      if (enableRateLimit) {
        this.setupRateLimiting();
      }

      this.setupErrorHandling();

      logger.info('Server configuration completed successfully');
      return this.app;

    } catch (error) {
      logger.error('Failed to create server:', error);
      throw error;
    }
  }

  public listen(port: number, callback?: () => void): void {
    this.server = this.app.listen(port, () => {
      logger.info(`Server listening on port ${port} in ${config.nodeEnv} mode`);
      if (callback) callback();
    });

    // Handle server errors
    this.server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });
  }

  private async initializeDatabase(serverless: boolean = false): Promise<void> {
    try {
      await database.connect(serverless);
      
      // Check if the connection is actually active
      if (database.isConnectionActive()) {
        this.isDatabaseConnected = true;
        logger.info('Database connected successfully');
      } else {
        this.isDatabaseConnected = false;
        logger.warn('Database connection failed - continuing without database');
      }
    } catch (error) {
      logger.error('Database connection failed:', error);
      this.isDatabaseConnected = false;
      
      if (config.nodeEnv === 'production') {
        logger.error('Database is required in production mode');
        throw error;
      } else {
        logger.warn('Continuing without database - authentication features will be limited');
      }
    }
  }

  private setupSecurityMiddleware(): void {
    // Trust proxy for accurate client IP detection
    this.app.set('trust proxy', 1);

    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: config.nodeEnv === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
      hsts: config.nodeEnv === 'production',
    }));

    // CORS configuration - Enhanced for Vercel deployment
    const corsOptions = {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          callback(null, true);
          return;
        }

        // Log for debugging
        logger.info(`CORS check - Origin: ${origin}, CORS_ORIGIN env: ${process.env.CORS_ORIGIN}`);

        // Always allow Vercel domains in production
        if (config.nodeEnv === 'production' && origin.includes('.vercel.app')) {
          callback(null, true);
          return;
        }

        // Check against configured CORS_ORIGIN
        const allowedOrigins = this.normalizeOrigins(config.corsOrigin);
        
        if (allowedOrigins === '*' || allowedOrigins.length === 0) {
          callback(null, true);
          return;
        }

        if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        // Fallback: allow the specific frontend URL
        if (origin === 'https://singlepage-resume-checker.vercel.app') {
          callback(null, true);
          return;
        }

        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'Origin', 'Accept', 'X-Requested-With'],
      exposedHeaders: ['Content-Length', 'X-Request-Id'],
    };

    this.app.use(cors(corsOptions));

    // Enhanced preflight handling for Vercel
    this.app.options('*', (req, res) => {
      const origin = req.headers.origin;
      
      // Set CORS headers for preflight requests
      if (origin) {
        // Allow Vercel domains in production
        if (config.nodeEnv === 'production' && origin.includes('.vercel.app')) {
          res.header('Access-Control-Allow-Origin', origin);
        } else {
          // Check against configured origins
          const allowedOrigins = this.normalizeOrigins(config.corsOrigin);
          if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
          } else {
            res.header('Access-Control-Allow-Origin', '*');
          }
        }
      } else {
        res.header('Access-Control-Allow-Origin', '*');
      }
      
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id, Origin, Accept, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400'); // 24 hours
      res.status(200).end();
    });

    // Additional middleware to ensure CORS headers are set on all responses
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      
      // Always set CORS headers for all responses
      if (origin) {
        // Allow Vercel domains in production
        if (config.nodeEnv === 'production' && origin.includes('.vercel.app')) {
          res.header('Access-Control-Allow-Origin', origin);
        } else {
          // Check against configured origins
          const allowedOrigins = this.normalizeOrigins(config.corsOrigin);
          if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
          } else if (allowedOrigins === '*') {
            res.header('Access-Control-Allow-Origin', '*');
          }
        }
      } else {
        // If no origin, allow all (for server-to-server requests)
        res.header('Access-Control-Allow-Origin', '*');
      }
      
      // Set other CORS headers
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id, Origin, Accept, X-Requested-With');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
        res.status(200).end();
        return;
      }
      
      next();
    });
  }

  private setupRequestMiddleware(): void {
    // Compression middleware
    this.app.use(compression({
      level: config.compressionLevel,
      threshold: 1024,
      filter: (req, res) => {
        // Don't compress if the request includes a cache-control header
        if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
          return false;
        }
        return compression.filter(req, res);
      },
    }));

    // Custom request logger (before other middleware)
    this.app.use(requestLogger);
  }

  private setupBodyParsing(): void {
    // JSON parsing with size limits
    this.app.use(express.json({ 
      limit: '50mb',
      verify: (req, _res, buf) => {
        // Add raw body for signature verification if needed
        (req as any).rawBody = buf;
      }
    }));

    // URL encoded parsing
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '50mb',
      parameterLimit: 1000,
    }));
  }

  private setupLogging(): void {
    if (config.nodeEnv === 'production') {
      // Structured logging for production
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim(), { component: 'http' })
        },
        skip: (req) => {
          // Skip health check logs to reduce noise
          return req.url.startsWith('/api/health');
        }
      }));
    } else {
      // Development logging
      this.app.use(morgan('dev', {
        skip: (req) => req.url.startsWith('/api/health')
      }));
    }
  }

  private setupRateLimiting(): void {
    // Global rate limiting
    this.app.use('/api/', rateLimiter);
  }

  private setupRoutes(): void {
    // Health checks (no rate limiting) - register BEFORE rate limiting
    this.app.use('/api/health', healthRoutes);

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/resume', resumeRoutes);
    this.app.use('/api/analyses', analysisRoutes);
    this.app.use('/api/contact', contactRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/feedback', feedbackRoutes);

    // API documentation route
    this.app.get('/api', (_req, res) => {
      res.json({
        name: 'Resume Checker API',
        version: '1.0.0',
        status: 'active',
        endpoints: {
          health: '/api/health',
          auth: '/api/auth',
          resume: '/api/resume',
          analyses: '/api/analyses',
          contact: '/api/contact',
          admin: '/api/admin',
          feedback: '/api/feedback',
        },
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler for undefined routes
    this.app.use((req, res, _next) => {
      logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        path: req.originalUrl,
        method: req.method,
      });
    });

    // Global error handler
    this.app.use(errorHandler);
  }

  private normalizeOrigins(origins: string | string[]): string | string[] {
    if (Array.isArray(origins)) {
      return origins.map(origin => origin.trim()).filter(Boolean);
    }
    
    if (origins === '*') {
      return '*';
    }
    
    return origins.split(',').map(origin => origin.trim()).filter(Boolean);
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      // Close HTTP server
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }

      // Close database connection
      if (this.isDatabaseConnected) {
        try {
          await database.disconnect();
          logger.info('Database connection closed');
        } catch (error) {
          logger.error('Error closing database connection:', error);
        }
      }

      // Give ongoing requests time to complete
      setTimeout(() => {
        logger.info('Forcefully shutting down');
        process.exit(0);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      shutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection:', { reason, promise });
      shutdown('unhandledRejection');
    });
  }

  // Getter for testing
  public get expressApp(): Express {
    return this.app;
  }

  // Health check method
  public async healthCheck(): Promise<{ status: string; database?: any; uptime: number }> {
    const health: any = {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    if (this.isDatabaseConnected) {
      try {
        health.database = await database.checkHealth();
      } catch (error) {
        health.database = { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
        health.status = 'degraded';
      }
    }

    return health;
  }
}

// Factory function for creating server
export const createServer = async (options?: ServerOptions): Promise<Express> => {
  const server = new Server();
  return server.create(options);
};

// Export server class for testing
export { Server }; 