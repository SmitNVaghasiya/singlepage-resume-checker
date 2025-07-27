import { createServer } from '../src/server';
import { Express, Request, Response } from 'express';

let cachedApp: Express | null = null;

export default async function handler(req: Request, res: Response) {
  // Set CORS headers for Vercel serverless environment
  const origin = req.headers.origin;
  
  if (origin) {
    // Allow Vercel domains in production
    if (process.env.NODE_ENV === 'production' && origin.includes('.vercel.app')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Check against configured origins
      const corsOrigin = process.env.CORS_ORIGIN;
      if (corsOrigin) {
        const allowedOrigins = corsOrigin.split(',').map(o => o.trim());
        if (allowedOrigins.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        }
      }
    }
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id, Origin, Accept, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.status(200).end();
    return;
  }

  if (!cachedApp) {
    cachedApp = await createServer({
      enableDatabase: true,
      enableRateLimit: true,
      serverless: true
    });
  }
  
  return cachedApp(req, res);
} 