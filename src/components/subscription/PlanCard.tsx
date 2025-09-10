/**
 * Plan Card Component
 * Reusable card component for displaying subscription plans
 */

import React from 'react';
import { PlanCardProps } from '../../types/subscription';
import './PlanCard.css';

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isSelected = false,
  isPopular = false,
  onSelect,
  disabled = false,
}) => {
  const handleSelect = () => {
    if (!disabled) {
      onSelect(plan.name);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `₹${price}`;
  };

  const getFeatures = (planName: string) => {
    switch (planName) {
      case 'free_trial':
        return [
          'Full access to all features',
          '14 days free trial',
          'No credit card required',
          'AI HSN suggestions',
          'WhatsApp sharing',
          'Mobile + Desktop access'
        ];
      case 'paid':
        return [
          'Everything in Free Trial',
          'Continue after trial',
          'Priority support',
          'Custom templates',
          'Payment reminders',
          'Data export'
        ];
      default:
        return [];
    }
  };

  return (
    <div 
      className={`plan-card ${isSelected ? 'selected' : ''} ${isPopular ? 'popular' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleSelect}
    >
      {isPopular && (
        <div className="plan-card__badge">
          Most Popular
        </div>
      )}
      
      <div className="plan-card__header">
        <h3 className="plan-card__title">{plan.display_name}</h3>
        <div className="plan-card__price">
          <span className="plan-card__amount">{formatPrice(plan.price_monthly)}</span>
          {plan.price_monthly > 0 && (
            <span className="plan-card__period">/month</span>
          )}
          {plan.price_monthly === 0 && (
            <span className="plan-card__period">for {plan.trial_days} days</span>
          )}
        </div>
      </div>

      <div className="plan-card__features">
        <ul className="plan-card__feature-list">
          {getFeatures(plan.name).map((feature, index) => (
            <li key={index} className="plan-card__feature-item">
              <span className="plan-card__feature-icon">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="plan-card__footer">
        <button 
          className={`plan-card__button ${isSelected ? 'selected' : ''}`}
          disabled={disabled}
        >
          {isSelected ? 'Selected' : plan.price_monthly === 0 ? 'Start Free Trial' : 'Choose Plan'}
        </button>
      </div>
    </div>
  );
};

export default PlanCard;
