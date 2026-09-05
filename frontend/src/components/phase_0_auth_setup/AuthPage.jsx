import React, { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight 
} from 'lucide-react';

export default function AuthPage({ onAuthenticate }) {
  const [mode, setMode] = useState('signup'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    // Save auth token / state to localStorage
    const authData = {
      email: email.trim(),
      isNewUser: mode === 'signup',
      authenticated_at: new Date().toISOString()
    };
    try {
      localStorage.setItem('study_prep_auth', JSON.stringify(authData));
    } catch (err) {
      console.log('LocalStorage error:', err);
    }

    onAuthenticate(authData);
  };

  const handleQuickDemo = () => {
    const demoData = {
      email: 'vikash@example.com',
      isNewUser: mode === 'signup',
      authenticated_at: new Date().toISOString()
    };
    try {
      localStorage.setItem('study_prep_auth', JSON.stringify(demoData));
    } catch (err) {}
    onAuthenticate(demoData);
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '460px',
      margin: '0 auto',
      padding: '0 16px'
    }}>
      {/* Header Logo */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          margin: '0 auto 16px auto',
          boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)'
        }}>
          🧠
        </div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em', color: '#ffffff' }}>
          {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
          {mode === 'signup'
            ? 'Sign up to start your neurocognitive retention profile & smart timetable.'
            : 'Sign in to resume your calibrated circadian study roadmap.'}
        </p>
      </div>

      {/* Auth Mode Toggle Pill */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.04)',
        padding: '4px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '24px'
      }}>
        <button
          type="button"
          onClick={() => { setMode('signin'); setError(null); }}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: mode === 'signin' ? '#6366f1' : 'transparent',
            color: mode === 'signin' ? '#ffffff' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <LogIn size={15} />
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setError(null); }}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            fontSize: '0.86rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: mode === 'signup' ? '#6366f1' : 'transparent',
            color: mode === 'signup' ? '#ffffff' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <UserPlus size={15} />
          Sign Up (New)
        </button>
      </div>

      {/* Auth Card */}
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '28px 24px', borderRadius: '16px' }}>
        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.82rem',
            marginBottom: '18px'
          }}>
            {error}
          </div>
        )}

        {/* Email Field */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
            Email Address
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px'
          }}>
            <Mail size={16} color="var(--text-dim)" />
            <input
              type="email"
              placeholder="e.g. vikash@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                width: '100%'
              }}
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
            Password
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px'
          }}>
            <Lock size={16} color="var(--text-dim)" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                width: '100%'
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex' }}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: '0.92rem', gap: '8px', justifyContent: 'center', background: '#6366f1' }}
        >
          {mode === 'signup' ? <UserPlus size={16} /> : <LogIn size={16} />}
          {mode === 'signup' ? 'Create Account & Continue' : 'Sign In to StudyPrep'}
        </button>

        {/* Quick Demo Option */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleQuickDemo}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-cyan)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ⚡ Quick Demo Sign In (Skip typing)
          </button>
        </div>
      </form>
    </div>
  );
}
