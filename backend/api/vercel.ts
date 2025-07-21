import { createServer } from '../src/server';
import { logger } from '../src/utils/logger';

// Global variable to cache the Express app instance
let cachedApp: any = null;

// Add this block at the top, after imports
const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'MONGODB_URL',
  'PYTHON_API_URL',
  'JWT_SECRET',
  'CORS_ORIGIN'
];

function logMissingEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    logger.warn(
      `Warning: Missing required environment variables: ${missing.join(', ')}. The backend may not function correctly without these.`
    );
  }
}

let envChecked = false;

// Serverless-compatible server creation
export default async function handler(req: any, res: any): Promise<void> {
  try {
    if (!envChecked) {
      logMissingEnvVars();
      envChecked = true;
    }
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