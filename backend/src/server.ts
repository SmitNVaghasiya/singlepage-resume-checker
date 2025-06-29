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
import { config } from './config/config';
import { logger } from './utils/logger';

export const createServer = async (): Promise<Express> => {
  const app = express();

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
  app.use('/api/', rateLimiter);

  // Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/resume', resumeRoutes);

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