import { api } from './client'

export interface CAInfo {
  name: string
  experience: string
  specialization: string
  location: string
  rating: string
  businesses_guided: string
}

export interface TimeSlot {
  date: string
  time: string
  available: boolean
}

export interface AvailableSlotsResponse {
  slots: TimeSlot[]
  timezone: string
  ca_info: CAInfo
}

export interface FirstInvoiceCheck {
  is_first_invoice: boolean
  total_invoices: number
  has_ca_booking: boolean
}

export interface CASchedulingRequest {
  invoice_id?: number
  full_name: string
  phone: string
  email?: string
  business_name?: string
  business_type?: string
  preferred_date?: string
  preferred_time?: string
  user_notes?: string
}

export interface CASchedulingResponse {
  id: number
  status: string
  message: string
  ca_details: {
    name: string
    phone: string
    email: string
  }
}

export interface MyCARequest {
  id: number
  status: string
  preferred_date?: string
  preferred_time?: string
  ca_name: string
  ca_phone: string
  ca_email: string
  created_at: string
  scheduled_at?: string
  user_notes?: string
}

// Check if this is the user's first invoice
export async function checkFirstInvoice(): Promise<FirstInvoiceCheck> {
  const response = await api('/ca-scheduling/check-first-invoice')
  return response
}

// Get available CA consultation slots
export async function getAvailableSlots(): Promise<AvailableSlotsResponse> {
  const response = await api('/ca-scheduling/available-slots')
  return response
}

// Schedule a CA consultation call
export async function scheduleCACall(request: CASchedulingRequest): Promise<CASchedulingResponse> {
  const response = await api('/ca-scheduling/schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
  return response
}

// Get user's CA scheduling requests
export async function getMyCARequests(): Promise<MyCARequest[]> {
  const response = await api('/ca-scheduling/my-requests')
  return response
}

