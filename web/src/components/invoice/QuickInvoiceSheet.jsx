import React, { useState } from 'react'
import { useStore, uuid } from '../../store/useStore'
import { generateInvoiceNumber } from '../../utils/invoiceNumber'
import { generateInvoicePDF } from '../../utils/pdfGenerator'
import Modal from '../ui/Modal'
import SignaturePadComponent from './SignaturePad'
import AddLineItemModal from './AddLineItemModal'
import '../ui/forms.css'
import './QuickInvoiceSheet.css'

export default function QuickInvoiceSheet({ onClose }) {
  const { state, dispatch } = useStore()
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientGSTIN, setClientGSTIN] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientPAN, setClientPAN] = useState('')
  const [lineItems, setLineItems] = useState([])
  const [signatureDataUrl, setSignatureDataUrl] = useState(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lastPdfBlob, setLastPdfBlob] = useState(null)
  const [lastInvoiceNum, setLastInvoiceNum] = useState('')

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const taxTotal = lineItems.reduce((s, i) => { const sub = i.quantity * i.unitPrice; return s + sub * i.taxPercentage / 100 }, 0)
  const grandTotal = subtotal + taxTotal

  function selectClient(id) {
    setSelectedClientId(id)
    const c = state.clients.find(c => c.id === id)
    if (c) {
      setClientName(c.name)
      setClientEmail(c.email)
      setClientAddress(c.address)
      setClientGSTIN(c.gstin || c.taxID || '')
      setClientPhone(c.phone || '')
      setClientPAN(c.panNumber || '')
    }
  }

  function removeItem(id) { setLineItems(prev => prev.filter(i => i.id !== id)) }

  async function handleGenerate(email = false) {
    if (!clientName.trim() || lineItems.length === 0) return
    setIsGenerating(true)
    try {
      const invoiceNum = generateInvoiceNumber()
      setLastInvoiceNum(invoiceNum)
      const invoice = {
        id: uuid(), invoiceNumber: invoiceNum,
        dateCreated: new Date().toISOString(),
        clientName, clientEmail, clientAddress,
        clientGSTIN, clientPhone, clientPAN,
        lineItems, subtotal, taxTotal, grandTotal,
        signatureDataUrl, status: 'Draft',
        pdfFilename: `${invoiceNum}.pdf`,
      }

      const pdfBlob = await generateInvoicePDF(invoice, state.companyProfile)
      const blobUrl = URL.createObjectURL(pdfBlob)

      const reader = new FileReader()
      reader.onload = () => {
        dispatch({ type: 'ADD_INVOICE', payload: { ...invoice, pdfBase64: reader.result } })
      }
      reader.readAsDataURL(pdfBlob)

      setLastPdfBlob(pdfBlob)
      setSuccess(true)

      if (email) {
        const subject = encodeURIComponent(`Invoice ${invoiceNum} from ${state.companyProfile?.companyName || 'SimpleInvoice'}`)
        const body = encodeURIComponent(`Dear ${clientName},\n\nPlease find your invoice ${invoiceNum} attached.\n\nGrand Total: ₹${grandTotal.toFixed(2)}\n\nRegards`)
        window.open(`mailto:${clientEmail}?subject=${subject}&body=${body}`)
      } else {
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = `${invoiceNum}.pdf`
        a.click()
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const canGenerate = clientName.trim() && lineItems.length > 0

  const glassBtn = (style = {}) => ({
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: 'white',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    padding: '14px 20px',
    width: '100%',
    cursor: 'pointer',
    transition: 'background 0.15s',
    ...style,
  })

  return (
    <Modal title="New Invoice" onClose={onClose} wide>
      {success ? (
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
      ) : (
        <div className="invoice-form">
          {/* Client Section */}
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

          {/* Line Items */}
          <div className="section-card">
            <div className="section-header" style={{ justifyContent: 'space-between' }}>
              <span><span className="section-icon">📋</span> Line Items</span>
              <button onClick={() => setShowAddItem(true)} style={{
                padding: '6px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white', fontSize: 13, fontWeight: 600,
              }}>+ Add</button>
            </div>

            {lineItems.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No items yet. Tap + Add to begin.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {lineItems.map(item => {
                  const sub = item.quantity * item.unitPrice
                  const cgst = sub * (item.taxPercentage / 2) / 100
                  const total = sub + cgst * 2
                  return (
                    <div key={item.id} style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10, padding: '10px 12px',
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                          {item.quantity} × ₹{item.unitPrice.toFixed(2)} | Tax {item.taxPercentage}%
                          {item.hsnCode && ` | HSN ${item.hsnCode}`}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.8)', marginRight: 4 }}>₹{total.toFixed(2)}</div>
                      <button onClick={() => removeItem(item.id)} style={{ color: '#f87171', fontSize: 16, lineHeight: 1, padding: '2px 4px' }}>✕</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Totals */}
          {lineItems.length > 0 && (
            <div className="section-card">
              <div className="totals-table">
                {[['Subtotal', subtotal], ['CGST (9%)', taxTotal / 2], ['SGST (9%)', taxTotal / 2]].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                    <span>{l}</span><span>₹{v.toFixed(2)}</span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '12px 0 0', fontWeight: 800, fontSize: 18,
                  color: 'white', borderTop: '1px solid rgba(255,255,255,0.12)', marginTop: 6,
                }}>
                  <span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Signature */}
          <div className="section-card">
            <div className="section-header"><span className="section-icon">✍️</span> Digital Signature</div>
            <SignaturePadComponent onChange={setSignatureDataUrl} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              style={{ ...glassBtn(), opacity: canGenerate && !isGenerating ? 1 : 0.4 }}
              onClick={() => handleGenerate(false)}
              disabled={!canGenerate || isGenerating}
            >
              {isGenerating ? '⏳ Generating…' : '📄 Generate & Download PDF'}
            </button>
            <button
              style={{ ...glassBtn({ background: 'rgba(255,255,255,0.06)' }), opacity: canGenerate && !isGenerating ? 1 : 0.4 }}
              onClick={() => handleGenerate(true)}
              disabled={!canGenerate || isGenerating}
            >
              ✉️ Draft Email
            </button>
          </div>
        </div>
      )}

      {showAddItem && (
        <AddLineItemModal
          workRates={state.workRates}
          onAdd={item => setLineItems(prev => [...prev, item])}
          onClose={() => setShowAddItem(false)}
        />
      )}
    </Modal>
  )
}

