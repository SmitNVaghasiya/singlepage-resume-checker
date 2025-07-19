// Configuration utility for environment variables
export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  },
  
  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'AI Resume Checker',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
  
  // Feature Flags
  features: {
    debugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
  },
  
  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Build Info
  buildTime: import.meta.env.BUILD_TIME || new Date().toISOString(),
};

// Helper function to get API URL with endpoint
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = config.api.baseUrl.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.replace(/^\//, ''); // Remove leading slash
  return `${baseUrl}/${cleanEndpoint}`;
};

// Helper function to check if running in production
export const isProduction = (): boolean => {
  return config.isProduction;
};

// Helper function to check if debug mode is enabled
export const isDebugMode = (): boolean => {
  return config.features.debugMode || config.isDevelopment;
}; 