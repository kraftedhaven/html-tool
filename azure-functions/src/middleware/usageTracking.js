/**
 * Usage Tracking Middleware
 * Tracks API usage and enforces subscription limits
 */

import jwt from 'jsonwebtoken';
import DatabaseService from '../services/databaseService.js';
import { getKeyVaultSecret } from '../utils/keyVault.js';

const dbService = new DatabaseService();

/**
 * Middleware to track and enforce usage limits
 */
export async function trackUsage(usageType, amount = 1) {
  return async (request, context) => {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return {
          status: 401,
          jsonBody: { error: 'Authorization required' }
        };
      }

      const token = authHeader.replace('Bearer ', '');
      const jwtSecret = await getKeyVaultSecret('JWT_SECRET');
      const decoded = jwt.verify(token, jwtSecret);

      // Get user's subscription
      const subscription = await dbService.getSubscriptionById(decoded.subscriptionId);
      if (!subscription || !subscription.isActive()) {
        return {
          status: 403,
          jsonBody: { error: 'Active subscription required' }
        };
      }

      // Get current usage
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      let usage = await dbService.getCurrentUsage(decoded.userId, periodStart, periodEnd);
      if (!usage) {
        usage = await dbService.createUsageRecord({
          userId: decoded.userId,
          subscriptionId: subscription.id,
          periodStart,
          periodEnd,
          listingsCreated: 0,
          aiAnalysesUsed: 0,
          apiCallsMade: 0
        });
      }

      // Check limits before processing
      const limitType = getLimitTypeForUsage(usageType);
      if (limitType && usage.hasExceededLimit(limitType, subscription)) {
        const planDetails = subscription.getPlanDetails();
        const limit = planDetails.features[limitType];
        
        return {
          status: 429,
          jsonBody: { 
            error: 'Usage limit exceeded',
            limit,
            current: getCurrentUsageForType(usage, usageType),
            plan: subscription.plan,
            upgradeRequired: true
          }
        };
      }

      // Update usage after successful operation
      await dbService.updateUsage(decoded.userId, usageType, amount);

      // Add user context to request for downstream functions
      request.userContext = {
        userId: decoded.userId,
        subscriptionId: decoded.subscriptionId,
        subscription,
        usage
      };

      return null; // Continue processing
    } catch (error) {
      context.log.error('Usage tracking error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Usage tracking failed' }
      };
    }
  };
}

/**
 * Get the limit type for a usage type
 */
function getLimitTypeForUsage(usageType) {
  const mapping = {
    'listings': 'monthlyListingLimit',
    'aiAnalysis': 'aiAnalysisLimit',
    'apiCalls': null // No specific limit for API calls
  };
  return mapping[usageType];
}

/**
 * Get current usage count for a specific type
 */
function getCurrentUsageForType(usage, usageType) {
  const mapping = {
    'listings': usage.listingsCreated,
    'aiAnalysis': usage.aiAnalysesUsed,
    'apiCalls': usage.apiCallsMade
  };
  return mapping[usageType] || 0;
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeatureAccess(featureName) {
  return async (request, context) => {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return {
          status: 401,
          jsonBody: { error: 'Authorization required' }
        };
      }

      const token = authHeader.replace('Bearer ', '');
      const jwtSecret = await getKeyVaultSecret('JWT_SECRET');
      const decoded = jwt.verify(token, jwtSecret);

      const subscription = await dbService.getSubscriptionById(decoded.subscriptionId);
      if (!subscription || !subscription.isActive()) {
        return {
          status: 403,
          jsonBody: { error: 'Active subscription required' }
        };
      }

      if (!subscription.hasFeature(featureName)) {
        return {
          status: 403,
          jsonBody: { 
            error: 'Feature not available in current plan',
            feature: featureName,
            currentPlan: subscription.plan,
            upgradeRequired: true
          }
        };
      }

      // Add user context to request
      request.userContext = {
        userId: decoded.userId,
        subscriptionId: decoded.subscriptionId,
        subscription
      };

      return null; // Continue processing
    } catch (error) {
      context.log.error('Feature access check error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Feature access check failed' }
      };
    }
  };
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(userId, months = 3) {
  try {
    const stats = [];
    const now = new Date();
    
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const usage = await dbService.getCurrentUsage(userId, periodStart, periodEnd);
      
      stats.push({
        period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        periodStart,
        periodEnd,
        listingsCreated: usage?.listingsCreated || 0,
        aiAnalysesUsed: usage?.aiAnalysesUsed || 0,
        apiCallsMade: usage?.apiCallsMade || 0
      });
    }
    
    return stats.reverse(); // Return chronological order
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    throw error;
  }
}

