/**
 * Main Dashboard Component
 * Shows user profile, subscription status, usage statistics, and plan management
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UsageChart } from './UsageChart';
import { SubscriptionCard } from './SubscriptionCard';
import { SubscriptionManager } from './SubscriptionManager';
import { UserOnboarding } from './UserOnboarding';
import { UserSettings } from './UserSettings';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user, subscription, usage, refreshUsage, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'billing' | 'settings'>('overview');
  const [billingSubTab, setBillingSubTab] = useState<'plans' | 'history' | 'payment-methods'>('plans');

  useEffect(() => {
    // Refresh usage data when dashboard loads
    refreshUsage();
  }, [refreshUsage]);

  if (!user || !subscription) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <UserOnboarding />
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Neural Listing Engine</h1>
          <p>Welcome back, {user.firstName}</p>
        </div>

        <div className="dashboard-actions">
          <button className="dashboard-btn dashboard-btn-secondary" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`nav-tab ${activeTab === 'usage' ? 'active' : ''}`}
          onClick={() => setActiveTab('usage')}
        >
          Usage
        </button>
        <button
          className={`nav-tab ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          Billing
        </button>
        <button
          className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="dashboard-grid">
              <SubscriptionCard subscription={subscription} />

              {usage && (
                <div className="usage-overview">
                  <h3>Current Usage</h3>
                  <div className="usage-stats">
                    <div className="usage-stat">
                      <div className="usage-stat-header">
                        <span>Listings</span>
                        <span className="usage-stat-value">
                          {usage.listings.used}/{usage.listings.unlimited ? '∞' : usage.listings.limit}
                        </span>
                      </div>
                      <div className="usage-bar">
                        <div
                          className="usage-bar-fill"
                          style={{ width: `${Math.min(usage.listings.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="usage-stat">
                      <div className="usage-stat-header">
                        <span>AI Analyses</span>
                        <span className="usage-stat-value">
                          {usage.aiAnalyses.used}/{usage.aiAnalyses.unlimited ? '∞' : usage.aiAnalyses.limit}
                        </span>
                      </div>
                      <div className="usage-bar">
                        <div
                          className="usage-bar-fill"
                          style={{ width: `${Math.min(usage.aiAnalyses.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="usage-stat">
                      <div className="usage-stat-header">
                        <span>API Calls</span>
                        <span className="usage-stat-value">
                          {usage.apiCalls.used}/∞
                        </span>
                      </div>
                      <div className="usage-bar">
                        <div className="usage-bar-fill" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button className="action-btn">
                    <span className="action-icon">🖼️</span>
                    <span>Analyze Images</span>
                  </button>
                  <button className="action-btn">
                    <span className="action-icon">📊</span>
                    <span>View Analytics</span>
                  </button>
                  <button className="action-btn">
                    <span className="action-icon">⚙️</span>
                    <span>API Settings</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="usage-tab">
            <h2>Usage Analytics</h2>
            {usage && <UsageChart usage={usage} />}
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="billing-tab">
            <h2>Subscription Management</h2>
            <SubscriptionManager subscription={subscription} usage={usage} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <UserSettings />
          </div>
        )}
      </div>
    </div>
  );
};