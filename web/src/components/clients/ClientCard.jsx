import React, { useState } from 'react'
import { useStore } from '../../store/useStore'

export default function ClientCard({ client, onEdit }) {
  const { state, dispatch } = useStore()
  const [confirm, setConfirm] = useState(false)

  const invoiceCount = state.invoices.filter(i => i.clientName === client.name).length
  const initials = client.name.trim().charAt(0).toUpperCase() || '?'

  function handleDelete() {
    dispatch({ type: 'DELETE_CLIENT', payload: client.id })
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 16, padding: 16,
      border: '1px solid rgba(255,255,255,0.10)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(255,255,255,0.10)',
        border: '1px solid rgba(255,255,255,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
      }}>
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, color: 'white' }}>{client.name}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{client.email}</div>
        {client.phone && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>📞 {client.phone}</div>}
        {(client.gstin || client.taxID) && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            GSTIN: {client.gstin || client.taxID}
          </div>
        )}
      </div>

      {invoiceCount > 0 && (
        <div style={{ textAlign: 'center', marginRight: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{invoiceCount}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>invoices</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onEdit} style={{
          padding: '6px 12px', borderRadius: 8,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500,
        }}>Edit</button>
        {confirm ? (
          <button onClick={handleDelete} style={{
            padding: '6px 12px', borderRadius: 8,
            background: 'rgba(239,68,68,0.2)',
            border: '1px solid rgba(239,68,68,0.35)',
            fontSize: 12, color: '#f87171', fontWeight: 600,
          }}>Confirm</button>
        ) : (
          <button onClick={() => setConfirm(true)} style={{
            padding: '6px 12px', borderRadius: 8,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 12, color: 'rgba(255,255,255,0.4)',
          }}>🗑</button>
        )}
      </div>
    </div>
  )
}
