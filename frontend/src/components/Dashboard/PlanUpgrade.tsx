/**
 * Plan Upgrade Component
 * Allows users to upgrade/downgrade their subscription plans
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { config } from '../../config/environment';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: {
    monthlyListingLimit: number;
    aiAnalysisLimit: number;
    marketplaceCount: number;
    bulkUploadEnabled: boolean;
    advancedAnalyticsEnabled: boolean;
    prioritySupport: boolean;
  };
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  planDetails: {
    name: string;
    price: number;
  };
}

interface PlanUpgradeProps {
  currentSubscription: Subscription;
}

export const PlanUpgrade: React.FC<PlanUpgradeProps> = ({ currentSubscription }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>(currentSubscription.plan);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { updateSubscription, cancelSubscription, createBillingPortal, refreshProfile } = useAuth();

  // Fetch available plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/subscription/plans`);
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans);
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      }
    };

    fetchPlans();
  }, []);

  const handlePlanChange = async () => {
    if (selectedPlan === currentSubscription.plan) return;

    setIsLoading(true);
    try {
      const success = await updateSubscription(selectedPlan);
      if (success) {
        await refreshProfile();
        setShowConfirmation(false);
        alert('Plan updated successfully!');
      } else {
        alert('Failed to update plan. Please try again.');
      }
    } catch (error) {
      alert('Failed to update plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setIsLoading(true);
    try {
      const success = await cancelSubscription(false);
      if (success) {
        await refreshProfile();
        alert('Subscription cancelled. You will retain access until the end of your billing period.');
      } else {
        alert('Failed to cancel subscription. Please try again.');
      }
    } catch (error) {
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    const url = await createBillingPortal();
    if (url) {
      window.open(url, '_blank');
    }
  };

  const currentPlan = plans.find(plan => plan.id === currentSubscription.plan);
  const newPlan = plans.find(plan => plan.id === selectedPlan);

  return (
    <div className="plan-upgrade">
      <div className="current-plan-info">
        <h3>Current Plan</h3>
        <div className="current-plan-card">
          <div className="plan-header">
            <h4>{currentSubscription.planDetails.name}</h4>
            <div className="plan-price">${currentSubscription.planDetails.price}/month</div>
          </div>
          
          {currentSubscription.cancelAtPeriodEnd && (
            <div className="cancellation-notice">
              <strong>⚠️ Subscription will be cancelled at the end of the billing period</strong>
            </div>
          )}
        </div>
      </div>

      <div className="available-plans">
        <h3>Available Plans</h3>
        <div className="plans-grid">
          {plans.map(plan => (
            <div 
              key={plan.id} 
              className={`plan-card ${plan.id === currentSubscription.plan ? 'current' : ''} ${plan.id === selectedPlan ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="plan-card-header">
                <h4>{plan.name}</h4>
                <div className="plan-card-price">
                  ${plan.price}
                  <span className="plan-interval">/{plan.interval}</span>
                </div>
              </div>

              <div className="plan-features">
                <ul>
                  <li>
                    {plan.features.monthlyListingLimit === -1 
                      ? 'Unlimited listings' 
                      : `${plan.features.monthlyListingLimit} listings/month`}
                  </li>
                  <li>
                    {plan.features.aiAnalysisLimit === -1 
                      ? 'Unlimited AI analyses' 
                      : `${plan.features.aiAnalysisLimit} AI analyses/month`}
                  </li>
                  <li>
                    {plan.features.marketplaceCount} marketplace{plan.features.marketplaceCount > 1 ? 's' : ''}
                  </li>
                  {plan.features.bulkUploadEnabled && <li>✓ Bulk upload</li>}
                  {plan.features.advancedAnalyticsEnabled && <li>✓ Advanced analytics</li>}
                  {plan.features.prioritySupport && <li>✓ Priority support</li>}
                </ul>
              </div>

              {plan.id === currentSubscription.plan && (
                <div className="current-plan-badge">Current Plan</div>
              )}

              {plan.id === selectedPlan && plan.id !== currentSubscription.plan && (
                <div className="selected-plan-badge">Selected</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedPlan !== currentSubscription.plan && (
        <div className="plan-change-actions">
          <div className="change-summary">
            <h4>Plan Change Summary</h4>
            <div className="change-details">
              <div className="change-from">
                From: {currentPlan?.name} (${currentPlan?.price}/month)
              </div>
              <div className="change-to">
                To: {newPlan?.name} (${newPlan?.price}/month)
              </div>
              <div className="change-difference">
                {newPlan && currentPlan && (
                  <span className={newPlan.price > currentPlan.price ? 'price-increase' : 'price-decrease'}>
                    {newPlan.price > currentPlan.price ? '+' : ''}
                    ${(newPlan.price - currentPlan.price).toFixed(2)}/month
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="change-buttons">
            <button 
              className="dashboard-btn dashboard-btn-secondary"
              onClick={() => setSelectedPlan(currentSubscription.plan)}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              className="dashboard-btn dashboard-btn-primary"
              onClick={() => setShowConfirmation(true)}
              disabled={isLoading}
            >
              {newPlan && currentPlan && newPlan.price > currentPlan.price ? 'Upgrade Plan' : 'Change Plan'}
            </button>
          </div>
        </div>
      )}

      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h4>Confirm Plan Change</h4>
            <p>
              Are you sure you want to change from {currentPlan?.name} to {newPlan?.name}?
            </p>
            <p className="modal-note">
              Changes will be prorated and reflected in your next billing cycle.
            </p>
            <div className="modal-actions">
              <button 
                className="dashboard-btn dashboard-btn-secondary"
                onClick={() => setShowConfirmation(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className="dashboard-btn dashboard-btn-primary"
                onClick={handlePlanChange}
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="billing-actions">
        <h3>Billing Management</h3>
        <div className="billing-buttons">
          <button 
            className="dashboard-btn dashboard-btn-secondary"
            onClick={handleManageBilling}
            disabled={isLoading}
          >
            Manage Payment Methods
          </button>
          
          {!currentSubscription.cancelAtPeriodEnd && (
            <button 
              className="dashboard-btn dashboard-btn-danger"
              onClick={handleCancelSubscription}
              disabled={isLoading}
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>
    </div>
  );
};