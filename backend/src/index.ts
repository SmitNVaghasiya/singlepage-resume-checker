import cluster from 'cluster';
import os from 'os';
import { config } from './config/config';
import { logger } from './utils/logger';
import { createServer } from './server';

const startWorker = async () => {
  try {
    const app = await createServer();
    const port = config.port;

    app.listen(port, () => {
      logger.info(`Worker ${process.pid} started and listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  }
};

const startCluster = () => {
  const numWorkers = config.clusterWorkers || os.cpus().length;

  logger.info(`Master ${process.pid} setting up ${numWorkers} workers`);

  // Fork workers
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    logger.info(`Worker ${worker.process.pid} is online`);
  });

  cluster.on('exit', (worker, code, signal) => {
    logger.error(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    logger.info('Starting a new worker');
    cluster.fork();
  });
};

// Start the application
if (config.nodeEnv === 'production' && cluster.isPrimary && config.clusterWorkers > 0) {
  startCluster();
} else {
  startWorker();
}