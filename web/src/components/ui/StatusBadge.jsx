import React from 'react'

const colors = {
  Draft:    { bg: 'rgba(255,255,255,0.07)', text: 'rgba(255,255,255,0.5)', dot: 'rgba(255,255,255,0.3)' },
  Sent:     { bg: 'rgba(255,255,255,0.10)', text: 'rgba(255,255,255,0.8)', dot: 'rgba(255,255,255,0.6)' },
  Received: { bg: 'rgba(74,222,128,0.12)', text: '#86efac', dot: '#4ade80' },
  Paid:     { bg: 'rgba(74,222,128,0.12)', text: '#86efac', dot: '#4ade80' },
}

export default function StatusBadge({ status }) {
  const c = colors[status] || colors.Draft
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 100,
      background: c.bg, color: c.text,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.4,
      border: `1px solid ${c.dot}44`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {status}
    </span>
  )
}
