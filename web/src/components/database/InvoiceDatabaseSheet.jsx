import React, { useState } from 'react'
import { useStore } from '../../store/useStore'
import InvoiceArchive from './InvoiceArchive'
import InsightsView from './InsightsView'
import { exportAllDataToCSV } from '../../utils/exportUtils'
import './InvoiceDatabaseSheet.css'

const TIME_RANGES = ['Today', 'This Week', 'This Month', 'This Year', 'All Time']

export default function InvoiceDatabaseSheet({ onClose }) {
  const { state } = useStore()
  const [tab, setTab] = useState('insights')
  const [timeRange, setTimeRange] = useState('All Time')
  const [searchQuery, setSearchQuery] = useState('')

  function handleExport() {
    exportAllDataToCSV(state.ledgerEntries || [], state.clients, state.operators || [])
  }

  return (
    <div className="db-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="db-panel">
        <div className="db-header">
          <h2 className="modal-title">Database</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={handleExport} style={{
              padding: '6px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>⬇ CSV</button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Tabs: Insights LEFT, Archive RIGHT */}
        <div className="db-tabs">
          <button className={`db-tab ${tab === 'insights' ? 'active' : ''}`} onClick={() => setTab('insights')}>📊 Insights</button>
          <button className={`db-tab ${tab === 'archive' ? 'active' : ''}`} onClick={() => setTab('archive')}>📁 Archive</button>
        </div>

        {/* Time Range Filter */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 16px', scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {TIME_RANGES.map(r => (
            <button key={r} onClick={() => setTimeRange(r)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
              background: timeRange === r ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${timeRange === r ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: timeRange === r ? 'white' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
            }}>{r}</button>
          ))}
        </div>

        {/* Archive Search */}
        {tab === 'archive' && (
          <div style={{ padding: '0 16px 12px' }}>
            <input
              type="text"
              placeholder="🔍 Search by client, entity name, or invoice ID…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12, boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'white', fontSize: 13, outline: 'none',
              }}
            />
          </div>
        )}

        <div className="db-body">
          {tab === 'insights'
            ? <InsightsView timeRange={timeRange} />
            : <InvoiceArchive timeRange={timeRange} searchQuery={searchQuery} />
          }
        </div>
      </div>
    </div>
  )
}
