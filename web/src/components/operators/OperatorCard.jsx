import React from 'react'

export default function OperatorCard({ operator, onOpenLedger }) {
  const initials = (operator.name || '?').trim().charAt(0).toUpperCase()

  return (
    <div
      onClick={onOpenLedger}
      style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 16, padding: 16,
        border: '1px solid rgba(255,255,255,0.10)',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer', transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
    >
      {operator.avatarUrl ? (
        <img src={operator.avatarUrl} alt={operator.name}
          style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.14)' }} />
      ) : (
        <div style={{
          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
        }}>{initials}</div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, color: 'white' }}>{operator.name}</div>
        {operator.phone && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>📞 {operator.phone}</div>}
        {operator.address && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{operator.address}</div>}
        {operator.panNumber && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>PAN: {operator.panNumber}</div>
        )}
      </div>

      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>›</div>
    </div>
  )
}
