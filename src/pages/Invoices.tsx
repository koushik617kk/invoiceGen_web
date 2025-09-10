import React from 'react'
import { api, API_BASE } from '../api/client'
import { Link } from 'react-router-dom'
import ExportModal from '../components/ExportModal'

export default function Invoices() {
  const [q, setQ] = React.useState('')
  const [status, setStatus] = React.useState('')
  const [customerId, setCustomerId] = React.useState('')
  const [sortBy, setSortBy] = React.useState('date')
  const [sortDir, setSortDir] = React.useState('desc')
  const [list, setList] = React.useState<any[]>([])
  const [customers, setCustomers] = React.useState<any[]>([])
  const [selectedInvoices, setSelectedInvoices] = React.useState<Set<number>>(new Set())
  const [bulkLoading, setBulkLoading] = React.useState(false)
  const [showExportModal, setShowExportModal] = React.useState(false)

  async function load() {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    if (customerId) params.set('customer_id', customerId)
    if (sortBy) params.set('sort_by', sortBy)
    if (sortDir) params.set('sort_dir', sortDir)
    const data = await api(`/invoices?${params.toString()}`)
    setList(data)
    // Clear selection when filters change
    setSelectedInvoices(new Set())
  }
  React.useEffect(() => { load() }, [q, status, customerId, sortBy, sortDir])
  React.useEffect(() => { api('/customers').then(setCustomers) }, [])

  function toggleSelection(id: number) {
    const newSelected = new Set(selectedInvoices)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedInvoices(newSelected)
  }

  function selectAll() {
    if (selectedInvoices.size === list.length) {
      setSelectedInvoices(new Set())
    } else {
      setSelectedInvoices(new Set(list.map(inv => inv.id)))
    }
  }

  async function downloadBulkPDFs() {
    if (selectedInvoices.size === 0) {
      alert('Please select invoices to download')
      return
    }

    setBulkLoading(true)
    try {
      // Generate PDFs for selected invoices
      const pdfFiles: File[] = []
      
      for (const invoiceId of selectedInvoices) {
        const response = await fetch(`${API_BASE}/my/invoices/${invoiceId}/pdf`, {
          headers: {
            'Authorization': `Bearer ${(await import('aws-amplify/auth').then(m => m.fetchAuthSession())).tokens?.idToken?.toString() || ''}`
          }
        })
        
        if (response.ok) {
          const blob = await response.blob()
          const invoice = list.find(inv => inv.id === invoiceId)
          const filename = `${invoice?.invoice_number || 'invoice'}.pdf`
          const file = new File([blob], filename, { type: 'application/pdf' })
          pdfFiles.push(file)
        }
      }

      if (pdfFiles.length === 0) {
        alert('Failed to generate PDFs')
        return
      }

      // Create a ZIP file with all PDFs
      const JSZip = await import('jszip')
      const zip = new JSZip.default()
      
      pdfFiles.forEach(file => {
        zip.file(file.name, file)
      })
      
      // Generate ZIP and download
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const zipFile = new File([zipBlob], `invoices_${new Date().toISOString().split('T')[0]}.zip`, { type: 'application/zip' })
      
      // Download the ZIP file
      const url = window.URL.createObjectURL(zipFile)
      const a = document.createElement('a')
      a.href = url
      a.download = zipFile.name
      a.style.display = 'none'
      a.setAttribute('download', zipFile.name)
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
      
      alert(`Downloaded ${pdfFiles.length} invoices as ZIP file! Check your Downloads folder.`)
      
    } catch (error) {
      console.error('Bulk download failed:', error)
      alert('Failed to download invoices. Please try again.')
    } finally {
      setBulkLoading(false)
    }
  }

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

  function openExportModal() {
    setShowExportModal(true)
  }

  async function mark(id: number, paid: boolean) {
    await api(`/invoices/${id}/${paid ? 'mark-paid' : 'mark-unpaid'}`, { method: 'POST' })
    load()
  }
  
  async function duplicate(id: number) {
    await api(`/invoices/${id}/duplicate`, { method: 'POST' })
    load()
  }
  
  async function remove(id: number) {
    if (!confirm('Delete this invoice?')) return
    await api(`/invoices/${id}`, { method: 'DELETE' })
    load()
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
        return { color: 'success', icon: '✅', text: 'PAID' }
      case 'PARTIALLY_PAID':
        return { color: 'warning', icon: '⚠️', text: 'PARTIAL' }
      default:
        return { color: 'unpaid', icon: '🕒', text: 'UNPAID' }
    }
  }

  return (
    <div className="invoices-container">
      {/* Header Section */}
      <div className="invoices-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">📄 Invoices</h1>
            <p className="page-subtitle">Manage and track all your invoices</p>
          </div>
          <div className="header-actions">
            <button className="export-btn" onClick={openExportModal}>
              <span className="btn-icon">📊</span>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Compact Filter Bar */}
      <div className="compact-filter-bar">
        <div className="filter-row">
          <div className="search-section">
            <input 
              className="compact-search-input" 
              placeholder="🔍 Search invoices..." 
              value={q} 
              onChange={e => setQ(e.target.value)} 
            />
          </div>
          
          <div className="filter-controls">
            <button 
              className={`filter-btn ${status ? 'active' : ''}`}
              onClick={() => setStatus('')}
            >
              📊 Filters
              {status && <span className="filter-indicator">•</span>}
            </button>
            
            <button 
              className={`filter-btn ${sortBy !== 'date' || sortDir !== 'desc' ? 'active' : ''}`}
              onClick={() => {
                setSortBy('date')
                setSortDir('desc')
              }}
            >
              📅 Sort
              {(sortBy !== 'date' || sortDir !== 'desc') && <span className="filter-indicator">•</span>}
            </button>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {(status || customerId || q) && (
          <div className="active-filters">
            <span className="filters-label">Active filters:</span>
            {q && (
              <span className="filter-chip">
                Search: "{q}" <button onClick={() => setQ('')} className="remove-filter">✕</button>
              </span>
            )}
            {status && (
              <span className="filter-chip">
                Status: {status === 'UNPAID' ? 'Unpaid' : status === 'PAID' ? 'Paid' : 'Partially Paid'} 
                <button onClick={() => setStatus('')} className="remove-filter">✕</button>
              </span>
            )}
            {customerId && (
              <span className="filter-chip">
                Customer: {customers.find(c => c.id === Number(customerId))?.name || 'Unknown'} 
                <button onClick={() => setCustomerId('')} className="remove-filter">✕</button>
              </span>
            )}
            <button className="clear-all-filters" onClick={() => {
              setQ('')
              setStatus('')
              setCustomerId('')
              setSortBy('date')
              setSortDir('desc')
            }}>
              Clear all
            </button>
          </div>
        )}
        
        {/* Filter Dropdowns (Hidden by default, shown on filter button click) */}
        <div className="filter-dropdowns">
          <div className="filter-dropdown">
            <label>Status:</label>
            <select 
              className="compact-select" 
              value={status} 
              onChange={e => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
            </select>
          </div>
          
          <div className="filter-dropdown">
            <label>Customer:</label>
            <select 
              className="compact-select" 
              value={customerId} 
              onChange={e => setCustomerId(e.target.value)}
            >
              <option value="">All customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="filter-dropdown">
            <label>Sort by:</label>
            <select 
              className="compact-select" 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="date">Date</option>
              <option value="number">Number</option>
              <option value="total">Total</option>
            </select>
          </div>
          
          <div className="filter-dropdown">
            <label>Order:</label>
            <select 
              className="compact-select" 
              value={sortDir} 
              onChange={e => setSortDir(e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Bulk Selection UI */}
      {list.length > 0 && (
        <div className="bulk-actions-section">
          <div className="bulk-header">
            <div className="bulk-left">
              <label className="select-all-checkbox">
                <input 
                  type="checkbox" 
                  checked={selectedInvoices.size === list.length}
                  onChange={selectAll}
                />
                <span className="select-all-text">
                  {selectedInvoices.size === 0 
                    ? 'Select invoices for bulk actions' 
                    : `${selectedInvoices.size} invoice${selectedInvoices.size === 1 ? '' : 's'} selected`
                  }
                </span>
              </label>
            </div>
            
            {selectedInvoices.size > 0 && (
              <div className="bulk-actions">
                <button 
                  className="bulk-download-btn" 
                  onClick={downloadBulkPDFs}
                  disabled={bulkLoading}
                >
                  <span className="btn-icon">
                    {bulkLoading ? '⏳' : '📥'}
                  </span>
                  {bulkLoading 
                    ? 'Generating PDFs...' 
                    : selectedInvoices.size === 1 
                      ? 'Download PDF' 
                      : `Download ${selectedInvoices.size} PDFs`
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Invoices Grid - Card Layout */}
      <div className="invoices-grid-section">
        {list.length > 0 ? (
          <div className="invoices-grid">
            {list.map((inv, index) => {
                const firstItem = inv.items && inv.items.length ? inv.items[0].description : ''
                const extraCount = inv.items && inv.items.length > 1 ? ` + ${inv.items.length - 1} more` : ''
                const itemSummary = firstItem ? `${firstItem}${extraCount}` : ''
              const statusInfo = getStatusInfo(inv.status)
              
                return (
                <div key={inv.id} className={`invoice-card ${index % 2 === 0 ? 'even' : 'odd'}`}>
                  {/* Invoice Header */}
                  <div className="invoice-card-header">
                    <div className="invoice-card-checkbox">
                      <input 
                        type="checkbox" 
                        checked={selectedInvoices.has(inv.id)}
                        onChange={() => toggleSelection(inv.id)}
                      />
                    </div>
                    <div className="invoice-card-number">#{inv.invoice_number}</div>
                    <div className={`invoice-card-status ${statusInfo.color}`}>
                      <span className="status-icon">{statusInfo.icon}</span>
                      <span className="status-text">{statusInfo.text}</span>
                    </div>
                  </div>
                  
                  {/* Invoice Content */}
                  <div className="invoice-card-content">
                    <div className="invoice-card-customer">
                        <div className="customer-avatar">👤</div>
                      <div className="customer-name">{inv.buyer?.name || 'Unknown Customer'}</div>
                    </div>
                    
                    <div className="invoice-card-details">
                      <div className="detail-row">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">{formatDate(inv.date)}</span>
                      </div>
                      
                      {inv.due_date && (
                        <div className="detail-row">
                          <span className="detail-label">Due Date:</span>
                          <span className="detail-value">{formatDate(inv.due_date)}</span>
                        </div>
                      )}
                      
                      <div className="detail-row">
                        <span className="detail-label">Items:</span>
                        <span className="detail-value">{itemSummary || 'No items'}</span>
                      </div>
                      
                      <div className="detail-row total-row">
                        <span className="detail-label">Total:</span>
                        <span className="detail-value total-amount">₹{Number(inv.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Invoice Actions */}
                  <div className="invoice-card-actions">
                        <Link className="action-btn view-btn" to={`/app/invoice/${inv.id}`}>
                      <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                          View
                        </Link>
                    
                        <button className="action-btn pdf-btn" onClick={() => openPdfForInvoice(inv.id)}>
                      <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                          PDF
                        </button>
                    
                        <button className="action-btn duplicate-btn" onClick={() => duplicate(inv.id)}>
                      <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                          Copy
                        </button>
                    
                        <button className="action-btn status-btn" onClick={() => mark(inv.id, inv.status !== 'PAID')}>
                      {inv.status === 'PAID' ? (
                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      ) : (
                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22,4 12,14.01 9,11.01"/>
                        </svg>
                      )}
                          {inv.status === 'PAID' ? 'Unpaid' : 'Paid'}
                        </button>
                    
                        <button className="action-btn delete-btn" onClick={() => remove(inv.id)}>
                      <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                          Delete
                        </button>
                      </div>
                </div>
                )
              })}
        </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3 className="empty-title">No invoices found</h3>
            <p className="empty-subtitle">Try adjusting your filters or create your first invoice</p>
            <Link to="/app/create-invoice" className="create-invoice-btn">
              <span className="btn-icon">➕</span>
              Create Invoice
            </Link>
          </div>
        )}
      </div>
      
      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportParams={{
          status,
          customerId,
          dateFrom: '', // Add date filters if needed
          dateTo: ''
        }}
      />
    </div>
  )
}

