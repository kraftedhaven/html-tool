/**
 * Payment Methods Component
 * Manages user's payment methods and billing information
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { config } from '../../config/environment';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  brand?: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export const PaymentMethods: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingMethod, setIsAddingMethod] = useState(false);

  const { token, createBillingPortal } = useAuth();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${config.apiBaseUrl}/subscription/payment-methods`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      } else {
        setError('Failed to load payment methods');
      }
    } catch (error) {
      setError('Error loading payment methods');
      console.error('Payment methods error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    setIsAddingMethod(true);
    try {
      // Use Stripe billing portal for adding payment methods
      const url = await createBillingPortal();
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
    } finally {
      setIsAddingMethod(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${config.apiBaseUrl}/subscription/set-default-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (response.ok) {
        await fetchPaymentMethods(); // Refresh the list
      } else {
        setError('Failed to set default payment method');
      }
    } catch (error) {
      setError('Error setting default payment method');
      console.error('Set default payment error:', error);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    if (!token) return;

    try {
      const response = await fetch(`${config.apiBaseUrl}/subscription/remove-payment-method`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (response.ok) {
        await fetchPaymentMethods(); // Refresh the list
      } else {
        setError('Failed to remove payment method');
      }
    } catch (error) {
      setError('Error removing payment method');
      console.error('Remove payment method error:', error);
    }
  };

  const getCardIcon = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      case 'discover': return '💳';
      default: return '💳';
    }
  };

  if (isLoading) {
    return (
      <div className="payment-methods-loading">
        <div className="loading-spinner"></div>
        <p>Loading payment methods...</p>
      </div>
    );
  }

  return (
    <div className="payment-methods">
      <div className="payment-methods-header">
        <h3>Payment Methods</h3>
        <button
          className="dashboard-btn dashboard-btn-primary"
          onClick={handleAddPaymentMethod}
          disabled={isAddingMethod}
        >
          {isAddingMethod ? 'Opening...' : 'Add Payment Method'}
        </button>
      </div>

      {error && (
        <div className="payment-methods-error">
          <p className="error-message">{error}</p>
          <button 
            className="dashboard-btn dashboard-btn-secondary"
            onClick={() => setError('')}
          >
            Dismiss
          </button>
        </div>
      )}

      {paymentMethods.length === 0 ? (
        <div className="no-payment-methods">
          <div className="empty-state">
            <span className="empty-icon">💳</span>
            <h4>No Payment Methods</h4>
            <p>Add a payment method to manage your subscription billing.</p>
            <button
              className="dashboard-btn dashboard-btn-primary"
              onClick={handleAddPaymentMethod}
              disabled={isAddingMethod}
            >
              Add Your First Payment Method
            </button>
          </div>
        </div>
      ) : (
        <div className="payment-methods-list">
          {paymentMethods.map((method) => (
            <div key={method.id} className={`payment-method-card ${method.isDefault ? 'default' : ''}`}>
              <div className="payment-method-info">
                <div className="payment-method-icon">
                  {getCardIcon(method.brand || '')}
                </div>
                <div className="payment-method-details">
                  <div className="payment-method-type">
                    {method.type === 'card' ? (
                      <>
                        {method.brand?.toUpperCase()} ending in {method.last4}
                        {method.expiryMonth && method.expiryYear && (
                          <span className="expiry">
                            Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                          </span>
                        )}
                      </>
                    ) : (
                      `Bank account ending in ${method.last4}`
                    )}
                  </div>
                  {method.isDefault && (
                    <div className="default-badge">Default</div>
                  )}
                </div>
              </div>

              <div className="payment-method-actions">
                {!method.isDefault && (
                  <button
                    className="action-btn set-default-btn"
                    onClick={() => handleSetDefault(method.id)}
                    title="Set as default"
                  >
                    Set Default
                  </button>
                )}
                <button
                  className="action-btn remove-btn"
                  onClick={() => handleRemovePaymentMethod(method.id)}
                  title="Remove payment method"
                  disabled={method.isDefault && paymentMethods.length === 1}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="payment-methods-footer">
        <p className="security-note">
          🔒 Your payment information is securely processed by Stripe and never stored on our servers.
        </p>
      </div>
    </div>
  );
};