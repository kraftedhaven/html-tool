/**
 * Usage Chart Component
 * Displays usage statistics in a visual format
 */

import React from 'react';

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

interface UsageChartProps {
  usage: Usage;
}

export const UsageChart: React.FC<UsageChartProps> = ({ usage }) => {
  const usageItems = [
    {
      name: 'Listings Created',
      used: usage.listings.used,
      limit: usage.listings.limit,
      percentage: usage.listings.percentage,
      unlimited: usage.listings.unlimited,
      color: '#00ff88'
    },
    {
      name: 'AI Analyses',
      used: usage.aiAnalyses.used,
      limit: usage.aiAnalyses.limit,
      percentage: usage.aiAnalyses.percentage,
      unlimited: usage.aiAnalyses.unlimited,
      color: '#007aff'
    },
    {
      name: 'API Calls',
      used: usage.apiCalls.used,
      limit: usage.apiCalls.limit,
      percentage: usage.apiCalls.percentage,
      unlimited: usage.apiCalls.unlimited,
      color: '#ff9500'
    }
  ];

  return (
    <div className="usage-chart">
      <div className="usage-summary">
        <h3>Current Billing Period Usage</h3>
        <p>Track your usage across all features</p>
      </div>

      <div className="usage-items">
        {usageItems.map((item, index) => (
          <div key={index} className="usage-item">
            <div className="usage-item-header">
              <div className="usage-item-info">
                <h4>{item.name}</h4>
                <div className="usage-numbers">
                  <span className="usage-used">{item.used.toLocaleString()}</span>
                  <span className="usage-separator">/</span>
                  <span className="usage-limit">
                    {item.unlimited ? '∞' : item.limit.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {!item.unlimited && (
                <div className="usage-percentage">
                  {Math.round(item.percentage)}%
                </div>
              )}
            </div>

            <div className="usage-progress">
              <div className="usage-progress-track">
                <div 
                  className="usage-progress-fill"
                  style={{ 
                    width: item.unlimited ? '0%' : `${Math.min(item.percentage, 100)}%`,
                    backgroundColor: item.color
                  }}
                ></div>
              </div>
            </div>

            <div className="usage-status">
              {item.unlimited ? (
                <span className="status-unlimited">Unlimited</span>
              ) : item.percentage >= 90 ? (
                <span className="status-warning">Near limit</span>
              ) : item.percentage >= 100 ? (
                <span className="status-exceeded">Limit exceeded</span>
              ) : (
                <span className="status-normal">Within limits</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="usage-insights">
        <h4>Usage Insights</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-value">
              {Math.round((usage.listings.used + usage.aiAnalyses.used) / 2)}
            </div>
            <div className="insight-label">Avg. Daily Usage</div>
          </div>
          
          <div className="insight-card">
            <div className="insight-value">
              {usage.listings.unlimited ? '∞' : Math.max(0, usage.listings.limit - usage.listings.used)}
            </div>
            <div className="insight-label">Listings Remaining</div>
          </div>
          
          <div className="insight-card">
            <div className="insight-value">
              {usage.aiAnalyses.unlimited ? '∞' : Math.max(0, usage.aiAnalyses.limit - usage.aiAnalyses.used)}
            </div>
            <div className="insight-label">Analyses Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
};