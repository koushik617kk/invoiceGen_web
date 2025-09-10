/**
 * Subscription API Service
 * Centralized API calls for subscription functionality
 */

import { 
  SubscriptionPlan, 
  SubscriptionStatus, 
  SubscriptionManagement, 
  PlanSelectionData, 
  UpgradeResponse,
  ApiResponse 
} from '../types/subscription';
import { API_BASE, api } from '../api/client';

class SubscriptionApiService {
  constructor() {
    // No need for baseUrl since we're using the api() function
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const data = await api(endpoint, options);
      return { data };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get user's subscription status
   */
  async getSubscriptionStatus(): Promise<ApiResponse<SubscriptionStatus>> {
    return this.request<SubscriptionStatus>('/subscription/status');
  }

  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    return this.request<SubscriptionPlan[]>('/subscription/plans');
  }

  /**
   * Select a subscription plan
   */
  async selectPlan(planData: PlanSelectionData): Promise<ApiResponse<SubscriptionStatus>> {
    return this.request<SubscriptionStatus>('/subscription/select-plan', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  /**
   * Get subscription management details
   */
  async getSubscriptionManagement(): Promise<ApiResponse<SubscriptionManagement>> {
    return this.request<SubscriptionManagement>('/subscription/manage');
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(): Promise<ApiResponse<UpgradeResponse>> {
    return this.request<UpgradeResponse>('/subscription/upgrade', {
      method: 'POST',
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/subscription/cancel', {
      method: 'POST',
    });
  }
}

// Export singleton instance
export const subscriptionApi = new SubscriptionApiService();
export default subscriptionApi;
