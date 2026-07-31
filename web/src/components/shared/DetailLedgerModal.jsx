import React, { useState } from 'react'
import { useStore, uuid } from '../../store/useStore'
import DoubleConfirmDeleteModal from './DoubleConfirmDeleteModal'
import ClientFormModal from '../clients/ClientFormModal'
import OperatorFormModal from '../operators/OperatorFormModal'
import { getAuthSession } from '../auth/AuthModal'

function Avatar({ entity, size = 56 }) {
  const initials = (entity.name || '?').trim().charAt(0).toUpperCase()
  if (entity.avatarUrl) {
    return (
      <img src={entity.avatarUrl} alt={entity.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
    }}>{initials}</div>
  )
}

function AmountBadge({ amount }) {
  const isPos = amount >= 0
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700,
      background: isPos ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
      color: isPos ? '#4ade80' : '#f87171',
      border: `1px solid ${isPos ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
      whiteSpace: 'nowrap',
    }}>
      {isPos ? '+' : ''}₹{Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  )
}

const TRANS_LABELS = {
  ClientInvoice: 'Invoice Raised',
  ClientPayment: 'Payment Received',
  OperatorPayment: 'Payment Made',
  OperatorAdvance: 'Advance Paid',
}

const CLIENT_TRANS_TYPES = [
  { value: 'ClientPayment', label: 'Payment Received (+)', sign: 1 },
  { value: 'ClientInvoice', label: 'Invoice Raised (−)', sign: -1 },
]
const OPERATOR_TRANS_TYPES = [
  { value: 'OperatorPayment', label: 'Payment Made (+)', sign: 1 },
  { value: 'OperatorAdvance', label: 'Advance Paid (−)', sign: -1 },
]

function AddTransactionForm({ entity, entityType, onSave, onCancel }) {
  const session = getAuthSession()
  const transTypes = entityType === 'Client' ? CLIENT_TRANS_TYPES : OPERATOR_TRANS_TYPES
  const [transType, setTransType] = useState(transTypes[0].value)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const selectedType = transTypes.find(t => t.value === transType) || transTypes[0]
  const amtNum = parseFloat(amount) || 0
  const signedAmount = selectedType.sign * amtNum

  function handleSave() {
    if (amtNum <= 0) return
    onSave({
      id: uuid(),
      timestamp: new Date().toISOString(),
      transactionType: transType,
      amount: signedAmount,
      noteDescription: note,
      generatedByPerson: session?.personName || 'Unknown',
      entityType,
      entityId: entity.id,
      lineItems: [],
    })
  }

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: 10, boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
    color: 'white', fontSize: 14, outline: 'none',
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 2 }}>➕ Add Transaction</div>
      <select style={inp} value={transType} onChange={e => setTransType(e.target.value)}>
        {transTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <input style={inp} type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (₹)" min="0" />
      <input style={inp} value={note} onChange={e => setNote(e.target.value)} placeholder="Note / Description (optional)" />
      {amtNum > 0 && (
        <div style={{ fontSize: 13, color: signedAmount >= 0 ? '#4ade80' : '#f87171' }}>
          {signedAmount >= 0 ? '+ Receiving' : '− Paying'} ₹{amtNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleSave} disabled={amtNum <= 0} style={{ flex: 2, padding: '11px', borderRadius: 12, background: amtNum > 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.2)', color: amtNum > 0 ? 'white' : 'rgba(255,255,255,0.25)', fontSize: 14, fontWeight: 700, cursor: amtNum > 0 ? 'pointer' : 'not-allowed' }}>Save Transaction</button>
      </div>
    </div>
  )
}

export default function DetailLedgerModal({ entity, entityType, onClose }) {
  const { state, dispatch } = useStore()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showAddTxn, setShowAddTxn] = useState(false)

  const entries = (state.ledgerEntries || [])
    .filter(e => e.entityId === entity.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  const totalIn = entries.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0)
  const totalOut = entries.filter(e => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0)
  const balance = totalIn - totalOut

  function handleDeleteConfirm() {
    entries.forEach(e => dispatch({ type: 'DELETE_LEDGER_ENTRY', payload: e.id }))
    if (entityType === 'Client') dispatch({ type: 'DELETE_CLIENT', payload: entity.id })
    else dispatch({ type: 'DELETE_OPERATOR', payload: entity.id })
    onClose()
  }

  function handleAddTransaction(entry) {
    dispatch({ type: 'ADD_LEDGER_ENTRY', payload: entry })
    setShowAddTxn(false)
  }

  const inLabel = entityType === 'Client' ? 'Received' : 'Paid Out'
  const outLabel = entityType === 'Client' ? 'Invoiced' : 'Advances'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      overflowY: 'auto',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        minHeight: '100%', display: 'flex', flexDirection: 'column',
        maxWidth: 680, margin: '0 auto',
        background: '#0d0d0d',
      }}>
        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 20, padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer' }}>←</button>
          <span style={{ fontWeight: 700, color: 'white', fontSize: 17, flex: 1 }}>Ledger</span>
          <button onClick={() => setShowAddTxn(v => !v)} style={{
            padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
            background: showAddTxn ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer',
          }}>
            {showAddTxn ? '✕ Cancel' : '➕ Add'}
          </button>
        </div>

        <div style={{ padding: '20px 20px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profile Card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 20, padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <Avatar entity={entity} size={60} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'white' }}>{entity.name}</div>
                {entity.address && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{entity.address}</div>}
                {entity.phone && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>📞 {entity.phone}</div>}
                {entity.gstin && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>GSTIN: {entity.gstin}</div>}
              </div>
            </div>

            {/* KPI Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Balance', value: balance, color: balance >= 0 ? '#4ade80' : '#f87171' },
                { label: inLabel, value: totalIn, color: '#4ade80' },
                { label: outLabel, value: totalOut, color: '#f87171' },
              ].map(kpi => (
                <div key={kpi.label} style={{
                  background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '10px 8px', textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: kpi.color, wordBreak: 'break-all' }}>
                    ₹{Math.abs(kpi.value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{kpi.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Transaction Form (inline) */}
          {showAddTxn && (
            <AddTransactionForm
              entity={entity}
              entityType={entityType}
              onSave={handleAddTransaction}
              onCancel={() => setShowAddTxn(false)}
            />
          )}

          {/* Transaction Timeline */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Transactions ({entries.length})
            </div>
            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.25)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <p style={{ margin: 0 }}>No transactions yet</p>
                <button onClick={() => setShowAddTxn(true)} style={{
                  marginTop: 12, padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white', cursor: 'pointer',
                }}>➕ Add First Transaction</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {entries.map((entry, idx) => {
                  const d = new Date(entry.timestamp)
                  const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                  const isEven = idx % 2 === 0
                  return (
                    <div key={entry.id} style={{
                      background: isEven ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isEven ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)'}`,
                      borderRadius: 14, padding: '12px 14px',
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>
                          {TRANS_LABELS[entry.transactionType] || entry.transactionType}
                        </div>
                        {entry.noteDescription && (
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3, wordBreak: 'break-word' }}>{entry.noteDescription}</div>
                        )}
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                          {dateStr} · {timeStr}
                          {entry.generatedByPerson && ` · ${entry.generatedByPerson}`}
                        </div>
                      </div>
                      <AmountBadge amount={entry.amount} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setShowEdit(true)} style={{
              flex: 1, padding: '13px', borderRadius: 14, fontSize: 14, fontWeight: 600,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'white', cursor: 'pointer',
            }}>✏️ Edit Profile</button>
            <button onClick={() => setShowDelete(true)} style={{
              flex: 1, padding: '13px', borderRadius: 14, fontSize: 14, fontWeight: 600,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', cursor: 'pointer',
            }}>🗑 Delete Profile</button>
          </div>
        </div>
      </div>

      {showEdit && entityType === 'Client' && (
        <ClientFormModal client={entity} onClose={() => setShowEdit(false)} />
      )}
      {showEdit && entityType === 'Operator' && (
        <OperatorFormModal operator={entity} onClose={() => setShowEdit(false)} />
      )}
      {showDelete && (
        <DoubleConfirmDeleteModal
          name={entity.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
