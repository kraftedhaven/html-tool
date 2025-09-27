/**
 * SaaS Application Component
 * Main entry point for the SaaS platform with authentication and dashboard
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import App from './App'; // Original Neural Listing Engine
import './App.css';

type ViewMode = 'auth' | 'dashboard' | 'engine';
type AuthMode = 'login' | 'register';

const SaaSAppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('auth');
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="saas-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If not authenticated, show auth forms
  if (!isAuthenticated) {
    return (
      <div className="saas-auth">
        <div className="auth-background">
          <div className="grid-bg"></div>
        </div>
        
        <div className="auth-content">
          {authMode === 'login' ? (
            <LoginForm
              onSwitchToRegister={() => setAuthMode('register')}
              onSuccess={() => setViewMode('dashboard')}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={() => setAuthMode('login')}
              onSuccess={() => setViewMode('dashboard')}
            />
          )}
        </div>
      </div>
    );
  }

  // If authenticated, show the appropriate view
  return (
    <div className="saas-app">
      {viewMode === 'dashboard' && (
        <>
          <Dashboard />
          <div className="view-switcher">
            <button 
              className="switch-btn"
              onClick={() => setViewMode('engine')}
            >
              Open Neural Listing Engine
            </button>
          </div>
        </>
      )}
      
      {viewMode === 'engine' && (
        <>
          <div className="engine-header">
            <button 
              className="back-btn"
              onClick={() => setViewMode('dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>
          <App />
        </>
      )}
    </div>
  );
};

const SaaSApp: React.FC = () => {
  return (
    <AuthProvider>
      <SaaSAppContent />
    </AuthProvider>
  );
};

export default SaaSApp;