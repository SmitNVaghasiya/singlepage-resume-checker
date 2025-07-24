import { SystemConfig, ISystemConfig } from '../models/SystemConfig';
import { logger } from '../utils/logger';

export interface ConfigValue {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  category: string;
  isPublic?: boolean;
  isEditable?: boolean;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

export class SystemConfigService {
  private static cache = new Map<string, any>();
  private static cacheExpiry = new Map<string, number>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Initialize default system configurations
   */
  static async initializeDefaultConfigs(adminId: string): Promise<void> {
    try {
      const defaultConfigs: ConfigValue[] = [
        // Security configurations
        {
          key: 'max_login_attempts',
          value: 5,
          type: 'number',
          description: 'Maximum login attempts before account lockout',
          category: 'security',
          validation: { min: 1, max: 10 }
        },
        {
          key: 'lockout_duration_minutes',
          value: 15,
          type: 'number',
          description: 'Account lockout duration in minutes',
          category: 'security',
          validation: { min: 5, max: 1440 }
        },
        {
          key: 'session_timeout_hours',
          value: 24,
          type: 'number',
          description: 'Session timeout in hours',
          category: 'security',
          validation: { min: 1, max: 168 }
        },
        {
          key: 'password_expiry_days',
          value: 90,
          type: 'number',
          description: 'Password expiry in days',
          category: 'security',
          validation: { min: 30, max: 365 }
        },
        {
          key: 'require_2fa',
          value: false,
          type: 'boolean',
          description: 'Require two-factor authentication for admins',
          category: 'security'
        },
        {
          key: 'ip_whitelist_enabled',
          value: false,
          type: 'boolean',
          description: 'Enable IP whitelist for admin access',
          category: 'security'
        },

        // Performance configurations
        {
          key: 'max_file_size_mb',
          value: 5,
          type: 'number',
          description: 'Maximum file upload size in MB',
          category: 'performance',
          validation: { min: 1, max: 50 }
        },
        {
          key: 'max_pages_per_pdf',
          value: 7,
          type: 'number',
          description: 'Maximum pages allowed per PDF',
          category: 'performance',
          validation: { min: 1, max: 20 }
        },
        {
          key: 'max_job_description_length',
          value: 5000,
          type: 'number',
          description: 'Maximum job description length in characters',
          category: 'performance',
          validation: { min: 100, max: 10000 }
        },
        {
          key: 'analysis_timeout_seconds',
          value: 300,
          type: 'number',
          description: 'Analysis timeout in seconds',
          category: 'performance',
          validation: { min: 60, max: 1800 }
        },

        // Limits configurations
        {
          key: 'daily_analysis_limit',
          value: 15,
          type: 'number',
          description: 'Daily analysis limit per user',
          category: 'limits',
          validation: { min: 1, max: 100 }
        },
        {
          key: 'max_concurrent_analyses',
          value: 10,
          type: 'number',
          description: 'Maximum concurrent analyses',
          category: 'limits',
          validation: { min: 1, max: 50 }
        },

        // Email configurations
        {
          key: 'email_notifications_enabled',
          value: true,
          type: 'boolean',
          description: 'Enable email notifications',
          category: 'email'
        },
        {
          key: 'admin_email_alerts',
          value: true,
          type: 'boolean',
          description: 'Send email alerts to admins',
          category: 'email'
        },

        // Analytics configurations
        {
          key: 'analytics_retention_days',
          value: 365,
          type: 'number',
          description: 'Analytics data retention in days',
          category: 'analytics',
          validation: { min: 30, max: 1095 }
        },
        {
          key: 'audit_log_retention_days',
          value: 365,
          type: 'number',
          description: 'Audit log retention in days',
          category: 'analytics',
          validation: { min: 30, max: 1095 }
        },

        // UI configurations
        {
          key: 'dark_mode_enabled',
          value: true,
          type: 'boolean',
          description: 'Enable dark mode by default',
          category: 'ui',
          isPublic: true
        },
        {
          key: 'maintenance_mode',
          value: false,
          type: 'boolean',
          description: 'Enable maintenance mode',
          category: 'ui',
          isPublic: true
        },

        // Backup configurations
        {
          key: 'auto_backup_enabled',
          value: true,
          type: 'boolean',
          description: 'Enable automatic backups',
          category: 'backup'
        },
        {
          key: 'backup_frequency_hours',
          value: 24,
          type: 'number',
          description: 'Backup frequency in hours',
          category: 'backup',
          validation: { min: 1, max: 168 }
        },
        {
          key: 'backup_retention_days',
          value: 30,
          type: 'number',
          description: 'Backup retention in days',
          category: 'backup',
          validation: { min: 1, max: 365 }
        }
      ];

      for (const config of defaultConfigs) {
        await this.setConfig(config.key, config.value, {
          type: config.type,
          description: config.description,
          category: config.category,
          isPublic: config.isPublic || false,
          isEditable: config.isEditable !== false,
          validation: config.validation
        }, adminId);
      }

      logger.info('Default system configurations initialized');
    } catch (error) {
      logger.error('Failed to initialize default configs:', error);
      throw error;
    }
  }

