import React from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { fetchAuthSession, signOut } from 'aws-amplify/auth'
import { api } from './api/client'
import './auth/amplify'
import './styles/main.css'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import CreateInvoice from './pages/CreateInvoice'
import Invoices from './pages/Invoices'
import InvoiceView from './pages/InvoiceView'
import BusinessProfile from './pages/BusinessProfile'
import { useEffect } from 'react';
import { useSubscription } from './contexts/SubscriptionContext';
import { SubscriptionStatus, SubscriptionPrompt } from './components/subscription';

// This component handles the scroll restoration for the entire app.
// It is placed in App.tsx to ensure it runs on every route change.
const ScrollManager = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // This is a hyper-aggressive scroll-to-top that targets all possible
    // scrolling elements to ensure it works on mobile browsers, which
    // can have inconsistent scrolling behavior.
    try {
      window.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
      document.documentElement.scrollTo(0, 0);

      // Additionally, try to find the main content container and scroll it.
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.scrollTo(0, 0);
      }
    } catch (e) {
      // Ignore errors, as some browsers might not support all methods.
    }
  }, [pathname]);

  return null;
};

export default function App() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { subscription } = useSubscription()

  const [ready, setReady] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  
  React.useEffect(() => {
    let mounted = true
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth check timed out, proceeding anyway')
        setReady(true)
      }
    }, 5000) // 5 second timeout
    
    fetchAuthSession()
      .then(async (s) => {
        clearTimeout(timeoutId)
        const hasToken = Boolean(s.tokens?.idToken || s.tokens?.accessToken)
        
        if (!hasToken) {
          navigate('/signin')
          return
        }
        
        // Check if user has completed onboarding
        try {
          const onboardingResponse = await api('/users/onboarding')
          const hasCompletedOnboarding = onboardingResponse?.completed === true
          
          if (!hasCompletedOnboarding) {
            // New user - redirect to onboarding
            navigate('/onboarding')
            return
          }
          
          // User has completed onboarding - proceed to dashboard
          if (mounted) setReady(true)
        } catch (error) {
          console.warn('Failed to check onboarding status:', error)
          // If we can't check onboarding status, assume new user and redirect
          navigate('/onboarding')
          return
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        console.warn('Auth check failed:', error)
        // In development, proceed anyway (you can also navigate to signin if preferred)
        if (mounted) setReady(true) // Allow proceeding in case of auth errors
      })
    
    return () => { 
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [navigate])

  if (!ready) {
    return (
      <div className="loading-container" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        zIndex: 9999
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%',
          margin: '0 auto'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
            display: 'block'
          }}></div>
          <h3 style={{ color: '#1f2937', margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: '600' }}>📄 InvoiceGen</h3>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '1rem' }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <ScrollManager />
      {/* Modern Two-Row Header */}
      <header className="modern-header">
        {/* Row 1: Brand + Controls (Always Visible) */}
        <div className="header-top-row">
          <div className="brand-section">
            <div className="logo-icon">⚡</div>
            <span className="brand-name">invoiceGen</span>
          </div>
          
          <div className="header-controls">
            {/* Subscription Status */}
            {subscription && (
              <div className="subscription-status-header">
                <SubscriptionStatus
                  subscription={subscription}
                  onUpgrade={() => navigate('/app/subscription')}
                  onManage={() => navigate('/app/subscription')}
                  compact={true}
                />
              </div>
            )}
            
            <button 
              className={`menu-toggle ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              title="More Options"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
            
            <button 
              className="logout-btn" 
              onClick={() => signOut().then(() => navigate('/signin'))}
              title="Logout"
            >
              🔒
            </button>
          </div>
        </div>

        {/* Row 2: Main Navigation with Descriptions (Hidden on Scroll) */}
        <div className="main-navigation-row">
          <div className="nav-grid">
            <Link 
              className={`nav-card ${pathname === '/app' ? 'active' : ''}`} 
              to="/app"
            >
              <div className="nav-icon">📊</div>
              <div className="nav-content">
                <div className="nav-title">Dashboard</div>
                <div className="nav-desc">Business overview</div>
              </div>
            </Link>
            
            <Link 
              className={`nav-card ${pathname.startsWith('/app/invoices') ? 'active' : ''}`} 
              to="/app/invoices"
            >
              <div className="nav-icon">📋</div>
              <div className="nav-content">
                <div className="nav-title">Invoices</div>
                <div className="nav-desc">View & manage</div>
              </div>
            </Link>
            
            <Link 
              className={`nav-card ${pathname.startsWith('/app/customers') ? 'active' : ''}`} 
              to="/app/customers"
            >
              <div className="nav-icon">👥</div>
              <div className="nav-content">
                <div className="nav-title">Customers</div>
                <div className="nav-desc">Client database</div>
              </div>
            </Link>
            
            <Link 
              className={`nav-card ${pathname.startsWith('/app/create-invoice') ? 'active' : ''}`} 
              to="/app/create-invoice"
            >
              <div className="nav-icon">✨</div>
              <div className="nav-content">
                <div className="nav-title">Create</div>
                <div className="nav-desc">New invoice</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Collapsible Menu (Secondary Actions) */}
        <div className={`secondary-menu ${menuOpen ? 'open' : ''}`}>
          <div className="menu-items">
            <Link 
              className={`menu-item ${pathname.startsWith('/app/item-library') ? 'active' : ''}`} 
              to="/app/item-library"
              onClick={() => setMenuOpen(false)}
            >
              <span className="menu-icon">📚</span>
              <span className="menu-text">Item Library</span>
            </Link>
            
            <Link 
              className={`menu-item ${pathname.startsWith('/app/service-templates') ? 'active' : ''}`} 
              to="/app/service-templates"
              onClick={() => setMenuOpen(false)}
            >
              <span className="menu-icon">📋</span>
              <span className="menu-text">Templates</span>
            </Link>
            
            <Link 
              className={`menu-item ${pathname.startsWith('/app/business') ? 'active' : ''}`} 
              to="/app/business"
              onClick={() => setMenuOpen(false)}
            >
              <span className="menu-icon">🏢</span>
              <span className="menu-text">Business Profile</span>
            </Link>
            
            <Link 
              className={`menu-item ${pathname.startsWith('/app/subscription') ? 'active' : ''}`} 
              to="/app/subscription"
              onClick={() => setMenuOpen(false)}
            >
              <span className="menu-icon">💳</span>
              <span className="menu-text">Subscription</span>
            </Link>
            
            <Link 
              className="menu-item" 
              to="/app/terms"
              onClick={() => setMenuOpen(false)}
            >
              <span className="menu-icon">📄</span>
              <span className="menu-text">Terms & Privacy</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Subscription Prompts */}
        {subscription && (subscription.is_expiring_soon || subscription.status === 'expired') && (
          <SubscriptionPrompt
            subscription={subscription}
            onUpgrade={() => navigate('/app/subscription')}
            variant="banner"
          />
        )}
        
        <Outlet />
      </main>
    </div>
  )
}
