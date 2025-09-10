import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsAndConditions() {
  return (
    <div className="terms-container">
      <div className="terms-header">
        <h1>Terms of Service & Privacy Policy</h1>
        <p className="terms-subtitle">Last updated: {new Date().toLocaleDateString('en-IN')}</p>
      </div>

      <div className="terms-content">
        <section className="terms-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using InvoiceGen ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
            If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. Service Description</h2>
          <p>
            InvoiceGen is a business-to-business (B2B) invoice generation platform that helps businesses create, manage, and share 
            GST-compliant invoices. Our service includes invoice creation, customer management, and business profile management.
          </p>
        </section>

        <section className="terms-section">
          <h2>3. User Responsibilities</h2>
          <ul>
            <li>You must provide accurate and complete business information</li>
            <li>You are responsible for maintaining the confidentiality of your account</li>
            <li>You must comply with all applicable tax laws and regulations</li>
            <li>You are responsible for the accuracy of invoice data and GST calculations</li>
            <li>You must not use the service for any illegal or unauthorized purpose</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>4. GST Compliance</h2>
          <p>
            While InvoiceGen provides tools for GST-compliant invoicing, users are responsible for:
          </p>
          <ul>
            <li>Ensuring their GSTIN is valid and active</li>
            <li>Correct HSN/SAC code selection for goods/services</li>
            <li>Accurate GST rate application</li>
            <li>Compliance with GST filing requirements</li>
          </ul>
          <p>
            <strong>Note:</strong> InvoiceGen is not responsible for GST compliance errors or tax-related issues.
          </p>
        </section>

        <section className="terms-section">
          <h2>5. Data Privacy & Security</h2>
          <p>
            We are committed to protecting your business data:
          </p>
          <ul>
            <li>Your business information is stored securely and encrypted</li>
            <li>We do not share your data with third parties without consent</li>
            <li>You retain ownership of all your business data</li>
            <li>We implement industry-standard security measures</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>6. Service Availability</h2>
          <p>
            We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. 
            We reserve the right to modify, suspend, or discontinue the service with reasonable notice.
          </p>
        </section>

        <section className="terms-section">
          <h2>7. Limitation of Liability</h2>
          <p>
            InvoiceGen is provided "as is" without warranties. We are not liable for:
          </p>
          <ul>
            <li>Any financial losses due to invoice errors</li>
            <li>GST compliance issues or tax penalties</li>
            <li>Data loss or service interruptions</li>
            <li>Third-party actions or content</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>8. Account Termination</h2>
          <p>
            We may terminate or suspend your account if you violate these terms. 
            You may cancel your account at any time through your dashboard.
          </p>
        </section>

        <section className="terms-section">
          <h2>9. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. We will notify users of significant changes 
            via email or through the application.
          </p>
        </section>

        <section className="terms-section">
          <h2>10. Contact Information</h2>
          <p>
            If you have questions about these terms, please contact us at:
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> support@invoicegen.com</p>
            <p><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST</p>
          </div>
        </section>
      </div>

      <div className="terms-footer">
        <Link to="/app" className="btn-primary">Back to Dashboard</Link>
        <p className="terms-note">
          By using InvoiceGen, you acknowledge that you have read, understood, and agree to these terms.
        </p>
      </div>
    </div>
  );
}
