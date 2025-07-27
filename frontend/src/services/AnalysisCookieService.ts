import { AnalysisResult } from '../types';

interface AnalysisCookieData {
  analysisId: string;
  data: AnalysisResult;
  timestamp: number;
  expiresAt: number;
}

class AnalysisCookieService {
  private readonly COOKIE_PREFIX = 'analysis_';
  private readonly MAX_COOKIES = 10; // Maximum number of analysis cookies to store
  private readonly COOKIE_EXPIRY_DAYS = 7; // Cookies expire after 7 days

  /**
   * Store analysis data in a cookie
   */
  public storeAnalysis(analysisId: string, data: AnalysisResult): void {
    try {
      const cookieData: AnalysisCookieData = {
        analysisId,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (this.COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      };

      const cookieName = this.getCookieName(analysisId);
      const cookieValue = btoa(JSON.stringify(cookieData)); // Base64 encode
      
      // Set cookie with proper attributes
      document.cookie = `${cookieName}=${cookieValue}; max-age=${this.COOKIE_EXPIRY_DAYS * 24 * 60 * 60}; path=/; SameSite=Strict`;
      
      // Clean up old cookies to prevent exceeding browser limits
      this.cleanupOldCookies();
      
      console.log(`Analysis data stored in cookie: ${analysisId}`);
    } catch (error) {
      console.error('Failed to store analysis in cookie:', error);
    }
  }

  /**
   * Retrieve analysis data from cookie
   */
  public getAnalysis(analysisId: string): AnalysisResult | null {
    try {
      const cookieName = this.getCookieName(analysisId);
      const cookieValue = this.getCookieValue(cookieName);
      
      if (!cookieValue) {
        return null;
      }

      const cookieData: AnalysisCookieData = JSON.parse(atob(cookieValue));
      
      // Check if cookie has expired
      if (Date.now() > cookieData.expiresAt) {
        this.removeAnalysis(analysisId);
        return null;
      }

      console.log(`Analysis data retrieved from cookie: ${analysisId}`);
      return cookieData.data;
    } catch (error) {
      console.error('Failed to retrieve analysis from cookie:', error);
      // Remove corrupted cookie
      this.removeAnalysis(analysisId);
      return null;
    }
  }

  /**
   * Check if analysis data exists in cookie
   */
  public hasAnalysis(analysisId: string): boolean {
    try {
      const cookieName = this.getCookieName(analysisId);
      const cookieValue = this.getCookieValue(cookieName);
      
      if (!cookieValue) {
        return false;
      }

      const cookieData: AnalysisCookieData = JSON.parse(atob(cookieValue));
      
      // Check if cookie has expired
      if (Date.now() > cookieData.expiresAt) {
        this.removeAnalysis(analysisId);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to check analysis cookie:', error);
      return false;
    }
  }

  /**
   * Remove analysis data from cookie
   */
  public removeAnalysis(analysisId: string): void {
    try {
      const cookieName = this.getCookieName(analysisId);
      document.cookie = `${cookieName}=; max-age=0; path=/`;
      console.log(`Analysis data removed from cookie: ${analysisId}`);
    } catch (error) {
      console.error('Failed to remove analysis cookie:', error);
    }
  }

  /**
   * Get all stored analysis IDs
   */
  public getAllAnalysisIds(): string[] {
    try {
      const analysisIds: string[] = [];
      const cookies = document.cookie.split(';');
      
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        
        if (name && name.startsWith(this.COOKIE_PREFIX) && value) {
          try {
            const cookieData: AnalysisCookieData = JSON.parse(atob(value));
            
            // Check if cookie has expired
            if (Date.now() <= cookieData.expiresAt) {
              analysisIds.push(cookieData.analysisId);
            } else {
              // Remove expired cookie
              this.removeAnalysis(cookieData.analysisId);
            }
          } catch (error) {
            // Remove corrupted cookie
            const analysisId = name.replace(this.COOKIE_PREFIX, '');
            this.removeAnalysis(analysisId);
          }
        }
      }
      
      return analysisIds;
    } catch (error) {
      console.error('Failed to get analysis IDs from cookies:', error);
      return [];
    }
  }

  /**
   * Clear all analysis cookies
   */
  public clearAllAnalyses(): void {
    try {
      const analysisIds = this.getAllAnalysisIds();
      
      for (const analysisId of analysisIds) {
        this.removeAnalysis(analysisId);
      }
      
      console.log('All analysis cookies cleared');
    } catch (error) {
      console.error('Failed to clear analysis cookies:', error);
    }
  }

  /**
   * Get cookie storage statistics
   */
  public getStorageStats(): {
    totalAnalyses: number;
    totalSize: number;
    oldestAnalysis: string | null;
    newestAnalysis: string | null;
  } {
    try {
      const analysisIds = this.getAllAnalysisIds();
      let totalSize = 0;
      let oldestTimestamp = Date.now();
      let newestTimestamp = 0;
      let oldestAnalysis: string | null = null;
      let newestAnalysis: string | null = null;

      for (const analysisId of analysisIds) {
        const cookieName = this.getCookieName(analysisId);
        const cookieValue = this.getCookieValue(cookieName);
        
        if (cookieValue) {
          totalSize += cookieValue.length;
          
          try {
            const cookieData: AnalysisCookieData = JSON.parse(atob(cookieValue));
            
            if (cookieData.timestamp < oldestTimestamp) {
              oldestTimestamp = cookieData.timestamp;
              oldestAnalysis = analysisId;
            }
            
            if (cookieData.timestamp > newestTimestamp) {
              newestTimestamp = cookieData.timestamp;
              newestAnalysis = analysisId;
            }
          } catch (error) {
            // Skip corrupted cookies
          }
        }
      }

      return {
        totalAnalyses: analysisIds.length,
        totalSize,
        oldestAnalysis,
        newestAnalysis
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalAnalyses: 0,
        totalSize: 0,
        oldestAnalysis: null,
        newestAnalysis: null
      };
    }
  }

  /**
   * Clean up old cookies to prevent exceeding browser limits
   */
  private cleanupOldCookies(): void {
    try {
      const analysisIds = this.getAllAnalysisIds();
      
      if (analysisIds.length <= this.MAX_COOKIES) {
        return;
      }

      // Sort by timestamp (oldest first)
      const analysisData: Array<{ analysisId: string; timestamp: number }> = [];
      
      for (const analysisId of analysisIds) {
        const cookieName = this.getCookieName(analysisId);
        const cookieValue = this.getCookieValue(cookieName);
        
        if (cookieValue) {
          try {
            const cookieData: AnalysisCookieData = JSON.parse(atob(cookieValue));
            analysisData.push({
              analysisId,
              timestamp: cookieData.timestamp
            });
          } catch (error) {
            // Remove corrupted cookie
            this.removeAnalysis(analysisId);
          }
        }
      }

      // Sort by timestamp (oldest first)
      analysisData.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest cookies to stay within limit
      const cookiesToRemove = analysisData.length - this.MAX_COOKIES;
      
      for (let i = 0; i < cookiesToRemove; i++) {
        this.removeAnalysis(analysisData[i].analysisId);
      }

      console.log(`Cleaned up ${cookiesToRemove} old analysis cookies`);
    } catch (error) {
      console.error('Failed to cleanup old cookies:', error);
    }
  }

  /**
   * Get cookie name for analysis ID
   */
  private getCookieName(analysisId: string): string {
    return `${this.COOKIE_PREFIX}${analysisId}`;
  }

  /**
   * Get cookie value by name
   */
  private getCookieValue(cookieName: string): string | null {
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      
      if (name === cookieName && value) {
        return value;
      }
    }
    
    return null;
  }
}

// Export singleton instance
export const analysisCookieService = new AnalysisCookieService(); 