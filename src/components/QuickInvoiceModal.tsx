import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
// Modal styles now imported via main.css

interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  sac_code: string;
  gst_rate: number;
  category: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface QuickInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: (invoiceId: string) => void;
}

export default function QuickInvoiceModal({ isOpen, onClose, onInvoiceCreated }: QuickInvoiceModalProps) {
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [items, setItems] = useState<Array<{
    templateId: string;
    description: string;
    sac_code: string;
    gst_rate: number;
    quantity: string;
    rate: string;
    unit: string;
  }>>([{
    templateId: '',
    description: '',
    sac_code: '',
    gst_rate: 0,
    quantity: '1',
    rate: '',
    unit: 'Nos'
  }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setTemplatesLoading(true);
    setCustomersLoading(true);
    
    try {
      // Fetch service templates and customers in parallel
      const [templatesResponse, customersResponse] = await Promise.all([
        api('/service-templates'),
        api('/customers')
      ]);

      console.log('Templates response:', templatesResponse);
      console.log('Customers response:', customersResponse);

      // Handle array responses directly
      setServiceTemplates(Array.isArray(templatesResponse) ? templatesResponse : []);
      setCustomers(Array.isArray(customersResponse) ? customersResponse : []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setTemplatesLoading(false);
      setCustomersLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate all items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.templateId || !item.rate || !item.quantity) {
          setError(`Please fill in all fields for item ${i + 1}`);
          setLoading(false);
          return;
        }

        const amountValue = parseFloat(item.rate);
        const quantityValue = parseInt(item.quantity);
        
        if (isNaN(amountValue) || amountValue <= 0) {
          setError(`Please enter a valid amount for item ${i + 1}`);
          setLoading(false);
          return;
        }
        
        if (isNaN(quantityValue) || quantityValue <= 0) {
          setError(`Please enter a valid quantity for item ${i + 1}`);
          setLoading(false);
          return;
        }
      }

      if (!selectedCustomer) {
        setError('Please select a customer');
        setLoading(false);
        return;
      }

      const invoiceData = {
        buyer_id: parseInt(selectedCustomer),
        items: items.map(item => {
          const template = serviceTemplates.find(t => t.id === item.templateId);
          return {
            description: template?.description || item.description,
            quantity: parseInt(item.quantity),
            rate: parseFloat(item.rate),
            sac_code: template?.sac_code || item.sac_code,
            gst_rate: template?.gst_rate || item.gst_rate,
            unit: item.unit
          };
        }),
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      };

      console.log('Creating invoice with data:', invoiceData);

      const response = await api('/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData)
      });

      console.log('Invoice created:', response);
      
      onInvoiceCreated(response.id);
      onClose();
      
      // Reset form
      setItems([{
        templateId: '',
        description: '',
        sac_code: '',
        gst_rate: 0,
        quantity: '1',
        rate: '',
        unit: 'Nos'
      }]);
      setSelectedCustomer('');
      
    } catch (error: any) {
      console.error('Error creating quick invoice:', error);
      setError(`Failed to create invoice: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateGST = () => {
    let totalSubtotal = 0;
    let totalGST = 0;
    
    items.forEach(item => {
      if (item.rate && item.quantity) {
        const amountValue = parseFloat(item.rate);
        const quantityValue = parseInt(item.quantity);
        
        if (!isNaN(amountValue) && !isNaN(quantityValue)) {
          const subtotal = amountValue * quantityValue;
          totalSubtotal += subtotal;
          
          // Find template for GST rate
          const template = serviceTemplates.find(t => t.id === item.templateId);
          const gstRate = template?.gst_rate || item.gst_rate || 0;
          const gst = subtotal * (gstRate / 100);
          totalGST += gst;
        }
      }
    });
    
    const total = totalSubtotal + totalGST;
    
    return { subtotal: totalSubtotal, gst: totalGST, total };
  };

  const { subtotal, gst, total } = calculateGST();

  if (!isOpen) return null;

  return (
    <div className="quick-invoice-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="quick-invoice-modal">
        {/* Drag Handle */}
        <div className="drag-handle">
          <div className="handle-bar"></div>
        </div>

        {/* Header */}
        <div className="quick-modal-header">
          <div className="header-content">
            <div className="header-icon">⚡</div>
            <div className="header-text">
              <h2>Quick Invoice</h2>
              <p>Create professional invoice in 30 seconds</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="quick-modal-form">
          {/* Step 1: Customer Selection */}
          <div className="form-step">
            <div className="step-header">
              <div className="step-number">1</div>
              <div className="step-title">
                <h3>Select Customer</h3>
                <p>Choose who you're invoicing</p>
              </div>
            </div>
            
            <div className="input-group">
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="form-select"
                required
                disabled={customersLoading}
              >
                <option value="">
                  {customersLoading ? 'Loading customers...' : 'Choose customer...'}
                </option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone && `(${customer.phone})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: Services & Items */}
          <div className="form-step">
            <div className="step-header">
              <div className="step-number">2</div>
              <div className="step-title">
                <h3>Add Services</h3>
                <p>Select services and enter amounts</p>
              </div>
            </div>
            
            <div className="items-container">
              {items.map((item, index) => (
                <div key={index} className="service-item">
                  <div className="item-header">
                    <span className="item-number">Service {index + 1}</span>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}
                        className="remove-btn"
                        title="Remove service"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6"/>
                          <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="item-fields">
                    <div className="field-group full-width">
                      <label>Service Template</label>
                      <select
                        value={item.templateId}
                        onChange={(e) => {
                          const template = serviceTemplates.find(t => t.id === e.target.value);
                          setItems(prev => prev.map((it, i) => 
                            i === index ? {
                              ...it,
                              templateId: e.target.value,
                              description: template?.description || '',
                              sac_code: template?.sac_code || '',
                              gst_rate: template?.gst_rate || 0,
                              unit: 'Nos'
                            } : it
                          ));
                        }}
                        className="form-select"
                        required
                        disabled={templatesLoading}
                      >
                        <option value="">
                          {templatesLoading ? 'Loading services...' : 'Select service...'}
                        </option>
                        {serviceTemplates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.description} ({template.gst_rate}% GST)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-row">
                      <div className="field-group">
                        <label>Amount (₹)</label>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => setItems(prev => prev.map((it, i) => 
                            i === index ? { ...it, rate: e.target.value } : it
                          ))}
                          className="form-input"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="field-group">
                        <label>Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => setItems(prev => prev.map((it, i) => 
                            i === index ? { ...it, quantity: e.target.value } : it
                          ))}
                          className="form-input"
                          placeholder="1"
                          min="1"
                          required
                        />
                      </div>

                      <div className="field-group">
                        <label>Subtotal</label>
                        <div className="calculated-field">
                          ₹{((parseFloat(item.rate) || 0) * (parseInt(item.quantity) || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setItems(prev => [...prev, {
                  templateId: '',
                  description: '',
                  sac_code: '',
                  gst_rate: 0,
                  quantity: '1',
                  rate: '',
                  unit: 'Nos'
                }])}
                className="add-service-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Another Service
              </button>
            </div>
          </div>

          {/* Step 3: Summary & Create */}
          <div className="form-step">
            <div className="step-header">
              <div className="step-number">3</div>
              <div className="step-title">
                <h3>Invoice Summary</h3>
                <p>Review totals and create invoice</p>
              </div>
            </div>
            
            <div className="invoice-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>GST:</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="cancel-btn" disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="create-btn" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    Create Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}