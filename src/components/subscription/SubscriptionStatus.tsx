/**
 * Subscription Status Component
 * Displays current subscription status with upgrade options
 */

import React from 'react';
import { SubscriptionStatusProps } from '../../types/subscription';
import './SubscriptionStatus.css';

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  subscription,
  onUpgrade,
  onManage,
  compact = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trial':
        return '#f59e0b';
      case 'active':
        return '#10b981';
      case 'expired':
        return '#ef4444';
      case 'cancelled':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'trial':
        return 'Free Trial';
      case 'active':
        return 'Active';
      case 'expired':
        return 'Expired';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const formatDaysRemaining = (days: number | null) => {
    if (days === null) return null;
    if (days === 0) return 'Expires today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  if (compact) {
    return (
      <div className="subscription-status subscription-status--compact">
        <div className="subscription-status__info">
          <span 
            className="subscription-status__status"
            style={{ color: getStatusColor(subscription.status) }}
          >
            {subscription.status === 'trial' ? 'Trial' : getStatusText(subscription.status)}
          </span>
          {subscription.days_remaining !== null && subscription.status === 'trial' && (
            <span className="subscription-status__days">
              {subscription.days_remaining}d
            </span>
          )}
        </div>
        {subscription.upgrade_required && (
          <button 
            className="subscription-status__upgrade-btn"
            onClick={onUpgrade}
          >
            Upgrade
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="subscription-status">
      <div className="subscription-status__header">
        <h3 className="subscription-status__title">Subscription Status</h3>
        <div className="subscription-status__status-badge">
          <span 
            className="subscription-status__status-dot"
            style={{ backgroundColor: getStatusColor(subscription.status) }}
          />
          {getStatusText(subscription.status)}
        </div>
      </div>

      <div className="subscription-status__content">
        <div className="subscription-status__plan">
          <span className="subscription-status__plan-label">Current Plan:</span>
          <span className="subscription-status__plan-name">{subscription.plan_name}</span>
        </div>

        {subscription.days_remaining !== null && (
          <div className="subscription-status__trial-info">
            <span className="subscription-status__days-label">Trial Status:</span>
            <span className="subscription-status__days">
              {formatDaysRemaining(subscription.days_remaining)}
            </span>
          </div>
        )}

        {subscription.is_expiring_soon && (
          <div className="subscription-status__warning">
            ⚠️ Your trial is expiring soon!
          </div>
        )}

        {subscription.is_read_only && (
          <div className="subscription-status__readonly">
            🔒 You're in read-only mode. Upgrade to continue creating invoices.
          </div>
        )}
      </div>

      <div className="subscription-status__actions">
        {subscription.upgrade_required ? (
          <button 
            className="subscription-status__upgrade-btn subscription-status__upgrade-btn--primary"
            onClick={onUpgrade}
          >
            Upgrade Now - ₹{subscription.plan_price}/month
          </button>
        ) : (
          <button 
            className="subscription-status__manage-btn"
            onClick={onManage}
          >
            Manage Subscription
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus;
