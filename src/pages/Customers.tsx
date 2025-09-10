import React from 'react'
import { api } from '../api/client'
import { useNavigate } from 'react-router-dom'

export default function Customers() {
  const [list, setList] = React.useState<any[]>([])
  const [q, setQ] = React.useState('')
  const [form, setForm] = React.useState<any>({ name: '', gstin: '', state_code: '', phone: '' })
  const [showSuccess, setShowSuccess] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState('')
  const navigate = useNavigate()

  function load() {
    const qp = q ? `?q=${encodeURIComponent(q)}` : ''
    api(`/customers${qp}`).then(setList)
  }
  React.useEffect(() => { load() }, [q])

  function create() {
    if (!form.name.trim()) {
      alert('Please enter customer name')
      return
    }
    
    api('/customers', { method: 'POST', body: JSON.stringify(form) }).then(() => { 
      // Show success message
      setSuccessMessage(`Customer "${form.name}" added successfully! 🎉`)
      setShowSuccess(true)
      
      // Reset form
      setForm({ name: '', gstin: '', state_code: '', phone: '' })
      
      // Reload customer list
      load()
      
      // Auto-scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false)
        setSuccessMessage('')
      }, 3000)
    }).catch((error) => {
      console.error('Failed to add customer:', error)
      alert('Failed to add customer. Please try again.')
    })
  }

  // Handle search input focus to prevent mobile zoom
  function handleSearchFocus() {
    // Prevent mobile zoom by ensuring proper viewport
    if (window.innerWidth <= 768) {
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      }
    }
  }

  // Handle search input blur to reset viewport
  function handleSearchBlur() {
    // Reset viewport after search input loses focus
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        const viewport = document.querySelector('meta[name="viewport"]')
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
        }
      }, 100)
    }
  }

  return (
    <div className="customers-container">
      {/* Add Customer Section */}
      <div className="add-customer-section">
        <div className="section-header">
          <h2 className="section-title">
            <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            Add New Customer
          </h2>
          <p className="section-subtitle">Create a new customer profile for your business</p>
        </div>
        
        {/* Success Message */}
        {showSuccess && (
          <div className="success-message sticky-success">
            <svg className="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            {successMessage}
          </div>
        )}
        
        <div className="customer-form">
          <div className="form-row">
            <div className="form-field">
              <label>Customer Name</label>
              <input 
                className="form-input" 
                placeholder="Enter customer name" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
            </div>
            <div className="form-field">
              <label>Phone Number</label>
              <input 
                className="form-input" 
                type="tel"
                placeholder="Enter phone number (e.g., 9876543210)" 
                value={form.phone} 
                onChange={e => setForm({ ...form, phone: e.target.value })} 
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
            </div>
            <div className="form-field">
              <label>GSTIN</label>
              <input 
                className="form-input" 
                placeholder="Enter GSTIN number" 
                value={form.gstin} 
                onChange={e => setForm({ ...form, gstin: e.target.value })} 
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
            </div>
            <div className="form-field">
              <label>State Code</label>
              <input 
                className="form-input" 
                placeholder="Enter state code" 
                value={form.state_code} 
                onChange={e => setForm({ ...form, state_code: e.target.value })} 
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
            </div>
          </div>
          <button className="save-btn" onClick={create}>
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
            Save Customer
          </button>
        </div>
      </div>

      {/* Customers List Section */}
      <div className="customers-list-section">
        <div className="section-header">
          <div className="header-left">
            <h2 className="section-title">
              <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Customers
            </h2>
            <div className="customer-count">Total: {list.length} customers</div>
          </div>
          <div className="search-container">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              className="search-input" 
              placeholder="Search customers..." 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
          </div>
        </div>
        
        <div className="customers-grid">
          {list.map((c, index) => (
            <div key={c.id} className={`customer-card ${index % 2 === 0 ? 'even' : 'odd'}`}>
              <div className="customer-header">
                <div className="customer-avatar">
                  <svg className="avatar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="customer-info">
                  <div 
                    className="customer-name"
                    onClick={() => navigate(`/customer/${c.id}`)}
                  >
                    {c.name}
                  </div>
                  <div className="customer-gstin">
                    GSTIN: {c.gstin || 'Not provided'}
                  </div>
                  {c.phone && (
                    <div className="customer-phone">
                      📱 {c.phone}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="customer-footer">
                <div className="customer-state">
                  <span className="state-badge">State: {c.state_code || 'Not specified'}</span>
                </div>
                <button 
                  className="view-details-btn" 
                  onClick={() => navigate(`/customer/${c.id}`)}
                >
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {list.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3 className="empty-title">No customers found</h3>
            <p className="empty-subtitle">Start by adding your first customer above</p>
          </div>
        )}
      </div>
    </div>
  )
}
