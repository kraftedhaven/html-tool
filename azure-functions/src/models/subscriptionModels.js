/**
 * Subscription Management Models
 * Defines data structures for SaaS subscription system
 */

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 'basic',
    name: 'Basic',
    price: 29.00,
    currency: 'usd',
    interval: 'month',
    features: {
      monthlyListingLimit: 100,
      aiAnalysisLimit: 50,
      marketplaceCount: 1, // eBay only
      bulkUploadEnabled: false,
      advancedAnalyticsEnabled: false,
      prioritySupport: false
    },
    stripeProductId: process.env.STRIPE_BASIC_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 67.00,
    currency: 'usd',
    interval: 'month',
    features: {
      monthlyListingLimit: 500,
      aiAnalysisLimit: 250,
      marketplaceCount: 2, // eBay + Facebook
      bulkUploadEnabled: true,
      advancedAnalyticsEnabled: true,
      prioritySupport: false
    },
    stripeProductId: process.env.STRIPE_PRO_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 97.00,
    currency: 'usd',
    interval: 'month',
    features: {
      monthlyListingLimit: -1, // Unlimited
      aiAnalysisLimit: -1, // Unlimited
      marketplaceCount: 3, // All marketplaces
      bulkUploadEnabled: true,
      advancedAnalyticsEnabled: true,
      prioritySupport: true
    },
    stripeProductId: process.env.STRIPE_ENTERPRISE_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID
  }
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  PAST_DUE: 'past_due',
  UNPAID: 'unpaid',
  TRIALING: 'trialing'
};

export class SubscriptionModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.stripeCustomerId = data.stripeCustomerId || null;
    this.stripeSubscriptionId = data.stripeSubscriptionId || null;
    this.plan = data.plan || 'basic';
    this.status = data.status || SUBSCRIPTION_STATUS.ACTIVE;
    this.currentPeriodStart = data.currentPeriodStart || new Date();
    this.currentPeriodEnd = data.currentPeriodEnd || new Date();
    this.cancelAtPeriodEnd = data.cancelAtPeriodEnd || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  getPlanDetails() {
    return SUBSCRIPTION_PLANS[this.plan.toUpperCase()];
  }

  isActive() {
    return this.status === SUBSCRIPTION_STATUS.ACTIVE || this.status === SUBSCRIPTION_STATUS.TRIALING;
  }

  hasFeature(featureName) {
    const planDetails = this.getPlanDetails();
    return planDetails?.features[featureName] || false;
  }

  getFeatureLimit(featureName) {
    const planDetails = this.getPlanDetails();
    return planDetails?.features[featureName] || 0;
  }
}

export class UsageTrackingModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.subscriptionId = data.subscriptionId || null;
    this.listingsCreated = data.listingsCreated || 0;
    this.aiAnalysesUsed = data.aiAnalysesUsed || 0;
    this.apiCallsMade = data.apiCallsMade || 0;
    this.periodStart = data.periodStart || new Date();
    this.periodEnd = data.periodEnd || new Date();
    this.createdAt = data.createdAt || new Date();
  }

  hasExceededLimit(limitType, subscription) {
    const limit = subscription.getFeatureLimit(limitType);
    if (limit === -1) return false; // Unlimited

    switch (limitType) {
      case 'monthlyListingLimit':
        return this.listingsCreated >= limit;
      case 'aiAnalysisLimit':
        return this.aiAnalysesUsed >= limit;
      default:
        return false;
    }
  }

  incrementUsage(usageType, amount = 1) {
    switch (usageType) {
      case 'listings':
        this.listingsCreated += amount;
        break;
      case 'aiAnalysis':
        this.aiAnalysesUsed += amount;
        break;
      case 'apiCalls':
        this.apiCallsMade += amount;
        break;
    }
  }
}

export class UserModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.email = data.email || null;
    this.passwordHash = data.passwordHash || null;
    this.firstName = data.firstName || null;
    this.lastName = data.lastName || null;
    this.isEmailVerified = data.isEmailVerified || false;
    this.stripeCustomerId = data.stripeCustomerId || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  getFullName() {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
}