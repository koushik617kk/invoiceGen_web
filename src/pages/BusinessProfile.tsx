import React from 'react'
import { api } from '../api/client'

export default function BusinessProfile() {
  const [form, setForm] = React.useState<any>({})
  const [saved, setSaved] = React.useState<string>('')
  const [saving, setSaving] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string>('')
  React.useEffect(() => { api('/business').then(setForm) }, [])

  function set<K extends string>(k: K, v: any) { setForm((f: any) => ({ ...f, [k]: v })) }
  async function save() {
    try {
      setSaving(true)
      setError('')
      const res = await api('/business', { method: 'PUT', body: JSON.stringify(form) })
      setForm(res)
      setSaved('Saved')
      setTimeout(() => setSaved(''), 2000)
    } catch (e) {
      setError(String(e))
    }
    finally { setSaving(false) }
  }

  return (
    <div className="business-profile-container">
      <div className="business-profile-card">
        <h1 className="business-section-title">Business Profile</h1>
      
      {/* Basic Business Information */}
        <div className="business-form-row">
          <div className="business-form-group">
            <label className="business-label">Business Name</label>
            <input 
              className="business-input" 
              placeholder="Enter your business name" 
              value={form.business_name || ''} 
              onChange={e => set('business_name', e.target.value)} 
            />
          </div>
          <div className="business-form-group">
            <label className="business-label">PAN</label>
            <input 
              className="business-input" 
              placeholder="ABCDE1234F" 
              value={form.pan || ''} 
              onChange={e => set('pan', e.target.value)} 
            />
          </div>
      </div>
      
        <div className="business-form-row">
          <div className="business-form-group">
            <label className="business-label">GSTIN</label>
            <input 
              className="business-input" 
              placeholder="22ABCDE1234F1Z5" 
              value={form.gstin || ''} 
              onChange={e => set('gstin', e.target.value)} 
            />
          </div>
          <div className="business-form-group">
            <label className="business-label">State Code</label>
            <input 
              className="business-input" 
              placeholder="22" 
              value={form.state_code || ''} 
              onChange={e => set('state_code', e.target.value)} 
            />
          </div>
      </div>
      
        <div className="business-form-row">
          <div className="business-form-group full-width">
            <label className="business-label">Complete Address</label>
            <textarea 
              className="business-input business-textarea" 
              placeholder="Complete address with state and pincode" 
              rows={3} 
              value={form.address || ''} 
              onChange={e => set('address', e.target.value)} 
            />
          </div>
        </div>
        
        <div className="business-form-row">
          <div className="business-form-group">
            <label className="business-label">Phone</label>
            <input 
              className="business-input" 
              placeholder="+91 9876543210" 
              value={form.phone || ''} 
              onChange={e => set('phone', e.target.value)} 
            />
          </div>
          <div className="business-form-group">
            <label className="business-label">Email</label>
            <input 
              className="business-input" 
              type="email" 
              placeholder="business@example.com" 
              value={form.email || ''} 
              onChange={e => set('email', e.target.value)} 
            />
          </div>
      </div>
      
        {/* Business Settings */}
        <h2 className="business-section-title">Business Settings</h2>
        
        <div className="business-form-row">
          <div className="business-form-group">
            <label className="business-label">Turnover Category</label>
            <select 
              className="business-input business-select" 
              value={form.turnover_category || ''} 
              onChange={e => set('turnover_category', e.target.value)}
            >
            <option value="">Select turnover category</option>
            <option value="below_5cr">Below ₹5 crore (4-digit HSN codes)</option>
            <option value="5cr_plus">₹5 crore and above (6-digit HSN codes)</option>
          </select>
        </div>
          <div className="business-form-group">
            <label className="business-label">Current Financial Year</label>
            <input 
              className="business-input" 
              placeholder="e.g., 2024-25" 
              value={form.current_financial_year || ''} 
              onChange={e => set('current_financial_year', e.target.value)} 
            />
          </div>
        </div>
        
        <div className="business-form-row">
          <div className="business-form-group">
            <label className="business-label">Invoice Number Prefix</label>
            <input 
              className="business-input" 
              placeholder="e.g., INV, BILL, INV-" 
              value={form.invoice_prefix || ''} 
              onChange={e => set('invoice_prefix', e.target.value)} 
            />
      </div>
          <div className="business-form-group">
            <label className="business-label">Primary Brand Color</label>
            <input 
              className="business-input" 
              type="color" 
              value={form.primary_color || '#2563eb'} 
              onChange={e => set('primary_color', e.target.value)} 
            />
        </div>
      </div>
      
      {/* Branding & Assets */}
        <h2 className="business-section-title">Branding & Assets</h2>
        
        <div className="business-form-row">
          <div className="business-form-group">
            <label className="business-label">Company Logo</label>
            <input 
              className="business-file-input" 
              type="file" 
              accept="image/*" 
              onChange={e => {
            const file = e.target.files?.[0]
            if (file) {
              // TODO: Implement logo upload
              console.log('Logo file selected:', file.name)
            }
              }} 
            />
          {form.logo_path && (
              <div className="file-upload-status">
              ✅ Logo uploaded: {form.logo_path.split('/').pop()}
            </div>
          )}
        </div>
          <div className="business-form-group">
            <label className="business-label">Digital Signature</label>
            <input 
              className="business-file-input" 
              type="file" 
              accept="image/*" 
              onChange={e => {
            const file = e.target.files?.[0]
            if (file) {
              // TODO: Implement signature upload
              console.log('Signature file selected:', file.name)
            }
              }} 
            />
          {form.signature_path && (
              <div className="file-upload-status">
              ✅ Signature uploaded: {form.signature_path.split('/').pop()}
            </div>
          )}
        </div>
      </div>
      
        {/* Payment Details */}
        <h2 className="business-section-title">Payment Details</h2>
        
        <div className="business-form-row">
          <div className="business-form-group">
            <label className="business-label">Bank Account Name</label>
            <input 
              className="business-input" 
              placeholder="Account holder name" 
              value={form.bank_account_name || ''} 
              onChange={e => set('bank_account_name', e.target.value)} 
            />
          </div>
          <div className="business-form-group">
            <label className="business-label">Bank Name</label>
            <input 
              className="business-input" 
              placeholder="State Bank of India" 
              value={form.bank_name || ''} 
              onChange={e => set('bank_name', e.target.value)} 
            />
          </div>
        </div>
        
        <div className="business-form-row">
          <div className="business-form-group">
            <label className="business-label">Bank Branch</label>
            <input 
              className="business-input" 
              placeholder="Main Branch" 
              value={form.bank_branch || ''} 
              onChange={e => set('bank_branch', e.target.value)} 
            />
          </div>
          <div className="business-form-group">
            <label className="business-label">Account Number</label>
            <input 
              className="business-input" 
              placeholder="1234567890" 
              value={form.bank_account_number || ''} 
              onChange={e => set('bank_account_number', e.target.value)} 
            />
          </div>
        </div>
        
        <div className="business-form-row">
          <div className="business-form-group">
            <label className="business-label">IFSC Code</label>
            <input 
              className="business-input" 
              placeholder="SBIN0001234" 
              value={form.bank_ifsc || ''} 
              onChange={e => set('bank_ifsc', e.target.value)} 
            />
      </div>
          <div className="business-form-group">
            <label className="business-label">UPI ID</label>
            <input 
              className="business-input" 
              placeholder="business@upi" 
              value={form.upi_id || ''} 
              onChange={e => set('upi_id', e.target.value)} 
            />
      </div>
        </div>
        
        <div className="business-form-row">
          <div className="business-form-group full-width">
            <label className="business-label">Default Terms on Invoice</label>
            <textarea 
              className="business-input business-textarea" 
              rows={3} 
              placeholder="Default terms (shown on invoice PDF)" 
              value={form.default_terms || ''} 
              onChange={e => set('default_terms', e.target.value)} 
            />
        </div>
      </div>
        
        <div className="business-form-row">
          <div className="business-form-group">
            <label className="business-label">Accept Cash Payments?</label>
            <select 
              className="business-input business-select" 
              value={form.accepts_cash || ''} 
              onChange={e => set('accepts_cash', e.target.value)}
            >
            <option value="">Select</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
        </div>
          <div className="business-form-group">
            <label className="business-label">Cash Note (Optional)</label>
            <textarea 
              className="business-input business-textarea" 
              rows={2} 
              placeholder="Eg. Cash accepted up to ₹10,000 as per policy" 
              value={form.cash_note || ''} 
              onChange={e => set('cash_note', e.target.value)} 
            />
          </div>
        </div>
        
        {/* Sample Invoice Preview */}
        <h2 className="business-section-title">📄 Sample Invoice Preview</h2>
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
        <div style={{ background: 'white', borderRadius: 6, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {/* Invoice Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottom: '2px solid #e2e8f0', paddingBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: form.primary_color || '#2563eb', marginBottom: 4 }}>
                {form.business_name || 'Your Business Name'}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
                {form.address || 'Business Address, City, State - Pincode'}<br/>
                {form.phone && `Phone: ${form.phone}`} {form.email && `• Email: ${form.email}`}<br/>
                {form.gstin && `GSTIN: ${form.gstin}`} {form.pan && `• PAN: ${form.pan}`}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: form.primary_color || '#2563eb' }}>INVOICE</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Invoice #: {form.invoice_prefix || 'INV'}-001<br/>
                Date: {new Date().toLocaleDateString('en-IN')}<br/>
                Due Date: {new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-IN')}
              </div>
            </div>
          </div>
          
          {/* Bill To */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 8 }}>Bill To:</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Sample Customer Name<br/>
              Customer Address, City, State - Pincode<br/>
              Phone: +91 98765 43210 • Email: customer@example.com<br/>
              GSTIN: 29ABCDE1234F1Z5
            </div>
          </div>
          
          {/* Service Items Table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ background: form.primary_color || '#2563eb', color: 'white', padding: '10px 12px', fontSize: 13, fontWeight: 'bold', display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 100px', gap: 12 }}>
              <div>Description</div>
              <div style={{ textAlign: 'center' }}>Qty</div>
              <div style={{ textAlign: 'right' }}>Rate</div>
              <div style={{ textAlign: 'right' }}>GST</div>
              <div style={{ textAlign: 'right' }}>Amount</div>
            </div>
            <div style={{ padding: '10px 12px', fontSize: 13, display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 100px', gap: 12, borderBottom: '1px solid #f1f5f9' }}>
              <div>Web Development Services</div>
              <div style={{ textAlign: 'center' }}>1</div>
              <div style={{ textAlign: 'right' }}>₹25,000</div>
              <div style={{ textAlign: 'right' }}>18%</div>
              <div style={{ textAlign: 'right' }}>₹29,500</div>
            </div>
            <div style={{ padding: '10px 12px', fontSize: 13, display: 'grid', gridTemplateColumns: '2fr 80px 80px 80px 100px', gap: 12 }}>
              <div>Logo Design Services</div>
              <div style={{ textAlign: 'center' }}>1</div>
              <div style={{ textAlign: 'right' }}>₹5,000</div>
              <div style={{ textAlign: 'right' }}>18%</div>
              <div style={{ textAlign: 'right' }}>₹5,900</div>
            </div>
          </div>
          
          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <div style={{ minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                <span>Subtotal:</span>
                <span>₹30,000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                <span>GST (18%):</span>
                <span>₹5,400</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 15, fontWeight: 'bold', borderTop: '1px solid #e2e8f0', color: form.primary_color || '#2563eb' }}>
                <span>Total:</span>
                <span>₹35,400</span>
              </div>
            </div>
          </div>
          
          {/* Payment Info */}
          {(form.bank_name || form.upi_id) && (
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>Payment Details:</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {form.bank_name && `Bank: ${form.bank_name} • A/c: ${form.bank_account_number || 'XXXXXXXXX'} • IFSC: ${form.bank_ifsc || 'XXXXXXX'}`}<br/>
                {form.upi_id && `UPI: ${form.upi_id}`}
              </div>
            </div>
          )}
          
          {/* Terms */}
          <div style={{ fontSize: 11, color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
            <strong>Terms & Conditions:</strong><br/>
            {form.default_terms || 'Payment is due within 30 days. Late payments may incur additional charges.'}
          </div>
        </div>
        
        <div style={{ marginTop: 16, padding: 12, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <div style={{ fontSize: 13, color: '#1e40af' }}>
            <strong>This is how your invoice will look!</strong> Complete the business profile above to see your actual details in the preview.
        </div>
      </div>
        </div>

        {/* Save Button and Status */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '2px solid #f3f4f6' }}>
      {saved && (
            <div style={{ 
              background: '#ecfdf5', 
              color: '#166534', 
              padding: 12, 
              borderRadius: 8, 
              marginBottom: 16,
              border: '1px solid #bbf7d0'
            }}>
              ✅ {saved}
        </div>
      )}
      {error && (
            <div style={{ 
              background: '#fef2f2', 
              color: '#991b1b', 
              padding: 12, 
              borderRadius: 8, 
              marginBottom: 16,
              border: '1px solid #fecaca'
            }}>
              ❌ {error}
            </div>
          )}
          
          <button 
            className="business-input" 
            onClick={save} 
            disabled={saving}
            style={{
              background: saving ? '#9ca3af' : '#3b82f6',
              color: 'white',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              border: 'none',
              fontSize: '1rem',
              padding: '16px 24px'
            }}
          >
            {saving ? '💾 Saving...' : '💾 Save Business Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
