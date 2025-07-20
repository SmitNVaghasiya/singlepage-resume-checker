import { createServer } from './server';
import { config } from './config/config';
import { logger } from './utils/logger';

// Global variable to cache the Express app instance
let cachedApp: any = null;

// Serverless-compatible server creation
export default async function handler(req: any, res: any): Promise<void> {
  try {
    // Cache the app instance for better performance
    if (!cachedApp) {
      logger.info('Initializing server for Vercel...');
      cachedApp = await createServer({
        enableDatabase: true,
        enableRateLimit: true,
        serverless: true
      });
      logger.info('Server initialized successfully for Vercel');
    }

    // Handle the request using the cached Express app
    return new Promise<void>((resolve, reject) => {
      cachedApp(req, res, (err: any) => {
        if (err) {
          logger.error('Request handling error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    logger.error('Server creation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to initialize server',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  }
}

// For local development only
if (process.env.NODE_ENV !== 'production') {
  const startServer = async () => {
    try {
      const app = await createServer({
        enableDatabase: true,
        enableRateLimit: true,
        serverless: false
      });

      const port = config.port;
      app.listen(port, () => {
        logger.info(`Development server listening on port ${port}`);
        logger.info(`Health check available at: http://localhost:${port}/api/health`);
      });
    } catch (error) {
      logger.error('Failed to start development server:', error);
      process.exit(1);
    }
  };

  startServer();
} 