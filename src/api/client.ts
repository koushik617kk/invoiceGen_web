import { fetchAuthSession } from 'aws-amplify/auth'
import { showToast } from '../ui/ToastHost'

// Smart API URL detection
const getApiUrl = () => {
  // Always check environment variable first (Vite loads the right .env file)
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE
  }
  
  // Fallback for development
  if (import.meta.env.DEV) {
    return 'http://localhost:8000'
  }
  
  // Production fallback
  return 'https://api.invoiceGen.in'
}

export const API_BASE = getApiUrl()

export async function api(path: string, init: RequestInit = {}) {
  const session = await fetchAuthSession()
  const token = session.tokens?.idToken?.toString() || session.tokens?.accessToken?.toString()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json')
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (res.status === 401) {
    showToast('Session expired. Please sign in again.', 'error')
    throw new Error('401 Unauthorized')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    showToast(text || `${res.status} ${res.statusText}`, 'error')
    throw new Error(text || `${res.status} ${res.statusText}`)
  }
  const ct = res.headers.get('content-type') || ''
  return ct.includes('application/json') ? res.json() : res.text()
}
