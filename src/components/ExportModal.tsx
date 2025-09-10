import React, { useState } from 'react'
import { API_BASE } from '../api/client'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  exportParams: {
    status?: string
    customerId?: string
    dateFrom?: string
    dateTo?: string
  }
}

export default function ExportModal({ isOpen, onClose, exportParams }: ExportModalProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<string>('all')
  const [customDateFrom, setCustomDateFrom] = useState<string>('')
  const [customDateTo, setCustomDateTo] = useState<string>('')

  if (!isOpen) return null

  const getDateRange = () => {
    const today = new Date()
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    
    switch (dateRange) {
      case 'last-month':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
        return { from: formatDate(lastMonth), to: formatDate(lastMonthEnd) }
      case 'last-3-months':
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1)
        return { from: formatDate(threeMonthsAgo), to: formatDate(today) }
      case 'last-6-months':
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1)
        return { from: formatDate(sixMonthsAgo), to: formatDate(today) }
      case 'last-year':
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), 1)
        return { from: formatDate(oneYearAgo), to: formatDate(today) }
      case 'custom':
        return { from: customDateFrom, to: customDateTo }
      default:
        return { from: '', to: '' }
    }
  }

  const handleExport = async (exportType: string) => {
    setLoading(exportType)
    
    try {
      const params = new URLSearchParams()
      if (exportParams.status) params.set('status', exportParams.status)
      if (exportParams.customerId) params.set('customer_id', exportParams.customerId)
      
      // Use date range selection
      const dateRangeData = getDateRange()
      if (dateRangeData.from) params.set('date_from', dateRangeData.from)
      if (dateRangeData.to) params.set('date_to', dateRangeData.to)
      
      // Fallback to original exportParams if no date range selected
      if (!dateRangeData.from && exportParams.dateFrom) params.set('date_from', exportParams.dateFrom)
      if (!dateRangeData.to && exportParams.dateTo) params.set('date_to', exportParams.dateTo)

      const response = await fetch(`${API_BASE}/invoices/export/${exportType}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${(await import('aws-amplify/auth').then(m => m.fetchAuthSession())).tokens?.idToken?.toString() || ''}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoices_${exportType}_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        onClose()
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const exportOptions = [
    {
      id: 'complete',
      title: 'Complete Invoices Export',
      description: 'Export all invoice details including items, amounts, and customer information',
      icon: '📄',
      color: '#3b82f6'
    },
    {
      id: 'hsn',
      title: 'HSN Code Wise Export',
      description: 'Export turnover summary grouped by HSN codes with total amounts',
      icon: '🏷️',
      color: '#10b981'
    },
    {
      id: 'gst-slab',
      title: 'GST Slab Wise Export',
      description: 'Export turnover summary grouped by GST tax rates (0%, 5%, 12%, 18%, 28%)',
      icon: '📊',
      color: '#f59e0b'
    }
  ]

  return (
    <div className="export-modal-overlay">
      <div className="export-modal">
        <div className="export-modal-header">
          <h2 className="export-modal-title">Choose Export Type</h2>
          <button className="export-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div className="export-modal-content">
          <p className="export-modal-description">
            Select the type of export you need. Each option provides different data views for your analysis.
          </p>
          
          {/* Date Range Selector */}
          <div className="date-range-section">
            <h3 className="date-range-title">Select Date Range</h3>
            <div className="date-range-options">
              <label className="date-range-option">
                <input 
                  type="radio" 
                  name="dateRange" 
                  value="all" 
                  checked={dateRange === 'all'}
                  onChange={(e) => setDateRange(e.target.value)}
                />
                <span>All Time</span>
              </label>
              <label className="date-range-option">
                <input 
                  type="radio" 
                  name="dateRange" 
                  value="last-month" 
                  checked={dateRange === 'last-month'}
                  onChange={(e) => setDateRange(e.target.value)}
                />
                <span>Last Month</span>
              </label>
              <label className="date-range-option">
                <input 
                  type="radio" 
                  name="dateRange" 
                  value="last-3-months" 
                  checked={dateRange === 'last-3-months'}
                  onChange={(e) => setDateRange(e.target.value)}
                />
                <span>Last 3 Months</span>
              </label>
              <label className="date-range-option">
                <input 
                  type="radio" 
                  name="dateRange" 
                  value="last-6-months" 
                  checked={dateRange === 'last-6-months'}
                  onChange={(e) => setDateRange(e.target.value)}
                />
                <span>Last 6 Months</span>
              </label>
              <label className="date-range-option">
                <input 
                  type="radio" 
                  name="dateRange" 
                  value="last-year" 
                  checked={dateRange === 'last-year'}
                  onChange={(e) => setDateRange(e.target.value)}
                />
                <span>Last Year</span>
              </label>
              <label className="date-range-option">
                <input 
                  type="radio" 
                  name="dateRange" 
                  value="custom" 
                  checked={dateRange === 'custom'}
                  onChange={(e) => setDateRange(e.target.value)}
                />
                <span>Custom Range</span>
              </label>
            </div>
            
            {dateRange === 'custom' && (
              <div className="custom-date-inputs">
                <div className="date-input-group">
                  <label>From:</label>
                  <input 
                    type="date" 
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                  />
                </div>
                <div className="date-input-group">
                  <label>To:</label>
                  <input 
                    type="date" 
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="export-options-grid">
            {exportOptions.map((option) => (
              <div 
                key={option.id}
                className={`export-option ${loading === option.id ? 'loading' : ''}`}
                onClick={() => !loading && handleExport(option.id)}
              >
                <div className="export-option-icon" style={{ backgroundColor: option.color }}>
                  {loading === option.id ? '⏳' : option.icon}
                </div>
                <div className="export-option-content">
                  <h3 className="export-option-title">{option.title}</h3>
                  <p className="export-option-description">{option.description}</p>
                </div>
                <div className="export-option-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
