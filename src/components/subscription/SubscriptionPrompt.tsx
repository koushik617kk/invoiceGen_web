/**
 * Subscription Prompt Component
 * Displays subscription expiry warnings and upgrade prompts
 */

import React, { useState } from 'react';
import { SubscriptionPromptProps } from '../../types/subscription';
import './SubscriptionPrompt.css';

const SubscriptionPrompt: React.FC<SubscriptionPromptProps> = ({
  subscription,
  onUpgrade,
  onDismiss,
  variant = 'banner',
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleUpgrade = () => {
    onUpgrade();
  };

  if (isDismissed) return null;

  const isExpired = subscription.status === 'expired';
  const isExpiringSoon = subscription.is_expiring_soon;
  const daysRemaining = subscription.days_remaining;

  const getPromptContent = () => {
    if (isExpired) {
      return {
        title: 'Trial Expired',
        message: 'Your free trial has expired. Upgrade to continue creating invoices.',
        buttonText: `Upgrade Now - ₹${subscription.plan_price}/month`,
        type: 'error' as const,
      };
    }

    if (isExpiringSoon && daysRemaining !== null) {
      return {
        title: 'Trial Expiring Soon',
        message: `Your free trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Upgrade now to continue without interruption.`,
        buttonText: `Upgrade Now - ₹${subscription.plan_price}/month`,
        type: 'warning' as const,
      };
    }

    return null;
  };

  const content = getPromptContent();
  if (!content) return null;

  const PromptComponent = variant === 'modal' ? ModalPrompt : BannerPrompt;

  return (
    <PromptComponent
      content={content}
      onUpgrade={handleUpgrade}
      onDismiss={handleDismiss}
      showDismiss={variant !== 'modal'}
    />
  );
};

// Banner Prompt Component
interface PromptComponentProps {
  content: {
    title: string;
    message: string;
    buttonText: string;
    type: 'error' | 'warning';
  };
  onUpgrade: () => void;
  onDismiss: () => void;
  showDismiss: boolean;
}

const BannerPrompt: React.FC<PromptComponentProps> = ({
  content,
  onUpgrade,
  onDismiss,
  showDismiss,
}) => {
  return (
    <div className={`subscription-prompt subscription-prompt--banner subscription-prompt--${content.type}`}>
      <div className="subscription-prompt__content">
        <div className="subscription-prompt__icon">
          {content.type === 'error' ? '🔒' : '⚠️'}
        </div>
        <div className="subscription-prompt__text">
          <h4 className="subscription-prompt__title">{content.title}</h4>
          <p className="subscription-prompt__message">{content.message}</p>
        </div>
      </div>
      <div className="subscription-prompt__actions">
        <button 
          className="subscription-prompt__upgrade-btn"
          onClick={onUpgrade}
        >
          {content.buttonText}
        </button>
        {showDismiss && (
          <button 
            className="subscription-prompt__dismiss-btn"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

// Modal Prompt Component
const ModalPrompt: React.FC<PromptComponentProps> = ({
  content,
  onUpgrade,
  onDismiss,
}) => {
  return (
    <div className="subscription-prompt__overlay">
      <div className="subscription-prompt subscription-prompt--modal subscription-prompt--${content.type}">
        <div className="subscription-prompt__header">
          <h3 className="subscription-prompt__title">{content.title}</h3>
          <button 
            className="subscription-prompt__close-btn"
            onClick={onDismiss}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="subscription-prompt__body">
          <div className="subscription-prompt__icon subscription-prompt__icon--large">
            {content.type === 'error' ? '🔒' : '⚠️'}
          </div>
          <p className="subscription-prompt__message">{content.message}</p>
        </div>
        <div className="subscription-prompt__footer">
          <button 
            className="subscription-prompt__upgrade-btn subscription-prompt__upgrade-btn--primary"
            onClick={onUpgrade}
          >
            {content.buttonText}
          </button>
          <button 
            className="subscription-prompt__cancel-btn"
            onClick={onDismiss}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPrompt;
