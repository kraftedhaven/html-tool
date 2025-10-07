/**
 * Main Dashboard Component
 * Shows user profile, subscription status, usage statistics, and plan management
 */

import { useState, useEffect } from 'react';
// import { useAuth } from './contexts/AuthContext'; // Assuming this path is correct
import { UsageChart } from './components/Dashboard/UsageChart';
import { SubscriptionCard } from './components/Dashboard/SubscriptionCard';
import { PlanUpgrade } from './components/Dashboard/PlanUpgrade';
import './components/Dashboard/Dashboard.css';

// Mock useAuth hook for standalone demonstration. 
// Replace with your actual import: import { useAuth } from '../../contexts/AuthContext';
const useAuth = () => ({
  user: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    createdAt: '2023-01-15T10:00:00Z',
  },
  subscription: {
    planName: 'Pro',
    price: 49,
    currency: 'USD',
    renewalDate: '2025-10-26T10:00:00Z',
  },
  usage: {
    listings: { used: 50, limit: 100, unlimited: false, percentage: 50 },
    aiAnalyses: { used: 250, limit: 1000, unlimited: false, percentage: 25 },
    apiCalls: { used: 1250, limit: 5000, unlimited: false, percentage: 25 },
  },
  refreshUsage: () => console.log('Refreshing usage...'),
  logout: () => console.log('Logging out...'),
});


export function Dashboard() {
  const { user, subscription, usage, refreshUsage, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'billing' | 'settings'>('overview');

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  if (!user || !subscription) {
    return (
      <div className="dashboard-loading" aria-live="polite">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'usage', label: 'Usage' },
    { id: 'billing', label: 'Billing' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Neural Listing Engine</h1>
          <p>Welcome back, {user.firstName}</p>
        </div>
        
        <div className="dashboard-actions">
          <button type="button" className="dashboard-btn dashboard-btn-secondary" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="dashboard-nav" role="tablist" aria-label="Dashboard navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as 'overview' | 'usage' | 'billing' | 'settings')}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        <div id="tabpanel-overview" role="tabpanel" aria-labelledby="tab-overview" hidden={activeTab !== 'overview'}>
          <div className="overview-tab">
            <div className="dashboard-grid">
              {/* @ts-ignore */}
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
                          {usage.apiCalls.used}/{usage.apiCalls.unlimited ? '∞' : usage.apiCalls.limit}
                        </span>
                      </div>
                      <div className="usage-bar">
                        <div className="usage-bar-fill" style={{ width: `${Math.min(usage.apiCalls.percentage, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button type="button" className="action-btn" onClick={() => alert('Navigate to Analyze Images page!')}>
                    <span role="img" aria-label="Pictures">🖼️</span>
                    <span>Analyze Images</span>
                  </button>
                  <button type="button" className="action-btn" onClick={() => alert('Navigate to Analytics page!')}>
                    <span role="img" aria-label="Bar chart">📊</span>
                    <span>View Analytics</span>
                  </button>
                  <button type="button" className="action-btn" onClick={() => alert('Navigate to API Settings page!')}>
                    <span role="img" aria-label="Gear">⚙️</span>
                    <span>API Settings</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="tabpanel-usage" role="tabpanel" aria-labelledby="tab-usage" hidden={activeTab !== 'usage'}>
          <div className="usage-tab">
            <h2>Usage Analytics</h2>
            {/* @ts-ignore */}
            {usage && <UsageChart usage={usage} />}
          </div>
        </div>

        <div id="tabpanel-billing" role="tabpanel" aria-labelledby="tab-billing" hidden={activeTab !== 'billing'}>
          <div className="billing-tab">
            <h2>Billing & Plans</h2>
            {/* @ts-ignore */}
            <PlanUpgrade currentSubscription={subscription} />
          </div>
        </div>

        <div id="tabpanel-settings" role="tabpanel" aria-labelledby="tab-settings" hidden={activeTab !== 'settings'}>
          <div className="settings-tab">
            <h2>Account Settings</h2>
            <div className="settings-section">
              <h3>Profile Information</h3>
              <div className="profile-info">
                <div className="info-row">
                  <strong>Name:</strong>
                  <span>{user.firstName} {user.lastName}</span>
                </div>
                <div className="info-row">
                  <strong>Email:</strong>
                  <span>{user.email}</span>
                </div>
                <div className="info-row">
                  <strong>Member since:</strong>
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>API Configuration</h3>
              <p className="settings-description">
                Configure your API keys and marketplace integrations in the main application.
              </p>
              <button type="button" className="dashboard-btn dashboard-btn-primary">
                Open Neural Listing Engine
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
