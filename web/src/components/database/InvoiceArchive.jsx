import React, { useState } from 'react'
import { useStore } from '../../store/useStore'
import StatusBadge from '../ui/StatusBadge'
import FilterChip from '../ui/FilterChip'

const STATUS_CYCLE = { Draft: 'Sent', Sent: 'Paid', Paid: 'Draft' }

export default function InvoiceArchive() {
  const { state, dispatch } = useStore()
  const [filter, setFilter] = useState('All')

  const filtered = state.invoices.filter(i => filter === 'All' || i.status === filter)
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

  function exportAll() {
    state.invoices.filter(i => i.pdfBase64).forEach((invoice, idx) => {
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = invoice.pdfBase64
        a.download = invoice.pdfFilename || `${invoice.invoiceNumber}.pdf`
        a.click()
      }, idx * 300)
    })
  }

  const statusColor = s => s === 'Paid' ? '#4ade80' : s === 'Sent' ? '#60a5fa' : '#f97316'

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 12 }}>
        {['All', 'Draft', 'Sent', 'Paid'].map(s => (
          <FilterChip key={s} label={s} active={filter === s} onClick={() => setFilter(s)} />
        ))}
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <button onClick={exportAll} disabled={state.invoices.length === 0}
            style={{
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
              whiteSpace: 'nowrap', opacity: state.invoices.length === 0 ? 0.4 : 1,
            }}>
            Export All
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p>{filter === 'All' ? 'No invoices yet' : `No ${filter} invoices`}</p>
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
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.9)' }}>Rs.{invoice.grandTotal.toFixed(2)}</span>
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
                    style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>
                    PDF
                  </button>
                )}
                <button onClick={() => cycleStatus(invoice)}
                  style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', fontSize: 12, fontWeight: 600 }}>
                  Mark {STATUS_CYCLE[invoice.status]}
                </button>
                <button onClick={() => dispatch({ type: 'DELETE_INVOICE', payload: invoice.id })}
                  style={{ padding: '5px 12px', borderRadius: 7, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 12, fontWeight: 600, marginLeft: 'auto' }}>
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
