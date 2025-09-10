import React from 'react'
import { signIn, signUp, resetPassword, confirmResetPassword, confirmSignUp } from 'aws-amplify/auth'
import { useNavigate } from 'react-router-dom'
// Auth styles now imported via main.css

export default function SignIn() {
  const [email, setEmail] = React.useState('demo@example.com')
  const [password, setPassword] = React.useState('Password123!')
  const [stage, setStage] = React.useState<'signin'|'signup'|'signup-confirm'|'reset-request'|'reset-confirm'>('signin')
  const [code, setCode] = React.useState('')
  const [fullName, setFullName] = React.useState('')
  const [phone, setPhone] = React.useState('+91')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [gender, setGender] = React.useState<'Male'|'Female'>('Male')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const navigate = useNavigate()

  const clearError = () => setError('')

  async function doSignIn() {
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await signIn({ username: email, password })
      navigate('/app')
    } catch (e: any) {
      setError(e?.message || 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function doSignUp() {
    if (!email || !password || !confirmPassword || !fullName.trim()) {
      setError('Please fill in all required fields')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const nameTrimmed = fullName.trim()
      const attrs: Record<string, string> = { email, name: nameTrimmed, gender }
      const phoneTrimmed = (phone || '').trim()
      if (phoneTrimmed && phoneTrimmed !== '+91') {
        attrs.phone_number = phoneTrimmed
      }
      
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: attrs,
          autoSignIn: true,
        },
      })
      setStage('signup-confirm')
    } catch (e: any) {
      setError(e?.message || 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function doSignUpConfirm() {
    if (!code) {
      setError('Please enter the verification code')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await confirmSignUp({ username: email, confirmationCode: code })
      await signIn({ username: email, password })
      // Redirect to plan selection after successful signup and signin
      navigate('/select-plan')
    } catch (e: any) {
      setError(e?.message || 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function doResetRequest() {
    if (!email) {
      setError('Please enter your email address')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await resetPassword({ username: email })
      setStage('reset-confirm')
    } catch (e: any) {
      setError(e?.message || 'Password reset request failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function doResetConfirm() {
    if (!code || !password) {
      setError('Please fill in all fields')
      return
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword: password })
      setStage('signin')
      setError('Password reset successful! Please sign in with your new password.')
    } catch (e: any) {
      setError(e?.message || 'Password reset failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderSignIn = () => (
    <div className="auth-form">
      <div className="form-header">
        <h1 className="form-title">Welcome Back! 👋</h1>
        <p className="form-subtitle">Sign in to your invoiceGen account</p>
      </div>
      
      <div className="form-group">
        <label className="form-label">Email Address</label>
        <input 
          className="form-input" 
          type="email" 
          placeholder="Enter your email" 
          autoComplete="email" 
          value={email} 
          onChange={(e) => { setEmail(e.target.value); clearError() }}
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Password</label>
        <input 
          className="form-input" 
          type="password" 
          placeholder="Enter your password" 
          autoComplete="current-password" 
          value={password} 
          onChange={(e) => { setPassword(e.target.value); clearError() }}
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <button 
        className="btn-primary" 
        onClick={doSignIn}
        disabled={loading}
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </button>
      
      <div className="form-actions">
        <button 
          className="btn-link" 
          onClick={() => { setStage('reset-request'); clearError() }}
        >
          Forgot password?
        </button>
        <button 
          className="btn-link" 
          onClick={() => { setStage('signup'); clearError() }}
        >
          Create account
        </button>
      </div>
    </div>
  )

  const renderSignUp = () => (
    <div className="auth-form">
      <div className="form-header">
        <h1 className="form-title">Create Your Account 🚀</h1>
        <p className="form-subtitle">Join invoiceGen and start creating professional invoices</p>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input 
            className="form-input" 
            placeholder="Enter your full name" 
            autoComplete="name" 
            value={fullName} 
            onChange={(e) => { setFullName(e.target.value); clearError() }}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Gender</label>
          <select 
            className="form-input" 
            value={gender} 
            onChange={(e) => setGender(e.target.value as any)}
          >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label">Email Address *</label>
        <input 
          className="form-input" 
          type="email" 
          placeholder="Enter your email" 
          autoComplete="email" 
          value={email} 
          onChange={(e) => { setEmail(e.target.value); clearError() }}
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Phone Number</label>
        <input 
          className="form-input" 
          placeholder="+91 98765 43210" 
          inputMode="tel" 
          autoComplete="tel" 
          value={phone} 
          onChange={(e) => { setPhone(e.target.value); clearError() }}
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Password *</label>
          <input 
            className="form-input" 
            type="password" 
            placeholder="Create a password" 
            autoComplete="new-password" 
            value={password} 
            onChange={(e) => { setPassword(e.target.value); clearError() }}
          />
          <small className="form-hint">Minimum 8 characters</small>
        </div>
        
        <div className="form-group">
          <label className="form-label">Confirm Password *</label>
          <input 
            className="form-input" 
            type="password" 
            placeholder="Confirm your password" 
            autoComplete="new-password" 
            value={confirmPassword} 
            onChange={(e) => { setConfirmPassword(e.target.value); clearError() }}
          />
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <button 
        className="btn-primary" 
        onClick={doSignUp}
        disabled={loading}
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
      
      <div className="form-actions">
        <button 
          className="btn-link" 
          onClick={() => { setStage('signin'); clearError() }}
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  )

  const renderSignUpConfirm = () => (
    <div className="auth-form">
      <div className="form-header">
        <h1 className="form-title">Verify Your Email ✉️</h1>
        <p className="form-subtitle">We've sent a verification code to {email}</p>
      </div>
      
      <div className="form-group">
        <label className="form-label">Verification Code</label>
        <input 
          className="form-input verification-input" 
          placeholder="Enter 6-digit code" 
          value={code} 
          onChange={(e) => { setCode(e.target.value); clearError() }}
          maxLength={6}
        />
        <small className="form-hint">Check your email for the verification code</small>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <button 
        className="btn-primary" 
        onClick={doSignUpConfirm}
        disabled={loading}
      >
        {loading ? 'Verifying...' : 'Verify & Sign In'}
      </button>
      
      <div className="form-actions">
        <button 
          className="btn-link" 
          onClick={() => { setStage('signin'); clearError() }}
        >
          Back to sign in
        </button>
      </div>
    </div>
  )

  const renderResetRequest = () => (
    <div className="auth-form">
      <div className="form-header">
        <h1 className="form-title">Reset Your Password 🔐</h1>
        <p className="form-subtitle">Enter your email to receive a reset code</p>
      </div>
      
      <div className="form-group">
        <label className="form-label">Email Address</label>
        <input 
          className="form-input" 
          type="email" 
          placeholder="Enter your email" 
          autoComplete="email" 
          value={email} 
          onChange={(e) => { setEmail(e.target.value); clearError() }}
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <button 
        className="btn-primary" 
        onClick={doResetRequest}
        disabled={loading}
      >
        {loading ? 'Sending Code...' : 'Send Reset Code'}
      </button>
      
      <div className="form-actions">
        <button 
          className="btn-link" 
          onClick={() => { setStage('signin'); clearError() }}
        >
          Back to sign in
        </button>
      </div>
    </div>
  )

  const renderResetConfirm = () => (
    <div className="auth-form">
      <div className="form-header">
        <h1 className="form-title">Set New Password 🔑</h1>
        <p className="form-subtitle">Enter the code from your email and create a new password</p>
      </div>
      
      <div className="form-group">
        <label className="form-label">Verification Code</label>
        <input 
          className="form-input verification-input" 
          placeholder="Enter 6-digit code" 
          value={code} 
          onChange={(e) => { setCode(e.target.value); clearError() }}
          maxLength={6}
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">New Password</label>
        <input 
          className="form-input" 
          type="password" 
          placeholder="Create a new password" 
          autoComplete="new-password" 
          value={password} 
          onChange={(e) => { setPassword(e.target.value); clearError() }}
        />
        <small className="form-hint">Minimum 8 characters</small>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <button 
        className="btn-primary" 
        onClick={doResetConfirm}
        disabled={loading}
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
      
      <div className="form-actions">
        <button 
          className="btn-link" 
          onClick={() => { setStage('signin'); clearError() }}
        >
          Back to sign in
        </button>
      </div>
    </div>
  )

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-pattern"></div>
      </div>
      
      <div className="auth-content">
        <div className="auth-brand">
          <div className="brand-logo">⚡</div>
          <h1 className="brand-name">invoiceGen</h1>
          <p className="brand-tagline">Professional Invoicing Made Simple</p>
        </div>
        
        <div className="auth-card">
          {stage === 'signin' && renderSignIn()}
          {stage === 'signup' && renderSignUp()}
          {stage === 'signup-confirm' && renderSignUpConfirm()}
          {stage === 'reset-request' && renderResetRequest()}
          {stage === 'reset-confirm' && renderResetConfirm()}
        </div>
        
        <div className="auth-footer">
          <p>© 2024 invoiceGen. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
