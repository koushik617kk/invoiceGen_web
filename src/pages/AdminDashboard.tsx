import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import adminClient, { User, DashboardStats, CARequest, AdminAPIError } from '../api/adminClient'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // CA Requests state
  const [activeTab, setActiveTab] = useState<'users' | 'ca-requests'>('users')
  const [caRequests, setCaRequests] = useState<CARequest[]>([])
  const [caCurrentPage, setCaCurrentPage] = useState(1)
  const [caTotalPages, setCaTotalPages] = useState(1)
  const [caStatusFilter, setCaStatusFilter] = useState('')
  const [selectedCARequest, setSelectedCARequest] = useState<CARequest | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [statusForm, setStatusForm] = useState({ status: '', ca_notes: '' })
  const [contactForm, setContactForm] = useState({ method: 'email', message: '' })

  useEffect(() => {
    if (!adminClient.isAuthenticated()) {
      navigate('/admin-login')
      return
    }
    loadDashboardData()
    loadCARequests()
  }, [navigate])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, usersData] = await Promise.all([
        adminClient.getDashboardStats(),
        adminClient.getUsers(1, 20)
      ])
      
      setStats(statsData)
      setUsers(usersData.users)
      setTotalPages(usersData.pagination.pages)
    } catch (err) {
      if (err instanceof AdminAPIError && err.status === 401) {
        navigate('/admin-login')
      } else {
        setError('Failed to load dashboard data')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadCARequests = async (page: number = 1, status?: string) => {
    try {
      setLoading(true)
      const caData = await adminClient.getCARequests(page, 20, status)
      setCaRequests(caData.requests)
      setCaTotalPages(caData.pagination.pages)
      setCaCurrentPage(page)
    } catch (err) {
      if (err instanceof AdminAPIError && err.status === 401) {
        navigate('/admin-login')
      } else {
        setError('Failed to load CA requests')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const usersData = await adminClient.getUsers(1, 20, searchTerm)
      setUsers(usersData.users)
      setTotalPages(usersData.pagination.pages)
      setCurrentPage(1)
    } catch (err) {
      setError('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = async (page: number) => {
    try {
      setLoading(true)
      const usersData = await adminClient.getUsers(page, 20, searchTerm)
      setUsers(usersData.users)
      setCurrentPage(page)
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await adminClient.logout()
      navigate('/admin-login')
    } catch (err) {
      // Even if logout fails, redirect to login
      navigate('/admin-login')
    }
  }

  // CA Request handlers
  const handleCAStatusFilter = async (status: string) => {
    setCaStatusFilter(status)
    await loadCARequests(1, status || undefined)
  }

  const handleCAStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCARequest) return

    try {
      setLoading(true)
      await adminClient.updateCARequestStatus(
        selectedCARequest.id,
        statusForm.status,
        statusForm.ca_notes
      )
      setShowStatusModal(false)
      setStatusForm({ status: '', ca_notes: '' })
      await loadCARequests(caCurrentPage, caStatusFilter || undefined)
    } catch (err) {
      setError('Failed to update CA request status')
    } finally {
      setLoading(false)
    }
  }

  const handleContactUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCARequest) return

    try {
      setLoading(true)
      await adminClient.contactCARequestUser(
        selectedCARequest.id,
        contactForm.method,
        contactForm.message
      )
      setShowContactModal(false)
      setContactForm({ method: 'email', message: '' })
      await loadCARequests(caCurrentPage, caStatusFilter || undefined)
    } catch (err) {
      setError('Failed to send contact message')
    } finally {
      setLoading(false)
    }
  }

  const openStatusModal = (request: CARequest) => {
    setSelectedCARequest(request)
    setStatusForm({ status: request.status, ca_notes: request.ca_notes || '' })
    setShowStatusModal(true)
  }

  const openContactModal = (request: CARequest) => {
    setSelectedCARequest(request)
    setContactForm({ method: 'email', message: '' })
    setShowContactModal(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading && !stats) {
    return (
      <div className="admin-dashboard-container">
        <div className="admin-loading">
          <div className="admin-loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-brand">
            <span className="admin-brand-icon">⚡</span>
            <h1>Admin Dashboard</h1>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        {error && (
          <div className="admin-error-banner">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon">👥</div>
              <div className="admin-stat-content">
                <h3>{stats.users.total.toLocaleString()}</h3>
                <p>Total Users</p>
                <span className="admin-stat-subtitle">
                  {stats.users.new_today} new today
                </span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon">📊</div>
              <div className="admin-stat-content">
                <h3>{stats.users.active_30_days.toLocaleString()}</h3>
                <p>Active Users</p>
                <span className="admin-stat-subtitle">
                  Last 30 days
                </span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon">📋</div>
              <div className="admin-stat-content">
                <h3>{stats.invoices.total.toLocaleString()}</h3>
                <p>Total Invoices</p>
                <span className="admin-stat-subtitle">
                  {stats.invoices.created_today} today
                </span>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon">💰</div>
              <div className="admin-stat-content">
                <h3>{formatCurrency(stats.invoices.total_revenue)}</h3>
                <p>Total Revenue</p>
                <span className="admin-stat-subtitle">
                  All time
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
          <button
            className={`admin-tab ${activeTab === 'ca-requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('ca-requests')}
          >
            📞 CA Requests
          </button>
        </div>

        {/* Users Section */}
        {activeTab === 'users' && (
          <div className="admin-section">
          <div className="admin-section-header">
            <h2>Users</h2>
            <form onSubmit={handleSearch} className="admin-search-form">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-search-input"
              />
              <button type="submit" className="admin-search-btn">
                Search
              </button>
            </form>
          </div>

          <div className="admin-users-table-container">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Business Type</th>
                  <th>Invoices</th>
                  <th>Revenue</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} onClick={() => setSelectedUser(user)}>
                    <td>
                      <div className="admin-user-info">
                        <div className="admin-user-avatar">
                          {user.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="admin-user-name">
                            {user.full_name || 'No name'}
                          </div>
                          {user.business_profile?.business_name && (
                            <div className="admin-user-business">
                              {user.business_profile.business_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{user.email || '-'}</td>
                    <td>{user.phone || '-'}</td>
                    <td>
                      <span className="admin-business-type">
                        {user.business_type || 'Not set'}
                      </span>
                    </td>
                    <td>{user.invoice_count}</td>
                    <td>{formatCurrency(user.total_revenue)}</td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <span className={`admin-status ${user.onboarding_completed ? 'completed' : 'pending'}`}>
                        {user.onboarding_completed ? 'Active' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="admin-pagination-btn"
              >
                Previous
              </button>
              
              <span className="admin-pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="admin-pagination-btn"
              >
                Next
              </button>
            </div>
          )}
          </div>
        )}

        {/* CA Requests Section */}
        {activeTab === 'ca-requests' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>CA Consultation Requests</h2>
              <div className="admin-ca-filters">
                <select
                  value={caStatusFilter}
                  onChange={(e) => handleCAStatusFilter(e.target.value)}
                  className="admin-filter-select"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="admin-ca-table-container">
              <table className="admin-ca-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Business</th>
                    <th>Preferred Date</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {caRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div className="admin-ca-user-info">
                          <div className="admin-ca-user-avatar">
                            {request.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="admin-ca-user-name">{request.full_name}</div>
                            <div className="admin-ca-user-contact">
                              {request.email} • {request.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="admin-ca-business-name">
                            {request.business_name || 'Not provided'}
                          </div>
                          <div className="admin-ca-business-type">
                            {request.business_type || 'Not specified'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          {request.preferred_date ? (
                            <div className="admin-ca-date">
                              {new Date(request.preferred_date).toLocaleDateString('en-IN')}
                            </div>
                          ) : (
                            <span className="admin-ca-no-date">Not specified</span>
                          )}
                          {request.preferred_time && (
                            <div className="admin-ca-time">{request.preferred_time}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-ca-status admin-ca-status-${request.status}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-ca-created">
                          {formatDate(request.created_at)}
                        </div>
                      </td>
                      <td>
                        <div className="admin-ca-actions">
                          <button
                            onClick={() => openStatusModal(request)}
                            className="admin-ca-action-btn admin-ca-status-btn"
                            title="Update Status"
                          >
                            📝
                          </button>
                          <button
                            onClick={() => openContactModal(request)}
                            className="admin-ca-action-btn admin-ca-contact-btn"
                            title="Contact User"
                          >
                            📞
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CA Requests Pagination */}
            {caTotalPages > 1 && (
              <div className="admin-pagination">
                <button
                  onClick={() => loadCARequests(caCurrentPage - 1, caStatusFilter || undefined)}
                  disabled={caCurrentPage === 1 || loading}
                  className="admin-pagination-btn"
                >
                  Previous
                </button>
                
                <span className="admin-pagination-info">
                  Page {caCurrentPage} of {caTotalPages}
                </span>
                
                <button
                  onClick={() => loadCARequests(caCurrentPage + 1, caStatusFilter || undefined)}
                  disabled={caCurrentPage === caTotalPages || loading}
                  className="admin-pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="admin-modal-close">
                ×
              </button>
            </div>
            <div className="admin-modal-content">
              <div className="admin-user-detail">
                <h4>{selectedUser.full_name || 'No name'}</h4>
                <p><strong>Email:</strong> {selectedUser.email || 'Not provided'}</p>
                <p><strong>Phone:</strong> {selectedUser.phone || 'Not provided'}</p>
                <p><strong>Business Type:</strong> {selectedUser.business_type || 'Not set'}</p>
                <p><strong>Onboarding:</strong> {selectedUser.onboarding_completed ? 'Completed' : 'Pending'}</p>
                <p><strong>Joined:</strong> {formatDate(selectedUser.created_at)}</p>
                <p><strong>Last Login:</strong> {formatDate(selectedUser.last_login)}</p>
                <p><strong>Invoices:</strong> {selectedUser.invoice_count}</p>
                <p><strong>Revenue:</strong> {formatCurrency(selectedUser.total_revenue)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CA Status Update Modal */}
      {showStatusModal && selectedCARequest && (
        <div className="admin-modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Update CA Request Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="admin-modal-close">
                ×
              </button>
            </div>
            <div className="admin-modal-content">
              <form onSubmit={handleCAStatusUpdate}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Status</label>
                  <select
                    value={statusForm.status}
                    onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
                    className="admin-form-input"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div className="admin-form-group">
                  <label className="admin-form-label">CA Notes</label>
                  <textarea
                    value={statusForm.ca_notes}
                    onChange={(e) => setStatusForm(prev => ({ ...prev, ca_notes: e.target.value }))}
                    className="admin-form-textarea"
                    rows={4}
                    placeholder="Add notes about this consultation..."
                  />
                </div>
                
                <div className="admin-modal-actions">
                  <button type="button" onClick={() => setShowStatusModal(false)} className="admin-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn-primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Contact User Modal */}
      {showContactModal && selectedCARequest && (
        <div className="admin-modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Contact User</h3>
              <button onClick={() => setShowContactModal(false)} className="admin-modal-close">
                ×
              </button>
            </div>
            <div className="admin-modal-content">
              <div className="admin-contact-user-info">
                <p><strong>User:</strong> {selectedCARequest.full_name}</p>
                <p><strong>Email:</strong> {selectedCARequest.email}</p>
                <p><strong>Phone:</strong> {selectedCARequest.phone}</p>
              </div>
              
              <form onSubmit={handleContactUser}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Contact Method</label>
                  <select
                    value={contactForm.method}
                    onChange={(e) => setContactForm(prev => ({ ...prev, method: e.target.value }))}
                    className="admin-form-input"
                    required
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="call">Phone Call</option>
                  </select>
                </div>
                
                <div className="admin-form-group">
                  <label className="admin-form-label">Message</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    className="admin-form-textarea"
                    rows={4}
                    placeholder="Enter your message to the user..."
                    required
                  />
                </div>
                
                <div className="admin-modal-actions">
                  <button type="button" onClick={() => setShowContactModal(false)} className="admin-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn-primary" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
