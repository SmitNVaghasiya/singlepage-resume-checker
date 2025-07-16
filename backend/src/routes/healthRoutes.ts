import { Router, Request, Response } from 'express';
import os from 'os';
import { pythonApiService } from '../services/pythonApiService';
import { database } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// Basic health check
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid,
  });
});

// Detailed health check
router.get('/detailed', async (_req: Request, res: Response) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Check Python API health
    const pythonApiHealth = await pythonApiService.checkHealth();
    
    // Check database health
    const databaseHealth = await database.checkHealth();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid,
      pythonApi: pythonApiHealth,
      database: databaseHealth,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      cpu: {
        user: `${Math.round(cpuUsage.user / 1000)}ms`,
        system: `${Math.round(cpuUsage.system / 1000)}ms`,
      },
      system: {
        loadAverage: os.loadavg(),
        freeMemory: `${Math.round(os.freemem() / 1024 / 1024)}MB`,
        totalMemory: `${Math.round(os.totalmem() / 1024 / 1024)}MB`,
        cpus: os.cpus().length,
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

export default router; 