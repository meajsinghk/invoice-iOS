import React, { useState } from 'react'
import { useStore, uuid } from '../../store/useStore'
import { generateInvoiceNumber } from '../../utils/invoiceNumber'
import { generateInvoicePDF } from '../../utils/pdfGenerator'
import Modal from '../ui/Modal'
import AddLineItemModal from './AddLineItemModal'
import '../ui/forms.css'
import './QuickInvoiceSheet.css'
import { haptic } from '../../App'

const glassBtn = (extra = {}) => ({
  background: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.18)',
  color: 'white', borderRadius: 14, fontSize: 15, fontWeight: 600,
  padding: '14px 20px', width: '100%', cursor: 'pointer',
  transition: 'background 0.15s', ...extra,
})

// ── TYPE SELECTOR ─────────────────────────────────────────────
function TypeSelector({ onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 0' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', margin: 0 }}>What would you like to create?</p>
      <button onClick={() => { haptic(); onSelect('client') }} style={{
        ...glassBtn(), padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 32 }}>🧾</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Client Invoice</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>Generate a tax invoice for a client</span>
      </button>
      <button onClick={() => { haptic(); onSelect('operator') }} style={{
        ...glassBtn({ background: 'rgba(255,255,255,0.06)' }), padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 32 }}>🔧</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Operator Payment / Task</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>Record payment or task for an operator</span>
      </button>
    </div>
  )
}

