/**
 * Environment Configuration
 * Manages environment-specific settings for the frontend application
 */

interface Config {
  apiBaseUrl: string;
  environment: 'development' | 'production' | 'test';
  stripePublishableKey: string;
}

const getConfig = (): Config => {
  const isDevelopment = import.meta.env.DEV;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
    (isDevelopment ? 'http://localhost:7071/api' : '/api');

  return {
    apiBaseUrl,
    environment: isDevelopment ? 'development' : 'production',
    stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  };
};

export const config = getConfig();