  /**
   * Get a configuration value
   */
  static async getConfig(key: string): Promise<any> {
    try {
      // Check cache first
      const cached = this.cache.get(key);
      const expiry = this.cacheExpiry.get(key);
      
      if (cached && expiry && Date.now() < expiry) {
        return cached;
      }

      const config = await SystemConfig.findOne({ key }).exec();
      
      if (!config) {
        return null;
      }

      // Cache the result
      this.cache.set(key, config.value);
      this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);

      return config.value;
    } catch (error) {
      logger.error(`Failed to get config ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set a configuration value
   */
  static async setConfig(
    key: string,
    value: any,
    options: {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      description: string;
      category: string;
      isPublic?: boolean;
      isEditable?: boolean;
      validation?: {
        required?: boolean;
        min?: number;
        max?: number;
        pattern?: string;
        enum?: any[];
      };
    },
    adminId: string
  ): Promise<ISystemConfig> {
    try {
      // Validate value based on type and validation rules
      this.validateConfigValue(value, options);

      const config = await SystemConfig.findOneAndUpdate(
        { key },
        {
          value,
          type: options.type,
          description: options.description,
          category: options.category,
          isPublic: options.isPublic || false,
          isEditable: options.isEditable !== false,
          validation: options.validation,
          lastModifiedBy: adminId,
          lastModifiedAt: new Date()
        },
        { upsert: true, new: true }
      );

      // Clear cache for this key
      this.cache.delete(key);
      this.cacheExpiry.delete(key);

      logger.info(`Config updated: ${key} = ${value}`);
      return config;
    } catch (error) {
      logger.error(`Failed to set config ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get all configurations with filtering
   */
  static async getAllConfigs(filters: {
    category?: string;
    isPublic?: boolean;
    isEditable?: boolean;
  } = {}): Promise<ISystemConfig[]> {
    try {
      const query: any = {};

      if (filters.category) query.category = filters.category;
      if (filters.isPublic !== undefined) query.isPublic = filters.isPublic;
      if (filters.isEditable !== undefined) query.isEditable = filters.isEditable;

      const configs = await SystemConfig.find(query)
        .sort({ category: 1, key: 1 })
        .populate('lastModifiedBy', 'username fullName')
        .exec();

      return configs;
    } catch (error) {
      logger.error('Failed to get all configs:', error);
      throw error;
    }
  }

  /**
   * Delete a configuration
   */
  static async deleteConfig(key: string): Promise<boolean> {
    try {
      const result = await SystemConfig.deleteOne({ key });
      
      // Clear cache
      this.cache.delete(key);
      this.cacheExpiry.delete(key);

      logger.info(`Config deleted: ${key}`);
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Failed to delete config ${key}:`, error);
      throw error;
    }
  }

  /**
   * Validate configuration value
   */
  private static validateConfigValue(value: any, options: any): void {
    // Type validation
    switch (options.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Value must be a string for key: ${options.key}`);
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          throw new Error(`Value must be a number for key: ${options.key}`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Value must be a boolean for key: ${options.key}`);
        }
        break;
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          throw new Error(`Value must be an object for key: ${options.key}`);
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`Value must be an array for key: ${options.key}`);
        }
        break;
    }

    // Validation rules
    if (options.validation) {
      const { validation } = options;

      if (validation.required && (value === null || value === undefined || value === '')) {
        throw new Error(`Value is required for key: ${options.key}`);
      }

      if (validation.min !== undefined) {
        if (typeof value === 'number' && value < validation.min) {
          throw new Error(`Value must be at least ${validation.min} for key: ${options.key}`);
        }
        if (typeof value === 'string' && value.length < validation.min) {
          throw new Error(`Value must be at least ${validation.min} characters for key: ${options.key}`);
        }
      }

      if (validation.max !== undefined) {
        if (typeof value === 'number' && value > validation.max) {
          throw new Error(`Value must be at most ${validation.max} for key: ${options.key}`);
        }
        if (typeof value === 'string' && value.length > validation.max) {
          throw new Error(`Value must be at most ${validation.max} characters for key: ${options.key}`);
        }
      }

      if (validation.pattern && typeof value === 'string') {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
          throw new Error(`Value does not match pattern for key: ${options.key}`);
        }
      }

      if (validation.enum && !validation.enum.includes(value)) {
        throw new Error(`Value must be one of: ${validation.enum.join(', ')} for key: ${options.key}`);
      }
    }
  }

  /**
   * Clear configuration cache
   */
  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    logger.info('Configuration cache cleared');
  }

  /**
   * Get configuration statistics
   */
  static async getConfigStats(): Promise<any> {
    try {
      const stats = await SystemConfig.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            publicCount: {
              $sum: { $cond: ['$isPublic', 1, 0] }
            },
            editableCount: {
              $sum: { $cond: ['$isEditable', 1, 0] }
            }
          }
        }
      ]);

      return stats;
    } catch (error) {
      logger.error('Failed to get config stats:', error);
      throw error;
    }
  }
}