// ── CLIENT INVOICE FORM ───────────────────────────────────────
function ClientInvoiceForm({ onClose, currentUser }) {
  const { state, dispatch } = useStore()
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientGSTIN, setClientGSTIN] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientPAN, setClientPAN] = useState('')
  const [lineItems, setLineItems] = useState([])
  const [showAddItem, setShowAddItem] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lastPdfBlob, setLastPdfBlob] = useState(null)
  const [lastInvoiceNum, setLastInvoiceNum] = useState('')

  function selectClient(id) {
    setSelectedClientId(id)
    const c = state.clients.find(c => c.id === id)
    if (c) {
      setClientName(c.name)
      setClientEmail(c.email || '')
      setClientAddress(c.address || '')
      setClientGSTIN(c.gstin || c.taxID || '')
      setClientPhone(c.phone || '')
      setClientPAN(c.panNumber || '')
    }
  }

  function removeItem(id) { setLineItems(prev => prev.filter(i => i.id !== id)) }

  async function handleGenerate(emailMode = false) {
    if (!clientName.trim() || lineItems.length === 0) return
    haptic()
    setIsGenerating(true)
    try {
      const invoiceNum = generateInvoiceNumber()
      setLastInvoiceNum(invoiceNum)

      let subtotal = 0, taxTotal = 0
      lineItems.forEach(item => {
        const sub = item.quantity * item.unitPrice
        subtotal += sub
        taxTotal += sub * ((item.cgstRate || 0) + (item.sgstRate || 0) + (item.igstRate || 0)) / 100
      })
      const grandTotal = subtotal + taxTotal

      const invoice = {
        id: uuid(), invoiceNumber: invoiceNum,
        dateCreated: new Date().toISOString(),
        clientName, clientEmail, clientAddress,
        clientGSTIN, clientPhone, clientPAN,
        lineItems, subtotal, taxTotal, grandTotal,
        signatureDataUrl: null,
        status: 'Draft',
        pdfFilename: `${invoiceNum}.pdf`,
        generatedByPerson: currentUser || 'Unknown',
      }

      const pdfBlob = await generateInvoicePDF(invoice, state.companyProfile)
      const blobUrl = URL.createObjectURL(pdfBlob)

      // Convert blob → base64 and dispatch invoice + ledger entry
      const reader = new FileReader()
      reader.onload = () => {
        const pdfBase64 = reader.result
        dispatch({ type: 'ADD_INVOICE', payload: { ...invoice, pdfBase64 } })

        // Always create ledger entry — use selectedClientId if available, else find by name, else use invoice id as placeholder
        const clientObj = state.clients.find(c => c.id === selectedClientId)
          || state.clients.find(c => c.name.toLowerCase() === clientName.toLowerCase())
        const entityId = clientObj ? clientObj.id : invoice.id  // link to invoice id if no client profile

        dispatch({
          type: 'ADD_LEDGER_ENTRY',
          payload: {
            id: uuid(),
            timestamp: new Date().toISOString(),
            transactionType: 'ClientInvoice',
            amount: -grandTotal,  // negative = we are owed this money
            noteDescription: `Invoice ${invoiceNum}`,
            generatedByPerson: currentUser || 'Unknown',
            entityType: 'Client',
            entityId,
            lineItems: lineItems.map(item => ({
              particulars: item.title || item.particulars || '',
              hsnCode: item.hsnCode,
              qty: item.quantity,
              rate: item.unitPrice,
              amount: item.quantity * item.unitPrice,
              cgstRate: item.cgstRate,
              cgstAmount: (item.quantity * item.unitPrice) * (item.cgstRate || 0) / 100,
              sgstRate: item.sgstRate,
              sgstAmount: (item.quantity * item.unitPrice) * (item.sgstRate || 0) / 100,
              igstRate: item.igstRate,
              igstAmount: (item.quantity * item.unitPrice) * (item.igstRate || 0) / 100,
            })),
          },
        })
      }
      reader.readAsDataURL(pdfBlob)

      setLastPdfBlob(pdfBlob)
      setSuccess(true)

      if (emailMode) {
        const subject = encodeURIComponent(`Invoice ${invoiceNum} from ${state.companyProfile?.companyName || 'SimpleInvoice'}`)
        const body = encodeURIComponent(`Dear ${clientName},\n\nPlease find your invoice ${invoiceNum} attached.\n\nGrand Total: ₹${grandTotal.toFixed(2)}\n\nRegards`)
        window.open(`mailto:${clientEmail}?subject=${subject}&body=${body}`)
      } else {
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = `${invoiceNum}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const canGenerate = clientName.trim() && lineItems.length > 0

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'white' }}>Invoice Saved!</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{lastInvoiceNum}</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontSize: 14 }}>PDF downloaded to your device</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {lastPdfBlob && (
            <button style={glassBtn()} onClick={() => {
              const a = document.createElement('a')
              a.href = URL.createObjectURL(lastPdfBlob)
              a.download = `${lastInvoiceNum}.pdf`
              a.click()
            }}>⬇ Download PDF</button>
          )}
          <button onClick={onClose} style={glassBtn()}>Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="invoice-form">
      <div className="section-card">
        <div className="section-header"><span className="section-icon">👤</span> Bill To</div>
        {state.clients.length > 0 && (
          <label className="form-label" style={{ marginBottom: 12 }}>Select Client
            <select className="form-input" value={selectedClientId} onChange={e => selectClient(e.target.value)}>
              <option value="">— Select a client —</option>
              {state.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        )}
        <div className="form-grid">
          <label className="form-label">Client Name *
            <input className="form-input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Name" />
          </label>
          <div className="form-row">
            <label className="form-label">Email
              <input className="form-input" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="email@example.com" />
            </label>
            <label className="form-label">Phone
              <input className="form-input" type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+91 98765…" />
            </label>
          </div>
          <label className="form-label">Address
            <textarea className="form-input form-textarea" value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Full address…" rows={2} />
          </label>
          <div className="form-row">
            <label className="form-label">Party GSTIN
              <input className="form-input" value={clientGSTIN} onChange={e => setClientGSTIN(e.target.value.toUpperCase())} placeholder="29ABCDE1234F1Z5" />
            </label>
            <label className="form-label">PAN
              <input className="form-input" value={clientPAN} onChange={e => setClientPAN(e.target.value.toUpperCase())} placeholder="ABCDE1234F" />
            </label>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header" style={{ justifyContent: 'space-between' }}>
          <span><span className="section-icon">📋</span> Line Items</span>
          <button onClick={() => setShowAddItem(true)} style={{
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>+ Add</button>
        </div>

        {lineItems.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No items yet. Tap + Add to begin.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lineItems.map(item => {
              const sub = item.quantity * item.unitPrice
              const tax = sub * ((item.cgstRate || 0) + (item.sgstRate || 0) + (item.igstRate || 0)) / 100
              const total = sub + tax
              const taxParts = [
                item.cgstRate > 0 && `CGST ${item.cgstRate}%`,
                item.sgstRate > 0 && `SGST ${item.sgstRate}%`,
                item.igstRate > 0 && `IGST ${item.igstRate}%`,
              ].filter(Boolean)
              return (
                <div key={item.id} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>{item.title || item.particulars}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                      {item.quantity} × ₹{item.unitPrice.toFixed(2)}
                      {item.hsnCode && ` | HSN ${item.hsnCode}`}
                      {taxParts.length > 0 && ` | ${taxParts.join(', ')}`}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.8)', marginRight: 4 }}>₹{total.toFixed(2)}</div>
                  <button onClick={() => removeItem(item.id)} style={{ color: '#f87171', fontSize: 16, lineHeight: 1, padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button style={{ ...glassBtn(), opacity: canGenerate && !isGenerating ? 1 : 0.4 }}
          onClick={() => handleGenerate(false)} disabled={!canGenerate || isGenerating}>
          {isGenerating ? '⏳ Generating…' : '📄 Generate & Download PDF'}
        </button>
        <button style={{ ...glassBtn({ background: 'rgba(255,255,255,0.06)' }), opacity: canGenerate && !isGenerating ? 1 : 0.4 }}
          onClick={() => handleGenerate(true)} disabled={!canGenerate || isGenerating}>
          ✉️ Draft Email
        </button>
      </div>

      {showAddItem && (
        <AddLineItemModal
          isOperator={false}
          onAdd={item => setLineItems(prev => [...prev, item])}
          onClose={() => setShowAddItem(false)}
        />
      )}
    </div>
  )
}

// ── OPERATOR PAYMENT FORM ─────────────────────────────────────
function OperatorPaymentForm({ onClose, currentUser }) {
  const { state, dispatch } = useStore()
  const [selectedOpId, setSelectedOpId] = useState('')
  const [operatorName, setOperatorName] = useState('')
  const [tasks, setTasks] = useState([])
  const [showAddItem, setShowAddItem] = useState(false)
  const [note, setNote] = useState('')
  const [transType, setTransType] = useState('OperatorPayment')
  const [success, setSuccess] = useState(false)

  const operators = state.operators || []

  function selectOp(id) {
    setSelectedOpId(id)
    const o = operators.find(o => o.id === id)
    if (o) setOperatorName(o.name)
  }

  function removeTask(id) { setTasks(prev => prev.filter(t => t.id !== id)) }

  const totalAmt = tasks.reduce((s, t) => s + t.quantity * t.unitPrice, 0)
  const canSave = (selectedOpId || operatorName.trim()) && tasks.length > 0

  function handleSave() {
    haptic()
    const amount = transType === 'OperatorAdvance' ? -totalAmt : totalAmt
    dispatch({
      type: 'ADD_LEDGER_ENTRY',
      payload: {
        id: uuid(),
        timestamp: new Date().toISOString(),
        transactionType: transType,
        amount,
        noteDescription: note || tasks.map(t => t.title).join(', '),
        generatedByPerson: currentUser || 'Unknown',
        entityType: 'Operator',
        entityId: selectedOpId || uuid(),
        lineItems: tasks.map(t => ({
          particulars: t.title,
          qty: t.quantity,
          rate: t.unitPrice,
          amount: t.quantity * t.unitPrice,
        })),
      },
    })
    setSuccess(true)
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'white' }}>Entry Saved!</h3>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24, fontSize: 14 }}>Operator ledger updated.</p>
        <button onClick={onClose} style={glassBtn()}>Done</button>
      </div>
    )
  }

  return (
    <div className="invoice-form">
      <div className="section-card">
        <div className="section-header"><span className="section-icon">🔧</span> Operator</div>
        {operators.length > 0 && (
          <label className="form-label" style={{ marginBottom: 12 }}>Select Operator
            <select className="form-input" value={selectedOpId} onChange={e => selectOp(e.target.value)}>
              <option value="">— Select an operator —</option>
              {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
        )}
        {!selectedOpId && (
          <label className="form-label">Operator Name *
            <input className="form-input" value={operatorName} onChange={e => setOperatorName(e.target.value)} placeholder="Name" />
          </label>
        )}
        <label className="form-label" style={{ marginTop: 10 }}>Entry Type
          <select className="form-input" value={transType} onChange={e => setTransType(e.target.value)}>
            <option value="OperatorPayment">Payment Made (Settled ✓)</option>
            <option value="OperatorAdvance">Advance Paid (Owed by operator)</option>
          </select>
        </label>
        <label className="form-label" style={{ marginTop: 10 }}>Note / Description
          <input className="form-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note…" />
        </label>
      </div>

      <div className="section-card">
        <div className="section-header" style={{ justifyContent: 'space-between' }}>
          <span><span className="section-icon">📋</span> Tasks / Work Done</span>
          <button onClick={() => setShowAddItem(true)} style={{
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>+ Add</button>
        </div>

        {tasks.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No tasks yet. Tap + Add to begin.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tasks.map(task => (
              <div key={task.id} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                    {task.quantity} × ₹{task.unitPrice.toFixed(2)}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.8)', marginRight: 4 }}>₹{(task.quantity * task.unitPrice).toFixed(2)}</div>
                <button onClick={() => removeTask(task.id)} style={{ color: '#f87171', fontSize: 16, padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {tasks.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontWeight: 800, fontSize: 16, color: 'white', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 10 }}>
            <span>Total</span><span>₹{totalAmt.toFixed(2)}</span>
          </div>
        )}
      </div>

      <button style={{ ...glassBtn(), opacity: canSave ? 1 : 0.4 }}
        onClick={handleSave} disabled={!canSave}>
        💾 Save Entry
      </button>

      {showAddItem && (
        <AddLineItemModal
          isOperator={true}
          onAdd={item => setTasks(prev => [...prev, item])}
          onClose={() => setShowAddItem(false)}
        />
      )}
    </div>
  )
}

// ── MAIN SHEET ────────────────────────────────────────────────
export default function QuickInvoiceSheet({ onClose, currentUser }) {
  const [entryType, setEntryType] = useState(null) // null | 'client' | 'operator'

  const title = entryType === 'client' ? 'Client Invoice' : entryType === 'operator' ? 'Operator Payment' : 'New Entry'

  return (
    <Modal title={title} onClose={onClose} wide>
      {entryType === null && <TypeSelector onSelect={setEntryType} />}
      {entryType === 'client' && <ClientInvoiceForm onClose={onClose} currentUser={currentUser} />}
      {entryType === 'operator' && <OperatorPaymentForm onClose={onClose} currentUser={currentUser} />}
    </Modal>
  )
}
