import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { config } from './config';

class Database {
  private static instance: Database;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private maxRetries: number = 3;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Already connected to MongoDB');
      return;
    }

    try {
      const mongoUri = config.mongoUri || 'mongodb://localhost:27017/resume_analyzer';
      
      logger.info(`Attempting to connect to MongoDB: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      
      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000, // Increased timeout for Atlas
        socketTimeoutMS: 45000,
        bufferCommands: true,
        // Add these options for better Atlas compatibility
        retryWrites: true,
        w: 'majority',
        // Connection pool settings
        minPoolSize: 1,
        maxIdleTimeMS: 30000,
        // Timeout settings
        connectTimeoutMS: 30000,
        // Heartbeat settings
        heartbeatFrequencyMS: 10000,
        // Server selection settings
        localThresholdMS: 15
      });

      this.isConnected = true;
      this.connectionAttempts = 0;
      logger.info(`Successfully connected to MongoDB: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      this.connectionAttempts++;
      logger.error(`Failed to connect to MongoDB (attempt ${this.connectionAttempts}/${this.maxRetries}):`, error);
      
      if (this.connectionAttempts < this.maxRetries) {
        logger.info(`Retrying connection in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.connect();
      }
      
      this.isConnected = false;
      
      // In development, allow the app to continue without database
      if (config.nodeEnv === 'development') {
        logger.warn('Continuing without database connection - authentication features will be limited');
        return;
      }
      
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public isConnectionActive(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public async checkHealth(): Promise<{ status: string; details?: any }> {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected' };
      }

      // Ping the database
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      } else {
        throw new Error('Database connection not established');
      }
      
      return {
        status: 'connected',
        details: {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name
        }
      };
    } catch (error) {
      return {
        status: 'error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}

export const database = Database.getInstance(); 