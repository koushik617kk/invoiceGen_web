/**
 * Subscription Context
 * Global state management for subscription functionality
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  SubscriptionStatus, 
  SubscriptionPlan, 
  UseSubscriptionReturn,
  SUBSCRIPTION_STATUS 
} from '../types/subscription';
import { subscriptionApi } from '../services/subscriptionApi';

// Action Types
type SubscriptionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SUBSCRIPTION'; payload: SubscriptionStatus | null }
  | { type: 'SET_PLANS'; payload: SubscriptionPlan[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'REFRESH_SUBSCRIPTION'; payload: SubscriptionStatus };

// State Interface
interface SubscriptionState {
  subscription: SubscriptionStatus | null;
  plans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Initial State
const initialState: SubscriptionState = {
  subscription: null,
  plans: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Reducer
function subscriptionReducer(state: SubscriptionState, action: SubscriptionAction): SubscriptionState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_SUBSCRIPTION':
      return { 
        ...state, 
        subscription: action.payload, 
        lastUpdated: Date.now(),
        error: null,
        isLoading: false  // Add this line to fix loading state
      };
    
    case 'SET_PLANS':
      return { ...state, plans: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'REFRESH_SUBSCRIPTION':
      return { 
        ...state, 
        subscription: action.payload, 
        lastUpdated: Date.now(),
        error: null,
        isLoading: false  // Add this line to fix loading state
      };
    
    default:
      return state;
  }
}

// Context
const SubscriptionContext = createContext<UseSubscriptionReturn | undefined>(undefined);

// Provider Props
interface SubscriptionProviderProps {
  children: ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

// Provider Component
export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({
  children,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [state, dispatch] = useReducer(subscriptionReducer, initialState);

  // Fetch subscription status
  const fetchSubscriptionStatus = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await subscriptionApi.getSubscriptionStatus();
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
      } else if (response.data) {
        dispatch({ type: 'SET_SUBSCRIPTION', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'No data received' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch subscription status' });
    }
  };

  // Fetch subscription plans
  const fetchPlans = async () => {
    try {
      const response = await subscriptionApi.getSubscriptionPlans();
      
      if (response.data) {
        dispatch({ type: 'SET_PLANS', payload: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch subscription plans:', error);
    }
  };

  // Select plan
  const selectPlan = async (planName: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await subscriptionApi.selectPlan({ plan_name: planName });
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        throw new Error(response.error);
      } else if (response.data) {
        dispatch({ type: 'REFRESH_SUBSCRIPTION', payload: response.data });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to select plan' });
      throw error;
    }
  };

  // Upgrade subscription
  const upgradeSubscription = async () => {
    try {
      const response = await subscriptionApi.upgradeSubscription();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data!;
    } catch (error) {
      throw error;
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    try {
      const response = await subscriptionApi.cancelSubscription();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Refresh subscription status after cancellation
      await fetchSubscriptionStatus();
      
      return response.data!;
    } catch (error) {
      throw error;
    }
  };

  // Refresh subscription
  const refreshSubscription = async () => {
    await fetchSubscriptionStatus();
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && state.subscription) {
      const interval = setInterval(() => {
        fetchSubscriptionStatus();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, state.subscription]);

  // Initial load
  useEffect(() => {
    fetchSubscriptionStatus();
    fetchPlans();
  }, []);

  // Context value
  const contextValue: UseSubscriptionReturn = {
    subscription: state.subscription,
    isLoading: state.isLoading,
    error: state.error,
    refreshSubscription,
    selectPlan,
    upgradeSubscription,
    cancelSubscription,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Custom hook
export const useSubscription = (): UseSubscriptionReturn => {
  const context = useContext(SubscriptionContext);
  
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  
  return context;
};

// Utility hooks
export const useSubscriptionStatus = () => {
  const { subscription, isLoading, error } = useSubscription();
  return { subscription, isLoading, error };
};

export const useSubscriptionPlans = () => {
  const { subscription } = useSubscription();
  // This would need to be added to the context if needed
  return [];
};

export const useTrialStatus = () => {
  const { subscription } = useSubscription();
  
  if (!subscription) return null;
  
  return {
    isTrial: subscription.status === SUBSCRIPTION_STATUS.TRIAL,
    isExpired: subscription.status === SUBSCRIPTION_STATUS.EXPIRED,
    isExpiringSoon: subscription.is_expiring_soon,
    daysRemaining: subscription.days_remaining,
    needsUpgrade: subscription.upgrade_required,
  };
};
