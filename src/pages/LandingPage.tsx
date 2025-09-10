import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className="landing-page">
      {/* Modern Header */}
      <header className="modern-landing-header">
        <div className="header-container">
          <div className="brand-section">
            <div className="logo-icon">⚡</div>
            <span className="brand-name">invoiceGen</span>
          </div>
          <nav className="header-nav">
            <button 
              className="signin-btn"
              onClick={() => setShowSignIn(true)}
            >
              Sign In
            </button>
            <Link to="/signin" className="cta-btn">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-text">✨ New: Updated GST Reform Support</span>
            </div>
            
            <h1 className="hero-title">
              Create GST-Compliant Invoices in 
              <span className="highlight"> 30 Seconds</span>
            </h1>
            
            <p className="hero-subtitle">
              AI-powered HSN detection + FREE CA validation call for every new user
            </p>
            
            <p className="hero-description">
              Generate professional invoices instantly with smart GST calculations, 
              WhatsApp sharing, and expert CA validation - all for free!
            </p>

            <div className="hero-cta">
              <Link to="/signin" className="btn-primary">
                Start Free Trial
                <span className="btn-subtext">+ Get CA Call</span>
              </Link>
              <button className="btn-secondary">
                <span className="play-icon">▶</span>
                Watch Demo
              </button>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <div className="stat-number">1000+</div>
                <div className="stat-label">Businesses</div>
              </div>
              <div className="stat">
                <div className="stat-number">50K+</div>
                <div className="stat-label">Invoices</div>
              </div>
              <div className="stat">
                <div className="stat-number">98%</div>
                <div className="stat-label">Faster</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Everything you need to invoice like a pro</h2>
            <p>Built for Indian businesses with GST compliance at its core</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3>AI HSN Detection</h3>
              <p>Type "brake pad" → Get HSN 8708, 28% GST automatically</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile-First</h3>
              <p>Create invoices on your phone, tablet, or desktop seamlessly</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>WhatsApp Ready</h3>
              <p>Send professional invoices directly via WhatsApp</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>GST Compliant</h3>
              <p>Auto-calculates taxes and generates proper PDFs</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📞</div>
              <h3>FREE CA Validation</h3>
              <p>Get expert validation of your first invoice setup</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Create invoices in 30 seconds, not 30 minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* CA Validation Section */}
      <section className="ca-section">
        <div className="container">
          <div className="ca-content">
            <div className="ca-badge">
              <span>🎯 Limited Time Offer</span>
            </div>
            <h2>FREE CA Validation for Your First Invoice</h2>
            <p>Get expert validation from a Chartered Accountant to ensure your invoices are perfect</p>
            
            <div className="ca-features">
              <div className="ca-feature">
                <div className="ca-icon">✅</div>
                <span>CA reviews your invoice format</span>
              </div>
              <div className="ca-feature">
                <div className="ca-icon">✅</div>
                <span>Confirms HSN codes are correct</span>
              </div>
              <div className="ca-feature">
                <div className="ca-icon">✅</div>
                <span>15-minute personalized consultation</span>
              </div>
            </div>
            
            <div className="ca-cta">
              <Link to="/signin" className="btn-primary">
                Get Free CA Validation
              </Link>
              <p className="ca-note">Only 23 slots remaining this month</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <h2>Trusted by 1000+ Businesses in Hyderabad</h2>
          <div className="testimonials-grid">
            <div className="testimonial">
              <div className="testimonial-content">
                "The AI HSN suggestions are spot-on! Saves me 2 hours daily. Best investment ever."
              </div>
              <div className="testimonial-author">
                <div className="author-name">Priya Sharma</div>
                <div className="author-title">IT Consultant, Gachibowli</div>
              </div>
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
            </div>
            <div className="testimonial">
              <div className="testimonial-content">
                "The free CA validation gave me complete confidence. Now I never worry about GST errors."
              </div>
              <div className="testimonial-author">
                <div className="author-name">Ravi Malhotra</div>
                <div className="author-title">Auto Parts Trader, Secunderabad</div>
              </div>
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
            </div>
            <div className="testimonial">
              <div className="testimonial-content">
                "Perfect for my agency - creates professional invoices in seconds, clients love it."
              </div>
              <div className="testimonial-author">
                <div className="author-name">Suresh Kumar</div>
                <div className="author-title">Digital Agency, Jubilee Hills</div>
              </div>
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing-section">
        <div className="container">
          <div className="section-header">
            <h2>Simple, transparent pricing</h2>
            <p>Start free, upgrade when you're ready</p>
          </div>
          
          <div className="pricing-cards">
            <div className="pricing-card">
              <div className="plan-name">Free Trial</div>
              <div className="plan-price">
                <span className="price">₹0</span>
                <span className="period">for 14 days</span>
              </div>
              <ul className="plan-features">
                <li>✓ Unlimited invoices</li>
                <li>✓ AI HSN suggestions</li>
                <li>✓ WhatsApp sharing</li>
                <li>✓ FREE CA validation</li>
                <li>✓ Mobile + Desktop</li>
              </ul>
              <Link to="/signin" className="btn-primary">Start Free Trial</Link>
            </div>
            
            <div className="pricing-card popular">
              <div className="popular-badge">Most Popular</div>
              <div className="plan-name">Pro Plan</div>
              <div className="plan-price">
                <span className="price">₹158</span>
                <span className="period">/month</span>
              </div>
              <ul className="plan-features">
                <li>✓ Everything in Free</li>
                <li>✓ Remove branding</li>
                <li>✓ Priority support</li>
                <li>✓ Custom templates</li>
                <li>✓ Payment reminders</li>
                <li>✓ Data export</li>
              </ul>
              <Link to="/signin" className="btn-primary">Choose Pro</Link>
            </div>
          </div>
          
          <div className="pricing-guarantee">
            <p>30-day money-back guarantee • Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Ready to transform your invoicing?</h2>
          <p>Join 1000+ Hyderabad businesses creating professional invoices in 30 seconds</p>
          <div className="final-cta-buttons">
            <Link to="/signin" className="btn-primary btn-large">
              Start Free Trial - No Credit Card
            </Link>
            <button className="btn-secondary btn-large">
              Book Free CA Call First
            </button>
          </div>
        </div>
      </section>

      {/* Sign In Modal */}
      {showSignIn && (
        <div className="signin-modal-overlay" onClick={() => setShowSignIn(false)}>
          <div className="signin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Welcome back</h3>
              <button 
                className="close-btn"
                onClick={() => setShowSignIn(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <p>Sign in to your account to continue</p>
              <Link to="/signin" className="btn-primary btn-full">
                Go to Sign In
              </Link>
              <p className="signup-link">
                Don't have an account? <Link to="/signin">Sign up for free</Link>
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
