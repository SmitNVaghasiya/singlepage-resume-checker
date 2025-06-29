"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
const config_1 = require("./config/config");
const logger_1 = require("./utils/logger");
const server_1 = require("./server");
const startWorker = async () => {
    try {
        const app = await (0, server_1.createServer)();
        const port = config_1.config.port;
        app.listen(port, () => {
            logger_1.logger.info(`Worker ${process.pid} started and listening on port ${port}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start worker:', error);
        process.exit(1);
    }
};
const startCluster = () => {
    const numWorkers = config_1.config.clusterWorkers || os_1.default.cpus().length;
    logger_1.logger.info(`Master ${process.pid} setting up ${numWorkers} workers`);
    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
        cluster_1.default.fork();
    }
    cluster_1.default.on('online', (worker) => {
        logger_1.logger.info(`Worker ${worker.process.pid} is online`);
    });
    cluster_1.default.on('exit', (worker, code, signal) => {
        logger_1.logger.error(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
        logger_1.logger.info('Starting a new worker');
        cluster_1.default.fork();
    });
};
// Start the application
if (config_1.config.nodeEnv === 'production' && cluster_1.default.isPrimary && config_1.config.clusterWorkers > 0) {
    startCluster();
}
else {
    startWorker();
}
//# sourceMappingURL=index.js.map