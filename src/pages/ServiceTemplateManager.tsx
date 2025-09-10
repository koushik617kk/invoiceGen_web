import React, { useState, useEffect } from 'react';
import { API_BASE, api } from '../api/client';

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
  max_quantity: number | null;
  is_active: boolean;
  is_default: boolean;
  template_type: string; // "service" or "product"
  created_at: string;
  updated_at: string;
}

interface MasterDataItem {
  id: string;
  name: string;
  description: string;
  category: string;
  code: string;
  gst_rate: number;
  type: 'service' | 'product';
  usage_count?: number;
}

const ServiceTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<ServiceTemplate | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    template_name: '', // NEW: Generic name for template selection
    description: '', // Specific description for invoice
    sac_code: '',
    gst_rate: 18,
    hsn_code: '',
    unit: 'Nos',
    base_rate: 0,
    currency: 'INR',
    payment_terms: 'Net 30 days',
    min_quantity: 1,
    max_quantity: null as number | null,
    is_active: true,
    is_default: false,
    template_type: 'service' as 'service' | 'product' // Template type
  });
  
  // AI Suggestions state
  const [dataSuggestions, setDataSuggestions] = useState<MasterDataItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await api('/service-templates');
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTemplate = async () => {
    try {
      await api('/service-templates', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      await fetchTemplates();
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error('Error adding template:', error);
    }
  };

  const handleEditTemplate = async () => {
    if (!editingTemplate) return;

    try {
      console.log('Updating template:', editingTemplate.id, 'with data:', formData);
      
      await api(`/service-templates/${editingTemplate.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      console.log('Template updated successfully');
      await fetchTemplates();
      setEditingTemplate(null);
      resetForm();
    } catch (error: any) {
      console.error('Error updating template:', error);
      alert(`Error updating template: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await api(`/service-templates/${id}`, {
        method: 'DELETE'
      });
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleEdit = (template: ServiceTemplate) => {
    console.log('Edit button clicked for template:', template);
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name, // NEW: Include template name
      description: template.description,
      sac_code: template.sac_code,
      gst_rate: template.gst_rate,
      hsn_code: template.hsn_code || '',
      unit: template.unit,
      base_rate: template.base_rate,
      currency: template.currency,
      payment_terms: template.payment_terms,
      min_quantity: template.min_quantity,
      max_quantity: template.max_quantity,
      is_active: template.is_active,
      is_default: template.is_default,
      template_type: template.template_type || 'service' // Include template type
    });
    console.log('Form data set for editing:', {
      description: template.description,
      sac_code: template.sac_code,
      base_rate: template.base_rate,
      template_type: template.template_type
    });
  };

  const resetForm = () => {
    setFormData({
      template_name: '', // NEW: Reset template name
      description: '',
      sac_code: '',
      gst_rate: 18,
      hsn_code: '',
      unit: 'Nos',
      base_rate: 0,
      currency: 'INR',
      payment_terms: 'Net 30 days',
      min_quantity: 1,
      max_quantity: null,
      is_active: true,
      is_default: false,
      template_type: 'service' // Reset template type
    });
    setDataSuggestions([]);
    setShowSuggestions(false);
  };

  // AI-powered suggestions using unified search API (services + products)
  const getDataSuggestions = async (input: string) => {
    if (input.length < 2) {
      setShowSuggestions(false);
      return;
    }

    setSuggestionLoading(true);
    
    try {
      // Call the unified backend API for intelligent search (services + products)
      const response = await api(`/master-data/search?q=${encodeURIComponent(input)}&data_type=all&limit=10`);
      
      // API returns array of MasterDataItem objects (services + products)
      const suggestions = Array.isArray(response) ? response : [];
      
      setDataSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      
    } catch (error) {
      console.error('Error fetching data suggestions:', error);
      // Fallback to empty suggestions on error
      setDataSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSuggestionLoading(false);
    }
  };

  const handleTemplateNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, template_name: value }));
    getDataSuggestions(value);
  };

  const selectSuggestion = (suggestion: MasterDataItem) => {
    // Auto-fill form with complete data from API (services + products)
    setFormData(prev => ({ 
      ...prev, 
      template_name: suggestion.name, // NEW: Set template name from suggestion
      description: suggestion.description, // Set description from suggestion
      sac_code: suggestion.code, // This will be SAC for services, HSN for products
      gst_rate: suggestion.gst_rate,
      unit: 'Nos', // Default unit
      template_type: suggestion.type // Set template type based on suggestion
    }));
    
    setShowSuggestions(false);
    setDataSuggestions([]);
    
    // Record usage for analytics (only for services)
    if (suggestion.type === 'service' && suggestion.id.startsWith('service_')) {
      try {
        const serviceId = suggestion.id.replace('service_', '');
        api(`/master-services/${serviceId}/use`, { method: 'POST' });
      } catch (error) {
        // Silent fail for analytics
        console.log('Analytics recording failed:', error);
      }
    }
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setShowAddForm(false);
    resetForm();
  };

  if (loading) {
    return (
      <div className="service-template-manager">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="service-template-manager">
      <div className="header-section">
        <h1>Templates</h1>
        <p>Manage your service and product templates for quick invoice generation</p>
        <button 
          className="btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          + Add New Template
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingTemplate) && (
        <div className="template-form">
          <h2>{editingTemplate ? 'Edit Template' : 'Add New Template'}</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Template Name * 
                <span className="ai-badge">🤖 AI Assisted</span>
              </label>
              <div className="input-with-suggestions">
                <input
                  type="text"
                  value={formData.template_name}
                  onChange={(e) => handleTemplateNameChange(e.target.value)}
                  placeholder="Start typing... e.g., Web Development, Laptop Computer"
                  autoComplete="off"
                />

                
                {/* AI Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="suggestions-dropdown" style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 9999
                  }}>

                    {suggestionLoading ? (
                      <div className="suggestion-loading" style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#6b7280'
                      }}>
                        <div className="spinner-small"></div>
                        AI is thinking...
                      </div>
                    ) : (
                      <>
                        <div className="suggestions-header" style={{
                          padding: '16px',
                          backgroundColor: '#f8fafc',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          🤖 AI Suggestions ({dataSuggestions.length})
                        </div>
                        
                        {/* Services Section */}
                        {dataSuggestions.filter(s => s.type === 'service').length > 0 && (
                          <>
                            <div className="suggestion-section-header" style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#1e40af',
                              padding: '12px 16px',
                              backgroundColor: '#dbeafe',
                              borderBottom: '1px solid #3b82f6',
                              // Removed sticky positioning to prevent overlap
                              zIndex: 1
                            }}>
                              🖥️ Services ({dataSuggestions.filter(s => s.type === 'service').length})
                            </div>
                            {dataSuggestions.filter(s => s.type === 'service').map((suggestion, index) => (
                              <div
                                key={suggestion.id || index}
                                className="suggestion-item"
                                onClick={() => selectSuggestion(suggestion)}
                                style={{
                                  padding: '16px',
                                  borderBottom: index < dataSuggestions.filter(s => s.type === 'service').length - 1 ? '1px solid #f1f5f9' : 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  backgroundColor: 'white'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                              >
                                <div className="suggestion-content">
                                  <div className="suggestion-main" style={{ marginBottom: '8px' }}>
                                    <span className="suggestion-name" style={{
                                      display: 'block',
                                      fontSize: '15px',
                                      fontWeight: '600',
                                      color: '#1e293b',
                                      marginBottom: '4px'
                                    }}>{suggestion.name}</span>
                                    <span className="suggestion-category" style={{
                                      fontSize: '12px',
                                      color: '#64748b',
                                      textTransform: 'capitalize'
                                    }}>{suggestion.category?.replace('_', ' ')}</span>
                                  </div>
                                  <div className="suggestion-details" style={{
                                    display: 'flex',
                                    gap: '8px'
                                  }}>
                                    <span className="suggestion-code" style={{
                                      fontSize: '12px',
                                      backgroundColor: '#e2e8f0',
                                      color: '#475569',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontWeight: '500'
                                    }}>SAC: {suggestion.code}</span>
                                    <span className="suggestion-gst" style={{
                                      fontSize: '12px',
                                      backgroundColor: '#dcfce7',
                                      color: '#166534',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontWeight: '500'
                                    }}>GST: {suggestion.gst_rate}%</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}

                        {/* Products Section */}
                        {dataSuggestions.filter(s => s.type === 'product').length > 0 && (
                          <>
                            <div className="suggestion-section-header" style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#92400e',
                              padding: '12px 16px',
                              backgroundColor: '#fef3c7',
                              borderBottom: '1px solid #f59e0b',
                              // Removed sticky positioning to prevent overlap
                              zIndex: 1
                            }}>
                              🏭 Products ({dataSuggestions.filter(s => s.type === 'product').length})
                            </div>
                            {dataSuggestions.filter(s => s.type === 'product').map((suggestion, index) => (
                              <div
                                key={suggestion.id || index}
                                className="suggestion-item"
                                onClick={() => selectSuggestion(suggestion)}
                                style={{
                                  padding: '16px',
                                  borderBottom: index < dataSuggestions.filter(s => s.type === 'product').length - 1 ? '1px solid #f1f5f9' : 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  backgroundColor: 'white'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef7ed'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                              >
                                <div className="suggestion-content">
                                  <div className="suggestion-main" style={{ marginBottom: '8px' }}>
                                    <span className="suggestion-name" style={{
                                      display: 'block',
                                      fontSize: '15px',
                                      fontWeight: '600',
                                      color: '#1e293b',
                                      marginBottom: '4px'
                                    }}>{suggestion.name}</span>
                                    <span className="suggestion-category" style={{
                                      fontSize: '12px',
                                      color: '#64748b',
                                      textTransform: 'capitalize'
                                    }}>{suggestion.category?.replace('_', ' ')}</span>
                                  </div>
                                  <div className="suggestion-details" style={{
                                    display: 'flex',
                                    gap: '8px'
                                  }}>
                                    <span className="suggestion-code" style={{
                                      fontSize: '12px',
                                      backgroundColor: '#fef3c7',
                                      color: '#92400e',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontWeight: '500'
                                    }}>HSN: {suggestion.code}</span>
                                    <span className="suggestion-gst" style={{
                                      fontSize: '12px',
                                      backgroundColor: '#dcfce7',
                                      color: '#166534',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontWeight: '500'
                                    }}>GST: {suggestion.gst_rate}%</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}

                        {dataSuggestions.length === 0 && (
                          <div className="no-suggestions" style={{
                            padding: '20px',
                            textAlign: 'center',
                            color: '#6b7280',
                            fontSize: '14px'
                          }}>
                            No suggestions found. Keep typing or enter custom template.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Template Type *</label>
              <select
                value={formData.template_type}
                onChange={(e) => setFormData(prev => ({ ...prev, template_type: e.target.value as 'service' | 'product' }))}
              >
                <option value="service">🖥️ Service</option>
                <option value="product">🏭 Product</option>
              </select>
            </div>

            <div className="form-group">
              <label>Invoice Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Specific description that will appear on the invoice..."
                rows={3}
              />
              <small className="form-help">
                This description will be printed on the invoice. For services, you can customize this per invoice. For products, this is usually fixed.
              </small>
            </div>

            <div className="form-group">
              <label>Code (SAC/HSN) *</label>
              <input
                type="text"
                value={formData.sac_code}
                onChange={(e) => setFormData(prev => ({ ...prev, sac_code: e.target.value }))}
                placeholder="e.g., 998314 (SAC) or 8517 (HSN)"
              />
            </div>

            <div className="form-group">
              <label>GST Rate (%) *</label>
              <input
                type="number"
                value={formData.gst_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, gst_rate: parseFloat(e.target.value) }))}
                min="0"
                max="28"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Base Rate (₹) *</label>
              <input
                type="number"
                value={formData.base_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, base_rate: parseFloat(e.target.value) }))}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Payment Terms</label>
              <input
                type="text"
                value={formData.payment_terms}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                placeholder="e.g., Net 30 days"
              />
            </div>

            <div className="form-group">
              <label>Min Quantity</label>
              <input
                type="number"
                value={formData.min_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, min_quantity: parseFloat(e.target.value) }))}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Max Quantity</label>
              <input
                type="number"
                value={formData.max_quantity || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  max_quantity: e.target.value ? parseFloat(e.target.value) : null 
                }))}
                min="0"
                step="0.01"
                placeholder="Leave empty for no limit"
              />
            </div>


          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              />
              Active
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
              />
              Default Template
            </label>
          </div>

          <div className="form-actions">
            <button className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button 
              className="btn-primary"
              onClick={() => {
                console.log('Form submit button clicked');
                console.log('Editing template:', editingTemplate);
                console.log('Form data:', formData);
                if (editingTemplate) {
                  handleEditTemplate();
                } else {
                  handleAddTemplate();
                }
              }}
              disabled={!formData.template_name || !formData.description || !formData.sac_code || formData.base_rate <= 0}
            >
              {editingTemplate ? 'Update Template' : 'Add Template'}
            </button>
            
            {/* Debug info */}
            {editingTemplate && (
              <div className="debug-info" style={{fontSize: '12px', color: '#666', marginTop: '8px'}}>
                Debug: Form validation - Description: {formData.description ? '✅' : '❌'}, 
                SAC: {formData.sac_code ? '✅' : '❌'}, 
                Rate: {formData.base_rate > 0 ? '✅' : '❌'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="templates-list">
        <h2>Your Templates ({templates.length})</h2>
        
        {templates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No templates found</h3>
            <p>No templates found. Create your first template to get started!</p>
          </div>
        ) : (
          <div className="templates-grid">
            {templates.map(template => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <h3>{template.template_type === 'service' ? '🖥️' : '🏭'} {template.template_name}</h3>
                  <div className="template-badges">
                    <span className="badge type">{template.template_type === 'service' ? 'Service' : 'Product'}</span>
                    {template.is_default && <span className="badge default">Default</span>}
                    {template.is_active ? (
                      <span className="badge active">Active</span>
                    ) : (
                      <span className="badge inactive">Inactive</span>
                    )}
                  </div>
                </div>

                <div className="template-details">
                  <div className="detail-row">
                    <span className="label">SAC Code:</span>
                    <span className="value">{template.sac_code}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">GST Rate:</span>
                    <span className="value">{template.gst_rate}%</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Base Rate:</span>
                    <span className="value">₹{template.base_rate.toLocaleString()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Payment Terms:</span>
                    <span className="value">{template.payment_terms}</span>
                  </div>
                  {template.description && (
                    <div className="detail-row">
                      <span className="label">Description:</span>
                      <span className="value">{template.description}</span>
                    </div>
                  )}
                </div>

                <div className="template-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => handleEdit(template)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceTemplateManager;
