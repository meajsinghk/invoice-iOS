import React, { useState } from 'react'

export default function DoubleConfirmDeleteModal({ name, onConfirm, onCancel }) {
  const [step, setStep] = useState(1)
  const [typed, setTyped] = useState('')

  const backdrop = {
    position: 'fixed', inset: 0, zIndex: 2000,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  }
  const panel = {
    background: '#121212',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20, padding: '28px 24px',
    width: '100%', maxWidth: 360,
  }
  const btnBase = { padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', flex: 1 }

  return (
    <div style={backdrop} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={panel}>
        {step === 1 ? (
          <>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
            <h3 style={{ color: 'white', fontWeight: 700, textAlign: 'center', margin: '0 0 8px' }}>Delete Profile?</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', margin: '0 0 24px' }}>
              Are you sure you want to delete <strong style={{ color: 'white' }}>{name}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onCancel} style={{ ...btnBase, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}>Cancel</button>
              <button onClick={() => setStep(2)} style={{ ...btnBase, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>Delete</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>🚨</div>
            <h3 style={{ color: '#f87171', fontWeight: 700, textAlign: 'center', margin: '0 0 8px' }}>Final Warning</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', margin: '0 0 16px' }}>
              All ledger entries for <strong style={{ color: 'white' }}>{name}</strong> will be permanently deleted.<br />Type <strong style={{ color: '#f87171' }}>DELETE</strong> to confirm.
            </p>
            <input
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder="Type DELETE"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'white', fontSize: 15, textAlign: 'center', marginBottom: 16,
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onCancel} style={{ ...btnBase, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}>Cancel</button>
              <button
                onClick={onConfirm}
                disabled={typed !== 'DELETE'}
                style={{ ...btnBase, background: typed === 'DELETE' ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', color: typed === 'DELETE' ? '#f87171' : 'rgba(255,255,255,0.2)', cursor: typed === 'DELETE' ? 'pointer' : 'not-allowed' }}>
                Permanently Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
