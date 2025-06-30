"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const config_1 = require("./config");
class Database {
    constructor() {
        this.isConnected = false;
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connect() {
        if (this.isConnected) {
            logger_1.logger.info('Already connected to MongoDB');
            return;
        }
        try {
            const mongoUri = config_1.config.mongoUri || 'mongodb://localhost:27017/resume_analyzer';
            await mongoose_1.default.connect(mongoUri, {
                maxPoolSize: 10, // Maintain up to 10 socket connections
                serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
                bufferCommands: true // Enable mongoose buffering for better error handling
            });
            this.isConnected = true;
            logger_1.logger.info(`Connected to MongoDB: ${mongoUri}`);
            // Handle connection events
            mongoose_1.default.connection.on('error', (error) => {
                logger_1.logger.error('MongoDB connection error:', error);
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('disconnected', () => {
                logger_1.logger.warn('MongoDB disconnected');
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('reconnected', () => {
                logger_1.logger.info('MongoDB reconnected');
                this.isConnected = true;
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to MongoDB:', error);
            this.isConnected = false;
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await mongoose_1.default.disconnect();
            this.isConnected = false;
            logger_1.logger.info('Disconnected from MongoDB');
        }
        catch (error) {
            logger_1.logger.error('Error disconnecting from MongoDB:', error);
            throw error;
        }
    }
    isConnectionActive() {
        return this.isConnected && mongoose_1.default.connection.readyState === 1;
    }
    async checkHealth() {
        try {
            if (!this.isConnected) {
                return { status: 'disconnected' };
            }
            // Ping the database
            if (mongoose_1.default.connection.db) {
                await mongoose_1.default.connection.db.admin().ping();
            }
            else {
                throw new Error('Database connection not established');
            }
            return {
                status: 'connected',
                details: {
                    readyState: mongoose_1.default.connection.readyState,
                    host: mongoose_1.default.connection.host,
                    port: mongoose_1.default.connection.port,
                    name: mongoose_1.default.connection.name
                }
            };
        }
        catch (error) {
            return {
                status: 'error',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    }
}
exports.database = Database.getInstance();
//# sourceMappingURL=database.js.map