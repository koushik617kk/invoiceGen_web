/**
 * Subscription System Types
 * Centralized type definitions for subscription functionality
 */

export interface SubscriptionPlan {
  id: number;
  name: string;
  display_name: string;
  price_monthly: number;
  trial_days: number;
  currency: string;
}

export interface UserSubscription {
  plan_name: string | null;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trial_start_date: string | null;
  trial_end_date: string | null;
  next_billing_date: string | null;
  days_remaining: number | null;
  is_expiring_soon: boolean;
  is_read_only: boolean;
  upgrade_required: boolean;
  plan_price: number;
}

export interface SubscriptionStatus {
  has_subscription: boolean;
  plan_name: string | null;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trial_start_date: string | null;
  trial_end_date: string | null;
  next_billing_date: string | null;
  days_remaining: number | null;
  is_expiring_soon: boolean;
  is_read_only: boolean;
  upgrade_required: boolean;
  plan_price: number;
}

export interface SubscriptionManagement {
  subscription: UserSubscription;
  upgrade_options: {
    paid_plan_price: number;
    currency: string;
  };
  actions: {
    can_upgrade: boolean;
    can_cancel: boolean;
    upgrade_required: boolean;
  };
}

export interface PlanSelectionData {
  plan_name: string;
}

export interface UpgradeResponse {
  message: string;
  redirect_url?: string;
  plan: string;
  amount: number;
  currency: string;
  payment_required: boolean;
}

export interface SubscriptionError {
  error: string;
  message: string;
  upgrade_required: boolean;
  read_only_mode?: boolean;
  plan_price: number;
  days_remaining?: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Component Props Types
export interface PlanCardProps {
  plan: SubscriptionPlan;
  isSelected?: boolean;
  isPopular?: boolean;
  onSelect: (planName: string) => void;
  disabled?: boolean;
}

export interface SubscriptionStatusProps {
  subscription: SubscriptionStatus;
  onUpgrade?: () => void;
  onManage?: () => void;
  compact?: boolean;
}

export interface SubscriptionPromptProps {
  subscription: SubscriptionStatus;
  onUpgrade: () => void;
  onDismiss?: () => void;
  variant?: 'banner' | 'modal' | 'inline';
}

// Hook Return Types
export interface UseSubscriptionReturn {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  selectPlan: (planName: string) => Promise<void>;
  upgradeSubscription: () => Promise<UpgradeResponse>;
  cancelSubscription: () => Promise<void>;
}

// Constants
export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE_TRIAL: 'free_trial',
  PAID: 'paid',
} as const;

export const TRIAL_WARNING_DAYS = 3;
export const TRIAL_DURATION_DAYS = 14;
