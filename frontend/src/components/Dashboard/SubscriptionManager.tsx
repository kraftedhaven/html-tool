/**
 * Subscription Manager Component
 * Comprehensive subscription management interface with plan upgrades, billing, and usage
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SubscriptionCard } from './SubscriptionCard';
import { PlanUpgrade } from './PlanUpgrade';
import { BillingHistory } from './BillingHistory';
import { PaymentMethods } from './PaymentMethods';
import { UsageChart } from './UsageChart';

interface SubscriptionManagerProps {
  subscription: any;
  usage: any;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ 
  subscription, 
  usage 
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'plans' | 'usage' | 'billing' | 'payment'>('overview');
  const { createBillingPortal, updateSubscription, cancelSubscription } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickUpgrade = async () => {
    if (subscription.plan === 'basic') {
      setIsLoading(true);
      try {
        const success = await updateSubscription('pro');
        if (success) {
          alert('Successfully upgraded to Pro plan!');
        } else {
          alert('Failed to upgrade plan. Please try again.');
        }
      } catch (error) {
        alert('Failed to upgrade plan. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setActiveSection('plans');
    }
  };

  const handleManageBilling = async () => {
    const url = await createBillingPortal();
    if (url) {
      window.open(url, '_blank');
    }
  };

  const getUpgradeRecommendation = () => {
    if (!usage) return null;

    const listingsUsage = usage.listings.percentage;
    const aiUsage = usage.aiAnalyses.percentage;

    if (subscription.plan === 'basic' && (listingsUsage > 80 || aiUsage > 80)) {
      return {
        message: 'You\'re approaching your plan limits. Consider upgrading to Pro for unlimited features.',
        action: 'Upgrade to Pro',
        urgency: 'high'
      };
    }

    if (subscription.plan === 'pro' && listingsUsage > 90) {
      return {
        message: 'Heavy usage detected. Enterprise plan offers advanced features and priority support.',
        action: 'View Enterprise',
        urgency: 'medium'
      };
    }

    return null;
  };

  const recommendation = getUpgradeRecommendation();

  return (
    <div className="subscription-manager">
      <div className="subscription-nav">
        <button
          className={`sub-nav-tab ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          Overview
        </button>
        <button
          className={`sub-nav-tab ${activeSection === 'usage' ? 'active' : ''}`}
          onClick={() => setActiveSection('usage')}
        >
          Usage Details
        </button>
        <button
          className={`sub-nav-tab ${activeSection === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveSection('plans')}
        >
          Plans & Upgrades
        </button>
        <button
          className={`sub-nav-tab ${activeSection === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveSection('billing')}
        >
          Billing History
        </button>
        <button
          className={`sub-nav-tab ${activeSection === 'payment' ? 'active' : ''}`}
          onClick={() => setActiveSection('payment')}
        >
          Payment Methods
        </button>
      </div>

      <div className="subscription-content">
        {activeSection === 'overview' && (
          <div className="subscription-overview">
            <div className="overview-grid">
              <div className="overview-main">
                <SubscriptionCard subscription={subscription} />
                
                {recommendation && (
                  <div className={`upgrade-recommendation ${recommendation.urgency}`}>
                    <div className="recommendation-content">
                      <div className="recommendation-icon">
                        {recommendation.urgency === 'high' ? '⚠️' : '💡'}
                      </div>
                      <div className="recommendation-text">
                        <h4>Upgrade Recommendation</h4>
                        <p>{recommendation.message}</p>
                      </div>
                      <button
                        className="recommendation-btn"
                        onClick={handleQuickUpgrade}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Upgrading...' : recommendation.action}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="overview-sidebar">
                <div className="quick-stats">
                  <h4>Quick Stats</h4>
                  {usage && (
                    <div className="stats-grid">
                      <div className="stat-item">
                        <div className="stat-value">{usage.listings.used}</div>
                        <div className="stat-label">Listings Created</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{usage.aiAnalyses.used}</div>
                        <div className="stat-label">AI Analyses</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{usage.apiCalls.used}</div>
                        <div className="stat-label">API Calls</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="quick-actions-sub">
                  <h4>Quick Actions</h4>
                  <div className="action-list">
                    <button
                      className="action-item"
                      onClick={() => setActiveSection('plans')}
                    >
                      <span className="action-icon">📈</span>
                      <span>Upgrade Plan</span>
                    </button>
                    <button
                      className="action-item"
                      onClick={handleManageBilling}
                    >
                      <span className="action-icon">💳</span>
                      <span>Manage Billing</span>
                    </button>
                    <button
                      className="action-item"
                      onClick={() => setActiveSection('usage')}
                    >
                      <span className="action-icon">📊</span>
                      <span>View Usage</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'usage' && usage && (
          <div className="usage-section">
            <UsageChart usage={usage} />
          </div>
        )}

        {activeSection === 'plans' && (
          <div className="plans-section">
            <PlanUpgrade currentSubscription={subscription} />
          </div>
        )}

        {activeSection === 'billing' && (
          <div className="billing-section">
            <BillingHistory />
          </div>
        )}

        {activeSection === 'payment' && (
          <div className="payment-section">
            <PaymentMethods />
          </div>
        )}
      </div>
    </div>
  );
};