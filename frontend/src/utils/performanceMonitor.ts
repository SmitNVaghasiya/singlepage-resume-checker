interface PerformanceMetrics {
  authValidationTime: number;
  analysisLoadTime: number;
  cacheHitRate: number;
  totalRequests: number;
  cachedRequests: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    authValidationTime: 0,
    analysisLoadTime: 0,
    cacheHitRate: 0,
    totalRequests: 0,
    cachedRequests: 0
  };

  private authValidationTimes: number[] = [];
  private analysisLoadTimes: number[] = [];

  /**
   * Start timing an operation
   */
  public startTimer(): number {
    return performance.now();
  }

  /**
   * End timing and record auth validation time
   */
  public endAuthValidation(startTime: number): void {
    const duration = performance.now() - startTime;
    this.authValidationTimes.push(duration);
    this.metrics.authValidationTime = this.calculateAverage(this.authValidationTimes);
    
    console.log(`🔐 Auth validation completed in ${duration.toFixed(2)}ms`);
  }

  /**
   * End timing and record analysis load time
   */
  public endAnalysisLoad(startTime: number, fromCache: boolean = false): void {
    const duration = performance.now() - startTime;
    this.analysisLoadTimes.push(duration);
    this.metrics.analysisLoadTime = this.calculateAverage(this.analysisLoadTimes);
    
    this.metrics.totalRequests++;
    if (fromCache) {
      this.metrics.cachedRequests++;
    }
    
    this.metrics.cacheHitRate = (this.metrics.cachedRequests / this.metrics.totalRequests) * 100;
    
    const source = fromCache ? 'cookie cache' : 'server';
    console.log(`📊 Analysis loaded from ${source} in ${duration.toFixed(2)}ms`);
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance summary
   */
  public getSummary(): string {
    const avgAuthTime = this.metrics.authValidationTime.toFixed(2);
    const avgAnalysisTime = this.metrics.analysisLoadTime.toFixed(2);
    const cacheHitRate = this.metrics.cacheHitRate.toFixed(1);
    
    return `
🚀 Performance Summary:
• Average Auth Validation: ${avgAuthTime}ms
• Average Analysis Load: ${avgAnalysisTime}ms
• Cache Hit Rate: ${cacheHitRate}%
• Total Requests: ${this.metrics.totalRequests}
• Cached Requests: ${this.metrics.cachedRequests}
    `.trim();
  }

  /**
   * Reset all metrics
   */
  public reset(): void {
    this.metrics = {
      authValidationTime: 0,
      analysisLoadTime: 0,
      cacheHitRate: 0,
      totalRequests: 0,
      cachedRequests: 0
    };
    this.authValidationTimes = [];
    this.analysisLoadTimes = [];
  }

  /**
   * Calculate average of an array of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Log performance improvements
   */
  public logImprovements(): void {
    console.log('🎯 Performance Optimizations Active:');
    console.log('✅ User authentication caching (5min TTL)');
    console.log('✅ Analysis data cookie storage (7 days)');
    console.log('✅ Lightweight token validation endpoint');
    console.log('✅ Reduced database timeout (3s → 5s)');
    console.log('✅ Instant analysis loading from cookies');
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor(); 