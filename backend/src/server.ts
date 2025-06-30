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
import { config } from './config/config';
import { logger } from './utils/logger';
import { database } from './config/database';

export const createServer = async (): Promise<Express> => {
  const app = express();

  // Initialize database connection
  try {
    await database.connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    logger.warn('Server starting without database connection - authentication features will not work!');
    // For development, you might want to throw the error instead:
    // throw error;
  }

  // Trust proxy for accurate rate limiting
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    optionsSuccessStatus: 200,
  }));

  // Compression middleware
  app.use(compression({
    level: config.compressionLevel,
    threshold: 1024,
  }));

  // Request logging
  if (config.nodeEnv === 'production') {
    app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
  } else {
    app.use(morgan('dev'));
  }

  // Body parsing middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Custom request logger
  app.use(requestLogger);

  // Rate limiting
  app.use('/api/', rateLimiter());

  // Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/resume', resumeRoutes);
  app.use('/api/analyses', analysisRoutes);
  app.use('/api/contact', contactRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found',
    });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}; 