interface PerformanceMetrics {
  authValidationTime: number;
  analysisLoadTime: number;
  cacheHitRate: number;
  totalRequests: number;
  cachedRequests: number;
}

class PerformanceMonitor {
  private authValidationTimes: number[] = [];
  private analysisLoadTimes: number[] = [];
  private maxSamples = 10;

  startTimer(): number {
    return performance.now();
  }

  endAuthValidation(startTime: number, fromCache: boolean = false): void {
    const duration = performance.now() - startTime;
    this.authValidationTimes.push(duration);
    
    // Keep only the last N samples
    if (this.authValidationTimes.length > this.maxSamples) {
      this.authValidationTimes.shift();
    }

    console.log(`Auth validation ${fromCache ? '(cached)' : ''} took ${duration.toFixed(2)}ms`);
    
    // Log warning if auth is taking too long
    if (duration > 3000 && !fromCache) {
      console.warn(`Slow authentication detected: ${duration.toFixed(2)}ms`);
    }
  }

  endAnalysisLoad(startTime: number, fromCache: boolean = false): void {
    const duration = performance.now() - startTime;
    this.analysisLoadTimes.push(duration);
    
    // Keep only the last N samples
    if (this.analysisLoadTimes.length > this.maxSamples) {
      this.analysisLoadTimes.shift();
    }

    console.log(`Analysis load ${fromCache ? '(cached)' : ''} took ${duration.toFixed(2)}ms`);
  }

  getAverageAuthTime(): number {
    if (this.authValidationTimes.length === 0) return 0;
    const sum = this.authValidationTimes.reduce((a, b) => a + b, 0);
    return sum / this.authValidationTimes.length;
  }

  getAverageAnalysisLoadTime(): number {
    if (this.analysisLoadTimes.length === 0) return 0;
    const sum = this.analysisLoadTimes.reduce((a, b) => a + b, 0);
    return sum / this.analysisLoadTimes.length;
  }

  logImprovements(): void {
    const avgAuthTime = this.getAverageAuthTime();
    const avgAnalysisTime = this.getAverageAnalysisLoadTime();
    
    console.log('Performance Summary:', {
      averageAuthTime: `${avgAuthTime.toFixed(2)}ms`,
      averageAnalysisLoadTime: `${avgAnalysisTime.toFixed(2)}ms`,
      totalAuthSamples: this.authValidationTimes.length,
      totalAnalysisSamples: this.analysisLoadTimes.length,
    });

    // Suggest optimizations
    if (avgAuthTime > 2000) {
      console.warn('Consider implementing auth caching or reducing database queries');
    }
    if (avgAnalysisTime > 5000) {
      console.warn('Consider implementing analysis result caching');
    }
  }

  clear(): void {
    this.authValidationTimes = [];
    this.analysisLoadTimes = [];
  }
}

export const performanceMonitor = new PerformanceMonitor(); 