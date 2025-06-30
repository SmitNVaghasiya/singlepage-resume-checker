"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const requestLogger_1 = require("./middleware/requestLogger");
const resumeRoutes_1 = __importDefault(require("./routes/resumeRoutes"));
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
const analysisRoutes_1 = require("./routes/analysisRoutes");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const contactRoutes_1 = __importDefault(require("./routes/contactRoutes"));
const config_1 = require("./config/config");
const logger_1 = require("./utils/logger");
const database_1 = require("./config/database");
const createServer = async () => {
    const app = (0, express_1.default)();
    // Initialize database connection
    try {
        await database_1.database.connect();
        logger_1.logger.info('Database connected successfully');
    }
    catch (error) {
        logger_1.logger.error('Database connection failed:', error);
        logger_1.logger.warn('Server starting without database connection - authentication features will not work!');
        // For development, you might want to throw the error instead:
        // throw error;
    }
    // Trust proxy for accurate rate limiting
    app.set('trust proxy', 1);
    // Security middleware
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));
    // CORS configuration
    app.use((0, cors_1.default)({
        origin: config_1.config.corsOrigin,
        credentials: true,
        optionsSuccessStatus: 200,
    }));
    // Compression middleware
    app.use((0, compression_1.default)({
        level: config_1.config.compressionLevel,
        threshold: 1024,
    }));
    // Request logging
    if (config_1.config.nodeEnv === 'production') {
        app.use((0, morgan_1.default)('combined', { stream: { write: message => logger_1.logger.info(message.trim()) } }));
    }
    else {
        app.use((0, morgan_1.default)('dev'));
    }
    // Body parsing middleware
    app.use(express_1.default.json({ limit: '50mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
    // Custom request logger
    app.use(requestLogger_1.requestLogger);
    // Rate limiting
    app.use('/api/', (0, rateLimiter_1.rateLimiter)());
    // Routes
    app.use('/api/health', healthRoutes_1.default);
    app.use('/api/auth', authRoutes_1.default);
    app.use('/api/resume', resumeRoutes_1.default);
    app.use('/api/analyses', analysisRoutes_1.analysisRoutes);
    app.use('/api/contact', contactRoutes_1.default);
    // 404 handler
    app.use((_req, res) => {
        res.status(404).json({
            error: 'Not Found',
            message: 'The requested resource was not found',
        });
    });
    // Error handler
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createServer = createServer;
//# sourceMappingURL=server.js.map