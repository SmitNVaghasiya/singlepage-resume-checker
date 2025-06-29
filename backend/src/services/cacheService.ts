import { logger } from '../utils/logger';

interface CacheItem<T> {
  data: T;
  expiresAt: number;
}

interface AnalysisStatus {
  status: 'processing' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
}

class CacheService {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number = 3600000; // 1 hour in milliseconds

  constructor() {
    this.cache = new Map();
    
    // Clean up expired items every 5 minutes
    setInterval(() => this.cleanupExpired(), 300000);
  }

  // Set item in cache with TTL
  private set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { data, expiresAt });
    
    logger.debug({
      message: 'Cache set',
      key,
      ttl,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  }

  // Get item from cache
  private get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  // Clean up expired items
  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info({
        message: 'Cache cleanup completed',
        itemsCleaned: cleaned,
        remainingItems: this.cache.size,
      });
    }
  }

  // Analysis-specific methods
  async setAnalysisStatus(analysisId: string, status: AnalysisStatus): Promise<void> {
    const key = `analysis:status:${analysisId}`;
    this.set(key, status);
  }

  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus | null> {
    const key = `analysis:status:${analysisId}`;
    return this.get<AnalysisStatus>(key);
  }

  async setAnalysisResult(analysisId: string, result: any): Promise<void> {
    const key = `analysis:result:${analysisId}`;
    this.set(key, result, 7200000); // 2 hours for results
  }

  async getAnalysisResult(analysisId: string): Promise<any | null> {
    const key = `analysis:result:${analysisId}`;
    return this.get(key);
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Note: For production with high traffic, consider using Redis instead:
/*
import Redis from 'ioredis';
import { config } from '../config/config';

class RedisCacheService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: config.redisHost,
      port: config.redisPort,
      password: config.redisPassword,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      logger.info('Redis connected');
    });

    this.client.on('error', (err) => {
      logger.error('Redis error:', err);
    });
  }

  async setAnalysisStatus(analysisId: string, status: AnalysisStatus): Promise<void> {
    const key = `analysis:status:${analysisId}`;
    await this.client.setex(key, 3600, JSON.stringify(status));
  }

  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus | null> {
    const key = `analysis:status:${analysisId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // ... other methods
}
*/ 