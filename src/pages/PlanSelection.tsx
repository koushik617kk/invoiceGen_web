/**
 * Plan Selection Page
 * User selects subscription plan after OTP verification
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';
import { SubscriptionPlan } from '../types/subscription';
import PlanCard from '../components/subscription/PlanCard';
import { subscriptionApi } from '../services/subscriptionApi';
import './PlanSelection.css';

const PlanSelection: React.FC = () => {
  const navigate = useNavigate();
  const { selectPlan, isLoading, error } = useSubscription();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Load plans on component mount
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await subscriptionApi.getSubscriptionPlans();
        if (response.data) {
          setPlans(response.data);
        } else if (response.error) {
          console.error('Failed to load plans:', response.error);
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
      }
    };

    loadPlans();
  }, []);

  const handlePlanSelect = async (planName: string) => {
    if (isSelecting) return;

    setSelectedPlan(planName);
    setIsSelecting(true);

    try {
      await selectPlan(planName);
      
      // Redirect based on plan selection
      if (planName === 'free_trial') {
        // Redirect to onboarding for free trial
        navigate('/onboarding');
      } else if (planName === 'paid') {
        // Redirect to payment gateway (placeholder)
        window.location.href = 'https://payment-gateway-dummy.com/checkout';
      }
    } catch (err) {
      console.error('Failed to select plan:', err);
      setSelectedPlan(null);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleSkip = () => {
    // Allow users to skip and go to onboarding (they'll get free trial automatically)
    navigate('/onboarding');
  };

  return (
    <div className="plan-selection">
      <div className="plan-selection__container">
        {/* Header */}
        <div className="plan-selection__header">
          <h1 className="plan-selection__title">
            Choose Your Plan
          </h1>
          <p className="plan-selection__subtitle">
            Select the plan that works best for your business
          </p>
        </div>

        {/* Plans Grid */}
        <div className="plan-selection__plans">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlan === plan.name}
              isPopular={plan.name === 'paid'}
              onSelect={handlePlanSelect}
              disabled={isSelecting}
            />
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="plan-selection__error">
            <p>Error: {error}</p>
          </div>
        )}

        {/* Loading State */}
        {isSelecting && (
          <div className="plan-selection__loading">
            <div className="plan-selection__spinner"></div>
            <p>Setting up your plan...</p>
          </div>
        )}

        {/* Skip Option */}
        <div className="plan-selection__skip">
          <p className="plan-selection__skip-text">
            Not sure yet? You can start with a free trial and upgrade later.
          </p>
          <button 
            className="plan-selection__skip-btn"
            onClick={handleSkip}
            disabled={isSelecting}
          >
            Skip for now
          </button>
        </div>

        {/* Features Comparison */}
        <div className="plan-selection__features">
          <h3 className="plan-selection__features-title">
            What's included in both plans:
          </h3>
          <div className="plan-selection__features-grid">
            <div className="plan-selection__feature">
              <span className="plan-selection__feature-icon">✓</span>
              <span>Unlimited invoices</span>
            </div>
            <div className="plan-selection__feature">
              <span className="plan-selection__feature-icon">✓</span>
              <span>AI HSN suggestions</span>
            </div>
            <div className="plan-selection__feature">
              <span className="plan-selection__feature-icon">✓</span>
              <span>WhatsApp sharing</span>
            </div>
            <div className="plan-selection__feature">
              <span className="plan-selection__feature-icon">✓</span>
              <span>Mobile + Desktop access</span>
            </div>
            <div className="plan-selection__feature">
              <span className="plan-selection__feature-icon">✓</span>
              <span>GST compliance</span>
            </div>
            <div className="plan-selection__feature">
              <span className="plan-selection__feature-icon">✓</span>
              <span>Customer management</span>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="plan-selection__trust">
          <div className="plan-selection__trust-item">
            <span className="plan-selection__trust-icon">🔒</span>
            <span>Secure & Private</span>
          </div>
          <div className="plan-selection__trust-item">
            <span className="plan-selection__trust-icon">💳</span>
            <span>Cancel anytime</span>
          </div>
          <div className="plan-selection__trust-item">
            <span className="plan-selection__trust-icon">📞</span>
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection;
