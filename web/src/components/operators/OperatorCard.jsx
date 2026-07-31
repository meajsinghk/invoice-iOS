import React from 'react'

export default function OperatorCard({ operator, onOpenLedger, index = 0 }) {
  const initials = (operator.name || '?').trim().charAt(0).toUpperCase()
  const isEven = index % 2 === 0

  return (
    <div
      onClick={onOpenLedger}
      style={{
        background: isEven ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        borderRadius: 16, padding: '14px 16px',
        border: isEven ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer', transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
      onMouseLeave={e => e.currentTarget.style.background = isEven ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)'}
    >
      {operator.avatarUrl ? (
        <img src={operator.avatarUrl} alt={operator.name}
          style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.18)' }} />
      ) : (
        <div style={{
          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          background: isEven ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)',
          border: '2px solid rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, color: 'white',
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

      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18 }}>›</div>
    </div>
  )
}
