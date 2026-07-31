import React from 'react'

export default function ClientCard({ client, onOpenLedger, index = 0 }) {
  const initials = (client.name || '?').trim().charAt(0).toUpperCase()
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
      {client.avatarUrl ? (
        <img src={client.avatarUrl} alt={client.name}
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
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, color: 'white' }}>{client.name}</div>
        {client.email && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{client.email}</div>}
        {client.phone && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>📞 {client.phone}</div>}
        {(client.gstin || client.taxID) && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            GSTIN: {client.gstin || client.taxID}
          </div>
        )}
      </div>

      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18 }}>›</div>
    </div>
  )
}
