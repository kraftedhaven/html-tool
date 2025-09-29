/**
 * Authentication and Subscription Context
 * Manages user authentication, subscription status, and usage tracking
 */

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { config } from '../config/environment';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

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

interface Usage {
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

interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  usage: Usage | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, firstName: string, lastName: string, plan?: string) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  updateSubscription: (newPlan: string) => Promise<boolean>;
  cancelSubscription: (immediate?: boolean) => Promise<boolean>;
  createBillingPortal: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);

  const apiBaseUrl = config.apiBaseUrl;

  const isAuthenticated = !!user && !!token;

  // Initialize auth state on mount
  useEffect(() => {
    if (token) {
      refreshProfile();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser(data.user);
        setSubscription(data.user.subscription);
        setIsAdmin(data.user.isAdmin || false);
        localStorage.setItem('authToken', data.token);
        
        // Fetch usage data
        await refreshUsage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    plan: string = 'basic'
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName, plan }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser(data.user);
        setSubscription(data.user.subscription);
        localStorage.setItem('authToken', data.token);
        
        // Fetch usage data
        await refreshUsage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setSubscription(null);
    setUsage(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  const refreshProfile = async (): Promise<void> => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${apiBaseUrl}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setSubscription(data.subscription);
      } else if (response.status === 401) {
        logout();
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUsage = async (): Promise<void> => {
    if (!token) return;

    try {
      const response = await fetch(`${apiBaseUrl}/user/usage`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('Usage refresh error:', error);
    }
  };

  const updateSubscription = async (newPlan: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`${apiBaseUrl}/subscription/update-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newPlan }),
      });

      if (response.ok) {
        await refreshProfile();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Subscription update error:', error);
      return false;
    }
  };

  const cancelSubscription = async (immediate: boolean = false): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`${apiBaseUrl}/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ immediate }),
      });

      if (response.ok) {
        await refreshProfile();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      return false;
    }
  };

  const createBillingPortal = async (): Promise<string | null> => {
    if (!token) return null;

    try {
      const response = await fetch(`${apiBaseUrl}/subscription/billing-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          returnUrl: window.location.origin + '/dashboard' 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
      return null;
    } catch (error) {
      console.error('Billing portal error:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    subscription,
    usage,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshProfile,
    refreshUsage,
    updateSubscription,
    cancelSubscription,
    createBillingPortal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};