/**
 * Admin API Client
 * Handles all admin-related API calls
 */

// Smart API URL detection (same as main client)
const getApiUrl = () => {
  // Always check environment variable first (Vite loads the right .env file)
  if ((import.meta as any).env?.VITE_API_BASE) {
    return (import.meta as any).env.VITE_API_BASE
  }
  
  // Fallback for development
  if ((import.meta as any).env?.DEV) {
    return 'http://localhost:8000'
  }
  
  // Production fallback
  return 'https://api.invoiceGen.in'
}

const API_BASE_URL = getApiUrl()

class AdminAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'AdminAPIError'
  }
}

class AdminAPIClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_BASE_URL
    this.token = localStorage.getItem('admin_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AdminAPIError(
          errorData.detail || `HTTP ${response.status}`,
          response.status
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof AdminAPIError) {
        throw error
      }
      throw new AdminAPIError(`Network error: ${error}`)
    }
  }

  // Authentication
  async login(username: string, password: string) {
    const response = await this.request<{
      access_token: string
      token_type: string
      message: string
    }>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })

    this.token = response.access_token
    localStorage.setItem('admin_token', this.token)
    return response
  }

  async logout() {
    try {
      await this.request('/admin/auth/logout', {
        method: 'POST',
      })
    } finally {
      this.token = null
      localStorage.removeItem('admin_token')
    }
  }

  // User Management
  async getUsers(page: number = 1, limit: number = 20, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    
    if (search) {
      params.append('search', search)
    }

    return this.request<{
      users: User[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }>(`/admin/users?${params}`)
  }

  async getUserDetails(userId: number) {
    return this.request<UserDetails>(`/admin/users/${userId}`)
  }

  // Dashboard Statistics
  async getDashboardStats() {
    return this.request<DashboardStats>('/admin/dashboard/stats')
  }

  // CA Requests Management
  async getCARequests(page: number = 1, limit: number = 20, status?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    
    if (status) {
      params.append('status', status)
    }

    return this.request<{
      requests: CARequest[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }>(`/admin/ca-scheduling/requests?${params}`)
  }

  async getCARequestDetails(requestId: number) {
    return this.request<CARequestDetails>(`/admin/ca-scheduling/requests/${requestId}`)
  }

  async updateCARequestStatus(requestId: number, status: string, caNotes?: string) {
    return this.request<{
      id: number
      status: string
      message: string
      updated_at: string
    }>(`/admin/ca-scheduling/requests/${requestId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, ca_notes: caNotes }),
    })
  }

  async contactCARequestUser(requestId: number, method: string, message: string) {
    return this.request<{
      id: number
      message: string
      contact_logged: boolean
    }>(`/admin/ca-scheduling/requests/${requestId}/contact`, {
    method: 'POST',
      body: JSON.stringify({ method, message }),
    })
  }

  // Check if admin is authenticated
  isAuthenticated(): boolean {
    return !!this.token
  }
}

// Types
export interface User {
  id: number
  cognito_sub: string
  full_name: string | null
  email: string | null
  phone: string | null
  business_type: string | null
  onboarding_completed: boolean
  created_at: string | null
  last_login: string | null
  invoice_count: number
  total_revenue: number
  business_profile: {
    business_name: string | null
    gstin: string | null
    state_code: string | null
  } | null
}

export interface UserDetails {
  user: {
    id: number
    cognito_sub: string
    full_name: string | null
    email: string | null
    phone: string | null
    business_type: string | null
    onboarding_completed: boolean
    onboarding_step: string | null
    created_at: string | null
    updated_at: string | null
    last_login: string | null
  }
  business_profile: {
    business_name: string | null
    gstin: string | null
    pan: string | null
    address: string | null
    state_code: string | null
    phone: string | null
    email: string | null
  } | null
  statistics: {
    total_invoices: number
    total_revenue: number
    avg_invoice_value: number
  }
  recent_invoices: Array<{
    id: number
    invoice_number: string
    total: number
    status: string
    created_at: string
  }>
  ca_requests: Array<{
    id: number
    status: string
    preferred_date: string | null
    created_at: string
  }>
}

export interface DashboardStats {
  users: {
    total: number
    active_30_days: number
    new_today: number
  }
  invoices: {
    total: number
    total_revenue: number
    created_today: number
  }
  ca_consultations: {
    total_requests: number
    pending_requests: number
  }
  business_types: Array<{
    type: string
    count: number
  }>
}

export interface CARequest {
  id: number
  user_id: number
  invoice_id: number | null
  full_name: string
  phone: string
  email: string
  business_name: string | null
  business_type: string | null
  preferred_date: string | null
  preferred_time: string | null
  status: string
  user_notes: string | null
  ca_notes: string | null
  created_at: string
  scheduled_at: string | null
  completed_at: string | null
  ca_name: string | null
  ca_phone: string | null
  ca_email: string | null
}

export interface CARequestDetails {
  id: number
  user_id: number
  invoice_id: number | null
  full_name: string
  phone: string
  email: string
  business_name: string | null
  business_type: string | null
  preferred_date: string | null
  preferred_time: string | null
  status: string
  user_notes: string | null
  ca_notes: string | null
  created_at: string
  scheduled_at: string | null
  completed_at: string | null
  ca_name: string | null
  ca_phone: string | null
  ca_email: string | null
  user: {
    id: number
    full_name: string | null
    email: string | null
    phone: string | null
  }
  invoice: {
    id: number
    invoice_number: string
    total: number
    created_at: string
  } | null
}

export { AdminAPIError }
export default new AdminAPIClient()
