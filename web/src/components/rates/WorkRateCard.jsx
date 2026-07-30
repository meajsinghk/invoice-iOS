import React, { useState } from 'react'
import { useStore } from '../../store/useStore'

export default function WorkRateCard({ item, onEdit }) {
  const { dispatch } = useStore()
  const [confirm, setConfirm] = useState(false)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 16, padding: 16,
      border: '1px solid rgba(255,255,255,0.10)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>🔧</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: 'white' }}>{item.title}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {item.hsnCode && (
            <span style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(96,165,250,0.12)', color: '#7dd3fc', fontSize: 11, fontWeight: 600 }}>
              HSN: {item.hsnCode}
            </span>
          )}
          <span style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(249,115,22,0.12)', color: '#fb923c', fontSize: 11, fontWeight: 600 }}>
            Tax: {item.defaultTaxPercentage}%
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'right', marginRight: 4 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>₹{item.unitRate.toFixed(2)}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>per unit</div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onEdit} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Edit</button>
        {confirm ? (
          <button onClick={() => dispatch({ type: 'DELETE_WORK_RATE', payload: item.id })}
            style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.35)', fontSize: 12, color: '#f87171', fontWeight: 600 }}>Confirm</button>
        ) : (
          <button onClick={() => setConfirm(true)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>🗑</button>
        )}
      </div>
    </div>
  )
}
