import React from 'react'

export default function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 16px',
        borderRadius: 100,
        border: active ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.10)',
        background: active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)',
        color: active ? '#fff' : 'rgba(255,255,255,0.45)',
        fontSize: 13,
        fontWeight: active ? 700 : 400,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  )
}
