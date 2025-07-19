import { createServer } from './server';
import { config } from './config/config';
import { logger } from './utils/logger';

// Serverless-compatible server creation
export default async function handler(req: any, res: any): Promise<void> {
  try {
    const app = await createServer({
      enableDatabase: true,
      enableRateLimit: true
    });

    // Handle the request using the Express app
    return new Promise<void>((resolve, reject) => {
      app(req, res, (err: any) => {
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
    res.status(500).json({ error: 'Internal server error' });
  }
}

// For local development
if (process.env.NODE_ENV !== 'production') {
  const startServer = async () => {
    try {
      const app = await createServer({
        enableDatabase: true,
        enableRateLimit: true
      });

      const port = config.port;
      app.listen(port, () => {
        logger.info(`Development server listening on port ${port}`);
      });
    } catch (error) {
      logger.error('Failed to start development server:', error);
      process.exit(1);
    }
  };

  startServer();
} 