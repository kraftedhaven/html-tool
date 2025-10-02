/**
 * SaaS Application Component
 * Main entry point for the SaaS platform with authentication and dashboard
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import ServiceRequestForm from './components/Services/ServiceRequestForm';
import ServiceRequestList from './components/Admin/ServiceRequestList';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AffiliateProgram from './components/AffiliateProgram';
import ConsultingServices from './components/ConsultingServices';
import App from './App'; // Original Neural Listing Engine
import './App.css';

type ViewMode = 'auth' | 'dashboard' | 'engine' | 'services' | 'admin' | 'analytics' | 'affiliate' | 'consulting';


type AuthMode = 'login' | 'register';

const SaaSAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
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
            <button 
              className="switch-btn"
              onClick={() => setViewMode('services')}
            >
              Request "Done-For-You" Service
            </button>
            <button 
              className="switch-btn"
              onClick={() => setViewMode('analytics')}
            >
              Analytics Dashboard
            </button>
            <button 
              className="switch-btn"
              onClick={() => setViewMode('affiliate')}
            >
              Affiliate Program
            </button>
            <button 
              className="switch-btn"
              onClick={() => setViewMode('consulting')}
            >
              Consulting Services
            </button>
            {isAdmin && (
              <button 
                className="switch-btn"
                onClick={() => setViewMode('admin')}
              >
                Admin Dashboard
              </button>
            )}
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

      {viewMode === 'services' && (
        <>
          <div className="engine-header">
            <button 
              className="back-btn"
              onClick={() => setViewMode('dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>
          <ServiceRequestForm />
        </>
      )}

      {viewMode === 'admin' && (
        <>
          <div className="engine-header">
            <button 
              className="back-btn"
              onClick={() => setViewMode('dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>
          <ServiceRequestList />
        </>
      )}

      {viewMode === 'analytics' && (
        <>
          <div className="engine-header">
            <button 
              className="back-btn"
              onClick={() => setViewMode('dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>
          <AnalyticsDashboard />
        </>
      )}

      {viewMode === 'affiliate' && (
        <>
          <div className="engine-header">
            <button 
              className="back-btn"
              onClick={() => setViewMode('dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>
          <AffiliateProgram />
        </>
      )}

      {viewMode === 'consulting' && (
        <>
          <div className="engine-header">
            <button 
              className="back-btn"
              onClick={() => setViewMode('dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>
          <ConsultingServices />
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