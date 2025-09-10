import React from 'react'
import { api } from '../api/client'
import { showToast } from '../ui/ToastHost'

type LibraryItem = {
  id?: number
  description: string
  hsn_code: string
  sac_code: string
  gst_rate: number
  unit: string
  category?: string
  is_active: boolean
}

export default function ItemLibrary() {
  const [items, setItems] = React.useState<LibraryItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [showForm, setShowForm] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<LibraryItem | null>(null)
  const [formData, setFormData] = React.useState<LibraryItem>({
    description: '',
    hsn_code: '',
    sac_code: '',
    gst_rate: 0,
    unit: 'Nos',
    category: '',
    is_active: true
  })

  React.useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    try {
      setLoading(true)
      const response = await api('/item-library')
      setItems(response || [])
    } catch (error) {
      console.error('Failed to load items:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      description: '',
      hsn_code: '',
      sac_code: '',
      gst_rate: 0,
      unit: 'Nos',
      category: '',
      is_active: true
    })
    setEditingItem(null)
    setShowForm(false)
  }

  async function saveItem() {
    try {
      if (!formData.description.trim()) {
        showToast('Description is required', 'error')
        return
      }

      if (editingItem) {
        // Update existing item
        await api(`/item-library/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        })
        setItems(prev => prev.map(item => 
          item.id === editingItem.id ? { ...formData, id: editingItem.id } : item
        ))
        showToast('Item updated successfully', 'success')
      } else {
        // Create new item
        const newItem = await api('/item-library', {
          method: 'POST',
          body: JSON.stringify(formData)
        })
        setItems(prev => [...prev, { ...newItem, id: Date.now() }])
        showToast('Item added successfully', 'success')
      }
      
      resetForm()
    } catch (error) {
      console.error('Failed to save item:', error)
      showToast('Failed to save item', 'error')
    }
  }

  async function deleteItem(id: number) {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      await api(`/item-library/${id}`, { method: 'DELETE' })
      setItems(prev => prev.filter(item => item.id !== id))
      showToast('Item deleted successfully', 'success')
    } catch (error) {
      console.error('Failed to delete item:', error)
      showToast('Failed to delete item', 'error')
    }
  }

  function editItem(item: LibraryItem) {
    setFormData(item)
    setEditingItem(item)
    setShowForm(true)
  }

  const filteredItems = items.filter(item =>
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.hsn_code.includes(searchTerm) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="item-library-container">
      {/* Header Section */}
      <div className="library-header">
        <h1 className="library-title">Item Library</h1>
        <p className="library-subtitle">Manage your catalog of items for quick invoice creation</p>
      </div>

      {/* Search and Add Section */}
      <div className="search-add-section">
        <div className="search-container">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="search-input"
            placeholder="Search items by description, HSN code, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <button 
          className="add-item-btn"
          onClick={() => setShowForm(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add New Item
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="form-section">
          <div className="form-header">
            <h3 className="form-title">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h3>
            <button className="close-btn" onClick={resetForm}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">Description *</label>
              <input
                className="form-input"
                placeholder="Enter item description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">HSN Code</label>
              <input
                className="form-input"
                placeholder="HSN code"
                value={formData.hsn_code}
                onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">SAC Code</label>
              <input
                className="form-input"
                placeholder="SAC code"
                value={formData.sac_code}
                onChange={(e) => setFormData({ ...formData, sac_code: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">GST Rate (%)</label>
              <select
                className="form-select"
                value={formData.gst_rate}
                onChange={(e) => setFormData({ ...formData, gst_rate: Number(e.target.value) })}
              >
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select
                className="form-select"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="Nos">Nos</option>
                <option value="Kg">Kg</option>
                <option value="Meters">Meters</option>
                <option value="Hours">Hours</option>
                <option value="Days">Days</option>
                <option value="Pieces">Pieces</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                className="form-input"
                placeholder="e.g., Electronics, Furniture"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
            <button className="btn-primary" onClick={saveItem}>
              {editingItem ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
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
            Item Catalog ({filteredItems.length})
          </h2>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3 className="empty-title">No items found</h3>
            <p className="empty-subtitle">
              {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first item to the library'}
            </p>
            {!searchTerm && (
              <button className="add-item-btn" onClick={() => setShowForm(true)}>
                Add Your First Item
              </button>
            )}
          </div>
        ) : (
          <div className="items-grid">
            {filteredItems.map((item) => (
              <div key={item.id} className="item-card">
                <div className="item-header">
                  <div className="item-status">
                    <span className={`status-badge ${item.is_active ? 'active' : 'inactive'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="item-actions">
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => editItem(item)}
                      title="Edit item"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => deleteItem(item.id!)}
                      title="Delete item"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="item-content">
                  <h4 className="item-description">{item.description}</h4>
                  
                  <div className="item-details">
                    <div className="detail-row">
                      <span className="detail-label">HSN:</span>
                      <span className="detail-value">{item.hsn_code || 'Not set'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">GST:</span>
                      <span className="detail-value">{item.gst_rate}%</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Unit:</span>
                      <span className="detail-value">{item.unit}</span>
                    </div>
                    {item.category && (
                      <div className="detail-row">
                        <span className="detail-label">Category:</span>
                        <span className="detail-value">{item.category}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 