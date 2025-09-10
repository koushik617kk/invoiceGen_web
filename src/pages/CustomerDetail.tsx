import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, API_BASE } from '../api/client'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = React.useState<any>(null)
  const [invoices, setInvoices] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [updatingStatus, setUpdatingStatus] = React.useState<Set<number>>(new Set())

  React.useEffect(() => {
    if (!id) return
    Promise.all([
      api(`/customers/${id}`),
      api(`/invoices?customer_id=${id}`)
    ]).then(([cust, invs]) => {
      setCustomer(cust)
      setInvoices(invs)
      setLoading(false)
    }).catch(console.warn)
  }, [id])

  // Format date for display
  function formatDate(dateString: string) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  // Get status color and icon
  function getStatusInfo(status: string) {
    switch (status) {
      case 'PAID':
        return { color: 'success', icon: '✅', text: 'PAID', bgColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' }
      case 'PARTIALLY_PAID':
        return { color: 'warning', icon: '⚠️', text: 'PARTIAL', bgColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }
      default:
        return { color: 'unpaid', icon: '🕒', text: 'UNPAID', bgColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }
    }
  }

  // Toggle invoice status
  async function toggleInvoiceStatus(invoiceId: number, currentStatus: string) {
    if (updatingStatus.has(invoiceId)) return // Prevent double-clicking
    
    setUpdatingStatus(prev => new Set(prev).add(invoiceId))
    
    try {
      const newStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID'
      await api(`/invoices/${invoiceId}/${newStatus === 'PAID' ? 'mark-paid' : 'mark-unpaid'}`, { method: 'POST' })
      
      // Update local state
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, status: newStatus }
          : inv
      ))
    } catch (error) {
      console.error('Failed to update invoice status:', error)
      alert('Failed to update invoice status. Please try again.')
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev)
        newSet.delete(invoiceId)
        return newSet
      })
    }
  }

  if (loading) return (
    <div className="customer-detail-container">
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading customer details...</p>
      </div>
    </div>
  )

  if (!customer) return (
    <div className="customer-detail-container">
      <div className="error-state">
        <div className="error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h3>Customer not found</h3>
        <p>The customer you're looking for doesn't exist or has been removed.</p>
        <button className="btn-primary" onClick={() => navigate('/customers')}>
          Back to Customers
        </button>
      </div>
    </div>
  )

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
  const totalPaid = invoices.reduce((sum, inv) => {
    if (inv.status === 'PAID') return sum + (inv.total || 0)
    if (inv.status === 'PARTIALLY_PAID') {
      // Calculate paid amount from payments
      const paidAmount = inv.payments?.reduce((pSum: number, p: any) => pSum + (p.amount || 0), 0) || 0
      return sum + paidAmount
    }
    return sum
  }, 0)
  const outstanding = totalInvoiced - totalPaid

  return (
    <div className="customer-detail-container">
      {/* Header Section */}
      <div className="customer-header-section">
        <div className="header-content">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate('/customers')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
              Back to Customers
            </button>
            <h1 className="customer-title">{customer.name}</h1>
            <div className="customer-meta">
              {customer.gstin && (
                <span className="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
                    <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z"/>
                    <path d="M12 3c0 1-1 2-2 2s-2 1-2 2 1 2 2 2 2 1 2 2"/>
                    <path d="M12 21c0-1 1-2 2-2s2-1 2-2-1-2-2-2-2-1-2-2"/>
                  </svg>
                  GSTIN: {customer.gstin}
                </span>
              )}
              {customer.phone && (
                <span className="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {customer.phone}
                </span>
              )}
              {customer.email && (
                <span className="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  {customer.email}
                </span>
        )}
        {customer.state_code && (
                <span className="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  State: {customer.state_code}
                </span>
              )}
            </div>
      </div>

          <div className="header-right">
            <div className="customer-avatar-large">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
        </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button className="action-btn secondary" onClick={() => navigate('/create-invoice')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Invoice
          </button>
          
          <button className="action-btn secondary" onClick={async () => {
            try {
              const response = await fetch(`${API_BASE}/customers/${id}/invoices/export`, {
                  headers: {
                    'Authorization': `Bearer ${(await import('aws-amplify/auth').then(m => m.fetchAuthSession())).tokens?.idToken?.toString() || ''}`
                  }
                })
                
                if (response.ok) {
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `invoices_${customer.name}_${new Date().toISOString().split('T')[0]}.csv`
                  document.body.appendChild(a)
                  a.click()
                  window.URL.revokeObjectURL(url)
                  document.body.removeChild(a)
                }
              } catch (error) {
                console.error('Export failed:', error)
                alert('Export failed. Please try again.')
              }
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export Invoices
          </button>
        </div>
      </div>

      {/* Address Section */}
      {customer.address && (
        <div className="address-section">
          <div className="section-header">
            <h3 className="section-title">
              <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Address
            </h3>
          </div>
          <div className="address-card">
            <p className="address-text">{customer.address}</p>
          </div>
        </div>
      )}

      {/* Financial Summary Section */}
      <div className="summary-section">
        <div className="section-header">
          <h3 className="section-title">
            <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            Financial Summary
          </h3>
        </div>
        
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon total">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div className="summary-content">
              <span className="summary-label">Total Invoiced</span>
              <span className="summary-value">₹{totalInvoiced.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon paid">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
              </svg>
            </div>
            <div className="summary-content">
              <span className="summary-label">Total Paid</span>
              <span className="summary-value">₹{totalPaid.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-icon outstanding">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
            </div>
            <div className="summary-content">
              <span className="summary-label">Outstanding</span>
              <span className="summary-value">₹{outstanding.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Section */}
      <div className="invoices-section">
        <div className="section-header">
          <h3 className="section-title">
            <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            Invoices ({invoices.length})
          </h3>
        </div>
        
        {invoices.length === 0 ? (
          <div className="empty-invoices">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <h4>No invoices found</h4>
            <p>This customer doesn't have any invoices yet.</p>
            <button className="btn-primary" onClick={() => navigate('/create-invoice')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create First Invoice
            </button>
          </div>
        ) : (
          <div className="invoices-grid">
            {invoices.map((inv) => {
              const statusInfo = getStatusInfo(inv.status)
              const isUpdating = updatingStatus.has(inv.id)
              
              return (
                <div key={inv.id} className="invoice-card">
                  <div className="invoice-header">
                    <div className="invoice-number">#{inv.invoice_number}</div>
                    <div className={`invoice-status ${statusInfo.color}`} style={{ backgroundColor: statusInfo.bgColor, borderColor: statusInfo.borderColor }}>
                      <span className="status-icon">{statusInfo.icon}</span>
                      <span className="status-text">{statusInfo.text}</span>
                    </div>
                  </div>
                  
                  <div className="invoice-content">
                    <div className="invoice-date">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {formatDate(inv.date)}
                    </div>
                    
                    <div className="invoice-items">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4"/>
                        <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
                        <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z"/>
                        <path d="M12 3c0 1-1 2-2 2s-2 1-2 2 1 2 2 2 2 1 2 2"/>
                        <path d="M12 21c0-1 1-2 2-2s2-1 2-2-1-2-2-2-2-1-2-2"/>
                      </svg>
                      {inv.items?.length || 0} items
                    </div>
                    
                    <div className="invoice-amount">₹{inv.total?.toFixed(2)}</div>
              </div>
                  
                  <div className="invoice-actions">
                <button 
                      className="view-invoice-btn" 
                  onClick={() => navigate(`/invoice/${inv.id}`)}
                >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      View Invoice
                    </button>
                    
                    <button 
                      className={`status-toggle-btn ${inv.status === 'PAID' ? 'paid' : 'unpaid'}`}
                      onClick={() => toggleInvoiceStatus(inv.id, inv.status)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <div className="loading-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      ) : (
                        <>
                          {inv.status === 'PAID' ? (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                              Mark Unpaid
                            </>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22,4 12,14.01 9,11.01"/>
                              </svg>
                              Mark Paid
                            </>
                          )}
                        </>
                      )}
                </button>
              </div>
            </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
