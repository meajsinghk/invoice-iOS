import React, { useState } from 'react'
import { useStore } from '../../store/useStore'
import OperatorCard from './OperatorCard'
import OperatorFormModal from './OperatorFormModal'
import DetailLedgerModal from '../shared/DetailLedgerModal'
import '../clients/ClientsView.css'

export default function OperatorsView({ currentUser }) {
  const { state } = useStore()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [ledgerOperator, setLedgerOperator] = useState(null)

  const operators = state.operators || []
  const filtered = operators.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.phone || '').includes(search)
  ).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="view-container">
      <div className="search-bar-wrapper">
        <input
          className="search-input"
          type="text"
          placeholder="🔍  Search operators…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="add-btn" onClick={() => setShowAdd(true)}>+ Add</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔧</div>
          <h3>No Operators Yet</h3>
          <p>Add operators to track payments</p>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Operator</button>
        </div>
      ) : (
        <div className="card-list">
          {filtered.map((op, idx) => (
            <OperatorCard key={op.id} operator={op} index={idx} onOpenLedger={() => setLedgerOperator(op)} />
          ))}
        </div>
      )}

      {showAdd && <OperatorFormModal operator={null} onClose={() => setShowAdd(false)} />}
      {ledgerOperator && (
        <DetailLedgerModal
          entity={ledgerOperator}
          entityType="Operator"
          onClose={() => setLedgerOperator(null)}
        />
      )}
    </div>
  )
}
