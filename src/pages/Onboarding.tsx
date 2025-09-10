import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE, api } from '../api/client';

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  sac_code: string;
  gst_rate: number;
  category: string;
  specific_services?: {
    id: string;
    name: string;
    description: string;
    keywords?: string[];
    sac_code: string;
    gst_rate: number;
  }[];
}

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  hsn_code: string;
  gst_rate: number;
  category: string;
}

interface BusinessProfile {
  business_name: string;
  gstin: string;
  pan: string;
  address: string;
  state_code: string;
  phone: string;
  email: string;
  turnover_category?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [businessType, setBusinessType] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    business_name: '',
    gstin: '',
    pan: '',
    address: '',
    state_code: '',
    phone: '',
    email: '',
    turnover_category: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Refs for scrolling to errors
  const businessNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchServiceCategories();
    // Scroll to step content when component mounts
    setTimeout(() => {
      const stepContent = document.querySelector('.onboarding-content');
      if (stepContent) {
        stepContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  // Fetch product categories when business type changes
  useEffect(() => {
    if (businessType === 'product' || businessType === 'mixed') {
      fetchProductCategories();
    }
  }, [businessType]);



  // Scroll to step content whenever step changes
  useEffect(() => {
    if (currentStep > 1) {
      setTimeout(() => {
        const stepContent = document.querySelector('.onboarding-content');
        if (stepContent) {
          stepContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  }, [currentStep]);

  const fetchServiceCategories = async () => {
    try {
      setLoadingServices(true);
      const response = await fetch(`${API_BASE}/service-categories`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setServiceCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching service categories:', error);
      setServiceCategories([]); // Set empty array on error
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchProductCategories = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch(`${API_BASE}/master-products/categories`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProductCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching product categories:', error);
      setProductCategories([]); // Set empty array on error
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleBusinessTypeSelect = (type: string) => {
    setBusinessType(type);
    setBusinessProfile(prev => ({ ...prev, business_type: type }));
    // Clear step 1 errors when business type is selected
    if (errors.business_type) {
      setErrors(prev => ({ ...prev, business_type: '' }));
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
    // Clear step 2 errors when services are selected
    if (errors.selected_services) {
      setErrors(prev => ({ ...prev, selected_services: '' }));
    }
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleBusinessProfileChange = (field: keyof BusinessProfile, value: string) => {
    setBusinessProfile(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!businessType) {
      newErrors.business_type = 'Please select a business type';
    }
    
    setErrors(newErrors);
    
    // Scroll to step content if there are errors
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        const stepContent = document.querySelector('.onboarding-content');
        if (stepContent) {
          stepContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: ValidationErrors = {};
    
    if (businessType === 'service' && selectedServices.length === 0) {
      newErrors.selected_services = 'Please select at least one service';
    } else if (businessType === 'product' && selectedProducts.length === 0) {
      newErrors.selected_services = 'Please select at least one product category';
    } else if (businessType === 'mixed' && selectedServices.length === 0 && selectedProducts.length === 0) {
      newErrors.selected_services = 'Please select at least one service or product category';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  }

  const validateStep3 = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    if (!businessProfile.business_name.trim()) {
      newErrors.business_name = 'Business name is required';
    }
    
    if (!businessProfile.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(businessProfile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!businessProfile.address.trim()) {
      newErrors.address = 'Business address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const scrollToFirstError = () => {
    if (errors.business_name && businessNameRef.current) {
      businessNameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (errors.email && emailRef.current) {
      emailRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (errors.address && addressRef.current) {
      addressRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNext = () => {
    let isValid = false;
    
    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }
    
    if (isValid) {
      setCurrentStep(prev => prev + 1);
      // Scroll to step content when moving to next step
      setTimeout(() => {
        const stepContent = document.querySelector('.onboarding-content');
        if (stepContent) {
          stepContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    // Clear errors when going back
    setErrors({});
    // Scroll to step content when going back
    setTimeout(() => {
      const stepContent = document.querySelector('.onboarding-content');
      if (stepContent) {
        stepContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleComplete = async () => {
    setSubmitAttempted(true);
    
    if (!validateStep3()) {
      // Scroll to first error after validation
      setTimeout(scrollToFirstError, 100);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Starting onboarding completion...');
      
      // Update user onboarding status
      await api('/users/onboarding', {
        method: 'PUT',
        body: JSON.stringify({
          business_type: businessType,
          onboarding_completed: true,
          onboarding_step: 'completed'
        })
      });
      console.log('Onboarding status updated successfully');

      // Create business profile
      await api('/business-profile', {
        method: 'POST',
        body: JSON.stringify(businessProfile)
      });
      console.log('Business profile created successfully');

      // Generate service templates
      if (selectedServices.length > 0) {
        await api('/service-templates/generate-from-services', {
          method: 'POST',
          body: JSON.stringify(selectedServices)
        });
        console.log('Service templates generated successfully');
      }

      // Generate product templates
      if (selectedProducts.length > 0) {
        await api('/service-templates/generate-from-products', {
          method: 'POST',
          body: JSON.stringify(selectedProducts)
        });
        console.log('Product templates generated successfully');
      }

      console.log('All onboarding steps completed successfully. Moving to completion step...');
      
      // Show success message and move to step 4
      setErrors({ success: 'Onboarding completed successfully! Moving to next step...' });
      
      // Move to step 4 after a short delay
      setTimeout(() => {
        setCurrentStep(4);
        setErrors({});
        // Scroll to step content when moving to step 4
        setTimeout(() => {
          const stepContent = document.querySelector('.onboarding-content');
          if (stepContent) {
            stepContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      setErrors({ submit: `Failed to complete onboarding: ${error?.message || 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="onboarding-step">
      <h2><span className="step-number">1</span>🏢 What's your business type?</h2>
      <p className="step-description">Choose the type that best describes your business</p>
      
      {errors.business_type && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {errors.business_type}
        </div>
      )}
      
      <div className="business-type-grid">
        <div 
          className={`business-type-card ${businessType === 'service' ? 'selected' : ''}`}
          onClick={() => handleBusinessTypeSelect('service')}
        >
          <div className="business-type-icon">🖥️</div>
          <h3>Service Business</h3>
          <p>Consulting, Development, Marketing, Design, etc.</p>
          <div className="business-type-examples">
            <span>Web Development</span>
            <span>Digital Marketing</span>
            <span>Business Consulting</span>
          </div>
        </div>
        
        <div 
          className={`business-type-card ${businessType === 'product' ? 'selected' : ''}`}
          onClick={() => handleBusinessTypeSelect('product')}
        >
          <div className="business-type-icon">🏭</div>
          <h3>Product Business</h3>
          <p>Manufacturing, Trading, Retail, E-commerce, etc.</p>
          <div className="business-type-examples">
            <span>Electronics</span>
            <span>Furniture</span>
            <span>Clothing</span>
          </div>
        </div>
        
        <div 
          className={`business-type-card ${businessType === 'mixed' ? 'selected' : ''}`}
          onClick={() => handleBusinessTypeSelect('mixed')}
        >
          <div className="business-type-icon">🏪</div>
          <h3>Mixed Business</h3>
          <p>Both products and services</p>
          <div className="business-type-examples">
            <span>Restaurant</span>
            <span>E-commerce Platform</span>
            <span>Manufacturing + Service</span>
          </div>
        </div>
      </div>
      
      <div className="step-actions">
        <button 
          className="btn-primary"
          onClick={handleNext}
          disabled={!businessType}
        >
          Continue
        </button>
      </div>
    </div>
  );

  // Filter services based on search term - ENHANCED for new structure
  const filteredServices = serviceCategories ? serviceCategories.filter(service => {
    // Search in category level
    const categoryMatch = 
    service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
      service.sac_code.includes(serviceSearchTerm);
    
    // Search in specific services within the category
    const specificServiceMatch = service.specific_services?.some(specificService =>
      specificService.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
      specificService.description.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
      specificService.sac_code.includes(serviceSearchTerm)
    );
    
    return categoryMatch || specificServiceMatch;
  }) : [];

  // Limit services displayed to prevent long scrolling
  const [showAllServices, setShowAllServices] = useState(false);
  const servicesToShow = showAllServices ? filteredServices : filteredServices.slice(0, 1);

  // Filter products based on search term
  const filteredProducts = productCategories ? productCategories.filter(product => 
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.hsn_code.includes(productSearchTerm)
  ) : [];

  // Limit products displayed to prevent long scrolling
  const [showAllProducts, setShowAllProducts] = useState(false);
  const productsToShow = showAllProducts ? filteredProducts : filteredProducts.slice(0, 10);

  const renderStep2 = () => {
    const isServiceBusiness = businessType === 'service';
    const isProductBusiness = businessType === 'product';
    const isMixedBusiness = businessType === 'mixed';
    
    return (
      <div className="onboarding-step">
        <h2>
          <span className="step-number">2</span>
          {isServiceBusiness ? '🔍 What services do you provide?' : 
           isProductBusiness ? '🏭 What products do you sell?' : 
           '📋 What services and products do you offer?'}
        </h2>
        <p className="step-description">
          {isServiceBusiness ? 'Select all the services you offer (you can add more later)' :
           isProductBusiness ? 'Select all the product categories you deal with (you can add more later)' :
           'Select services and product categories you offer (you can add more later)'}
        </p>
        <p className="step-description" style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
          💡 <strong>Pro Tip:</strong> These selections will be used to create your service/item templates for quick invoice generation.
        </p>
        
        {errors.selected_services && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {errors.selected_services}
          </div>
        )}

        {/* Services Section - Show for service and mixed businesses */}
        {(isServiceBusiness || isMixedBusiness) && (
          <div className="section-container">
            <h3 className="section-title">🖥️ Services</h3>
            
            {loadingServices ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
                <p>Loading service categories...</p>
              </div>
            ) : serviceCategories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '24px', marginBottom: '16px' }}>📋</div>
                <p>No service categories available yet.</p>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
                  Service categories will be loaded automatically.
                </p>
              </div>
            ) : (
              <>
                {/* Service Search Box */}
                <div className="service-search-container">
                  <div className="search-input-wrapper">
                    <svg 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search services... (e.g., 'web development', 'consulting', 'design')"
                      value={serviceSearchTerm}
                      onChange={(e) => setServiceSearchTerm(e.target.value)}
                    />
                  </div>
                  {serviceSearchTerm && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                      Found {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
                      {filteredServices.length !== serviceCategories.length && (
                        <button 
                          onClick={() => setServiceSearchTerm('')}
                          style={{ 
                            marginLeft: '8px', 
                            color: '#3b82f6', 
                            textDecoration: 'underline', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="service-categories">
                  {servicesToShow.map(service => (
                    <div key={service.id} className="service-category-container" style={{
                      border: '2px solid #e2e8f0',
                      borderRadius: '16px',
                      marginBottom: '20px',
                      overflow: 'hidden'
                    }}>
                      {/* Category Header */}
                      <div className="service-category-header" style={{
                        background: '#f1f5f9',
                        padding: '16px 20px',
                        borderBottom: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                              {service.name}
                            </h3>
                            <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>
                              {service.description}
                            </p>
                          </div>
                          <div className="service-badge" style={{
                            background: '#3b82f6',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            SAC: {service.sac_code} | GST: {service.gst_rate}%
                          </div>
                        </div>
                      </div>
                      
                      {/* Specific Services List */}
                      <div className="specific-services-list" style={{ padding: '16px 20px' }}>
                        <h4 style={{ 
                          margin: '0 0 16px 0', 
                          fontSize: '16px', 
                          fontWeight: '600', 
                          color: '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          🎯 Specific Services in this Category
                        </h4>
                        
                        <div className="specific-services-grid" style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: '12px'
                        }}>
                          {service.specific_services?.map(specificService => (
                            <div 
                              key={specificService.id}
                              className={`specific-service-card ${selectedServices.includes(specificService.id) ? 'selected' : ''}`}
                              onClick={() => handleServiceToggle(specificService.id)}
                              style={{
                                padding: '16px',
                                border: selectedServices.includes(specificService.id) ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                                borderRadius: '12px',
                                background: selectedServices.includes(specificService.id) ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: selectedServices.includes(specificService.id) ? '0 4px 12px rgba(59, 130, 246, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                                transform: selectedServices.includes(specificService.id) ? 'translateY(-1px)' : 'translateY(0)'
                              }}
                            >
                              <div className="specific-service-header" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <h5 style={{ 
                                  margin: '0 0 4px 0', 
                                  fontSize: '14px', 
                                  fontWeight: '600', 
                                  color: '#1e293b',
                                  lineHeight: '1.4'
                                }}>
                                  {specificService.name}
                                </h5>
                                {selectedServices.includes(specificService.id) && (
                                  <div style={{
                                    background: '#3b82f6',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                  }}>
                                    ✓
                                  </div>
                                )}
                              </div>
                              <div className="service-description">
                                <p style={{ 
                                  margin: '0', 
                                  fontSize: '12px', 
                                  color: '#64748b',
                                  lineHeight: '1.4'
                                }}>
                                  {specificService.description}
                                </p>
                      </div>
                              <div className="specific-service-details" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '12px'
                              }}>
                                <span style={{ color: '#059669', fontWeight: '500' }}>
                                  SAC: {specificService.sac_code}
                                </span>
                                <span style={{ color: '#dc2626', fontWeight: '500' }}>
                                  GST: {specificService.gst_rate}%
                                </span>
                      </div>
                                  </div>
                                    ))}
                                  </div>
                                </div>
                            </div>
                          ))}
                        </div>
                {filteredServices.length > 1 && (
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button 
                      className="btn-secondary btn-sm" 
                      onClick={() => setShowAllServices(!showAllServices)}
                      style={{ fontSize: '14px' }}
                    >
                      {showAllServices ? 'Show Less' : `Load More (${filteredServices.length - 1} more)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Products Section - Show for product and mixed businesses */}
        {(isProductBusiness || isMixedBusiness) && (
          <div className="section-container">
            <h3 className="section-title">🏭 Products</h3>
            
            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
                <p>Loading product categories...</p>
              </div>
            ) : productCategories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '24px', marginBottom: '16px' }}>📋</div>
                <p>No product categories available yet.</p>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
                  Product categories will be loaded automatically.
                </p>
              </div>
            ) : (
              <>
                {/* Product Search Box */}
                <div className="service-search-container" style={{ marginBottom: '20px' }}>
                  <div className="search-input-wrapper" style={{ position: 'relative' }}>
                    <svg 
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#64748b' }}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search product categories... (e.g., 'electronics', 'furniture', 'clothing')"
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 40px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '14px',
                        background: '#ffffff',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  {productSearchTerm && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                      Found {filteredProducts.length} product categor{filteredProducts.length !== 1 ? 'ies' : 'y'}
                      {filteredProducts.length !== productCategories?.length && (
                        <button 
                          onClick={() => setProductSearchTerm('')}
                          style={{ 
                            marginLeft: '8px', 
                            color: '#3b82f6', 
                            textDecoration: 'underline', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="service-categories">
                  {productsToShow.map(product => (
                    <div 
                      key={product.id}
                      className={`specific-service-card ${selectedProducts.includes(product.id) ? 'selected' : ''}`}
                      onClick={() => handleProductToggle(product.id)}
                      style={{
                        padding: '16px',
                        border: selectedProducts.includes(product.id) ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                        borderRadius: '12px',
                        background: selectedProducts.includes(product.id) ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedProducts.includes(product.id) ? '0 4px 12px rgba(59, 130, 246, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                        transform: selectedProducts.includes(product.id) ? 'translateY(-1px)' : 'translateY(0)',
                        marginBottom: '12px'
                      }}
                    >
                      <div className="specific-service-header" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h5 style={{ 
                          margin: '0 0 4px 0', 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: '#1e293b',
                          lineHeight: '1.4'
                        }}>
                          {product.name}
                        </h5>
                        {selectedProducts.includes(product.id) && (
                          <div style={{
                            background: '#3b82f6',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            ✓
                      </div>
                        )}
                      </div>
                      <div className="service-description">
                        <p style={{ 
                          margin: '0', 
                          fontSize: '12px', 
                          color: '#64748b',
                          lineHeight: '1.4'
                        }}>
                          {product.description}
                        </p>
                      </div>
                      <div className="specific-service-details" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px'
                      }}>
                        <span style={{ color: '#059669', fontWeight: '500' }}>
                          HSN: {product.hsn_code}
                        </span>
                        <span style={{ color: '#dc2626', fontWeight: '500' }}>
                          GST: {product.gst_rate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredProducts.length > 10 && (
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <button 
                      className="btn-secondary btn-sm" 
                      onClick={() => setShowAllProducts(!showAllProducts)}
                      style={{ fontSize: '14px' }}
                    >
                      {showAllProducts ? 'Show Less' : `Load More (${filteredProducts.length - 10} more)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        <div className="service-note">
          <p><strong>💡 Don't worry if you miss something!</strong> You can always add more services or products later. Our AI will help you add any missing items with automatic HSN/SAC code detection.</p>
        </div>
        
        {/* Selection Summary */}
        <div style={{
          background: '#f8fafc',
          border: '2px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>📋 Selection Summary</h4>
          {isServiceBusiness || isMixedBusiness ? (
            <div style={{ marginBottom: '8px' }}>
              <strong>Services:</strong> {selectedServices.length} selected
              {selectedServices.length > 0 && (
                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                  (Click on services above to select/deselect)
                </span>
              )}
            </div>
          ) : null}
          {isProductBusiness || isMixedBusiness ? (
            <div>
              <strong>Products:</strong> {selectedProducts.length} selected
              {selectedProducts.length > 0 && (
                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                  (Click on products above to select/deselect)
                </span>
              )}
            </div>
          ) : null}
        </div>
        
        <div className="step-actions">
          <button className="btn-secondary" onClick={handleBack}>Back</button>
          <button 
            className="btn-primary"
            onClick={handleNext}
            disabled={
              (isServiceBusiness && selectedServices.length === 0) ||
              (isProductBusiness && selectedProducts.length === 0) ||
              (isMixedBusiness && selectedServices.length === 0 && selectedProducts.length === 0)
            }
          >
            Continue (
              {isServiceBusiness ? `${selectedServices.length} services` :
               isProductBusiness ? `${selectedProducts.length} products` :
               `${selectedServices.length} services, ${selectedProducts.length} products`}
            )
          </button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="onboarding-step">
      <h2><span className="step-number">3</span>📝 Business Details</h2>
      <p className="step-description">Tell us about your business</p>
      
      {errors.submit && (
        <div className="error-message error-submit">
          <span className="error-icon">❌</span>
          {errors.submit}
        </div>
      )}
      
      {errors.success && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          {errors.success}
        </div>
      )}
      
      <div className="business-profile-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="required">Business Name</label>
              <input
                ref={businessNameRef}
                type="text"
                required
                value={businessProfile.business_name}
                onChange={(e) => handleBusinessProfileChange('business_name', e.target.value)}
                placeholder="Enter your business name"
                className={submitAttempted && errors.business_name ? 'error-field' : ''}
              />
              {submitAttempted && errors.business_name && (
                <span className="field-error">{errors.business_name}</span>
              )}
            </div>

          </div>
        </div>
        
        <div className="form-section">
          <h3>Legal Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>GSTIN</label>
              <input
                type="text"
                value={businessProfile.gstin}
                onChange={(e) => handleBusinessProfileChange('gstin', e.target.value)}
                placeholder="Enter GSTIN (optional)"
              />
            </div>
            <div className="form-group">
              <label>PAN</label>
              <input
                type="text"
                value={businessProfile.pan}
                onChange={(e) => handleBusinessProfileChange('pan', e.target.value)}
                placeholder="Enter PAN (optional)"
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Contact Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={businessProfile.phone}
                onChange={(e) => handleBusinessProfileChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="form-group">
              <label className="required">Email</label>
              <input
                ref={emailRef}
                type="email"
                required
                value={businessProfile.email}
                onChange={(e) => handleBusinessProfileChange('email', e.target.value)}
                placeholder="Enter email address"
                className={submitAttempted && errors.email ? 'error-field' : ''}
              />
              {submitAttempted && errors.email && (
                <span className="field-error">{errors.email}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Address</h3>
          <div className="form-group">
            <label className="required">Full Address</label>
            <textarea
              ref={addressRef}
              required
              value={businessProfile.address}
              onChange={(e) => handleBusinessProfileChange('address', e.target.value)}
              placeholder="Enter your business address"
              rows={3}
              className={submitAttempted && errors.address ? 'error-field' : ''}
            />
            {submitAttempted && errors.address && (
              <span className="field-error">{errors.address}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="step-actions">
        <button className="btn-secondary" onClick={handleBack}>Back</button>
        <button 
          className="btn-primary"
          onClick={handleComplete}
          disabled={loading}
        >
          {loading ? 'Setting up...' : 'Complete Setup'}
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="onboarding-step">
      <div className="completion-header">
        <div className="completion-icon">🎉</div>
        <h2><span className="step-number">4</span>Congratulations! You're All Set!</h2>
        <p className="completion-subtitle">Your business profile is ready. Use the links below to explore and customize your setup.</p>
      </div>

      <div className="completion-summary">
        <h3>✅ What's Been Set Up:</h3>
        <ul>
          <li><strong>Business Type:</strong> {
            businessType === 'service' ? 'Service Business' : 
            businessType === 'product' ? 'Product Business' : 
            'Mixed Business (Services + Products)'
          }</li>
          {businessType === 'service' && (
            <li><strong>Service Items:</strong> {selectedServices.length} services configured</li>
          )}
          {businessType === 'product' && (
            <li><strong>Product Items:</strong> {selectedProducts.length} product categories configured</li>
          )}
          {businessType === 'mixed' && (
            <>
                      <li><strong>Service Items:</strong> {selectedServices.length} services configured</li>
        <li><strong>Product Items:</strong> {selectedProducts.length} product categories configured</li>
            </>
          )}
          <li><strong>Business Profile:</strong> Basic details added</li>
          <li><strong>AI Assistant:</strong> Ready to help you create invoices</li>
        </ul>
      </div>

      <div className="sample-invoice-preview">
        <h3>📄 Sample Invoice Preview</h3>
        <div className="invoice-preview-card">
          <div className="invoice-header">
            <div className="business-info">
              <h4>{businessProfile.business_name || 'Your Business Name'}</h4>
              <p>{businessProfile.address || 'Business Address'}</p>
              <p>GSTIN: {businessProfile.gstin || 'Not added yet'}</p>
            </div>
            <div className="invoice-details">
              <h5>INVOICE</h5>
              <p>Date: {new Date().toLocaleDateString('en-IN')}</p>
              <p>Invoice #: INV-001</p>
            </div>
          </div>
          <div className="invoice-body">
            <p><em>This is how your invoice will look. Complete your business profile to add logo, payment details, and branding.</em></p>
          </div>
        </div>
        
        <div className="ai-assistance-note">
          <h4>🤖 AI-Powered Features You Can Use</h4>
          <p><strong>Your AI assistant is ready!</strong> Here's how AI helps you throughout the app:</p>
          <ul>
            <li>✨ <strong>Service Suggestions:</strong> Type in Service Items and get AI service name suggestions</li>
            <li>📊 <strong>Auto HSN/SAC:</strong> Correct codes and GST rates automatically</li>
            <li>💰 <strong>Smart Calculations:</strong> GST calculated instantly on invoices</li>
            <li>🚀 <strong>Quick Invoice:</strong> 30-second invoice creation with AI guidance</li>
            <li>🔄 <strong>Missing Services:</strong> Add any service we missed with AI help</li>
          </ul>
          <p><em>💡 Pro tip: Try typing "web" in Service Items → Add Service Item → Service Name to see AI suggestions!</em></p>
        </div>
      </div>

      <div className="action-buttons">
        <Link to="/app/business" className="btn-primary">Complete Business Profile</Link>
        <Link to="/app/quick-invoice" className="btn-secondary">⚡ Create Quick Invoice (30 seconds)</Link>
        <Link to="/app/service-templates" className="btn-secondary">➕ Add Missing Services (AI Assisted)</Link>
      </div>

      <div className="terms-acceptance">
        <p>By continuing, you agree to our <Link to="/app/terms" className="terms-link">Terms of Service</Link></p>
      </div>
    </div>
  );

  const renderProgressBar = () => (
    <div className="onboarding-progress">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${(currentStep / 4) * 100}%` }}
        ></div>
      </div>
      <div className="progress-steps">
        <span className={`step ${currentStep >= 1 ? 'active' : ''}`}>1. Business Type</span>
        <span className={`step ${currentStep >= 2 ? 'active' : ''}`}>2. Services & Products</span>
        <span className={`step ${currentStep >= 3 ? 'active' : ''}`}>3. Details</span>
        <span className={`step ${currentStep >= 4 ? 'active' : ''}`}>4. Complete</span>
      </div>
    </div>
  );

  return (
    <div className="onboarding-standalone">
      {/* Standalone Header */}
      <div className="onboarding-standalone-header">
        <div className="standalone-brand">
          <h1>
            <div className="logo-icon">📄</div>
            InvoiceGen
          </h1>
          <p>Let's get your business set up in minutes</p>
        </div>
      </div>

      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Welcome! 🎉</h1>
          <p>Set up your business profile in just a few steps</p>
        </div>
        
        {renderProgressBar()}
        
        <div className="onboarding-content">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
