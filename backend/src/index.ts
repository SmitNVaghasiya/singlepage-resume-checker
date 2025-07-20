import { config } from './config/config';
import { logger } from './utils/logger';
import { createServer } from './server';

const startServer = async () => {
  try {
    const app = await createServer({
      enableDatabase: true,
      enableRateLimit: true,
      serverless: false
    });
    
    const port = config.port;

    app.listen(port, () => {
      logger.info(`Server started and listening on port ${port}`);
      logger.info(`Health check available at: http://localhost:${port}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application (no clustering for Vercel compatibility)
startServer();