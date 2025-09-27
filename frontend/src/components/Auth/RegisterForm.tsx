/**
 * Registration Form Component
 * Handles user registration with plan selection
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { config } from '../../config/environment';
import './Auth.css';

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

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    selectedPlan: 'basic'
  });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const success = await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.selectedPlan
      );

      if (success) {
        onSuccess();
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlan = plans.find(plan => plan.id === formData.selectedPlan);

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h2>Create Account</h2>
        <p>Start your 7-day free trial today</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              placeholder="First name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              placeholder="Last name"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            placeholder="At least 8 characters"
            minLength={8}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            placeholder="Confirm your password"
          />
        </div>

        <div className="form-group">
          <label htmlFor="selectedPlan">Choose Your Plan</label>
          <select
            id="selectedPlan"
            name="selectedPlan"
            value={formData.selectedPlan}
            onChange={handleInputChange}
            disabled={isLoading}
            className="plan-select"
          >
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name} - ${plan.price}/{plan.interval}
              </option>
            ))}
          </select>
        </div>

        {selectedPlan && (
          <div className="plan-preview">
            <h4>{selectedPlan.name} Plan Features</h4>
            <ul>
              <li>
                {selectedPlan.features.monthlyListingLimit === -1 
                  ? 'Unlimited listings' 
                  : `${selectedPlan.features.monthlyListingLimit} listings per month`}
              </li>
              <li>
                {selectedPlan.features.aiAnalysisLimit === -1 
                  ? 'Unlimited AI analyses' 
                  : `${selectedPlan.features.aiAnalysisLimit} AI analyses per month`}
              </li>
              <li>{selectedPlan.features.marketplaceCount} marketplace{selectedPlan.features.marketplaceCount > 1 ? 's' : ''}</li>
              {selectedPlan.features.bulkUploadEnabled && <li>Bulk upload enabled</li>}
              {selectedPlan.features.advancedAnalyticsEnabled && <li>Advanced analytics</li>}
              {selectedPlan.features.prioritySupport && <li>Priority support</li>}
            </ul>
            <div className="trial-notice">
              <strong>7-day free trial included</strong>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="auth-btn auth-btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Start Free Trial'}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Already have an account?{' '}
          <button
            type="button"
            className="auth-link"
            onClick={onSwitchToLogin}
            disabled={isLoading}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};