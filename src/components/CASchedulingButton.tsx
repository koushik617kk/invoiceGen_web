import React, { useState, useEffect } from 'react'
import { checkFirstInvoice, FirstInvoiceCheck } from '../api/ca-scheduling'
import CASchedulingModal from './CASchedulingModal'
import './CASchedulingButton.css'

interface CASchedulingButtonProps {
  invoiceId?: number
  userInfo?: {
    full_name?: string
    email?: string
    phone?: string
    business_name?: string
    business_type?: string
  }
  className?: string
}

const CASchedulingButton: React.FC<CASchedulingButtonProps> = ({
  invoiceId,
  userInfo = {},
  className = ''
}) => {
  const [showButton, setShowButton] = useState<boolean | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [buttonInfo, setButtonInfo] = useState<{total_invoices: number, has_ca_booking: boolean} | null>(null)

  useEffect(() => {
    checkIfShouldShowButton()
  }, [])

  const checkIfShouldShowButton = async () => {
    try {
      setIsLoading(true)
      const response: FirstInvoiceCheck = await checkFirstInvoice()
      console.log('CA Scheduling Check Response:', response)
      
      // Show button if it's the first invoice OR if user hasn't booked a CA consultation yet
      const shouldShow = response.is_first_invoice || !response.has_ca_booking
      console.log('Should show CA button:', shouldShow, '(is_first_invoice:', response.is_first_invoice, ', has_ca_booking:', response.has_ca_booking, ')')
      
      setShowButton(shouldShow)
      setButtonInfo({
        total_invoices: response.total_invoices,
        has_ca_booking: response.has_ca_booking
      })
    } catch (error) {
      console.error('Failed to check CA scheduling status:', error)
      // If we can't check, assume we shouldn't show the button
      setShowButton(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleScheduleClick = () => {
    setShowModal(true)
  }

  // Don't show the button if we're still loading or if we shouldn't show it
  if (isLoading || !showButton) {
    return null
  }

  return (
    <>
      <div className={`ca-scheduling-button-container ${className}`}>
        <div className="ca-scheduling-banner">
          <div className="ca-banner-content">
            <div className="ca-banner-icon">🎉</div>
            <div className="ca-banner-text">
              <h3>🎉 Free CA Consultation Available!</h3>
              <p>Get your invoice validated by our CA expert - completely free!</p>
            </div>
          </div>
          <button 
            className="ca-schedule-btn"
            onClick={handleScheduleClick}
          >
            📞 Schedule Free CA Call
          </button>
        </div>
      </div>

      <CASchedulingModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          // Refresh button status after closing modal (in case CA was booked)
          checkIfShouldShowButton()
        }}
        invoiceId={invoiceId}
        userInfo={userInfo}
      />
    </>
  )
}

export default CASchedulingButton

