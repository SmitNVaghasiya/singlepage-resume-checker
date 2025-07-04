import { logger } from '../utils/logger';
import { extractErrorMessage } from '../utils/helpers';

interface CacheItem<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

interface AnalysisStatus {
  status: 'processing' | 'completed' | 'failed';
  progress?: number;
  currentStage?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
  keys: string[];
}

class InMemoryCacheService {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number = 3600000; // 1 hour in milliseconds
  private stats: { hits: number; misses: number };
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0 };
    
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 300000);
    
    // Handle process cleanup
    process.on('beforeExit', () => this.cleanup());
  }

  // Set item in cache with TTL
  private set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    try {
      const now = Date.now();
      const expiresAt = now + ttl;
      
      this.cache.set(key, { 
        data, 
        expiresAt, 
        createdAt: now 
      });
      
      logger.debug('Cache item set', {
        key,
        ttl,
        expiresAt: new Date(expiresAt).toISOString(),
        cacheSize: this.cache.size,
      });
    } catch (error) {
      logger.error('Failed to set cache item', {
        key,
        error: extractErrorMessage(error),
      });
    }
  }

  // Get item from cache
  private get<T>(key: string): T | null {
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        this.stats.misses++;
        return null;
      }

      // Check if expired
      if (Date.now() > item.expiresAt) {
        this.cache.delete(key);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return item.data as T;
    } catch (error) {
      logger.error('Failed to get cache item', {
        key,
        error: extractErrorMessage(error),
      });
      this.stats.misses++;
      return null;
    }
  }

  // Delete specific cache item
  private delete(key: string): boolean {
    try {
      const deleted = this.cache.delete(key);
      if (deleted) {
        logger.debug('Cache item deleted', { key });
      }
      return deleted;
    } catch (error) {
      logger.error('Failed to delete cache item', {
        key,
        error: extractErrorMessage(error),
      });
      return false;
    }
  }

  // Check if key exists and is not expired
  private has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Clean up expired items
  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;
    const startTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    const duration = Date.now() - startTime;
    
    if (cleaned > 0 || duration > 100) { // Log if items cleaned or took too long
      logger.info('Cache cleanup completed', {
        itemsCleaned: cleaned,
        remainingItems: this.cache.size,
        duration,
      });
    }
  }

  // Analysis-specific methods
  public async setAnalysisStatus(analysisId: string, status: AnalysisStatus): Promise<void> {
    const key = `analysis:status:${analysisId}`;
    this.set(key, status, 7200000); // 2 hours for status
  }

  public async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus | null> {
    const key = `analysis:status:${analysisId}`;
    return this.get<AnalysisStatus>(key);
  }

  public async setAnalysisResult(analysisId: string, result: any): Promise<void> {
    const key = `analysis:result:${analysisId}`;
    this.set(key, result, 14400000); // 4 hours for results
  }

  public async getAnalysisResult(analysisId: string): Promise<any | null> {
    const key = `analysis:result:${analysisId}`;
    return this.get(key);
  }

  public async deleteAnalysis(analysisId: string): Promise<void> {
    const statusKey = `analysis:status:${analysisId}`;
    const resultKey = `analysis:result:${analysisId}`;
    
    this.delete(statusKey);
    this.delete(resultKey);
  }

  // Temporary file methods
  public async setTempFile(tempId: string, fileData: any): Promise<void> {
    const key = `temp:file:${tempId}`;
    this.set(key, fileData, 1800000); // 30 minutes for temporary files
  }

  public async getTempFile(tempId: string): Promise<any | null> {
    const key = `temp:file:${tempId}`;
    return this.get(key);
  }

  public async deleteTempFile(tempId: string): Promise<boolean> {
    const key = `temp:file:${tempId}`;
    return this.delete(key);
  }

  // Generic cache methods for other use cases
  public async setString(key: string, value: string, ttl?: number): Promise<void> {
    this.set(key, value, ttl);
  }

  public async getString(key: string): Promise<string | null> {
    return this.get<string>(key);
  }

  public async setObject(key: string, value: object, ttl?: number): Promise<void> {
    this.set(key, value, ttl);
  }

  public async getObject<T = any>(key: string): Promise<T | null> {
    return this.get<T>(key);
  }

  public async deleteKey(key: string): Promise<boolean> {
    return this.delete(key);
  }

  public async exists(key: string): Promise<boolean> {
    return this.has(key);
  }

  // Cache management methods
  public getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      totalRequests,
      hitRate: Math.round(hitRate * 100) / 100,
      keys: Array.from(this.cache.keys()),
    };
  }

  public resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    logger.info('Cache statistics reset');
  }

  public clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', { clearedItems: size });
  }

  // Get cache keys by pattern
  public getKeysByPattern(pattern: string): string[] {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  // Cleanup method
  public cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    logger.info('Cache service cleaned up');
  }

  // Health check method
  public async healthCheck(): Promise<{ healthy: boolean; stats: CacheStats; error?: string }> {
    try {
      // Test cache operations
      const testKey = 'health:check';
      const testValue = 'test';
      
      this.set(testKey, testValue, 1000); // 1 second TTL
      const retrievedValue = this.get(testKey);
      
      if (retrievedValue !== testValue) {
        throw new Error('Cache read/write test failed');
      }
      
      this.delete(testKey);
      
      return {
        healthy: true,
        stats: this.getStats(),
      };
    } catch (error) {
      return {
        healthy: false,
        stats: this.getStats(),
        error: extractErrorMessage(error),
      };
    }
  }
}

// Export singleton instance
export const cacheService = new InMemoryCacheService();

// Export class for testing
export { InMemoryCacheService }; 