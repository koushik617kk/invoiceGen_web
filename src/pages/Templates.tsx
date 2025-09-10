import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, API_BASE } from '../api/client'
import { showToast } from '../ui/ToastHost'

interface Template {
  id: number
  name: string
  description: string | null
  template_file_path: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [uploading, setUploading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    try {
      const data = await api('/templates')
      setTemplates(data)
    } catch (error) {
      showToast('Failed to fetch templates', 'error')
    }
  }

  async function handleCreateTemplate() {
    if (!formData.name.trim()) {
      showToast('Template name is required', 'error')
      return
    }

    try {
      await api('/templates', { method: 'POST', body: JSON.stringify(formData) })
      showToast('Template created successfully!', 'success')
      setFormData({ name: '', description: '' })
      setShowCreateForm(false)
      fetchTemplates()
    } catch (error) {
      showToast('Failed to create template', 'error')
    }
  }

  async function handleUploadTemplate(templateId: number, file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_BASE}/templates/${templateId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        showToast(result.message, 'success')
        fetchTemplates()
        setShowUploadForm(false)
        setSelectedTemplate(null)
      } else {
        const error = await response.json()
        showToast(error.detail || 'Upload failed', 'error')
      }
    } catch (error) {
      showToast('Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function getAuthToken() {
    const { fetchAuthSession } = await import('aws-amplify/auth')
    const session = await fetchAuthSession()
    return session.tokens?.idToken?.toString() || session.tokens?.accessToken?.toString()
  }

  async function handleSetDefault(templateId: number) {
    try {
      await api(`/templates/${templateId}`, { 
        method: 'PUT', 
        body: JSON.stringify({ is_default: true }) 
      })
      showToast('Default template updated', 'success')
      fetchTemplates()
    } catch (error) {
      showToast('Failed to update default template', 'error')
    }
  }

  async function handleDeleteTemplate(templateId: number) {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await api(`/templates/${templateId}`, { method: 'DELETE' })
      showToast('Template deleted', 'success')
      fetchTemplates()
    } catch (error) {
      showToast('Failed to delete template', 'error')
    }
  }

  return (
    <div className="card" style={{ display: 'grid', gap: 16 }}>
      <div className="title">📄 Invoice Templates</div>
      
      {/* Create Template Button */}
      <button 
        className="btn" 
        onClick={() => setShowCreateForm(true)}
        style={{ alignSelf: 'start' }}
      >
        ➕ Create New Template
      </button>

      {/* Create Template Form */}
      {showCreateForm && (
        <div className="card" style={{ border: '1px solid #e5e7eb', padding: 16 }}>
          <div className="title">Create Template</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="form-field">
              <label>Template Name</label>
              <input
                className="input"
                type="text"
                placeholder="e.g., Business Invoice, Service Invoice"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Description (Optional)</label>
              <textarea
                className="input"
                placeholder="Describe when to use this template"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={handleCreateTemplate}>
                Create Template
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div style={{ display: 'grid', gap: 12 }}>
        {templates.map((template) => (
          <div 
            key={template.id} 
            className="card" 
            style={{ 
              border: '1px solid #e5e7eb', 
              padding: 16,
              backgroundColor: template.is_default ? '#f0f9ff' : 'white'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>
                  {template.name} {template.is_default && '⭐ (Default)'}
                </div>
                {template.description && (
                  <div style={{ color: '#6b7280', marginTop: 4 }}>
                    {template.description}
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                  Created: {new Date(template.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                {!template.template_file_path && (
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setSelectedTemplate(template)
                      setShowUploadForm(true)
                    }}
                  >
                    📎 Upload PDF
                  </button>
                )}
                
                {template.template_file_path && (
                  <div style={{ color: '#059669', fontSize: 14, fontWeight: 500 }}>
                    ✅ PDF Uploaded
                  </div>
                )}
                
                {!template.is_default && (
                  <button 
                    className="btn-secondary"
                    onClick={() => handleSetDefault(template.id)}
                  >
                    Set Default
                  </button>
                )}
                
                <button 
                  className="btn-secondary"
                  onClick={() => handleDeleteTemplate(template.id)}
                  style={{ color: '#dc2626' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload PDF Form */}
      {showUploadForm && selectedTemplate && (
        <div className="card" style={{ border: '1px solid #e5e7eb', padding: 16 }}>
          <div className="title">Upload PDF Template</div>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <p style={{ margin: '0 0 12px 0', color: '#6b7280' }}>
                Upload your existing invoice PDF template. The system will automatically detect form fields 
                and fill them with invoice data like customer name, amounts, etc.
              </p>
              <p style={{ margin: 0, color: '#059669', fontWeight: 500 }}>
                Template: <strong>{selectedTemplate.name}</strong>
              </p>
            </div>
            
            <div className="form-field">
              <label>Select PDF File</label>
              <input
                className="input"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleUploadTemplate(selectedTemplate.id, file)
                  }
                }}
                disabled={uploading}
              />
            </div>
            
            {uploading && (
              <div style={{ color: '#059669', textAlign: 'center' }}>
                🔄 Uploading and analyzing with Gemini AI...
              </div>
            )}
            
            <button 
              className="btn-secondary" 
              onClick={() => {
                setShowUploadForm(false)
                setSelectedTemplate(null)
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card" style={{ backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9' }}>
        <div className="title" style={{ color: '#0c4a6e' }}>💡 How It Works</div>
        <div style={{ color: '#0c4a6e', lineHeight: 1.6 }}>
          <p><strong>1. Create Template:</strong> Give your template a name and description</p>
          <p><strong>2. Upload PDF:</strong> Upload your existing invoice PDF template</p>
          <p><strong>3. Automatic Detection:</strong> System detects form fields in your PDF automatically</p>
          <p><strong>4. Smart Filling:</strong> When creating invoices, data fills into your template fields</p>
        </div>
      </div>
    </div>
  )
}
