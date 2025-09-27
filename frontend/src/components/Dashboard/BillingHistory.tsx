/**
 * Billing History Component
 * Displays user's billing history and invoices
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { config } from '../../config/environment';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  downloadUrl?: string;
}

export const BillingHistory: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { token } = useAuth();

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const fetchBillingHistory = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${config.apiBaseUrl}/subscription/billing-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      } else {
        setError('Failed to load billing history');
      }
    } catch (error) {
      setError('Error loading billing history');
      console.error('Billing history error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#00ff88';
      case 'pending': return '#ff9500';
      case 'failed': return '#ff453a';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    if (invoice.downloadUrl) {
      window.open(invoice.downloadUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="billing-history-loading">
        <div className="loading-spinner"></div>
        <p>Loading billing history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="billing-history-error">
        <p className="error-message">{error}</p>
        <button 
          className="dashboard-btn dashboard-btn-secondary"
          onClick={fetchBillingHistory}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="billing-history">
      <div className="billing-history-header">
        <h3>Billing History</h3>
        <p>View and download your invoices</p>
      </div>

      {invoices.length === 0 ? (
        <div className="no-invoices">
          <p>No billing history available yet.</p>
        </div>
      ) : (
        <div className="invoices-table">
          <div className="table-header">
            <div className="header-cell">Date</div>
            <div className="header-cell">Description</div>
            <div className="header-cell">Amount</div>
            <div className="header-cell">Status</div>
            <div className="header-cell">Actions</div>
          </div>

          {invoices.map((invoice) => (
            <div key={invoice.id} className="table-row">
              <div className="table-cell" data-label="Date">
                {new Date(invoice.date).toLocaleDateString()}
              </div>
              <div className="table-cell" data-label="Description">
                {invoice.description}
              </div>
              <div className="table-cell" data-label="Amount">
                ${invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
              </div>
              <div className="table-cell" data-label="Status">
                <span 
                  className="status-badge"
                  style={{ color: getStatusColor(invoice.status) }}
                >
                  {getStatusText(invoice.status)}
                </span>
              </div>
              <div className="table-cell" data-label="Actions">
                {invoice.downloadUrl && (
                  <button
                    className="download-btn"
                    onClick={() => handleDownloadInvoice(invoice)}
                    title="Download Invoice"
                  >
                    📄 Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="billing-history-footer">
        <p className="footer-note">
          Need help with billing? <a href="mailto:support@hiddenhaven.com">Contact Support</a>
        </p>
      </div>
    </div>
  );
};