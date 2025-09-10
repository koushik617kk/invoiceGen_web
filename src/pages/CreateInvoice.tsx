import React from 'react'
import { api } from '../api/client'
import { showToast } from '../ui/ToastHost'
import SuccessToast from '../components/SuccessToast'
import { useNavigate } from 'react-router-dom'

type Item = { 
  description: string; 
  hsn_code?: string; 
  sac_code?: string;
  gst_rate: number; 
  quantity: number; 
  unit?: string;
  rate: number;
  discount_percent?: number;
  discount_amount?: number;
  templateId?: number | null; // Add template ID for linking
  searchTerm?: string; // Add search term for template search
  showSearchResults?: boolean; // Add search results visibility
  invoice_description?: string; // Description that gets printed on the invoice
}

interface Template {
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

export default function CreateInvoice() {
  const [customers, setCustomers] = React.useState<any[]>([])
  const [buyerId, setBuyerId] = React.useState<number | ''>('' as any)
  const [items, setItems] = React.useState<Item[]>([{ 
    description: '', 
    hsn_code: '', 
    sac_code: '', 
    gst_rate: 0, 
    quantity: 1, 
    unit: 'Nos',
    rate: 0,
    discount_percent: 0,
    discount_amount: 0,
    templateId: null,
    searchTerm: '',
    showSearchResults: false,
    invoice_description: ''
  }])
  const [invDate, setInvDate] = React.useState<string>('')
  const [dueDate, setDueDate] = React.useState<string>('')
  const [hsnResults, setHsnResults] = React.useState<Record<number, any[]>>({})
  const [hsnActive, setHsnActive] = React.useState<Record<number, number>>({})
  
  // AI Service Suggestions state
  const [serviceSuggestions, setServiceSuggestions] = React.useState<Record<number, any[]>>({})
  const [showServiceSuggestions, setShowServiceSuggestions] = React.useState<Record<number, boolean>>({})
  
  // Template search state
  const [templates, setTemplates] = React.useState<Template[]>([])
  const [templatesLoading, setTemplatesLoading] = React.useState(false)
  
  const [preview, setPreview] = React.useState<any | null>(null)
  const [creating, setCreating] = React.useState(false)
  
  // Library search state
  const [showLibrarySearch, setShowLibrarySearch] = React.useState<number | null>(null)
  const [libraryItems, setLibraryItems] = React.useState<any[]>([])
  const [librarySearchTerm, setLibrarySearchTerm] = React.useState('')
  const [libraryLoading, setLibraryLoading] = React.useState(false)
  
  // GST Compliance form state
  const [gstForm, setGstForm] = React.useState({
    reverse_charge: false,
    ecommerce_gstin: '',
    export_type: '',
    terms_and_conditions: ''
  })
  
  const navigate = useNavigate()
  
  // Save to template state
  const [savingToTemplate, setSavingToTemplate] = React.useState<Record<number, boolean>>({})
  
  // Auto-save setting (could be moved to user preferences later)
  const [autoSaveTemplates, setAutoSaveTemplates] = React.useState(true)

  // Success toast state
  const [successToast, setSuccessToast] = React.useState({ visible: false, message: '' })

  // Debug useEffect to track state changes
  React.useEffect(() => {
    console.log('🔍 Items state changed:', items.map((item, i) => ({ 
      index: i, 
      description: item.description, 
      showSearchResults: item.showSearchResults,
      hsn_code: item.hsn_code,
      gst_rate: item.gst_rate
    })));
  }, [items]);

  React.useEffect(() => { 
    api('/customers').then(setCustomers)
    api('/service-templates').then(setTemplates)
    loadLibraryItems()
  }, [])

  // Close template search results when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.description-input-wrapper')) {
        // Small delay to ensure click events on suggestions work
        setTimeout(() => {
          setItems(prev => prev.map(item => ({ ...item, showSearchResults: false })));
        }, 100);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setItems(prev => prev.map(item => ({ ...item, showSearchResults: false })));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  async function loadLibraryItems() {
    try {
      setLibraryLoading(true)
      const response = await api('/item-library')
      setLibraryItems(response || [])
    } catch (error) {
      console.error('Failed to load library items:', error)
      setLibraryItems([])
    } finally {
      setLibraryLoading(false)
    }
  }

  // Template search and selection
  function searchTemplates(searchTerm: string, itemIndex: number) {
    if (searchTerm.length < 2) {
      setItems(prev => prev.map((it, i) => 
        i === itemIndex ? { ...it, showSearchResults: false } : it
      ))
      return
    }

    setItems(prev => prev.map((it, i) => 
      i === itemIndex ? { ...it, showSearchResults: true } : it
    ))
  }

  function selectTemplate(template: Template, itemIndex: number) {
    console.log('🎯 Selecting template:', template);
    console.log('📝 Current items before:', items);
    
    setItems(prev => prev.map((it, i) => 
      i === itemIndex ? {
        ...it,
        templateId: template.id,
        description: template.description || '',
        sac_code: template.sac_code || '',
        hsn_code: template.hsn_code || '',
        gst_rate: template.gst_rate || 0,
        unit: template.unit || 'Nos',
        rate: template.base_rate || 0,
        searchTerm: template.description,
        showSearchResults: false,
        // Only auto-fill if invoice_description has NEVER been set
        invoice_description: (it.invoice_description === undefined || it.invoice_description === null) ? (template.description || '') : it.invoice_description
      } : it
    ))
    
    // Show success message
    showToast(`Template "${template.description}" selected!`, 'success')
  }

  function selectLibraryItem(item: any, itemIndex: number) {
    setItems(prev => prev.map((it, i) => 
      i === itemIndex ? {
        ...it,
        description: item.description,
        hsn_code: item.hsn_code,
        sac_code: item.sac_code,
        gst_rate: item.gst_rate,
        unit: item.unit,
        // Only auto-fill if invoice_description has NEVER been set
        invoice_description: (it.invoice_description === undefined || it.invoice_description === null) ? (item.description || '') : it.invoice_description
      } : it
    ))
    setShowLibrarySearch(null)
    setLibrarySearchTerm('')
    showToast(`Added "${item.description}" from library`, 'success')
  }

  function setItem(idx: number, patch: Partial<Item>) {
    console.log('🔧 setItem called:', { idx, patch });
    console.log('📝 Items before update:', items);
    
    setItems((arr) => {
      const newArr = arr.map((it, i) => i === idx ? { ...it, ...patch } : it);
      console.log('📝 Items after update:', newArr);
      return newArr;
    })
  }

  // Handle service suggestion selection
  function selectServiceSuggestion(idx: number, suggestion: any) {
    console.log('💡 Selecting service suggestion:', suggestion);
    console.log('📝 Suggestion properties:', {
      description: suggestion.description,
      sac_code: suggestion.sac_code,
      gst_rate: suggestion.gst_rate,
      hsn_code: suggestion.hsn_code,
      unit: suggestion.unit,
      name: suggestion.name
    });
    console.log('🔍 All suggestion properties:', Object.keys(suggestion));
    console.log('🔍 Full suggestion object:', JSON.stringify(suggestion, null, 2));
    console.log('📝 Current item before:', items[idx]);
    
    setItems(prev => prev.map((it, i) => {
      // Only auto-fill if the field has NEVER been touched (completely undefined/null)
      // Once the user has interacted with it, respect their input completely
      const shouldAutoFill = it.invoice_description === undefined || it.invoice_description === null;
      const newInvoiceDescription = shouldAutoFill ? (suggestion.name || suggestion.description || '') : it.invoice_description;
      
      console.log('🔍 Invoice Description Logic:', {
        current: it.invoice_description,
        shouldAutoFill,
        newValue: newInvoiceDescription,
        suggestionName: suggestion.name,
        suggestionDescription: suggestion.description
      });
      
      return i === idx ? {
        ...it,
        description: suggestion.description || suggestion.name || '',
        sac_code: suggestion.sac_code || suggestion.code || '', // Try both sac_code and code
        gst_rate: suggestion.gst_rate || 0,
        hsn_code: suggestion.hsn_code || '', // Services typically don't have HSN codes
        unit: suggestion.unit || 'Nos',
        showSearchResults: false,
        // Only auto-fill if invoice_description has NEVER been set
        invoice_description: newInvoiceDescription
      } : it;
    }));
    
    // Hide suggestions
    setServiceSuggestions((m) => ({ ...m, [idx]: [] }))
    setShowServiceSuggestions((m) => ({ ...m, [idx]: false }))
    
    console.log('📝 Item after update:', items[idx]);
    
    // Removed problematic analytics API call that was causing 422 error
  }

  // Handle HSN/SAC suggestions and service suggestions
  async function suggest(idx: number, value: string) {
    setItem(idx, { description: value })
    
    if (value.length < 2) {
      setHsnResults((m) => ({ ...m, [idx]: [] }))
      setServiceSuggestions((m) => ({ ...m, [idx]: [] }))
      setShowServiceSuggestions((m) => ({ ...m, [idx]: false }))
      return
    }

    // Use unified search API for better results
    try {
      const unifiedResponse = await api(`/master-data/search?q=${encodeURIComponent(value)}&data_type=all&limit=10`)
      const allResults = Array.isArray(unifiedResponse) ? unifiedResponse : []
      
      console.log('🔍 API Response:', allResults);
      
      // Separate products and services
      const products = allResults.filter(item => item.type === 'product')
      const services = allResults.filter(item => item.type === 'service')
      
      console.log('🏭 Products found:', products);
      console.log('💡 Services found:', services);
      if (services.length > 0) {
        console.log('🔍 First service structure:', JSON.stringify(services[0], null, 2));
      }
      
      // Set HSN results (products)
      setHsnResults((m) => ({ ...m, [idx]: products }))
      
      // Set service suggestions
      setServiceSuggestions((m) => ({ ...m, [idx]: services }))
      setShowServiceSuggestions((m) => ({ ...m, [idx]: services.length > 0 }))
      
    } catch (error) {
      console.error('Unified search failed:', error)
      setHsnResults((m) => ({ ...m, [idx]: [] }))
      setServiceSuggestions((m) => ({ ...m, [idx]: [] }))
      setShowServiceSuggestions((m) => ({ ...m, [idx]: false }))
    }
  }

  async function create() {
    if (!buyerId) return alert('Select a customer')
    try {
      setCreating(true)
      const body: any = { buyer_id: Number(buyerId), items }
      if (invDate) body.date = invDate
      if (dueDate) body.due_date = dueDate
      if (gstForm.reverse_charge) body.reverse_charge = gstForm.reverse_charge
      if (gstForm.ecommerce_gstin) body.ecommerce_gstin = gstForm.ecommerce_gstin
      if (gstForm.export_type) body.export_type = gstForm.export_type
      if (gstForm.terms_and_conditions) body.terms_and_conditions = gstForm.terms_and_conditions
      
      // Debug: Log what's being sent to backend
      console.log('📤 Creating invoice with data:', {
        buyer_id: body.buyer_id,
        items: body.items.map((item: any, idx: number) => ({
          idx,
          description: item.description,
          invoice_description: item.invoice_description,
          hsn_code: item.hsn_code,
          sac_code: item.sac_code,
          gst_rate: item.gst_rate,
          rate: item.rate,
          quantity: item.quantity
        }))
      });
      
    const inv = await api('/invoices', { method: 'POST', body: JSON.stringify(body) })
    
    // Debug: Log backend response
    console.log('📥 Backend response:', inv);
    
    setPreview(inv)
      
      // Auto-save useful items as templates (if enabled)
      if (autoSaveTemplates) {
        await autoSaveItemsAsTemplates()
      }
      
      showToast(`Invoice #${inv.invoice_number} created`, 'success')
      setSuccessToast({ visible: true, message: `Invoice #${inv.invoice_number} created successfully!` })
      navigate(`/app/invoice/${inv.id}`)
    } finally {
      setCreating(false)
    }
  }
  
  // Save item as service template
  async function saveAsTemplate(itemIndex: number) {
    const item = items[itemIndex]
    
    // Validate item has required data
    if (!item.description || !item.description.trim()) {
      showToast('Please enter a description before saving as template', 'error')
      return
    }
    
    try {
      setSavingToTemplate(prev => ({ ...prev, [itemIndex]: true }))
      
      const templateData = {
        template_name: item.description.trim(), // NEW: Use description as template name
        description: item.description.trim(), // Use same description for invoice description
        hsn_code: item.hsn_code || '',
        sac_code: item.sac_code || '',
        gst_rate: item.gst_rate || 0,
        base_rate: item.rate || 0,  // Backend expects 'base_rate', not 'rate'
        unit: item.unit || 'Nos',
        // Additional required fields for backend
        currency: 'INR',
        payment_terms: 'Net 30 days',
        min_quantity: 1.0,
        is_active: true,
        is_default: false,
        template_type: item.hsn_code ? 'product' : 'service' // Determine type based on HSN code
      }
      
      console.log('💾 Saving template with data:', templateData)
      
      const response = await api('/service-templates', { 
        method: 'POST', 
        body: JSON.stringify(templateData)
      })
      
      console.log('✅ Template saved successfully:', response)
      showToast(`"${item.description}" saved as template!`, 'success')
      
      // Refresh library items so it appears in suggestions
      loadLibraryItems()
      
    } catch (error: any) {
      console.error('Error saving template:', error)
      showToast('Failed to save template: ' + (error.message || 'Unknown error'), 'error')
    } finally {
      setSavingToTemplate(prev => ({ ...prev, [itemIndex]: false }))
    }
  }
  
  // Auto-save items as templates when invoice is created
  async function autoSaveItemsAsTemplates() {
    try {
      const itemsToSave = items.filter(item => {
        // Only save items with meaningful descriptions and rates
        return item.description && 
               item.description.trim().length > 3 && 
               item.rate > 0 &&
               // Skip generic descriptions
               !/(test|sample|demo|item|product|service)$/i.test(item.description.trim())
      })
      
      if (itemsToSave.length === 0) return
      
      console.log(`🤖 Auto-saving ${itemsToSave.length} items as templates...`)
      
      let savedCount = 0
      for (const item of itemsToSave) {
        try {
          const templateData = {
            template_name: item.description.trim(), // NEW: Use description as template name
            description: item.description.trim(), // Use same description for invoice description
            hsn_code: item.hsn_code || '',
            sac_code: item.sac_code || '',
            gst_rate: item.gst_rate || 0,
            base_rate: item.rate || 0,
            unit: item.unit || 'Nos',
            currency: 'INR',
            payment_terms: 'Net 30 days',
            min_quantity: 1.0,
            is_active: true,
            is_default: false,
            template_type: item.hsn_code ? 'product' : 'service' // Determine type based on HSN code
          }
          
          await api('/service-templates', { 
            method: 'POST', 
            body: JSON.stringify(templateData)
          })
          
          savedCount++
        } catch (error) {
          // Skip if template already exists or other error
          console.log(`Skipped saving "${item.description}":`, error)
        }
      }
      
      if (savedCount > 0) {
        showToast(`✨ Auto-saved ${savedCount} item${savedCount > 1 ? 's' : ''} as template${savedCount > 1 ? 's' : ''}!`, 'success')
        // Refresh library for future use
        loadLibraryItems()
      }
      
    } catch (error) {
      console.error('Auto-save templates failed:', error)
      // Don't show error to user - it's a background feature
    }
  }

  const totals = React.useMemo(() => {
    const subtotal = items.reduce((s, it) => s + (it.quantity * it.rate), 0)
    // approximate client-side GST for display; server is source of truth
    const tax = items.reduce((s, it) => s + (it.quantity * it.rate * (it.gst_rate / 100)), 0)
    return { subtotal, total: subtotal + tax }
  }, [items])

  function addItem() {
    setItems([...items, { 
      description: '', 
      hsn_code: '', 
      sac_code: '', 
      gst_rate: 0, 
      quantity: 1, 
      unit: 'Nos',
      rate: 0,
      discount_percent: 0,
      discount_amount: 0,
      templateId: null,
      searchTerm: '',
      showSearchResults: false,
      invoice_description: ''
    }])
    
    // Auto-scroll to the new item after a short delay to ensure DOM update
    setTimeout(() => {
      const newItemElement = document.querySelector('.item-card.new-item')
      if (newItemElement) {
        newItemElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
      }
    }, 100)
  }

  function removeItem(idx: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx))
    }
  }

  return (
    <div className="create-invoice-container">
      {/* Header Section */}
      <div className="create-header">
        <h1 className="create-title">Create New Invoice</h1>
        <p className="create-subtitle">Fill in the details below to create a professional invoice</p>
      </div>

      {/* Basic Information Section */}
      <div className="info-section">
        <div className="section-header">
          <h2 className="section-title">
            <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
              <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z"/>
              <path d="M12 3c0 1-1 2-2 2s-2 1-2 2 1 2 2 2 2 1 2 2"/>
              <path d="M12 21c0-1 1-2 2-2s2-1 2-2-1-2-2-2-2-1-2-2"/>
            </svg>
            Basic Information
          </h2>
      </div>

        <div className="info-grid">
      {/* Customer Selection */}
          <div className="form-group">
            <label className="form-label">Customer</label>
            <div className="input-with-button">
              <select 
                className="form-select" 
                value={buyerId} 
                onChange={e => setBuyerId(Number(e.target.value))}
              >
        <option value="">Select customer</option>
        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
        <button 
                className="secondary-btn" 
          onClick={() => navigate('/app/customers')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Customer
        </button>
      </div>
          </div>
          
          {/* Date Fields */}
          <div className="form-group">
            <label className="form-label">Invoice Date</label>
            <input 
              className="form-input" 
              type="date" 
              value={invDate} 
              onChange={e => setInvDate(e.target.value)} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input 
              className="form-input" 
              type="date" 
              value={dueDate} 
              onChange={e => setDueDate(e.target.value)} 
            />
          </div>
          </div>
        </div>
        
      {/* Items Section */}
      <div className="items-section">
        <div className="section-header">
          <h2 className="section-title">
            <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c-1 0-2-1-2-2s1-1 2-2 2 1 2 2-1 2-2 2z"/>
              <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z"/>
              <path d="M12 3c0 1-1 2-2 2s-2 1-2 2 1 2 2 2 2 1 2 2"/>
              <path d="M12 21c0-1 1-2 2-2s2-1 2-2-1-2-2-2-2-1-2-2"/>
            </svg>
            Invoice Items
          </h2>
      </div>

        {items.map((item, idx) => (
          <div key={idx} className={`item-card ${idx === items.length - 1 ? 'new-item' : 'existing-item'}`}>
            <div className="item-header">
              <div className="item-number">Item #{idx + 1}</div>
              {idx === items.length - 1 ? (
                <span className="new-badge">New Item</span>
              ) : (
                <span className="existing-badge">Existing Item</span>
              )}
              
              <div className="item-actions">
                {/* Save as Template Button - Always show for debugging */}
                <button 
                  className="save-template-btn" 
                  onClick={() => saveAsTemplate(idx)}
                  disabled={savingToTemplate[idx] || !item.description?.trim()}
                  title="Save as template for future use"
                  style={{ 
                    opacity: (!item.description?.trim()) ? 0.3 : 1,
                    border: '2px solid #16a34a' // Make it more visible
                  }}
                >
                    {savingToTemplate[idx] ? (
                      <svg className="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 12a8 8 0 0 1 8-8V4l5 5-5 5V8a8 8 0 1 0 8 8"/>
                      </svg>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                          <polyline points="17,21 17,13 7,13 7,21"/>
                          <polyline points="7,3 7,8 15,8"/>
                        </svg>
                        <span style={{marginLeft: '4px', fontSize: '12px'}}>Save</span>
                      </>
                    )}
                  </button>
                
                {/* Remove Item Button */}
                {items.length > 1 && (
                  <button 
                    className="remove-item-btn" 
                    onClick={() => removeItem(idx)}
                    title="Remove item"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
        </div>
      </div>

            <div className="item-fields">

              {/* Item Description Row */}
              <div className="field-row">
                <div className="form-group full-width">
                  <label className="form-label">Item Description 
                    <span className="ai-badge">🤖 AI Assisted</span>
                  </label>
                  
                  {/* Smart Unified Input - Template Search + AI Suggestions + Manual Edit */}
                  <div className="description-input-wrapper" style={{ position: 'relative' }}>
              <input
                      className="form-input"
                      placeholder="Search templates or type description for AI suggestions..."
                      value={item.description}
                      onChange={e => {
                        const value = e.target.value;
                        setItem(idx, { description: value });
                        suggest(idx, value);
                        searchTemplates(value, idx);
                      }}
                      onFocus={() => {
                        console.log('🎯 Input focused for item', idx);
                        setItems(prev => prev.map((it, i) => 
                          i === idx ? { ...it, showSearchResults: true } : it
                        ));
                        console.log('🎯 Set showSearchResults to true for item', idx);
                      }}
                onKeyDown={(e) => {
                  const list = hsnResults[idx] || []
                  if (!list.length) return
                  const current = hsnActive[idx] ?? 0
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    const next = (current + 1) % list.length
                    setHsnActive((m) => ({ ...m, [idx]: next }))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    const next = (current - 1 + list.length) % list.length
                    setHsnActive((m) => ({ ...m, [idx]: next }))
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    const r = list[current]
                    if (r) {
                            const newDesc = (item.description || '').trim()
                      const shouldReplace = newDesc.length < 3 || /^(item|desc|description)?$/i.test(newDesc)
                            setItem(idx, { hsn_code: r.code || r.hsn_code || '', gst_rate: r.gst_rate || 0, description: shouldReplace ? r.name : item.description })
                      setHsnResults((m) => ({ ...m, [idx]: [] }))
                    }
                  }
                }}
                      onBlur={() => {
                        // Don't close immediately - let click events happen first
                        // The click outside handler will close it properly
                      }}
                    />
                    
                    {/* Smart Suggestions Panel - Templates + AI Suggestions */}
                    {(item.showSearchResults && (item.description || '').length > 0) && (
                      <div className="suggestions-panel" style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #e1e5e9',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '400px',
                        overflowY: 'auto'
                      }}>
                        
                        {/* Template Suggestions Section */}
                        {templates.filter(template => 
                          template.template_name.toLowerCase().includes((item.description || '').toLowerCase()) ||
                          template.description.toLowerCase().includes((item.description || '').toLowerCase()) ||
                          template.sac_code.includes(item.description || '') ||
                          (template.hsn_code && template.hsn_code.includes(item.description || ''))
                        ).length > 0 && (
                          <div>
                            <div style={{
                              padding: '8px 12px',
                              backgroundColor: '#f0f9ff',
                              borderBottom: '1px solid #e1e5e9',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#0369a1'
                            }}>
                              📋 Existing Templates
                            </div>
                            {templates
                              .filter(template => 
                                template.template_name.toLowerCase().includes((item.description || '').toLowerCase()) ||
                                template.description.toLowerCase().includes((item.description || '').toLowerCase()) ||
                                template.sac_code.includes(item.description || '') ||
                                (template.hsn_code && template.hsn_code.includes(item.description || ''))
                              )
                              .slice(0, 4)
                              .map(template => (
                                <div
                                  key={template.id}
                                  style={{
                                    padding: '12px',
                                    borderBottom: '1px solid #f1f5f9',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  onClick={() => selectTemplate(template, idx)}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ 
                                        fontWeight: '600', 
                                        color: '#1e293b',
                                        fontSize: '14px',
                                        marginBottom: '4px'
                                      }}>
                                        {template.template_type === 'service' ? '🖥️' : '🏭'} {template.description}
                                      </div>
                                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                                        {template.template_type === 'service' ? 'Service' : 'Product'}
                                      </div>
                                    </div>
                                    <div style={{ 
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-end',
                                      marginLeft: '12px'
                                    }}>
                                      <span style={{ 
                                        fontSize: '11px',
                                        backgroundColor: '#e2e8f0',
                                        color: '#475569',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        marginBottom: '2px'
                                      }}>
                                        {template.hsn_code ? 'HSN' : 'SAC'}: {template.hsn_code || template.sac_code}
                                      </span>
                                      <span style={{ 
                                        fontSize: '11px',
                                        backgroundColor: '#dcfce7',
                                        color: '#166534',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                      }}>
                                        GST: {template.gst_rate}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Service Suggestions Section */}
                        {showServiceSuggestions[idx] && serviceSuggestions[idx]?.length ? (
                          <div className="suggestions-container" style={{
                            maxHeight: '300px',
                            overflowY: 'auto',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            backgroundColor: 'white',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            marginTop: '8px'
                          }}>
                            <div style={{
                              padding: '12px 16px',
                              backgroundColor: '#dbeafe',
                              borderBottom: '1px solid #3b82f6',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#1e40af',
                              // Removed sticky positioning to prevent overlap
                              zIndex: 1
                            }}>
                              🖥️ Services ({serviceSuggestions[idx].length})
                            </div>
                            {serviceSuggestions[idx].map((suggestion: any, i: number) => (
                              <div
                                key={suggestion.id || i}
                                style={{
                                  padding: '16px',
                                  borderBottom: i < serviceSuggestions[idx].length - 1 ? '1px solid #f1f5f9' : 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  backgroundColor: 'white'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                onClick={() => selectServiceSuggestion(idx, suggestion)}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ 
                                      fontWeight: '600', 
                                      color: '#1e293b',
                                      fontSize: '15px',
                                      marginBottom: '8px',
                                      lineHeight: '1.3'
                                    }}>
                                      💡 {suggestion.name}
                                    </div>
                                    <div style={{ 
                                      fontSize: '12px',
                                      color: '#64748b',
                                      marginBottom: '6px',
                                      lineHeight: '1.5'
                                    }}>
                                      {suggestion.description}
                                    </div>
                                    <div style={{ 
                                      fontSize: '11px', 
                                      color: '#94a3b8',
                                      textTransform: 'capitalize',
                                      lineHeight: '1.4'
                                    }}>
                                      {suggestion.category?.replace('_', ' ')}
                                    </div>
                                  </div>
                                  <div style={{ 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    marginLeft: '16px',
                                    gap: '6px'
                                  }}>
                                    <span style={{ 
                                      fontSize: '12px',
                                      backgroundColor: '#e2e8f0',
                                      color: '#475569',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontWeight: '500'
                                    }}>
                                      SAC: {suggestion.sac_code || suggestion.code || 'N/A'}
                                    </span>
                                    <span style={{ 
                                      fontSize: '12px',
                                      backgroundColor: '#dcfce7',
                                      color: '#166534',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontWeight: '500'
                                    }}>
                                      GST: {suggestion.gst_rate}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
            </div>
                        ) : null}

                        {/* HSN Codes Section */}
            {hsnResults[idx]?.length ? (
                          <div className="suggestions-container" style={{
                            maxHeight: '300px',
                            overflowY: 'auto',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            backgroundColor: 'white',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            marginTop: '8px'
                          }}>
                            <div style={{
                              padding: '12px 16px',
                              backgroundColor: '#fef3c7',
                              borderBottom: '1px solid #f59e0b',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#92400e',
                              // Removed sticky positioning to prevent overlap
                              zIndex: 1
                            }}>
                              🏭 Products ({hsnResults[idx].length})
                            </div>
                            {hsnResults[idx].map((hsn: any, i: number) => (
                              <div
                                key={hsn.id || i}
                                style={{
                                  padding: '16px',
                                  borderBottom: i < hsnResults[idx].length - 1 ? '1px solid #f1f5f9' : 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  backgroundColor: 'white'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef7ed'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    onClick={() => {
                                  console.log('🏭 Selecting HSN:', hsn);
                                  console.log('📝 HSN properties:', {
                                    code: hsn.code,
                                    hsn_code: hsn.hsn_code,
                                    name: hsn.name,
                                    gst_rate: hsn.gst_rate
                                  });
                                  console.log('📝 Current item before:', items[idx]);
                                  
                                  const newDesc = (items[idx].description || '').trim()
                      const shouldReplace = newDesc.length < 3 || /^(item|desc|description)?$/i.test(newDesc)
                                  
                                  setItems(prev => prev.map((it, i) => 
                                    i === idx ? {
                                      ...it,
                                      hsn_code: hsn.code || hsn.hsn_code || '', // Try both code and hsn_code
                                      gst_rate: hsn.gst_rate || 0,
                                      description: shouldReplace ? hsn.name : it.description,
                                      showSearchResults: false,
                                      // Only auto-fill if invoice_description has NEVER been set
                                      invoice_description: (it.invoice_description === undefined || it.invoice_description === null) ? (hsn.name || '') : it.invoice_description
                                    } : it
                                  ));
                                  
                      setHsnResults((m) => ({ ...m, [idx]: [] }))
                                  
                                  console.log('📝 Item after update:', items[idx]);
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ 
                                      fontWeight: '600', 
                                      color: '#1e293b',
                                      fontSize: '15px',
                                      marginBottom: '8px',
                                      lineHeight: '1.3'
                                    }}>
                                      🏭 {hsn.name}
                                    </div>
                                    <div style={{ 
                                      fontSize: '12px', 
                                      color: '#64748b',
                                      marginBottom: '6px',
                                      lineHeight: '1.5'
                                    }}>
                                      {hsn.description || hsn.category?.replace('_', ' ') || 'Product'}
                                    </div>
                                  </div>
                                  <div style={{ 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    marginLeft: '16px',
                                    gap: '6px'
                                  }}>
                                    <span style={{ 
                                      fontSize: '12px',
                                      backgroundColor: '#fef3c7',
                                      color: '#92400e',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontWeight: '500'
                                    }}>
                                      HSN: {hsn.code}
                                    </span>
                                    <span style={{ 
                                      fontSize: '12px',
                                      backgroundColor: '#dcfce7',
                                      color: '#166534',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontWeight: '500'
                                    }}>
                                      GST: {hsn.gst_rate}%
                                    </span>
                                  </div>
                                </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
                    )}
                  </div>
            {/* Combined Suggestions Panel */}
            {/* REMOVED - Now integrated into the smart unified input above */}
          </div>
        </div>

              {/* HSN/SAC Row */}
              <div className="field-row">
                <div className="form-group">
                  <label className="form-label">HSN Code</label>
                  <input 
                    className="form-input" 
                    placeholder="HSN" 
                    value={item.hsn_code || ''}
                onChange={e => {
                  const code = e.target.value
                  setItem(idx, { hsn_code: code })
                      // Auto-fill GST rate if HSN code matches from suggestions
                      const fromList = (hsnResults[idx] || []).find((r: any) => (r.code || r.hsn_code) === code)
                      if (fromList) setItem(idx, { gst_rate: fromList.gst_rate || 0 })
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SAC Code</label>
                  <input 
                    className="form-input" 
                    placeholder="SAC" 
                    value={item.sac_code || ''}
                    onChange={e => {
                      const code = e.target.value
                      setItem(idx, { sac_code: code })
                      // Auto-fill GST rate if SAC code matches from suggestions
                      const fromList = (serviceSuggestions[idx] || []).find((r: any) => r.sac_code === code)
                      if (fromList) setItem(idx, { gst_rate: fromList.gst_rate || 0 })
                    }}
              />
            </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select 
                    className="form-select" 
                    value={item.unit || 'Nos'} 
                    onChange={e => setItem(idx, { unit: e.target.value })}
                  >
              <option value="Nos">Nos</option>
              <option value="Kg">Kg</option>
              <option value="Meters">Meters</option>
              <option value="Hours">Hours</option>
              <option value="Days">Days</option>
              <option value="Pieces">Pieces</option>
            </select>
          </div>
          </div>
          
              {/* Invoice Description Row - What gets printed on the invoice */}
              <div className="field-row">
                <div className="form-group full-width">
                  <label className="form-label">Invoice Description 
                    <span className="print-badge">📄 For Invoice</span>
                  </label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="Enter the exact description that should appear on the invoice (this will be printed on the PDF)"
                    value={item.invoice_description || ''}
                    onChange={e => {
                      console.log('✏️ Invoice Description onChange:', {
                        idx,
                        oldValue: item.invoice_description,
                        newValue: e.target.value
                      });
                      setItem(idx, { invoice_description: e.target.value });
                    }}
                    rows={3}
                    style={{
                      resize: 'vertical',
                      minHeight: '80px'
                    }}
                  />
                  <div className="form-help-text" style={{
                    fontSize: '12px',
                    color: '#64748b',
                    marginTop: '4px',
                    fontStyle: 'italic'
                  }}>
                    This description will be printed on the invoice. Once you start typing, it won't be auto-overwritten by suggestions.
                  </div>
                </div>
              </div>
          
              {/* Quantity, Rate, Discount Row */}
              <div className="field-row">
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input 
                    className="form-input" 
                    inputMode="decimal" 
                    placeholder="1" 
                    value={item.quantity || ''}
                    onChange={e => setItem(idx, { quantity: e.target.value === '' ? 0 : Number(e.target.value) })} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rate (₹)</label>
                  <input 
                    className="form-input" 
                    inputMode="decimal" 
                    placeholder="0.00" 
                    value={item.rate || ''}
                    onChange={e => setItem(idx, { rate: e.target.value === '' ? 0 : Number(e.target.value) })} 
                  />
          </div>
                <div className="form-group">
                  <label className="form-label">Discount %</label>
                  <input 
                    className="form-input" 
                    placeholder="0" 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="0.01" 
                    value={item.discount_percent || 0} 
                onChange={e => setItem(idx, { discount_percent: Number(e.target.value) || 0 })} 
              />
            </div>
                <div className="form-group">
                  <label className="form-label">GST %</label>
                  <select 
                    className="form-select" 
                    value={item.gst_rate || 0} 
                    onChange={e => setItem(idx, { gst_rate: Number(e.target.value) })}
                  >
              <option value={0}>0%</option>
              <option value={5}>5%</option>
              <option value={12}>12%</option>
              <option value={18}>18%</option>
              <option value={28}>28%</option>
            </select>
                </div>
              </div>

              {/* Item Total Row */}
              <div className="item-total">
                <span className="total-label">Item Total:</span>
                <span className="total-amount">
                  ₹{((item.quantity * item.rate) * (1 - (item.discount_percent || 0) / 100) * (1 + (item.gst_rate || 0) / 100)).toFixed(2)}
                </span>
              </div>
          </div>
        </div>
      ))}

        {/* Add Item Button - Moved to bottom */}
        <div className="add-item-container">
          <button className="add-item-btn" onClick={addItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add New Item
          </button>
        </div>
      </div>

      {/* GST Compliance Section - Moved to end */}
      <div className="gst-section">
        <div className="section-header">
          <h2 className="section-title">
            <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
              <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z"/>
              <path d="M12 3c0 1-1 2-2 2s-2 1-2 2 1 2 2 2 2 1 2 2"/>
              <path d="M12 21c0-1 1-2 2-2s2-1 2-2-1-2-2-2-2-1-2-2"/>
            </svg>
            GST Compliance & Terms
          </h2>
        </div>
        
        <div className="gst-grid">
          <div className="form-group">
            <label className="form-label">Reverse Charge</label>
            <select 
              className="form-select" 
              value={gstForm.reverse_charge ? 'true' : 'false'} 
              onChange={e => setGstForm({ ...gstForm, reverse_charge: e.target.value === 'true' })}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">E-commerce GSTIN</label>
            <input 
              className="form-input" 
              placeholder="Enter if applicable" 
              value={gstForm.ecommerce_gstin} 
              onChange={e => setGstForm({ ...gstForm, ecommerce_gstin: e.target.value })} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Export Type</label>
            <select 
              className="form-select" 
              value={gstForm.export_type} 
              onChange={e => setGstForm({ ...gstForm, export_type: e.target.value })}
            >
              <option value="">Not Export</option>
              <option value="WITH_PAYMENT">With Payment</option>
              <option value="WITHOUT_PAYMENT">Without Payment</option>
            </select>
          </div>
        </div>
        
        <div className="form-group full-width">
          <label className="form-label">Terms & Conditions</label>
          <textarea 
            className="form-textarea" 
            rows={3} 
            placeholder="Additional terms for this invoice (optional)" 
            value={gstForm.terms_and_conditions} 
            onChange={e => setGstForm({ ...gstForm, terms_and_conditions: e.target.value })} 
          />
      </div>
      </div>

      {/* Totals Section */}
      <div className="totals-section">
        <div className="totals-card">
          <div className="total-row">
            <span className="total-label">Subtotal</span>
            <span className="total-value">₹{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span className="total-label">Estimated GST</span>
            <span className="total-value">₹{(totals.total - totals.subtotal).toFixed(2)}</span>
          </div>
          <div className="total-row final-total">
            <span className="total-label">Total Amount</span>
            <span className="total-value">₹{totals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Auto-save Templates Setting */}
      <div className="auto-save-setting" style={{ 
        padding: '16px 20px', 
        background: 'rgba(59, 130, 246, 0.05)', 
        borderRadius: '12px', 
        marginBottom: '20px',
        border: '1px solid rgba(59, 130, 246, 0.1)'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={autoSaveTemplates}
            onChange={(e) => setAutoSaveTemplates(e.target.checked)}
            style={{ transform: 'scale(1.2)' }}
          />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>
            🤖 Auto-save invoice items as templates for future use
          </span>
          <span style={{ fontSize: '12px', color: '#64748b', marginLeft: 'auto' }}>
            (Saves time on repeat invoices)
          </span>
        </label>
      </div>

      {/* Create Button */}
      <div className="create-actions">
        <button 
          className="create-btn" 
          onClick={create} 
          disabled={creating}
        >
          {creating ? (
            <>
              <div className="loading-spinner"></div>
              Creating Invoice...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"/>
                <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z"/>
                <path d="M12 3c0 1-1 2-2 2s-2 1-2 2 1 2 2 2 2 1 2 2"/>
                <path d="M12 21c0-1 1-2 2-2s2-1 2-2-1-2-2-2-2-1-2-2"/>
              </svg>
              Create Invoice
            </>
          )}
        </button>
      </div>

      {/* Preview Section */}
      {preview && (
        <div className="preview-section">
          <div className="preview-header">
            <h3 className="preview-title">✅ Invoice Created Successfully!</h3>
            <p className="preview-subtitle">Invoice #{preview.invoice_number}</p>
          </div>
          
          <div className="preview-details">
            <div className="preview-row">
              <span>Subtotal</span>
              <span>₹{Number(preview.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="preview-row">
              <span>CGST</span>
              <span>₹{Number(preview.cgst || 0).toFixed(2)}</span>
            </div>
            <div className="preview-row">
              <span>SGST</span>
              <span>₹{Number(preview.sgst || 0).toFixed(2)}</span>
            </div>
            <div className="preview-row">
              <span>IGST</span>
              <span>₹{Number(preview.igst || 0).toFixed(2)}</span>
            </div>
            <div className="preview-row final">
              <span>Total</span>
              <span>₹{Number(preview.total || 0).toFixed(2)}</span>
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
