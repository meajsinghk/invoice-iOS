import React, { useState } from 'react'
import { useStore } from '../../store/useStore'
import InvoiceArchive from './InvoiceArchive'
import InsightsView from './InsightsView'
import FilterChip from '../ui/FilterChip'
import './InvoiceDatabaseSheet.css'

export default function InvoiceDatabaseSheet({ onClose }) {
  const [tab, setTab] = useState('archive')

  return (
    <div className="db-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="db-panel">
        <div className="db-header">
          <h2 className="modal-title">Invoice Database</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="db-tabs">
          <button className={`db-tab ${tab === 'archive' ? 'active' : ''}`} onClick={() => setTab('archive')}>📁 Archive</button>
          <button className={`db-tab ${tab === 'insights' ? 'active' : ''}`} onClick={() => setTab('insights')}>📊 Insights</button>
        </div>

        <div className="db-body">
          {tab === 'archive' ? <InvoiceArchive /> : <InsightsView />}
        </div>
      </div>
    </div>
  )
}