/**
 * Check marketplace access based on subscription plan
 */
export async function checkMarketplaceAccess(marketplace) {
  return async (request, context) => {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return {
          status: 401,
          jsonBody: { error: 'Authorization required' }
        };
      }

      const token = authHeader.replace('Bearer ', '');
      const jwtSecret = await getKeyVaultSecret('JWT_SECRET');
      const decoded = jwt.verify(token, jwtSecret);

      const subscription = await dbService.getSubscriptionById(decoded.subscriptionId);
      if (!subscription || !subscription.isActive()) {
        return {
          status: 403,
          jsonBody: { error: 'Active subscription required' }
        };
      }

      const planDetails = subscription.getPlanDetails();
      const marketplaceMap = {
        'ebay': 1,
        'facebook': 2,
        'etsy': 3
      };

      const requiredCount = marketplaceMap[marketplace.toLowerCase()];
      if (requiredCount && planDetails.features.marketplaceCount < requiredCount) {
        return {
          status: 403,
          jsonBody: { 
            error: `${marketplace} marketplace not available in ${subscription.plan} plan`,
            marketplace,
            currentPlan: subscription.plan,
            requiredPlan: requiredCount === 2 ? 'pro' : 'enterprise',
            upgradeRequired: true
          }
        };
      }

      // Add user context to request
      request.userContext = {
        userId: decoded.userId,
        subscriptionId: decoded.subscriptionId,
        subscription
      };

      return null; // Continue processing
    } catch (error) {
      context.log.error('Marketplace access check error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Marketplace access check failed' }
      };
    }
  };
}

/**
 * Enhanced usage tracking with detailed metrics
 */
export async function trackDetailedUsage(usageType, metadata = {}) {
  return async (request, context) => {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return {
          status: 401,
          jsonBody: { error: 'Authorization required' }
        };
      }

      const token = authHeader.replace('Bearer ', '');
      const jwtSecret = await getKeyVaultSecret('JWT_SECRET');
      const decoded = jwt.verify(token, jwtSecret);

      // Get user's subscription
      const subscription = await dbService.getSubscriptionById(decoded.subscriptionId);
      if (!subscription || !subscription.isActive()) {
        return {
          status: 403,
          jsonBody: { error: 'Active subscription required' }
        };
      }

      // Track detailed usage with metadata
      await dbService.trackDetailedUsage(decoded.userId, {
        type: usageType,
        metadata,
        timestamp: new Date(),
        subscriptionPlan: subscription.plan
      });

      // Add user context to request
      request.userContext = {
        userId: decoded.userId,
        subscriptionId: decoded.subscriptionId,
        subscription,
        usageMetadata: metadata
      };

      return null; // Continue processing
    } catch (error) {
      context.log.error('Detailed usage tracking error:', error);
      return {
        status: 500,
        jsonBody: { error: 'Usage tracking failed' }
      };
    }
  };
}

/**
 * Middleware wrapper for Azure Functions
 */
export function withUsageTracking(usageType, amount = 1) {
  return (handler) => {
    return async (request, context) => {
      const trackingResult = await trackUsage(usageType, amount)(request, context);
      if (trackingResult) {
        return trackingResult; // Return error response
      }
      return await handler(request, context);
    };
  };
}

/**
 * Middleware wrapper for feature access
 */
export function withFeatureAccess(featureName) {
  return (handler) => {
    return async (request, context) => {
      const accessResult = await checkFeatureAccess(featureName)(request, context);
      if (accessResult) {
        return accessResult; // Return error response
      }
      return await handler(request, context);
    };
  };
}