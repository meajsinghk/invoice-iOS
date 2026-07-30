import React, { useState } from 'react'
import { StoreProvider } from './store/useStore'
import FloatingTabBar from './components/FloatingTabBar'
import ClientsView from './components/clients/ClientsView'
import WorkRatesView from './components/rates/WorkRatesView'
import QuickInvoiceSheet from './components/invoice/QuickInvoiceSheet'
import InvoiceDatabaseSheet from './components/database/InvoiceDatabaseSheet'
import CompanyProfileSheet from './components/company/CompanyProfileSheet'
import './App.css'

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
          <h1 className="app-title">{activeTab === 'clients' ? 'Clients' : 'Work Rates'}</h1>
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
