/**
 * Shared type definitions for authentication and subscription
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  plan: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  planDetails: {
    id: string;
    name: string;
    price: number;
    features: {
      monthlyListingLimit: number;
      aiAnalysisLimit: number;
      marketplaceCount: number;
      bulkUploadEnabled: boolean;
      advancedAnalyticsEnabled: boolean;
      prioritySupport: boolean;
    };
  };
}

export interface Usage {
  listings: {
    used: number;
    limit: number;
    percentage: number;
    unlimited: boolean;
  };
  aiAnalyses: {
    used: number;
    limit: number;
    percentage: number;
    unlimited: boolean;
  };
  apiCalls: {
    used: number;
    limit: number;
    percentage: number;
    unlimited: boolean;
  };
}
