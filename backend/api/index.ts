import { createServer } from '../src/server';
import { Express, Request, Response } from 'express';

let cachedApp: Express | null = null;

export default async function handler(req: Request, res: Response) {
  if (!cachedApp) {
    cachedApp = await createServer({
      enableDatabase: true,
      enableRateLimit: true,
      serverless: true
    });
  }
  return cachedApp(req, res);
} 