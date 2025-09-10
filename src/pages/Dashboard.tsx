import React from 'react'
import { api, API_BASE } from '../api/client'
import { Link, useNavigate } from 'react-router-dom'
import SuccessToast from '../components/SuccessToast'
// Dashboard styles now imported via main.css

export default function Dashboard() {
  const navigate = useNavigate()
  const [me, setMe] = React.useState<any>(null)
  const [list, setList] = React.useState<any[]>([])
  const [summary, setSummary] = React.useState<any | null>(null)
  const [successToast, setSuccessToast] = React.useState({ visible: false, message: '' })
  React.useEffect(() => {
    api('/auth/me').then(setMe).catch(console.warn)
    api('/invoices').then(setList).catch(console.warn)
    // Prefer /invoices/summary, fallback to /summary for older routers
    api('/invoices/summary').then(setSummary).catch(() => api('/summary').then(setSummary).catch(console.warn))
  }, [])

  async function openPdfForInvoice(invoiceId: number) {
    try {
      const sess = await (await import('aws-amplify/auth')).fetchAuthSession()
      const token = sess.tokens?.idToken?.toString() || sess.tokens?.accessToken?.toString()
      
      if (!token) {
        alert('Please log in to view the PDF')
        return
      }

      const response = await fetch(`${API_BASE}/my/invoices/${invoiceId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      if (blob.size === 0) {
        throw new Error('PDF file is empty')
      }

      const blobUrl = URL.createObjectURL(blob)
      const newWindow = window.open(blobUrl, '_blank')
      
      if (!newWindow) {
        // Fallback for popup blockers
        const link = document.createElement('a')
        link.href = blobUrl
        link.target = '_blank'
        link.download = `invoice-${invoiceId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      // Clean up blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, 10000)

    } catch (error: any) {
      console.error('Failed to open PDF:', error)
      alert(`Failed to open PDF: ${error?.message || 'Unknown error'}`)
    }
  }
  
  return (
    <div className="dashboard-container">
      {/* Quick Invoice Section - MOVED TO TOP */}
      <div className="quick-invoice-section">
        <div className="quick-invoice-content">
          <div className="quick-invoice-text">
            <h2 className="quick-invoice-title">⚡ Create Invoice in 30 Seconds</h2>
            <p className="quick-invoice-subtitle">Use your service templates to generate invoices instantly</p>
          </div>
          <button 
            className="quick-invoice-btn"
            onClick={() => navigate('/app/quick-invoice')}
          >
            <span className="btn-icon">✨</span>
            <span className="btn-text">Quick Invoice</span>
          </button>
        </div>
        <div className="quick-invoice-note">
          <span className="note-icon">💡</span>
          <span className="note-text">Need more control? Use "Create Invoice" from the navigation menu above</span>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <div className="welcome-text">
            <h1 className="welcome-title">
              Welcome{me?.full_name ? `, ${me.full_name}` : ''} 👋
            </h1>
            <p className="welcome-subtitle">Quick snapshot of your business performance</p>
          </div>
          <div className="welcome-stats">
            <div className="stat-item">
              <div className="stat-label">Total Invoices</div>
              <div className="stat-value">{list.length}</div>
            </div>
          </div>
        </div>
        

      </div>

      {/* Metrics Grid */}
      {summary && (
        <div className="metrics-section">
          <div className="metrics-grid">
            <div className="metric-card outstanding">
              <div className="metric-icon">⚠️</div>
              <div className="metric-content">
                <div className="metric-title">Outstanding Amount</div>
                <div className="metric-value">₹{summary.outstanding_total.toFixed(2)}</div>
                <div className="metric-subtitle">Pending payments</div>
              </div>
            </div>
            
            <div className="metric-card overdue">
              <div className="metric-icon">⏰</div>
              <div className="metric-content">
                <div className="metric-title">Overdue Invoices</div>
                <div className="metric-value">{summary.overdue_count}</div>
                <div className="metric-subtitle">Need attention</div>
              </div>
            </div>
            
            <div className="metric-card revenue">
              <div className="metric-icon">💰</div>
              <div className="metric-content">
                <div className="metric-title">This Month Revenue</div>
                <div className="metric-value">₹{summary.this_month_revenue.toFixed(2)}</div>
                <div className="metric-subtitle">Growing strong</div>
              </div>
            </div>
            
            <div className="metric-card invoices">
              <div className="metric-icon">📄</div>
              <div className="metric-content">
                <div className="metric-title">Invoices This Month</div>
                <div className="metric-value">{summary.invoices_this_month}</div>
                <div className="metric-subtitle">Active month</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      <div className="recent-invoices-section">
        <div className="section-header">
          <h2 className="section-title">Recent Invoices</h2>
          <Link to="/app/invoices" className="view-all-btn">View All Invoices</Link>
        </div>
        
        <div className="invoices-list">
          {list.slice(0, 8).map((inv) => {
            const firstItem = inv.items && inv.items.length ? inv.items[0].description : ''
            const extraCount = inv.items && inv.items.length > 1 ? ` + ${inv.items.length - 1} more` : ''
            const itemSummary = firstItem ? `${firstItem}${extraCount}` : ''
            return (
              <div key={inv.id} className="invoice-item">
                <div className="invoice-details-left">
                  <div className="invoice-customer">{inv.buyer?.name || 'Unknown Customer'}</div>
                  <div className="invoice-date">{inv.date}</div>
                  <div className="invoice-number">#{inv.invoice_number}</div>
                  {firstItem && <div className="invoice-item-tag">{firstItem}</div>}
                </div>
                <div className="invoice-details-right">
                  <div className="invoice-amount">₹{Number(inv.total || 0).toFixed(2)}</div>
                  <div className="invoice-actions-links">
                    <Link to={`/invoice/${inv.id}`} className="action-link">View</Link>
                    <a onClick={() => openPdfForInvoice(inv.id)} className="action-link">PDF</a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Analytics Section */}
      {summary && (
        <div className="analytics-section">
          <div className="analytics-grid">
            <div className="analytics-card customers-card">
              <div className="card-header">
                <h3 className="card-title">🏆 Top Customers (Last 90 Days)</h3>
                <div className="card-subtitle">Your most valuable clients</div>
              </div>
              <div className="customers-list">
                {summary.top_customers.map((c: any, index: number) => (
                  <div key={c.name} className="customer-item">
                    <div className="customer-rank">#{index + 1}</div>
                    <div className="customer-name">{c.name}</div>
                    <div className="customer-total">₹{Number(c.total || 0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="analytics-card overdue-card">
              <div className="card-header">
                <h3 className="card-title">🚨 Overdue Invoices</h3>
                <div className="card-subtitle">Requires immediate attention</div>
              </div>
              <div className="overdue-list">
                {summary.overdue_list.map((o: any) => (
                  <div key={o.id} className="overdue-item">
                    <div className="overdue-info">
                      <div className="overdue-number">#{o.invoice_number}</div>
                      <div className="overdue-customer">{o.customer}</div>
                      {o.due_date && <div className="overdue-date">Due: {o.due_date}</div>}
                    </div>
                    <div className="overdue-details">
                      <span className="overdue-days">{o.days_overdue}d overdue</span>
                      <div className="overdue-amount">₹{Number(o.total || 0).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Success Toast */}
      <SuccessToast
        message={successToast.message}
        isVisible={successToast.visible}
        onHide={() => setSuccessToast({ visible: false, message: '' })}
      />
    </div>
  )
}
