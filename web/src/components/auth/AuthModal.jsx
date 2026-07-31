import React, { useState } from 'react'

const AUTH_KEY = 'simpleinvoice_auth'

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

export default function AuthModal({ onSuccess }) {
  const [step, setStep] = useState('login') // 'login' | 'otp'
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [otp, setOtp] = useState('')
  const [personName, setPersonName] = useState('')
  const [otpError, setOtpError] = useState('')
  const [loginError, setLoginError] = useState('')

  function handleLogin(e) {
    e.preventDefault()
    if (phone.trim().length < 6) { setLoginError('Enter a valid phone number.'); return }
    if (pin.trim().length < 4) { setLoginError('Enter a 4–6 digit PIN.'); return }
    setLoginError('')
    const derivedName = personName.trim() || `User ${phone.slice(-4)}`
    setPersonName(derivedName)
    setStep('otp')
  }

  function handleOtp(e) {
    e.preventDefault()
    const code = otp.trim()
    if (code !== '1234' && code !== '') { setOtpError('Invalid OTP. Use 1234 for testing.'); return }
    const session = { authToken: 'local-token-' + Date.now(), personName: personName || `User ${phone.slice(-4)}`, phone }
    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
    onSuccess(session)
  }

  function autoComplete() {
    setOtp('1234')
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12, fontSize: 16,
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
    color: 'white', outline: 'none', boxSizing: 'border-box',
  }
  const btnPrimary = {
    width: '100%', padding: '15px', borderRadius: 14, fontSize: 16, fontWeight: 700,
    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
    color: 'white', cursor: 'pointer',
  }
  const errorStyle = { color: '#f87171', fontSize: 13, marginTop: 4 }

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
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏗️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: 0 }}>Milan Construction</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Invoice Management System</p>
        </div>

        {step === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              Your Name (optional)
              <input style={inputStyle} value={personName} onChange={e => setPersonName(e.target.value)} placeholder="e.g. Milandeep" />
            </label>
            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              Phone Number
              <input style={inputStyle} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 77708 55666" required />
            </label>
            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              PIN / Password
              <input style={inputStyle} type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="4–6 digit PIN" maxLength={6} required />
            </label>
            {loginError && <p style={errorStyle}>{loginError}</p>}
            <button type="submit" style={btnPrimary}>Continue →</button>
          </form>
        ) : (
          <form onSubmit={handleOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', margin: 0 }}>
              A verification code was sent to<br />
              <span style={{ color: 'white', fontWeight: 600 }}>{phone}</span>
            </p>
            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              4-Digit OTP
              <input style={{ ...inputStyle, fontSize: 24, textAlign: 'center', letterSpacing: 8 }}
                type="text" inputMode="numeric" maxLength={4}
                value={otp} onChange={e => setOtp(e.target.value)} placeholder="····" autoFocus />
            </label>
            {otpError && <p style={errorStyle}>{otpError}</p>}
            <button type="submit" style={btnPrimary}>Verify & Login</button>
            <button type="button" onClick={autoComplete}
              style={{ ...btnPrimary, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: 'rgba(255,255,255,0.4)', padding: 10 }}>
              Auto-complete (Offline / Test)
            </button>
            <button type="button" onClick={() => setStep('login')}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
