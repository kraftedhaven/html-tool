import { app } from '@azure/functions';
import { keyVault } from '../utils/keyVault.js';
import { tokenManager } from '../utils/tokenManager.js';
import { errorHandler } from '../utils/errorHandler.js';

app.http('healthCheck', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        return await errorHandler.withErrorHandling('healthCheck', async () => {
            const healthStatus = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    keyVault: 'unknown',
                    redis: 'unknown',
                    openai: 'unknown',
                    ebay: 'unknown'
                },
                version: '1.0.0'
            };

            // Check Key Vault connectivity
            try {
                await keyVault.getSecret('openai-api-key');
                healthStatus.services.keyVault = 'healthy';
            } catch (error) {
                healthStatus.services.keyVault = 'unhealthy';
                healthStatus.status = 'degraded';
                console.warn('Key Vault health check failed:', error.message);
            }

            // Check Redis connectivity (if configured)
            try {
                if (keyVault.redis) {
                    await keyVault.redis.ping();
                    healthStatus.services.redis = 'healthy';
                } else {
                    healthStatus.services.redis = 'not_configured';
                }
            } catch (error) {
                healthStatus.services.redis = 'unhealthy';
                healthStatus.status = 'degraded';
                console.warn('Redis health check failed:', error.message);
            }

            // Check OpenAI API key availability
            try {
                const openaiKey = await keyVault.getSecret('openai-api-key');
                healthStatus.services.openai = openaiKey ? 'healthy' : 'unhealthy';
            } catch (error) {
                healthStatus.services.openai = 'unhealthy';
                healthStatus.status = 'degraded';
            }

            // Check eBay token availability
            try {
                await tokenManager.getEbayAccessToken();
                healthStatus.services.ebay = 'healthy';
            } catch (error) {
                healthStatus.services.ebay = 'unhealthy';
                healthStatus.status = 'degraded';
                console.warn('eBay token check failed:', error.message);
            }

            const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

            return {
                status: statusCode,
                jsonBody: healthStatus
            };
        }, { endpoint: 'healthCheck' });
    }
});