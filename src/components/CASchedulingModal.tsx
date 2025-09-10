import React, { useState, useEffect } from 'react'
import { scheduleCACall, getAvailableSlots, AvailableSlotsResponse, CASchedulingRequest } from '../api/ca-scheduling'
import { showToast } from '../ui/ToastHost'
import './CASchedulingModal.css'

interface CASchedulingModalProps {
  isOpen: boolean
  onClose: () => void
  invoiceId?: number
  userInfo?: {
    full_name?: string
    email?: string
    phone?: string
    business_name?: string
    business_type?: string
  }
}

const CASchedulingModal: React.FC<CASchedulingModalProps> = ({
  isOpen,
  onClose,
  invoiceId,
  userInfo = {}
}) => {
  const [formData, setFormData] = useState<CASchedulingRequest>({
    invoice_id: invoiceId,
    full_name: userInfo.full_name || '',
    phone: userInfo.phone || '',
    email: userInfo.email || '',
    business_name: userInfo.business_name || '',
    business_type: userInfo.business_type || '',
    preferred_date: '',
    preferred_time: '',
    user_notes: ''
  })

  const [availableSlots, setAvailableSlots] = useState<AvailableSlotsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAvailableSlots()
    }
  }, [isOpen])

  const loadAvailableSlots = async () => {
    try {
      setIsLoading(true)
      const slots = await getAvailableSlots()
      setAvailableSlots(slots)
    } catch (error) {
      console.error('Failed to load available slots:', error)
      showToast('Failed to load available time slots', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name || !formData.phone) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await scheduleCACall(formData)
      
      showToast(response.message, 'success')
      onClose()
      
      // Reset form
      setFormData({
        invoice_id: invoiceId,
        full_name: userInfo.full_name || '',
        phone: userInfo.phone || '',
        email: userInfo.email || '',
        business_name: userInfo.business_name || '',
        business_type: userInfo.business_type || '',
        preferred_date: '',
        preferred_time: '',
        user_notes: ''
      })
    } catch (error) {
      console.error('Failed to schedule CA call:', error)
      showToast('Failed to schedule CA call. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="ca-scheduling-modal-overlay">
      <div className="ca-scheduling-modal">
        <div className="ca-modal-header">
          <h2>📞 Schedule Free CA Consultation</h2>
          <button className="ca-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="ca-modal-content">
          {availableSlots && (
            <div className="ca-info-card">
              <div className="ca-profile">
                <div className="ca-avatar">👨‍💼</div>
                <div className="ca-details">
                  <h3>{availableSlots.ca_info.name}</h3>
                  <p>{availableSlots.ca_info.experience} • {availableSlots.ca_info.specialization}</p>
                  <p>📍 {availableSlots.ca_info.location} • ⭐ {availableSlots.ca_info.rating}</p>
                  <p>✅ Guided {availableSlots.ca_info.businesses_guided} businesses</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="ca-scheduling-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="full_name">Full Name *</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="business_name">Business Name</label>
                <input
                  type="text"
                  id="business_name"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="business_type">Business Type</label>
              <select
                id="business_type"
                name="business_type"
                value={formData.business_type}
                onChange={handleInputChange}
              >
                <option value="">Select Business Type</option>
                <option value="service">Service Provider</option>
                <option value="product">Product Seller</option>
                <option value="mixed">Mixed (Services + Products)</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="preferred_date">Preferred Date</label>
                <select
                  id="preferred_date"
                  name="preferred_date"
                  value={formData.preferred_date}
                  onChange={handleInputChange}
                >
                  <option value="">Select Date</option>
                  {availableSlots?.slots.map((slot, index) => (
                    <option key={index} value={slot.date}>
                      {new Date(slot.date).toLocaleDateString('en-IN', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="preferred_time">Preferred Time</label>
                <select
                  id="preferred_time"
                  name="preferred_time"
                  value={formData.preferred_time}
                  onChange={handleInputChange}
                >
                  <option value="">Select Time</option>
                  <option value="morning">Morning (9 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                  <option value="evening">Evening (5 PM - 8 PM)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="user_notes">Additional Notes (Optional)</label>
              <textarea
                id="user_notes"
                name="user_notes"
                value={formData.user_notes}
                onChange={handleInputChange}
                placeholder="Any specific questions or requirements for the CA consultation..."
                rows={3}
              />
            </div>

            <div className="ca-benefits">
              <h4>What You'll Get:</h4>
              <ul>
                <li>✅ 15-minute free consultation with CA Rajesh Kumar</li>
                <li>✅ Review of your first invoice format</li>
                <li>✅ HSN code validation and suggestions</li>
                <li>✅ GST compliance verification</li>
                <li>✅ Industry-specific recommendations</li>
                <li>✅ Direct contact for future CA services</li>
              </ul>
            </div>

            <div className="ca-modal-actions">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Scheduling...' : 'Schedule Free CA Call'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CASchedulingModal

