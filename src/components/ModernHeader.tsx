import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
// Header styles now imported via main.css

interface NavigationItem {
  path: string;
  title: string;
  icon: string;
}

const navigationItems: NavigationItem[] = [
  {
    path: '/dashboard',
    title: 'Dashboard',
    icon: '📊'
  },
  {
    path: '/invoices',
    title: 'Invoices',
    icon: '📄'
  },
  {
    path: '/customers',
    title: 'Customers',
    icon: '👥'
  },
  {
    path: '/create-invoice',
    title: 'Create',
    icon: '✨'
  }
];

export default function ModernHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="modern-header">
        <div className="header-container">
          {/* Brand Section */}
          <div className="brand-section">
            <Link to="/app" className="brand-logo">
              <div className="logo-icon">📄</div>
              <span className="brand-name">InvoiceGen</span>
            </Link>
          </div>

          {/* Navigation Section */}
          <nav className="nav-section">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-card ${location.pathname === item.path ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-title">{item.title}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="user-section">
            <div className="user-profile">
              <div className="user-avatar">U</div>
              <div className="user-info">
                <div className="user-name">User</div>
                <div className="user-role">Business Owner</div>
              </div>
            </div>
            <button className="logout-btn" onClick={handleSignOut}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className={`menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-card ${location.pathname === item.path ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-title">{item.title}</span>
            </Link>
          ))}
          
          {/* Mobile User Actions */}
          <div style={{ marginTop: '16px', padding: '16px', borderTop: '1px solid #e5e7eb' }}>
            <button className="logout-btn" onClick={handleSignOut} style={{ width: '100%', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      {/* Spacer to prevent content from hiding under fixed header */}
      <div style={{ height: '64px' }}></div>
    </>
  );
}
