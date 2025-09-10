/**
 * Subscription Management Page
 * User can view and manage their subscription
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';
import { SubscriptionManagement as SubscriptionManagementType } from '../types/subscription';
import SubscriptionStatus from '../components/subscription/SubscriptionStatus';
import { subscriptionApi } from '../services/subscriptionApi';
import './SubscriptionManagement.css';

const SubscriptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const { 
    subscription, 
    isLoading, 
    error, 
    upgradeSubscription, 
    cancelSubscription,
    refreshSubscription 
  } = useSubscription();

  
  const [managementData, setManagementData] = useState<SubscriptionManagementType | null>(null);
  const [isLoadingManagement, setIsLoadingManagement] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load management data
  React.useEffect(() => {
    const loadManagementData = async () => {
      // Only load if we have a subscription
      if (!subscription) {
        setIsLoadingManagement(false);
        return;
      }

      setIsLoadingManagement(true);
      try {
        const response = await subscriptionApi.getSubscriptionManagement();
        if (response.data) {
          setManagementData(response.data);
        } else if (response.error) {
          console.error('Failed to load management data:', response.error);
        }
      } catch (err) {
        console.error('Failed to load management data:', err);
      } finally {
        setIsLoadingManagement(false);
      }
    };

    loadManagementData();
  }, [subscription]);

  const handleUpgrade = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await upgradeSubscription();
      
      if (response.redirect_url) {
        // Redirect to payment gateway
        window.location.href = response.redirect_url;
      } else {
        // Handle other response types
        console.log('Upgrade response:', response);
      }
    } catch (err) {
      console.error('Failed to upgrade subscription:', err);
      alert('Failed to upgrade subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await cancelSubscription();
      setShowCancelModal(false);
      await refreshSubscription();
      alert('Subscription cancelled successfully.');
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="subscription-management">
        <div className="subscription-management__loading">
          <div className="subscription-management__spinner"></div>
          <p>Loading subscription status...</p>
        </div>
      </div>
    );
  }

  if (isLoadingManagement) {
    return (
      <div className="subscription-management">
        <div className="subscription-management__loading">
          <div className="subscription-management__spinner"></div>
          <p>Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subscription-management">
        <div className="subscription-management__error">
          <h3>Error Loading Subscription</h3>
          <p>{error}</p>
          <button onClick={refreshSubscription}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="subscription-management">
        <div className="subscription-management__error">
          <h3>No Subscription Found</h3>
          <p>Unable to load your subscription details.</p>
          <button onClick={refreshSubscription}>Refresh</button>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-management">
      <div className="subscription-management__container">
        {/* Header */}
        <div className="subscription-management__header">
          <button 
            className="subscription-management__back-btn"
            onClick={handleBackToDashboard}
          >
            ← Back to Dashboard
          </button>
          <h1 className="subscription-management__title">
            Subscription Management
          </h1>
        </div>

        {/* Subscription Status */}
        <div className="subscription-management__status">
          <SubscriptionStatus
            subscription={subscription}
            onUpgrade={handleUpgrade}
            onManage={() => {}} // Already on management page
          />
        </div>

        {/* Management Details */}
        {managementData && (
          <div className="subscription-management__details">
            <h2 className="subscription-management__section-title">
              Subscription Details
            </h2>
            
            <div className="subscription-management__info-grid">
              <div className="subscription-management__info-item">
                <span className="subscription-management__info-label">Plan:</span>
                <span className="subscription-management__info-value">
                  {managementData.subscription.plan_name}
                </span>
              </div>
              
              <div className="subscription-management__info-item">
                <span className="subscription-management__info-label">Status:</span>
                <span className="subscription-management__info-value">
                  {managementData.subscription.status}
                </span>
              </div>
              
              {managementData.subscription.trial_start_date && (
                <div className="subscription-management__info-item">
                  <span className="subscription-management__info-label">Trial Started:</span>
                  <span className="subscription-management__info-value">
                    {new Date(managementData.subscription.trial_start_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {managementData.subscription.trial_end_date && (
                <div className="subscription-management__info-item">
                  <span className="subscription-management__info-label">Trial Ends:</span>
                  <span className="subscription-management__info-value">
                    {new Date(managementData.subscription.trial_end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {managementData.subscription.next_billing_date && (
                <div className="subscription-management__info-item">
                  <span className="subscription-management__info-label">Next Billing:</span>
                  <span className="subscription-management__info-value">
                    {new Date(managementData.subscription.next_billing_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="subscription-management__actions">
          <h2 className="subscription-management__section-title">
            Actions
          </h2>
          
          <div className="subscription-management__action-buttons">
            {managementData?.actions.can_upgrade && (
              <button 
                className="subscription-management__action-btn subscription-management__action-btn--primary"
                onClick={handleUpgrade}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Upgrade to Paid - ₹${managementData.upgrade_options.paid_plan_price}/month`}
              </button>
            )}
            
            {managementData?.actions.can_cancel && (
              <button 
                className="subscription-management__action-btn subscription-management__action-btn--danger"
                onClick={() => setShowCancelModal(true)}
                disabled={isProcessing}
              >
                Cancel Subscription
              </button>
            )}
            
            <button 
              className="subscription-management__action-btn subscription-management__action-btn--secondary"
              onClick={refreshSubscription}
              disabled={isProcessing}
            >
              Refresh Status
            </button>
          </div>
        </div>

        {/* Billing History Placeholder */}
        <div className="subscription-management__billing">
          <h2 className="subscription-management__section-title">
            Billing History
          </h2>
          <div className="subscription-management__placeholder">
            <p>Billing history will be available after your first payment.</p>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="subscription-management__modal-overlay">
          <div className="subscription-management__modal">
            <h3 className="subscription-management__modal-title">
              Cancel Subscription
            </h3>
            <p className="subscription-management__modal-message">
              Are you sure you want to cancel your subscription? 
              You'll lose access to all premium features.
            </p>
            <div className="subscription-management__modal-actions">
              <button 
                className="subscription-management__modal-btn subscription-management__modal-btn--danger"
                onClick={handleCancel}
                disabled={isProcessing}
              >
                {isProcessing ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
              <button 
                className="subscription-management__modal-btn subscription-management__modal-btn--secondary"
                onClick={() => setShowCancelModal(false)}
                disabled={isProcessing}
              >
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
