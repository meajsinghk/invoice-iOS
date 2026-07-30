import React, { useState } from 'react'
import { StoreProvider, useStore } from './store/useStore'
import FloatingTabBar from './components/FloatingTabBar'
import ClientsView from './components/clients/ClientsView'
import WorkRatesView from './components/rates/WorkRatesView'
import QuickInvoiceSheet from './components/invoice/QuickInvoiceSheet'
import InvoiceDatabaseSheet from './components/database/InvoiceDatabaseSheet'
import CompanyProfileSheet from './components/company/CompanyProfileSheet'
import './App.css'

function SyncStatus() {
  const { dbConnected } = useStore()
  return (
    <span
      title={dbConnected ? 'Synced to cloud database' : 'Offline — saved locally only'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 10, fontWeight: 600, color: dbConnected ? '#4ade80' : 'rgba(255,255,255,0.35)',
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: dbConnected ? '#4ade80' : 'rgba(255,255,255,0.3)',
      }} />
      {dbConnected ? 'Synced' : 'Offline'}
    </span>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('clients')
  const [showInvoice, setShowInvoice] = useState(false)
  const [showDatabase, setShowDatabase] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  return (
    <StoreProvider>
      <div className="app">
        <header className="app-header">
          <button className="icon-btn" onClick={() => setShowDatabase(true)} title="Invoice Archive">📁</button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <h1 className="app-title">{activeTab === 'clients' ? 'Clients' : 'Work Rates'}</h1>
            <SyncStatus />
          </div>
          <button className="icon-btn" onClick={() => setShowProfile(true)} title="Company Profile">⚙️</button>
        </header>

        <main className="app-main">
          {activeTab === 'clients' ? <ClientsView /> : <WorkRatesView />}
        </main>

        <FloatingTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onPlus={() => setShowInvoice(true)}
        />

        {showInvoice && <QuickInvoiceSheet onClose={() => setShowInvoice(false)} />}
        {showDatabase && <InvoiceDatabaseSheet onClose={() => setShowDatabase(false)} />}
        {showProfile && <CompanyProfileSheet onClose={() => setShowProfile(false)} />}
      </div>
    </StoreProvider>
  )
}
