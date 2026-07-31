import React, { useState } from 'react'
import { useStore } from '../../store/useStore'
import StatusBadge from '../ui/StatusBadge'
import FilterChip from '../ui/FilterChip'

const STATUS_CYCLE = { Draft: 'Sent', Sent: 'Paid', Paid: 'Draft' }

function getTimeRangeBounds(timeRange) {
  const now = new Date()
  const start = new Date()
  switch (timeRange) {
    case 'Today': start.setHours(0, 0, 0, 0); break
    case 'This Week': start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0); break
    case 'This Month': start.setDate(1); start.setHours(0, 0, 0, 0); break
    case 'This Year': start.setMonth(0, 1); start.setHours(0, 0, 0, 0); break
    default: return null
  }
  return start
}

export default function InvoiceArchive({ timeRange = 'All Time', searchQuery = '' }) {
  const { state, dispatch } = useStore()
  const [filter, setFilter] = useState('All')

  const rangeStart = getTimeRangeBounds(timeRange)
  const q = searchQuery.toLowerCase()

  const filtered = state.invoices
    .filter(i => filter === 'All' || i.status === filter)
    .filter(i => !rangeStart || new Date(i.dateCreated) >= rangeStart)
    .filter(i => !q || i.clientName?.toLowerCase().includes(q) || i.invoiceNumber?.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))

  function cycleStatus(invoice) {
    dispatch({ type: 'UPDATE_INVOICE', payload: { ...invoice, status: STATUS_CYCLE[invoice.status] || 'Draft' } })
  }

  function downloadPDF(invoice) {
    if (!invoice.pdfBase64) return
    const a = document.createElement('a')
    a.href = invoice.pdfBase64
    a.download = invoice.pdfFilename || `${invoice.invoiceNumber}.pdf`
    a.click()
  }

  const statusColor = s => s === 'Paid' ? '#4ade80' : s === 'Sent' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)'

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 12, scrollbarWidth: 'none' }}>
        {['All', 'Draft', 'Sent', 'Paid'].map(s => (
          <FilterChip key={s} label={s} active={filter === s} onClick={() => setFilter(s)} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p>{filter === 'All' ? 'No invoices found' : `No ${filter} invoices`}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(invoice => (
            <div key={invoice.id} style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 14, padding: '14px 16px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 3, borderRadius: 4,
                  background: statusColor(invoice.status),
                  alignSelf: 'stretch', flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{invoice.invoiceNumber}</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.9)' }}>Rs.{invoice.grandTotal?.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{invoice.clientName}</span>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                    {new Date(invoice.dateCreated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {invoice.pdfBase64 && (
                  <button onClick={() => downloadPDF(invoice)}
                    style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    PDF
                  </button>
                )}
                <button onClick={() => cycleStatus(invoice)}
                  style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  → {STATUS_CYCLE[invoice.status]}
                </button>
                <button onClick={() => dispatch({ type: 'DELETE_INVOICE', payload: invoice.id })}
                  style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 12, fontWeight: 600, marginLeft: 'auto', cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
