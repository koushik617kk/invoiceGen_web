import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, API_BASE } from '../api/client';
import styles from '../styles/pages/QuickInvoice.module.css';

interface ServiceTemplate {
  id: number;
  user_id: number;
  business_profile_id: number;
  template_name: string; // NEW: Generic name for template selection
  description: string; // Specific description for invoice
  sac_code: string;
  gst_rate: number;
  hsn_code?: string;
  unit: string;
  base_rate: number;
  currency: string;
  payment_terms: string;
  min_quantity: number;
  max_quantity?: number;
  is_active: boolean;
  is_default: boolean;
  template_type: string; // "service" or "product"
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function QuickInvoice() {
  const navigate = useNavigate();
  const pageTopRef = useRef<HTMLDivElement>(null);
  

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [items, setItems] = useState<Array<{
    description: string;
    sac_code: string;
    hsn_code: string;
    gst_rate: number;
    quantity: string;
    rate: string;
    unit: string;
  }>>([{
    description: '',
    sac_code: '',
    hsn_code: '',
    gst_rate: 18,
    quantity: '1',
    rate: '',
    unit: 'Nos'
  }]);


  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSelectionEvent, setIsSelectionEvent] = useState(false);
  const [userTemplates, setUserTemplates] = useState<any[]>([]);
  const [autoSavingTemplates, setAutoSavingTemplates] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    gstin: '',
    state_code: '',
    phone: ''
  });
  const [customerSaving, setCustomerSaving] = useState(false);

  // This effect will scroll to the top when an error is set
  useEffect(() => {
    if (error) {
      pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [error]);

  useEffect(() => {
    loadCustomers();
    loadUserTemplates();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await api('/customers');
      setCustomers(response);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadUserTemplates = async () => {
    try {
      const response = await api('/service-templates');
      setUserTemplates(response);
    } catch (error) {
      console.error('Failed to load user templates:', error);
    }
  };



  const addItem = () => {
    setItems(prev => [...prev, {
      description: '',
      sac_code: '',
      hsn_code: '',
      gst_rate: 18,
      quantity: '1',
      rate: '',
      unit: 'Nos'
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };



  const calculateGST = () => {
    let totalSubtotal = 0;
    let totalGST = 0;
    
    items.forEach((item) => {
      if (item.rate && item.quantity) {
        const amountValue = parseFloat(item.rate);
        const quantityValue = parseInt(item.quantity);
        
        if (!isNaN(amountValue) && !isNaN(quantityValue) && amountValue > 0 && quantityValue > 0) {
          const subtotal = amountValue * quantityValue;
          totalSubtotal += subtotal;
          
          const gstRate = item.gst_rate || 0;
          const gst = subtotal * (gstRate / 100);
          totalGST += gst;
        }
      }
    });
    
    const total = totalSubtotal + totalGST;
    return { subtotal: totalSubtotal, gst: totalGST, total };
  };

  const { subtotal, gst, total } = calculateGST();

  const createInvoice = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.description.trim()) {
          setError(`Please enter description for item ${i + 1}`);
          setLoading(false);
          return;
        }

        if (!item.rate || parseFloat(item.rate) <= 0) {
          setError(`Please enter a valid rate for item ${i + 1}`);
          setLoading(false);
          return;
        }
        
        if (!item.quantity || parseInt(item.quantity) <= 0) {
          setError(`Please enter a valid quantity for item ${i + 1}`);
          setLoading(false);
          return;
        }
      }

      if (!selectedCustomer && !showNewCustomerForm) {
        setError('Please select a customer or add a new one');
        setLoading(false);
        return;
      }
      
      if (showNewCustomerForm && !newCustomerForm.name.trim()) {
        setError('Please enter customer name or select an existing customer');
        setLoading(false);
        return;
      }
      
      // Create customer if needed
      let customerId = selectedCustomer;
      if (showNewCustomerForm && newCustomerForm.name.trim()) {
        try {
          const customerResponse = await api('/customers', { 
            method: 'POST', 
            body: JSON.stringify(newCustomerForm) 
          });
          customerId = customerResponse.id.toString();
          
          setCustomers(prev => [...prev, customerResponse]);
          setSelectedCustomer(customerId);
          setShowNewCustomerForm(false);
          setNewCustomerForm({ name: '', gstin: '', state_code: '', phone: '' });
        } catch (error: any) {
          setError(`Failed to create customer: ${error?.message || 'Unknown error'}`);
          setLoading(false);
          return;
        }
      }

      const invoiceData = {
        buyer_id: parseInt(customerId),
        items: items.map(item => ({
            description: item.description,
            quantity: parseInt(item.quantity),
            rate: parseFloat(item.rate),
            sac_code: item.sac_code,
          hsn_code: item.hsn_code,
            gst_rate: item.gst_rate,
            unit: item.unit
        })),
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      const response = await api('/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData)
      });

      // Auto-save custom items as templates (background operation)
      items.forEach((item, index) => {
        if (item.description.trim() && (item.sac_code || item.hsn_code)) {
          autoSaveAsTemplate(item, index);
        }
      });

      navigate(`/app/invoice/${response.id}?quickInvoice=true`);
      
    } catch (error: any) {
      console.error('Error creating quick invoice:', error);
      setError(`Failed to create invoice: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async () => {
    if (!newCustomerForm.name.trim()) {
      setError('Please enter customer name');
      return;
    }
    
    setCustomerSaving(true);
    setError('');

    try {
      const response = await api('/customers', { 
        method: 'POST', 
        body: JSON.stringify(newCustomerForm) 
      });
      
      setCustomers(prev => [...prev, response]);
      setSelectedCustomer(response.id.toString());
      setNewCustomerForm({ name: '', gstin: '', state_code: '', phone: '' });
      setShowNewCustomerForm(false);
      
    } catch (error: any) {
      console.error('Failed to create customer:', error);
      setError(`Failed to create customer: ${error?.message || 'Unknown error'}`);
    } finally {
      setCustomerSaving(false);
    }
  };

  useEffect(() => {
    if (isSelectionEvent) {
      setIsSelectionEvent(false);
      return;
    }
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        // Get master data suggestions
        const masterDataResponse = await api(`/master-data/search?q=${searchQuery}&data_type=all&limit=8`);
        
        // Filter user templates that match the search query
        const filteredTemplates = userTemplates.filter(template => 
          template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 3); // Limit to 3 user templates
        
        // Combine suggestions with user templates first
        const combinedSuggestions = [
          ...filteredTemplates.map(template => ({
            ...template,
            type: template.template_type,
            name: template.template_name,
            code: template.template_type === 'service' ? template.sac_code : template.hsn_code,
            isUserTemplate: true
          })),
          ...masterDataResponse
        ];
        
        setSuggestions(combinedSuggestions);
        if (combinedSuggestions.length > 0) {
          setShowSuggestions(true);
        }
    } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, userTemplates]);

  // Effect to handle clicks outside the suggestion box
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.target instanceof Element && !event.target.closest(`.${styles.suggestionsList}`) && !event.target.closest(`.${styles.formInput}`)) {
      setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (suggestion: any, itemIndex: number) => {
    const suggestionType = suggestion.type || 'service'; // Default to service if type is missing

    // Update the specific item with suggestion data
    updateItem(itemIndex, 'description', suggestion.description || suggestion.name);
    
    if (suggestionType === 'service') {
      updateItem(itemIndex, 'sac_code', suggestion.code || '');
      updateItem(itemIndex, 'hsn_code', '');
    } else {
      updateItem(itemIndex, 'hsn_code', suggestion.code || '');
      updateItem(itemIndex, 'sac_code', '');
    }
    
    updateItem(itemIndex, 'gst_rate', suggestion.gst_rate || 18);
    
    setSuggestions([]);
    setShowSuggestions(false); // Explicitly hide on selection
    setIsSelectionEvent(true); // Flag to prevent useEffect from re-opening suggestions
    setSearchQuery(''); // Clear search query
  };

  // Auto-save custom items as templates with duplication prevention
  const autoSaveAsTemplate = async (item: any, itemIndex: number) => {
    try {
      // Check for duplicates based on description and HSN/SAC code
      const isDuplicate = userTemplates.some(template => 
        template.description.toLowerCase() === item.description.toLowerCase() &&
        ((template.sac_code && template.sac_code === item.sac_code) ||
         (template.hsn_code && template.hsn_code === item.hsn_code))
      );

      if (isDuplicate) {
        console.log('Template already exists, skipping auto-save');
      return;
    }
    
      // Mark as saving
      setAutoSavingTemplates(prev => new Set(prev).add(itemIndex));

      // Create template data
      const templateData = {
        template_name: item.description.trim(),
        description: item.description.trim(),
        base_rate: parseFloat(item.rate) || 0,
        hsn_code: item.hsn_code || '',
        sac_code: item.sac_code || '',
        gst_rate: item.gst_rate || 18,
        unit: item.unit || 'Nos',
        template_type: item.hsn_code ? 'product' : 'service'
      };

      // Save template
      const response = await api('/service-templates', { 
        method: 'POST', 
        body: JSON.stringify(templateData)
      });

      // Update user templates list
      setUserTemplates(prev => [...prev, response]);
      console.log('Auto-saved template:', response.template_name);
      
    } catch (error) {
      console.error('Failed to auto-save template:', error);
      // Don't show error to user as this is background operation
    } finally {
      // Remove from saving set
      setAutoSavingTemplates(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemIndex);
        return newSet;
      });
    }
  };



  return (
    <div className={styles.quickInvoiceContainer} ref={pageTopRef}>
      {/* Header */}
      <div className={styles.quickInvoiceHeader}>
        <button className={styles.backButton} onClick={() => navigate('/app')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
          Back
        </button>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1>Quick Invoice</h1>
          </div>
        </div>
      </div>

      {/* Main Error Message Display */}
      {error && (
        <div className={styles.errorMessage}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Customer Section */}
      <div className={styles.formSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionNumber}>1</div>
          <div className={styles.sectionTitle}>
            <h3>Customer Details</h3>
            <p>Select existing customer or add a new one</p>
            </div>
          </div>
          
        {!showNewCustomerForm ? (
          <div className={styles.customerSelection}>
            <div className={styles.formGroup}>
              <label>Select Customer</label>
            <select
              value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className={styles.formSelect}
              >
                <option value="">Choose a customer...</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                    {customer.name}
                </option>
              ))}
            </select>
            </div>
            
            <button
              type="button"
              onClick={() => setShowNewCustomerForm(true)}
              className={styles.addCustomerBtn}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add New Customer
            </button>
          </div>
        ) : (
          <div className={styles.newCustomerForm}>
            <div className={styles.formHeader}>
                  <h4>New Customer Details</h4>
                  <button
                    type="button"
                onClick={() => setShowNewCustomerForm(false)}
                className={styles.closeButton}
              >
                ×
                  </button>
                </div>
                
            <div className={styles.formFields}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Name *</label>
                      <input
                        type="text"
                        value={newCustomerForm.name}
                        onChange={(e) => setNewCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                    className={styles.formInput}
                    placeholder="Customer name"
                        required
                      />
                    </div>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                      <input
                        type="tel"
                        value={newCustomerForm.phone}
                        onChange={(e) => setNewCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                    className={styles.formInput}
                    placeholder="Phone number"
                      />
                    </div>
                  </div>
                  
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                      <label>GSTIN</label>
                      <input
                        type="text"
                        value={newCustomerForm.gstin}
                        onChange={(e) => setNewCustomerForm(prev => ({ ...prev, gstin: e.target.value }))}
                    className={styles.formInput}
                    placeholder="GSTIN (optional)"
                      />
                    </div>
                <div className={styles.formGroup}>
                      <label>State Code</label>
                      <input
                        type="text"
                        value={newCustomerForm.state_code}
                        onChange={(e) => setNewCustomerForm(prev => ({ ...prev, state_code: e.target.value }))}
                    className={styles.formInput}
                    placeholder="State code (optional)"
                      />
                    </div>
                  </div>
                  
              <div className={styles.formActions}>
                    <button
                      type="button"
                      onClick={createCustomer}
                  disabled={customerSaving}
                  className={styles.saveButton}
                    >
                      {customerSaving ? (
                    <div className={styles.spinner}></div>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20,6 9,17 4,12"></polyline>
                          </svg>
                          Save Customer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
      </div>

      {/* Items Section */}
      <div className={styles.formSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionNumber}>2</div>
          <div className={styles.sectionTitle}>
            <h3>Invoice Items</h3>
            <p>Add services or products to your invoice</p>
          </div>
        </div>

        <div className={styles.itemsContainer}>
          {items.map((item, index) => (
            <div key={index} className={styles.invoiceItem}>
              <div className={styles.itemHeader}>
                <div className={styles.itemTitle}>
                  <span className={styles.itemNumber}>Item {index + 1}</span>
                  {autoSavingTemplates.has(index) && (
                    <span className={styles.autoSaveIndicator}>
                      💾 Saving as template...
                    </span>
                  )}
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className={styles.removeButton}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
                  </div>

              <div className={styles.inlineItemForm}>
                {/* Smart Search for HSN/SAC Codes */}
                  <div className={styles.formGroup} style={{ position: 'relative' }}>
                  <label>Search HSN/SAC Code</label>
                        <input
                          type="text"
                      className={styles.formInput}
                    placeholder="Type to search for HSN/SAC codes (e.g., 'iPhone repair', 'laptop')"
                    value={searchQuery}
                          onChange={(e) => {
                      setIsSelectionEvent(false);
                        setSearchQuery(e.target.value);
                      }}
                      onFocus={() => {
                        if (suggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      autoComplete="off"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className={styles.suggestionsList}>
                      {/* User Templates - Show First */}
                      {suggestions.filter(s => s.isUserTemplate).length > 0 && (
                         <div className={styles.suggestionSectionHeader}>⭐ Your Templates</div>
                      )}
                      {suggestions.filter(s => s.isUserTemplate).map((s, i) => (
                        <li key={`user-template-${i}`} onClick={() => handleSuggestionClick(s, index)}>
                          <div className={styles.suggestionContent}>
                            <span className={styles.suggestionDesc}>{s.description}</span>
                            <div className={styles.suggestionDetails}>
                              {s.code && <span>{s.type === 'service' ? 'SAC' : 'HSN'}: {s.code}</span>}
                              <span>GST: {s.gst_rate}%</span>
                              <span className={styles.userTemplateBadge}>Your Template</span>
                          </div>
                                </div>
                        </li>
                      ))}

                        {/* Service Suggestions */}
                      {suggestions.filter(s => s.type === 'service' && !s.isUserTemplate).length > 0 && (
                           <div className={styles.suggestionSectionHeader}>🖥️ Services</div>
                        )}
                      {suggestions.filter(s => s.type === 'service' && !s.isUserTemplate).map((s, i) => (
                        <li key={`service-${i}`} onClick={() => handleSuggestionClick(s, index)}>
                            <div className={styles.suggestionContent}>
                              <span className={styles.suggestionDesc}>{s.description}</span>
                              <div className={styles.suggestionDetails}>
                                {s.code && <span>SAC: {s.code}</span>}
                                <span>GST: {s.gst_rate}%</span>
                            </div>
                                  </div>
                          </li>
                        ))}

                        {/* Product Suggestions */}
                      {suggestions.filter(s => s.type === 'product' && !s.isUserTemplate).length > 0 && (
                           <div className={styles.suggestionSectionHeader}>🏭 Products</div>
                        )}
                      {suggestions.filter(s => s.type === 'product' && !s.isUserTemplate).map((s, i) => (
                        <li key={`product-${i}`} onClick={() => handleSuggestionClick(s, index)}>
                            <div className={styles.suggestionContent}>
                              <span className={styles.suggestionDesc}>{s.name}</span>
                              <div className={styles.suggestionDetails}>
                                {s.code && <span>HSN: {s.code}</span>}
                                <span>GST: {s.gst_rate}%</span>
                                  </div>
                                </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                {/* Custom Description */}
                    <div className={styles.formGroup}>
                  <label>Item Description *</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className={styles.formTextarea}
                    placeholder="Enter the exact description that will appear on the invoice..."
                        rows={3}
                        required
                      />
                </div>

                {/* HSN/SAC Code and GST Rate */}
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                    <label>HSN/SAC Code *</label>
                    <input
                      type="text"
                        value={item.hsn_code || item.sac_code}
                      onChange={(e) => {
                          if (item.sac_code) {
                            updateItem(index, 'sac_code', e.target.value);
                          } else {
                            updateItem(index, 'hsn_code', e.target.value);
                          }
                        }}
                        className={styles.formInput}
                      placeholder="e.g., 998314 (SAC) or 8517 (HSN)"
                      required
                      />
                              </div>
                    <div className={styles.formGroup}>
                      <label>GST Rate (%)</label>
                    <select
                        value={item.gst_rate}
                        onChange={(e) => updateItem(index, 'gst_rate', parseInt(e.target.value))}
                        className={styles.formSelect}
                      >
                        <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                </div>

                {/* Rate and Quantity */}
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                    <label>Rate (₹) *</label>
                    <input
                        type="number"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', e.target.value)}
                        className={styles.formInput}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                        required
                    />
                  </div>
                    <div className={styles.formGroup}>
                    <label>Quantity *</label>
                    <input
                        type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className={styles.formInput}
                      placeholder="1"
                      min="1"
                        step="0.01"
                        required
                    />
                  </div>
                  </div>
                  </div>
                </div>
          ))}
                      </div>
                      
        {/* Add Item Button */}
            <button
              type="button"
          onClick={addItem}
          className={styles.addItemButton}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
              </svg>
          Add Another Item
                  </button>
        </div>

      {/* Invoice Summary */}
      <div className={styles.formSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionNumber}>3</div>
          <div className={styles.sectionTitle}>
              <h3>Invoice Summary</h3>
            <p>Review totals before creating invoice</p>
            </div>
          </div>
          
        <div className={styles.invoiceSummary}>
          <div className={styles.summaryRow}>
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
          <div className={styles.summaryRow}>
            <span>GST ({items[0]?.gst_rate || 18}%):</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>
          <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
          </div>
            </div>
          </div>

      {/* Create Invoice Button */}
      <div className={styles.formSection}>
        <button
          type="button"
          onClick={createInvoice}
          disabled={loading}
          className={styles.createInvoiceButton}
        >
              {loading ? (
            <div className={styles.spinner}></div>
              ) : (
                <>
                  Create Invoice
                </>
              )}
            </button>
          </div>
    </div>
  );
}
