/**
 * Subscription Card Component
 * Displays current subscription status and plan details
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Subscription {
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

interface SubscriptionCardProps {
  subscription: Subscription;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription }) => {
  const { createBillingPortal } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#00ff88';
      case 'trialing': return '#007aff';
      case 'past_due': return '#ff9500';
      case 'cancelled': return '#ff453a';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'trialing': return 'Free Trial';
      case 'past_due': return 'Past Due';
      case 'cancelled': return 'Cancelled';
      case 'unpaid': return 'Unpaid';
      default: return status;
    }
  };

  const handleManageBilling = async () => {
    const url = await createBillingPortal();
    if (url) {
      window.open(url, '_blank');
    }
  };

  const daysUntilRenewal = Math.ceil(
    (new Date(subscription.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="subscription-card">
      <div className="subscription-header">
        <div className="subscription-plan">
          <h3>{subscription.planDetails.name} Plan</h3>
          <div className="subscription-price">
            ${subscription.planDetails.price}/month
          </div>
        </div>
        
        <div 
          className="subscription-status"
          style={{ color: getStatusColor(subscription.status) }}
        >
          {getStatusText(subscription.status)}
        </div>
      </div>

      <div className="subscription-details">
        {subscription.status === 'trialing' && (
          <div className="trial-info">
            <p>
              <strong>Free trial ends in {daysUntilRenewal} days</strong>
            </p>
            <p>Your subscription will automatically start on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
          </div>
        )}

        {subscription.status === 'active' && (
          <div className="billing-info">
            <p>Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
            {subscription.cancelAtPeriodEnd && (
              <p className="cancellation-notice">
                Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <div className="plan-features">
          <h4>Plan Features</h4>
          <ul>
            <li>
              {subscription.planDetails.features.monthlyListingLimit === -1 
                ? 'Unlimited listings' 
                : `${subscription.planDetails.features.monthlyListingLimit} listings/month`}
            </li>
            <li>
              {subscription.planDetails.features.aiAnalysisLimit === -1 
                ? 'Unlimited AI analyses' 
                : `${subscription.planDetails.features.aiAnalysisLimit} AI analyses/month`}
            </li>
            <li>
              {subscription.planDetails.features.marketplaceCount} marketplace
              {subscription.planDetails.features.marketplaceCount > 1 ? 's' : ''}
            </li>
            {subscription.planDetails.features.bulkUploadEnabled && (
              <li>Bulk upload enabled</li>
            )}
            {subscription.planDetails.features.advancedAnalyticsEnabled && (
              <li>Advanced analytics</li>
            )}
            {subscription.planDetails.features.prioritySupport && (
              <li>Priority support</li>
            )}
          </ul>
        </div>
      </div>

      <div className="subscription-actions">
        <button 
          className="dashboard-btn dashboard-btn-secondary"
          onClick={handleManageBilling}
        >
          Manage Billing
        </button>
      </div>
    </div>
  );
};