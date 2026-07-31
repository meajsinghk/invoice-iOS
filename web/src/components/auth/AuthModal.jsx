import React, { useState, useEffect } from 'react'

const AUTH_KEY = 'simpleinvoice_auth'
const API_BASE = import.meta.env.VITE_API_BASE || ''

export function getAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_KEY)
}

async function callAuth(body) {
  const res = await fetch(`${API_BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export default function AuthModal({ onSuccess }) {
  // 'checking' | 'login' | 'register'
  const [mode, setMode] = useState('checking')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dbAvailable, setDbAvailable] = useState(true)

  // On mount: check if DB has any users yet; decide login vs register
  useEffect(() => {
    callAuth({ action: 'check_users' })
      .then(data => setMode(data.hasUsers ? 'login' : 'register'))
      .catch(() => {
        setDbAvailable(false)
        setMode('login') // fallback — offline mode handled below
      })
  }, [])

  // Also verify any existing stored token on mount
  useEffect(() => {
    const session = getAuthSession()
    if (!session?.authToken) return
    callAuth({ action: 'verify', token: session.authToken })
      .then(data => {
        if (data.valid) {
          // Token still valid — auto-login
          onSuccess({ authToken: session.authToken, personName: data.personName, phone: data.phone })
        } else {
          clearAuthSession()
        }
      })
      .catch(() => {
        // DB offline: honour cached session as-is
        if (session?.personName) onSuccess(session)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [email, setEmail] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!dbAvailable) {
      // Offline: still enforce whitelist client-side
      const ALLOWED_PHONES = ['7770855666', '6475408800', '9098815367']
      const ALLOWED_EMAILS = ['virk.milan006@gmail.com', 'amarjot.johal@yahoo.com', 'johalamrit30@gmail.com']
      const normPhone = phone.replace(/[\s\-().+]/g, '').replace(/^91(\d{10})$/, '$1')
      if (!ALLOWED_PHONES.includes(normPhone) && !ALLOWED_EMAILS.includes(email.trim().toLowerCase())) {
        setError('Access denied. This phone number or email is not authorised.')
        return
      }
      const session = {
        authToken: 'offline-' + Date.now(),
        personName: name.trim() || `User ${phone.slice(-4)}`,
        phone,
      }
      localStorage.setItem(AUTH_KEY, JSON.stringify(session))
      return onSuccess(session)
    }

    if (mode === 'register') {
      if (!name.trim()) { setError('Please enter your name.'); return }
      if (phone.trim().length < 7) { setError('Enter a valid phone number.'); return }
      if (password.length < 4) { setError('Password must be at least 4 characters.'); return }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    } else {
      if (phone.trim().length < 7) { setError('Enter a valid phone number.'); return }
      if (!password) { setError('Enter your password.'); return }
    }

    setLoading(true)
    try {
      const data = await callAuth({
        action: mode,
        phone: phone.trim(),
        email: email.trim(),
        password,
        name: name.trim(),
      })
      const session = { authToken: data.token, personName: data.personName, phone: data.phone }
      localStorage.setItem(AUTH_KEY, JSON.stringify(session))
      onSuccess(session)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', padding: '14px 16px', borderRadius: 12, fontSize: 15,
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
    color: 'white', outline: 'none', boxSizing: 'border-box',
  }
  const btn = {
    width: '100%', padding: '15px', borderRadius: 14, fontSize: 16, fontWeight: 700,
    background: loading ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.25)',
    color: loading ? 'rgba(255,255,255,0.4)' : 'white',
    cursor: loading ? 'not-allowed' : 'pointer',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0a0a0a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 24, padding: '36px 28px',
        backdropFilter: 'blur(24px)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="Milan Construction" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 10, objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none' }} />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: 0 }}>Milan Construction</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Invoice Management System</p>
        </div>

        {mode === 'checking' ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            Connecting…
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                {mode === 'register' ? '👤 Create Account' : '🔐 Sign In'}
              </span>
            </div>

            {mode === 'register' && (
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                Your Name *
                <input style={inp} value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Milandeep Virk" autoComplete="name" />
              </label>
            )}

            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              Phone Number *
              <input style={inp} type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+91 77708 55666" autoComplete="tel" required />
            </label>

            {mode === 'register' && (
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                Email (optional — used for access verification)
                <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="yourname@email.com" autoComplete="email" />
              </label>
            )}

            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              Password *
              <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Create a password (min 4 chars)' : 'Your password'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required />
            </label>

            {mode === 'register' && (
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                Confirm Password *
                <input style={inp} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password" autoComplete="new-password" required />
              </label>
            )}

            {!dbAvailable && (
              <div style={{ fontSize: 12, color: 'rgba(255,165,0,0.8)', background: 'rgba(255,165,0,0.08)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,165,0,0.15)' }}>
                ⚠️ Database offline — signing in with local session
              </div>
            )}

            {error && (
              <p style={{ color: '#f87171', fontSize: 13, margin: 0, background: 'rgba(248,113,113,0.08)', padding: '8px 12px', borderRadius: 8 }}>
                {error}
              </p>
            )}

            <button type="submit" style={btn} disabled={loading}>
              {loading ? 'Please wait…' : mode === 'register' ? 'Create Account →' : 'Sign In →'}
            </button>

            {mode === 'login' && (
              <button type="button" onClick={() => { setMode('register'); setError('') }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', marginTop: -4 }}>
                First time? Create an account
              </button>
            )}
            {mode === 'register' && (
              <button type="button" onClick={() => { setMode('login'); setError('') }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', marginTop: -4 }}>
                Already have an account? Sign in
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
