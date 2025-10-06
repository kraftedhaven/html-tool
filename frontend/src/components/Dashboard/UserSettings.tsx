/**
 * User Settings Component
 * Comprehensive user profile and account settings management
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const UserSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'security' | 'notifications' | 'api'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    company: '',
    phone: ''
  });

  const handleSaveProfile = async () => {
    // Implementation would save profile data
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Implementation would delete account
      alert('Account deletion initiated. You will receive a confirmation email.');
    }
  };

  return (
    <div className="user-settings">
      <div className="settings-header">
        <h2>Account Settings</h2>
        <p>Manage your profile, security, and preferences</p>
      </div>

      <div className="settings-nav">
        <button
          className={`settings-nav-tab ${activeSettingsTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveSettingsTab('profile')}
        >
          Profile
        </button>
        <button
          className={`settings-nav-tab ${activeSettingsTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveSettingsTab('security')}
        >
          Security
        </button>
        <button
          className={`settings-nav-tab ${activeSettingsTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveSettingsTab('notifications')}
        >
          Notifications
        </button>
        <button
          className={`settings-nav-tab ${activeSettingsTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveSettingsTab('api')}
        >
          API Access
        </button>
      </div>

      <div className="settings-content">
        {activeSettingsTab === 'profile' && (
          <div className="profile-settings">
            <div className="settings-section">
              <h3>Personal Information</h3>
              <div className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      disabled={!isEditing}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    disabled={!isEditing}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Company (Optional)</label>
                    <input
                      type="text"
                      value={profileData.company}
                      onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                      disabled={!isEditing}
                      className="form-input"
                      placeholder="Your business name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone (Optional)</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      disabled={!isEditing}
                      className="form-input"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  {!isEditing ? (
                    <button
                      className="dashboard-btn dashboard-btn-primary"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="edit-actions">
                      <button
                        className="dashboard-btn dashboard-btn-secondary"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="dashboard-btn dashboard-btn-primary"
                        onClick={handleSaveProfile}
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Account Information</h3>
              <div className="account-info">
                <div className="info-item">
                  <span className="info-label">Member Since:</span>
                  <span className="info-value">{new Date(user?.createdAt || '').toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Account ID:</span>
                  <span className="info-value">{user?.id}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSettingsTab === 'security' && (
          <div className="security-settings">
            <div className="settings-section">
              <h3>Password & Authentication</h3>
              <div className="security-actions">
                <button className="dashboard-btn dashboard-btn-secondary">
                  Change Password
                </button>
                <button className="dashboard-btn dashboard-btn-secondary">
                  Enable Two-Factor Authentication
                </button>
              </div>
            </div>

            <div className="settings-section danger-zone">
              <h3>Danger Zone</h3>
              <p>These actions are permanent and cannot be undone.</p>
              <div className="danger-actions">
                <button
                  className="dashboard-btn dashboard-btn-danger"
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSettingsTab === 'notifications' && (
          <div className="notification-settings">
            <div className="settings-section">
              <h3>Email Notifications</h3>
              <div className="notification-options">
                <label className="notification-option">
                  <input type="checkbox" defaultChecked />
                  <span>Billing and payment notifications</span>
                </label>
                <label className="notification-option">
                  <input type="checkbox" defaultChecked />
                  <span>Usage limit warnings</span>
                </label>
                <label className="notification-option">
                  <input type="checkbox" />
                  <span>Product updates and new features</span>
                </label>
                <label className="notification-option">
                  <input type="checkbox" />
                  <span>Marketing and promotional emails</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeSettingsTab === 'api' && (
          <div className="api-settings">
            <div className="settings-section">
              <h3>API Access</h3>
              <p>Manage your API keys and access tokens for integrating with external services.</p>
              
              <div className="api-info">
                <div className="info-card">
                  <h4>Neural Listing Engine API</h4>
                  <p>Access the full Neural Listing Engine functionality programmatically.</p>
                  <button className="dashboard-btn dashboard-btn-primary">
                    Generate API Key
                  </button>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Marketplace Integrations</h3>
              <p>Configure your marketplace API credentials for automated listing.</p>
              
              <div className="integration-list">
                <div className="integration-item">
                  <div className="integration-info">
                    <span className="integration-name">eBay API</span>
                    <span className="integration-status connected">Connected</span>
                  </div>
                  <button className="dashboard-btn dashboard-btn-secondary">
                    Manage
                  </button>
                </div>
                
                <div className="integration-item">
                  <div className="integration-info">
                    <span className="integration-name">Facebook Marketplace</span>
                    <span className="integration-status disconnected">Not Connected</span>
                  </div>
                  <button className="dashboard-btn dashboard-btn-primary">
                    Connect
                  </button>
                </div>
                
                <div className="integration-item">
                  <div className="integration-info">
                    <span className="integration-name">Etsy API</span>
                    <span className="integration-status disconnected">Not Connected</span>
                  </div>
                  <button className="dashboard-btn dashboard-btn-primary">
                    Connect
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};