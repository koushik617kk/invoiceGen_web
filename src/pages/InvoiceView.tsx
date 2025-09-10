import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, API_BASE } from '../api/client'
import { fetchAuthSession } from 'aws-amplify/auth'
import CASchedulingButton from '../components/CASchedulingButton'
// Success styles now imported via main.css

export default function InvoiceView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState<any>(null)
  const [share, setShare] = useState<any>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [payForm, setPayForm] = useState({ amount: '', method: 'CASH', date: '', ref: '', note: '' })
  const [payments, setPayments] = useState<any[]>([])
  const [quickInvoiceSuccess, setQuickInvoiceSuccess] = useState(false)
  
  // Define statusInfo at the top level
  const statusInfo = data ? (() => {
    const statusMap: { [key: string]: { text: string; color: string; bgColor: string; borderColor: string; icon: string } } = {
      PAID: { text: 'Paid', color: 'success', bgColor: '#dcfce7', borderColor: '#22c55e', icon: '✅' },
      UNPAID: { text: 'Unpaid', color: 'warning', bgColor: '#fef3c7', borderColor: '#f59e0b', icon: '⏳' },
      PARTIALLY_PAID: { text: 'Partially Paid', color: 'info', bgColor: '#dbeafe', borderColor: '#3b82f6', icon: '💰' },
      OVERDUE: { text: 'Overdue', color: 'danger', bgColor: '#fee2e2', borderColor: '#ef4444', icon: '🚨' }
    }
    return statusMap[data.status] || { text: 'Unknown', color: 'secondary', bgColor: '#f1f5f9', borderColor: '#64748b', icon: '❓' }
  })() : null
  
  const overdue = data?.due_date && new Date(data.due_date) < new Date() && data.status !== 'PAID'
  const paid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const balance = (data?.total || 0) - paid

  function load() {
    if (!id) return
    api(`/my/invoices/${id}`).then((full) => {
      setData(full)
      setForm({
        buyer_id: full.buyer?.id,
        date: full.date,
        due_date: full.due_date,
        items: full.items.map((it: any) => ({
          description: it.description,
          hsn_code: it.hsn_code,
          quantity: it.quantity,
          rate: it.rate,
          gst_rate: it.gst_rate,
        })),
      })
    }).catch(console.warn)
    api('/customers').then(setCustomers).catch(console.warn)
    api(`/my/invoices/${id}/payments`).then(setPayments).catch(console.warn)
  }

  React.useEffect(() => { 
    load() 
    
    // Check if coming from Quick Invoice
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('quickInvoice') === 'true') {
      setQuickInvoiceSuccess(true)
      // Clear the URL parameter
      window.history.replaceState({}, '', `/invoice/${id}`)
      // Auto-hide success message after 5 seconds
      setTimeout(() => setQuickInvoiceSuccess(false), 5000)
    }
  }, [id])

  async function openPdfInApp() {
    if (!id) return
    
    try {
      // Get auth session for protected PDF access
      const sess = await fetchAuthSession()
      console.log('Auth session:', sess)
      
      const idToken = sess.tokens?.idToken?.toString()
      const accessToken = sess.tokens?.accessToken?.toString()
      const token = idToken || accessToken
      
      console.log('ID Token available:', !!idToken)
      console.log('Access Token available:', !!accessToken)
      console.log('Using token:', token ? `${token.substring(0, 20)}...` : 'none')
      
      if (!token) {
        alert('Please log in to view the PDF')
        return
      }
      
      console.log('Opening PDF with authentication...')
      console.log('PDF URL:', `${API_BASE}/my/invoices/${id}/pdf`)
      
      // Create a blob URL with authentication
      const response = await fetch(`${API_BASE}/my/invoices/${id}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers.get('content-type'))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('PDF fetch failed:', response.status, response.statusText, errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }
      
      const blob = await response.blob()
      console.log('Blob created, size:', blob.size, 'type:', blob.type)
      
      // Check if blob has content
      if (blob.size === 0) {
        throw new Error('PDF file is empty')
      }
      
      const blobUrl = URL.createObjectURL(blob)
      console.log('Blob URL created:', blobUrl)
      
      // Try to open PDF in new tab
      const newWindow = window.open(blobUrl, '_blank')
      
      if (!newWindow) {
        // Popup blocked - try alternative approach
        console.log('Popup blocked, trying alternative...')
        const link = document.createElement('a')
        link.href = blobUrl
        link.target = '_blank'
        link.download = `${data?.invoice_number || 'invoice'}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      // Clean up blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
        console.log('Blob URL cleaned up')
      }, 10000)
      
    } catch (error: any) {
      console.error('Failed to open PDF:', error)
      alert(`Failed to open PDF: ${error.message}`)
    }
  }

  async function doShare() {
    if (!id) return
    setShareLoading(true) // Start loading
    
    try {
      // Use the backend share endpoint to get secure public URLs for customer sharing
      const shareData = await api(`/my/invoices/${id}/share`)
      
      // Set the share data from backend response (uses public URLs with tokens)
      setShare({
        whatsapp_url: shareData.whatsapp_url,
        whatsapp_direct: shareData.whatsapp_direct,
        email_subject: shareData.email_subject,
        email_body: shareData.email_body,
        pdf_url: shareData.pdf_url, // This will be the public URL with secure token
        customer_phone: data?.buyer?.phone,
        customer_name: data?.buyer?.name || 'Customer',
        professional_message: shareData.professional_message
    })
    
    setShareLoading(false) // Stop loading
    
    // Scroll to share section after a brief delay to ensure it's rendered
    setTimeout(() => {
      const shareSection = document.querySelector('.share-section')
      if (shareSection) {
        shareSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        })
      }
    }, 100)
    
    } catch (error: any) {
      console.error('Failed to generate share links:', error)
      setShareLoading(false)
      alert('Failed to generate share links. Please try again.')
    }
  }

  async function sharePdfNative() {
    if (!id || !navigator.share || !('canShare' in navigator)) {
      return doShare()
    }
    try {
      const sess = await fetchAuthSession()
      const token = sess.tokens?.idToken?.toString() || sess.tokens?.accessToken?.toString()
      const res = await fetch(`${API_BASE}/invoices/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const blob = await res.blob()
      const file = new File([blob], `${data?.invoice_number || 'invoice'}.pdf`, { type: 'application/pdf' })
      // @ts-ignore
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Invoice ${data?.invoice_number}` })
        return
      }
      return doShare()
    } catch {
      return doShare()
    }
  }

  async function save() {
    if (!id || !form) return
    
    try {
      // Validate and format dates properly
      const updatedForm = {
        ...form,
        date: form.date ? new Date(form.date).toISOString().split('T')[0] : undefined,
        due_date: form.due_date ? new Date(form.due_date).toISOString().split('T')[0] : undefined
      }
      
      // Validate required fields
      if (!updatedForm.buyer_id) {
        alert('Please select a customer')
        return
      }
      
      if (!updatedForm.items || updatedForm.items.length === 0) {
        alert('Please add at least one item')
        return
      }
      
      // Validate items
      for (let i = 0; i < updatedForm.items.length; i++) {
        const item = updatedForm.items[i]
        if (!item.description?.trim()) {
          alert(`Please enter description for item ${i + 1}`)
          return
        }
        if (!item.quantity || item.quantity <= 0) {
          alert(`Please enter valid quantity for item ${i + 1}`)
          return
        }
        if (!item.rate || item.rate <= 0) {
          alert(`Please enter valid rate for item ${i + 1}`)
          return
        }
      }
      
      await api(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(updatedForm) })
      setEdit(false)
      load()
      alert('Invoice updated successfully! ✅')
    } catch (error: any) {
      console.error('Failed to save invoice:', error)
      alert('Failed to save invoice. Please check your input and try again.')
    }
  }

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

  if (!data) return (
    <div className="invoice-view-container">
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading invoice...</p>
        <div style={{ marginTop: '16px', fontSize: '14px', color: '#94a3b8' }}>
          Please wait while we fetch your invoice details
        </div>
      </div>
    </div>
  )

  if (edit && form) {
    return (
      <div className="invoice-view-container">
        {/* Header Section */}
        <div className="invoice-header-section">
          <div className="header-content">
            <div className="header-left">
              <button className="back-btn" onClick={() => navigate('/invoices')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15,18 9,12 15,6"/>
                </svg>
                Back to Invoices
              </button>
              <h1 className="invoice-title">Invoice #{data.invoice_number}</h1>
              <div className="invoice-meta">
                <span className="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {formatDate(data.date)}
                </span>
                {data.due_date && (
                  <span className="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    Due: {formatDate(data.due_date)}
                  </span>
                )}
                {data.paid_on && (
                  <span className="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                    Paid: {formatDate(data.paid_on)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="header-right">
              {statusInfo && (
                <div className={`status-badge ${statusInfo.color}`} style={{ backgroundColor: statusInfo.bgColor, borderColor: statusInfo.borderColor }}>
                  <span className="status-icon">{statusInfo.icon}</span>
                  <span className="status-text">{statusInfo.text}</span>
                </div>
              )}
              
              {overdue && (
                <div className="overdue-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  Overdue
                </div>
              )}
            </div>
          </div>
          
          <div className="header-actions">
            <button className="action-btn primary" onClick={openPdfInApp}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              Open PDF
            </button>
            

            
            <button className="action-btn secondary" onClick={() => setEdit(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            
            <button className="action-btn secondary" onClick={doShare} disabled={shareLoading}>
              {shareLoading ? (
                <>
                  <svg className="loading-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeDasharray="31.416" strokeDashoffset="31.416">
                      <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                      <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                  Preparing...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  Share
                </>
              )}
            </button>
          </div>
        </div>

        {/* CA Scheduling Button for First Invoice */}
        <CASchedulingButton
          invoiceId={data?.id}
          userInfo={{
            full_name: data?.user?.full_name || data?.business_profile?.business_name || 'User',
            email: data?.user?.email || data?.business_profile?.email || '',
            phone: data?.business_profile?.phone || data?.user?.phone || '',
            business_name: data?.business_profile?.business_name || '',
            business_type: data?.user?.business_type || ''
          }}
        />

        {/* Edit Invoice Section */}
        {edit && (
          <div className="edit-invoice-section">
            <div className="section-header">
              <h3 className="section-title">Edit Invoice #{data?.invoice_number}</h3>
              <button className="close-btn" onClick={() => setEdit(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="edit-form">
              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">Customer</label>
                  <p className="field-description">Select the customer for this invoice</p>
                  <select className="form-input" value={form.buyer_id || ''} onChange={e => setForm({ ...form, buyer_id: Number(e.target.value) })}>
                    <option value="">Select customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="form-section">
                <h4 className="section-subtitle">Invoice Items</h4>
                <p className="section-description">Add or modify the items in this invoice. Each item should have a description, HSN code, GST rate, quantity, and rate.</p>
                
                {form.items.map((it: any, idx: number) => (
                  <div key={idx} className="edit-item-row">
                    <div className="item-field">
                      <label className="item-label">Description</label>
                      <p className="field-hint">What service or product is being provided?</p>
                      <input 
                        className="form-input" 
                        placeholder="e.g., Web Development Services" 
                        value={it.description} 
                        onChange={e => setForm({ ...form, items: form.items.map((x: any, i: number) => i === idx ? { ...x, description: e.target.value } : x) })} 
                      />
                    </div>
                    <div className="item-field">
                      <label className="item-label">HSN Code</label>
                      <p className="field-hint">Harmonized System of Nomenclature code for GST classification</p>
                      <input 
                        className="form-input" 
                        placeholder="e.g., 998314" 
                        value={it.hsn_code || ''} 
                        onChange={e => setForm({ ...form, items: form.items.map((x: any, i: number) => i === idx ? { ...x, hsn_code: e.target.value } : x) })} 
                      />
                    </div>
                    <div className="item-field">
                      <label className="item-label">GST %</label>
                      <p className="field-hint">Goods and Services Tax percentage (5%, 12%, 18%, 28%)</p>
                      <input 
                        className="form-input" 
                        type="number" 
                        placeholder="18" 
                        value={it.gst_rate} 
                        onChange={e => setForm({ ...form, items: form.items.map((x: any, i: number) => i === idx ? { ...x, gst_rate: Number(e.target.value) } : x) })} 
                      />
                    </div>
                    <div className="item-field">
                      <label className="item-label">Quantity</label>
                      <p className="field-hint">Number of units or hours of service</p>
                      <input 
                        className="form-input" 
                        type="number" 
                        placeholder="1" 
                        value={it.quantity} 
                        onChange={e => setForm({ ...form, items: form.items.map((x: any, i: number) => i === idx ? { ...x, quantity: Number(e.target.value) } : x) })} 
                      />
                    </div>
                    <div className="item-field">
                      <label className="item-label">Rate (₹)</label>
                      <p className="field-hint">Price per unit or per hour</p>
                      <input 
                        className="form-input" 
                        type="number" 
                        placeholder="1000.00" 
                        value={it.rate} 
                        onChange={e => setForm({ ...form, items: form.items.map((x: any, i: number) => i === idx ? { ...x, rate: Number(e.target.value) } : x) })} 
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="edit-actions">
                <button className="btn-secondary" onClick={() => setForm({ ...form, items: [...form.items, { description: '', hsn_code: '', gst_rate: 0, quantity: 1, rate: 0 }] })}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Item
                </button>
                <button className="btn-primary" onClick={save}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Customer Information */}
        <div className="customer-section">
          <div className="section-header">
            <h3 className="section-title">Customer Information</h3>
          </div>
          <div className="customer-card">
            <div className="customer-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="customer-details">
              <h4 className="customer-name">{data.buyer?.name || 'Unknown Customer'}</h4>
              {data.buyer?.gstin && <p className="customer-gstin">GSTIN: {data.buyer.gstin}</p>}
              {data.buyer?.phone && <p className="customer-phone">📱 {data.buyer.phone}</p>}
              {data.buyer?.address && <p className="customer-address">{data.buyer.address}</p>}
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="items-section">
          <div className="section-header">
            <h3 className="section-title">Invoice Items</h3>
          </div>
          {data.items && data.items.length > 0 ? (
            <div className="items-table">
              <div className="items-header">
                <span>Description</span>
                <span>HSN/SAC</span>
                <span>Qty</span>
                <span>Rate</span>
                <span>Amount</span>
              </div>
              {data.items.map((it: any, i: number) => (
                <div key={i} className="item-row">
                  <span className="item-description">{it.description || 'No description'}</span>
                  <span className="item-hsn">{it.hsn_code || it.sac_code || '-'}</span>
                  <span className="item-qty">{it.quantity || 0}</span>
                  <span className="item-rate">₹{(it.rate || 0)?.toFixed(2)}</span>
                  <span className="item-amount">₹{((it.amount || 0) + (it.tax_amount || 0))?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-items">
              <p>No items found for this invoice.</p>
              <p className="debug-info">Debug: items array length: {data.items?.length || 'undefined'}</p>
            </div>
          )}
        </div>

        {/* Totals Section */}
        <div className="totals-section">
          <div className="section-header">
            <h3 className="section-title">Invoice Summary</h3>
          </div>
          <div className="totals-card">
            <div className="total-row">
              <span>Subtotal</span>
              <span>₹{data.subtotal?.toFixed(2)}</span>
            </div>
            {data.cgst > 0 && (
              <div className="total-row">
                <span>CGST</span>
                <span>₹{data.cgst?.toFixed(2)}</span>
              </div>
            )}
            {data.sgst > 0 && (
              <div className="total-row">
                <span>SGST</span>
                <span>₹{data.sgst?.toFixed(2)}</span>
              </div>
            )}
            {data.igst > 0 && (
              <div className="total-row">
                <span>IGST</span>
                <span>₹{data.igst?.toFixed(2)}</span>
              </div>
            )}
            <div className="total-row final-total">
              <span>Total Amount</span>
              <span>₹{data.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payments Section */}
        <div className="payments-section">
          <div className="section-header">
            <h3 className="section-title">Payments & Balance</h3>
          </div>
          
          <div className="payments-summary">
            <div className="payment-stat">
              <span className="stat-label">Total Paid</span>
              <span className="stat-value paid">₹{paid.toFixed(2)}</span>
            </div>
            <div className="payment-stat">
              <span className="stat-label">Balance Due</span>
              <span className="stat-value balance">₹{balance.toFixed(2)}</span>
            </div>
          </div>

          <div className="add-payment-form">
            <h4>Record New Payment</h4>
            <div className="payment-form-grid">
              <div className="form-field">
              <label>Amount</label>
                <input className="form-input" inputMode="decimal" placeholder="0.00" value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
            </div>
              <div className="form-field">
              <label>Method</label>
                <select className="form-input" value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
                <option value="CASH">Cash</option>
                <option value="BANK">Bank</option>
                <option value="UPI">UPI</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
              <div className="form-field">
              <label>Date</label>
                <input className="form-input" type="date" value={payForm.date}
                onChange={(e) => setPayForm({ ...payForm, date: e.target.value })} />
            </div>
              <div className="form-field">
              <label>Reference</label>
                <input className="form-input" placeholder="Receipt/UTR/Note" value={payForm.ref}
                onChange={(e) => setPayForm({ ...payForm, ref: e.target.value })} />
            </div>
              <div className="form-field">
                <label>Note</label>
                <input className="form-input" placeholder="Additional notes" value={payForm.note}
                  onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} />
              </div>
              <div className="form-field">
                <button className="btn-primary" onClick={async () => {
              if (!id) return
              const amt = parseFloat(String(payForm.amount).trim())
              if (!Number.isFinite(amt) || amt <= 0) { alert('Enter a valid amount'); return }
              const payload: any = {
                amount: amt,
                method: (payForm.method || 'CASH').toString().toUpperCase(),
              }
              if (payForm.date && String(payForm.date).trim()) payload.date = payForm.date
              if (payForm.ref && String(payForm.ref).trim()) payload.ref = payForm.ref
              if (payForm.note && String(payForm.note).trim()) payload.note = payForm.note
              await api(`/invoices/${id}/payments`, { method: 'POST', body: JSON.stringify(payload) })
              setPayForm({ amount: '', method: payForm.method || 'CASH', date: '', ref: '', note: '' })
              load()
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Record Payment
                </button>
              </div>
            </div>
          </div>

          {payments.length > 0 && (
            <div className="payments-list">
              <h4>Payment History</h4>
          {payments.map((p) => (
                <div key={p.id} className="payment-item">
                  <div className="payment-info">
                    <span className="payment-date">{formatDate(p.date)}</span>
                    <span className="payment-method">{p.method}</span>
                    {p.ref && <span className="payment-ref">{p.ref}</span>}
                  </div>
                  <div className="payment-actions">
                    <span className="payment-amount">₹{Number(p.amount || 0).toFixed(2)}</span>
                    <button className="delete-payment-btn" onClick={async () => { await api(`/payments/${p.id}`, { method: 'DELETE' }); load() }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    </button>
              </div>
            </div>
          ))}
        </div>
          )}
        </div>

        {/* Share Section */}
        {share && (
          <div className="share-section">
            <div className="section-header">
              <h3 className="section-title">Share Invoice</h3>
              {share.customer_phone && (
                <p className="share-subtitle">
                  📱 Customer Phone: {share.customer_phone}
                </p>
              )}
              {share.customer_name && (
                <p className="share-subtitle">
                  👤 Customer: {share.customer_name}
                </p>
              )}
            </div>
            <div className="share-actions">
            {share.whatsapp_direct ? (
                <a className="share-btn whatsapp" href={share.whatsapp_direct} target="_blank" rel="noreferrer">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  WhatsApp to {share.customer_name || 'Customer'}
                </a>
              ) : (
                <div className="no-phone-notice">
                  <p>📱 Customer phone number not available for direct WhatsApp sharing</p>
                  <p>Add phone number to customer profile for direct sharing</p>
                </div>
              )}
              
              <a className="share-btn whatsapp" href={share.whatsapp_url} target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                WhatsApp (Manual)
              </a>
              
              <a className="share-btn secondary" href={`mailto:?subject=${encodeURIComponent(share.email_subject)}&body=${encodeURIComponent(share.email_body)}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Email
              </a>
              
              <a className="share-btn secondary" href={share.pdf_url} target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                PDF Link
              </a>
            </div>
          </div>
        )}

        {/* Help Tip */}
        <div className="help-tip">
          <div className="tip-icon">💡</div>
          <div className="tip-content">
            <strong>Pro Tip:</strong> The WhatsApp message now includes a direct download link to your invoice PDF! Customers can click the link to download the invoice directly. For the best experience, use "WhatsApp to Customer" when the customer has a phone number saved.
          </div>
        </div>

        {/* Debug Section - Remove this in production */}
        {import.meta.env.VITE_ENVIRONMENT === 'development' && (
          <div className="debug-section">
            <details>
              <summary>🔍 Debug Info (Development Only)</summary>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </details>
        </div>
        )}
      </div>
    )
  }

  return (
    <div className="invoice-view-container">
      {/* Quick Invoice Success Banner */}
      {quickInvoiceSuccess && (
        <div className="quick-invoice-success-banner">
          <div className="success-content">
            <div className="success-icon">⚡🎉</div>
            <div className="success-text">
              <h3>Quick Invoice Created Successfully!</h3>
              <p>Your invoice is ready. Share it with your customer below.</p>
            </div>
            <button 
              className="close-success" 
              onClick={() => setQuickInvoiceSuccess(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Header Section */}
      <div className="invoice-header-section">
        <div className="header-content">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate('/invoices')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
              Back to Invoices
            </button>
            <h1 className="invoice-title">Invoice #{data.invoice_number}</h1>
            <div className="invoice-meta">
              <span className="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {formatDate(data.date)}
              </span>
              {data.due_date && (
                <span className="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                  Due: {formatDate(data.due_date)}
                </span>
              )}
              {data.paid_on && (
                <span className="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                  </svg>
                  Paid: {formatDate(data.paid_on)}
                </span>
              )}
            </div>
          </div>
          
          <div className="header-right">
            {statusInfo && (
              <div className={`status-badge ${statusInfo.color}`} style={{ backgroundColor: statusInfo.bgColor, borderColor: statusInfo.borderColor }}>
                <span className="status-icon">{statusInfo.icon}</span>
                <span className="status-text">{statusInfo.text}</span>
              </div>
            )}
            
            {overdue && (
              <div className="overdue-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                Overdue
              </div>
            )}
          </div>
        </div>
        
        <div className="header-actions">
          <button className="action-btn primary" onClick={openPdfInApp}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            Open PDF
          </button>
          
          {/* Test button to verify authentication */}
          <button className="action-btn secondary" onClick={async () => {
            try {
              const sess = await fetchAuthSession()
              const token = sess.tokens?.idToken?.toString() || sess.tokens?.accessToken?.toString()
              console.log('Auth test - Token available:', !!token)
              if (token) {
                console.log('Token preview:', token.substring(0, 30) + '...')
                alert('✅ Authentication working! Check console for token details.')
              } else {
                alert('❌ No authentication token found!')
              }
            } catch (error) {
              console.error('Auth test failed:', error)
              alert('❌ Authentication test failed!')
            }
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            Test Auth
          </button>
          

          
          <button className="action-btn secondary" onClick={() => setEdit(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
          
          <button className="action-btn secondary" onClick={doShare} disabled={shareLoading}>
            {shareLoading ? (
              <>
                <svg className="loading-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="31.416" strokeDashoffset="31.416">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                  </circle>
                </svg>
                Preparing...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share
              </>
            )}
          </button>
        </div>
      </div>

      {/* CA Scheduling Button for First Invoice */}
      <CASchedulingButton
        invoiceId={data?.id}
        userInfo={{
          full_name: data?.user?.full_name || data?.business_profile?.business_name || 'User',
          email: data?.user?.email || data?.business_profile?.email || '',
          phone: data?.business_profile?.phone || data?.user?.phone || '',
          business_name: data?.business_profile?.business_name || '',
          business_type: data?.user?.business_type || ''
        }}
      />

      {/* Customer Information */}
      <div className="customer-section">
        <div className="section-header">
          <h3 className="section-title">Customer Information</h3>
        </div>
        <div className="customer-card">
          <div className="customer-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="customer-details">
            <h4 className="customer-name">{data.buyer?.name || 'Unknown Customer'}</h4>
            {data.buyer?.gstin && <p className="customer-gstin">GSTIN: {data.buyer.gstin}</p>}
            {data.buyer?.phone && <p className="customer-phone">📱 {data.buyer.phone}</p>}
            {data.buyer?.address && <p className="customer-address">{data.buyer.address}</p>}
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="items-section">
        <div className="section-header">
          <h3 className="section-title">Invoice Items</h3>
        </div>
        {data.items && data.items.length > 0 ? (
          <div className="items-table">
            <div className="items-header">
              <span>Description</span>
              <span>HSN/SAC</span>
              <span>Qty</span>
              <span>Rate</span>
              <span>Amount</span>
            </div>
            {data.items.map((it: any, i: number) => (
              <div key={i} className="item-row">
                <span className="item-description">{it.description || 'No description'}</span>
                <span className="item-hsn">{it.hsn_code || it.sac_code || '-'}</span>
                <span className="item-qty">{it.quantity || 0}</span>
                <span className="item-rate">₹{(it.rate || 0)?.toFixed(2)}</span>
                <span className="item-amount">₹{((it.amount || 0) + (it.tax_amount || 0))?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-items">
            <p>No items found for this invoice.</p>
            <p className="debug-info">Debug: items array length: {data.items?.length || 'undefined'}</p>
          </div>
        )}
      </div>

      {/* Totals Section */}
      <div className="totals-section">
        <div className="section-header">
          <h3 className="section-title">Invoice Summary</h3>
        </div>
        <div className="totals-card">
          <div className="total-row">
            <span>Subtotal</span>
            <span>₹{data.subtotal?.toFixed(2)}</span>
          </div>
          {data.cgst > 0 && (
            <div className="total-row">
              <span>CGST</span>
              <span>₹{data.cgst?.toFixed(2)}</span>
            </div>
          )}
          {data.sgst > 0 && (
            <div className="total-row">
              <span>SGST</span>
              <span>₹{data.sgst?.toFixed(2)}</span>
            </div>
          )}
          {data.igst > 0 && (
            <div className="total-row">
              <span>IGST</span>
              <span>₹{data.igst?.toFixed(2)}</span>
            </div>
          )}
          <div className="total-row final-total">
            <span>Total Amount</span>
            <span>₹{data.total?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payments Section */}
      <div className="payments-section">
        <div className="section-header">
          <h3 className="section-title">Payments & Balance</h3>
        </div>
        
        <div className="payments-summary">
          <div className="payment-stat">
            <span className="stat-label">Total Paid</span>
            <span className="stat-value paid">₹{paid.toFixed(2)}</span>
          </div>
          <div className="payment-stat">
            <span className="stat-label">Balance Due</span>
            <span className="stat-value balance">₹{balance.toFixed(2)}</span>
          </div>
        </div>

        <div className="add-payment-form">
          <h4>Record New Payment</h4>
          <div className="payment-form-grid">
            <div className="form-field">
            <label>Amount</label>
              <input className="form-input" inputMode="decimal" placeholder="0.00" value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
          </div>
            <div className="form-field">
            <label>Method</label>
              <select className="form-input" value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
              <option value="CASH">Cash</option>
              <option value="BANK">Bank</option>
              <option value="UPI">UPI</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
            <div className="form-field">
            <label>Date</label>
              <input className="form-input" type="date" value={payForm.date}
              onChange={(e) => setPayForm({ ...payForm, date: e.target.value })} />
          </div>
            <div className="form-field">
            <label>Reference</label>
              <input className="form-input" placeholder="Receipt/UTR/Note" value={payForm.ref}
              onChange={(e) => setPayForm({ ...payForm, ref: e.target.value })} />
          </div>
            <div className="form-field">
              <label>Note</label>
              <input className="form-input" placeholder="Additional notes" value={payForm.note}
                onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} />
            </div>
            <div className="form-field">
              <button className="btn-primary" onClick={async () => {
            if (!id) return
            const amt = parseFloat(String(payForm.amount).trim())
            if (!Number.isFinite(amt) || amt <= 0) { alert('Enter a valid amount'); return }
            const payload: any = {
              amount: amt,
              method: (payForm.method || 'CASH').toString().toUpperCase(),
            }
            if (payForm.date && String(payForm.date).trim()) payload.date = payForm.date
            if (payForm.ref && String(payForm.ref).trim()) payload.ref = payForm.ref
            if (payForm.note && String(payForm.note).trim()) payload.note = payForm.note
            await api(`/invoices/${id}/payments`, { method: 'POST', body: JSON.stringify(payload) })
            setPayForm({ amount: '', method: payForm.method || 'CASH', date: '', ref: '', note: '' })
            load()
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Record Payment
              </button>
            </div>
          </div>
        </div>

        {payments.length > 0 && (
          <div className="payments-list">
            <h4>Payment History</h4>
        {payments.map((p) => (
              <div key={p.id} className="payment-item">
                <div className="payment-info">
                  <span className="payment-date">{formatDate(p.date)}</span>
                  <span className="payment-method">{p.method}</span>
                  {p.ref && <span className="payment-ref">{p.ref}</span>}
                </div>
                <div className="payment-actions">
                  <span className="payment-amount">₹{Number(p.amount || 0).toFixed(2)}</span>
                  <button className="delete-payment-btn" onClick={async () => { await api(`/payments/${p.id}`, { method: 'DELETE' }); load() }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
            </div>
          </div>
        ))}
      </div>
        )}
      </div>

      {/* Share Section */}
      {share && (
        <div className="share-section">
          <div className="section-header">
            <h3 className="section-title">Share Invoice</h3>
            {share.customer_phone && (
              <p className="share-subtitle">
                📱 Customer Phone: {share.customer_phone}
              </p>
            )}
            {share.customer_name && (
              <p className="share-subtitle">
                👤 Customer: {share.customer_name}
              </p>
            )}
          </div>
          <div className="share-actions">
          {share.whatsapp_direct ? (
              <a className="share-btn whatsapp" href={share.whatsapp_direct} target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                WhatsApp to {share.customer_name || 'Customer'}
              </a>
            ) : (
              <div className="no-phone-notice">
                <p>📱 Customer phone number not available for direct WhatsApp sharing</p>
                <p>Add phone number to customer profile for direct sharing</p>
              </div>
            )}
            
            <a className="share-btn whatsapp" href={share.whatsapp_url} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
              WhatsApp (Manual)
            </a>
            
            <a className="share-btn secondary" href={`mailto:?subject=${encodeURIComponent(share.email_subject)}&body=${encodeURIComponent(share.email_body)}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Email
            </a>
            
            <a className="share-btn secondary" href={share.pdf_url} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              PDF Link
            </a>
          </div>
        </div>
      )}

      {/* Help Tip */}
      <div className="help-tip">
        <div className="tip-icon">💡</div>
        <div className="tip-content">
          <strong>Pro Tip:</strong> The WhatsApp message now includes a direct download link to your invoice PDF! Customers can click the link to download the invoice directly. For the best experience, use "WhatsApp to Customer" when the customer has a phone number saved.
        </div>
      </div>

      {/* Debug Section - Remove this in production */}
      {import.meta.env.VITE_ENVIRONMENT === 'development' && (
        <div className="debug-section">
          <details>
            <summary>🔍 Debug Info (Development Only)</summary>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </details>
      </div>
      )}
    </div>
  )
}

