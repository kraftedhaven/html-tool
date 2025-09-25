interface EnvironmentConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  azureFunctionUrl?: string;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  
  // In development, use local Azure Functions
  // In production, use the deployed Azure Functions URL or relative path
  let apiBaseUrl = '/api';
  
  if (isDevelopment) {
    // Local development - point to Azure Functions Core Tools
    apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7071/api';
  } else if (isProduction) {
    // Production - use environment variable or default to relative path
    apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  }

  return {
    apiBaseUrl,
    isDevelopment,
    isProduction,
    azureFunctionUrl: import.meta.env.VITE_AZURE_FUNCTION_URL
  };
};

export const config = getEnvironmentConfig();

export default config;