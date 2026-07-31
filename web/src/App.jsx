import React, { useState, useEffect } from 'react'
import { StoreProvider, useStore } from './store/useStore'
import FloatingTabBar from './components/FloatingTabBar'
import ClientsView from './components/clients/ClientsView'
import OperatorsView from './components/operators/OperatorsView'
import QuickInvoiceSheet from './components/invoice/QuickInvoiceSheet'
import InvoiceDatabaseSheet from './components/database/InvoiceDatabaseSheet'
import CompanyProfileSheet from './components/company/CompanyProfileSheet'
import AuthModal, { getAuthSession } from './components/auth/AuthModal'
import './App.css'

export function haptic() {
  if (navigator.vibrate) navigator.vibrate(20)
}

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

const TAB_TITLES = { clients: 'Clients', operators: 'Operators' }

function AppInner({ currentUser }) {
  const [activeTab, setActiveTab] = useState('clients')
  const [showInvoice, setShowInvoice] = useState(false)
  const [showDatabase, setShowDatabase] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  return (
    <div className="app">
      <header className="app-header">
        <button className="icon-btn" onClick={() => { haptic(); setShowDatabase(true) }} title="Invoice Database">📁</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <h1 className="app-title">{TAB_TITLES[activeTab] || 'Milan Construction'}</h1>
          <SyncStatus />
        </div>
        <button className="icon-btn" onClick={() => { haptic(); setShowProfile(true) }} title="Company Profile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </button>
      </header>

      <main className="app-main">
        {activeTab === 'clients' && <ClientsView currentUser={currentUser} onOpenInvoice={() => setShowInvoice(true)} />}
        {activeTab === 'operators' && <OperatorsView currentUser={currentUser} onOpenInvoice={() => setShowInvoice(true)} />}
      </main>

      <FloatingTabBar
        activeTab={activeTab}
        onTabChange={tab => { haptic(); setActiveTab(tab) }}
        onPlus={() => { haptic(); setShowInvoice(true) }}
      />

      {showInvoice && <QuickInvoiceSheet onClose={() => setShowInvoice(false)} currentUser={currentUser} />}
      {showDatabase && <InvoiceDatabaseSheet onClose={() => setShowDatabase(false)} />}
      {showProfile && <CompanyProfileSheet onClose={() => setShowProfile(false)} />}
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(() => getAuthSession())

  return (
    <StoreProvider>
      {!session
        ? <AuthModal onSuccess={s => setSession(s)} />
        : <AppInner currentUser={session.personName} />
      }
    </StoreProvider>
  )
}
