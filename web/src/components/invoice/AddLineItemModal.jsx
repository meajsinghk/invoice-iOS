import React, { useState } from 'react'
import { useStore, uuid } from '../../store/useStore'
import Modal from '../ui/Modal'
import '../ui/forms.css'

export default function AddLineItemModal({ workRates, onAdd, onClose, isOperator = false }) {
  const [useRate, setUseRate] = useState(workRates.length > 0)
  const [selectedRate, setSelectedRate] = useState(workRates[0]?.id || '')
  const [title, setTitle] = useState('')
  const [hsnCode, setHsnCode] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')
  const [cgstRate, setCgstRate] = useState('0')
  const [sgstRate, setSgstRate] = useState('0')
  const [igstRate, setIgstRate] = useState('0')

  function applyRate(rateId) {
    setSelectedRate(rateId)
    const r = workRates.find(r => r.id === rateId)
    if (r) {
      setTitle(r.title)
      setHsnCode(r.hsnCode || '')
      setUnitPrice(r.unitRate.toString())
    }
  }

  const qty = parseFloat(quantity) || 0
  const price = parseFloat(unitPrice) || 0
  const cgst = parseFloat(cgstRate) || 0
  const sgst = parseFloat(sgstRate) || 0
  const igst = parseFloat(igstRate) || 0
  const sub = qty * price
  const cgstAmt = sub * cgst / 100
  const sgstAmt = sub * sgst / 100
  const igstAmt = sub * igst / 100
  const total = sub + cgstAmt + sgstAmt + igstAmt

  function handleAdd() {
    if (!title.trim() || qty <= 0 || price <= 0) return
    onAdd({
      id: uuid(), title, hsnCode, quantity: qty, unitPrice: price,
      cgstRate: isOperator ? 0 : cgst,
      sgstRate: isOperator ? 0 : sgst,
      igstRate: isOperator ? 0 : igst,
      // Keep backward compat
      taxPercentage: isOperator ? 0 : cgst + sgst + igst,
    })
    onClose()
  }

  const itemLabel = isOperator ? 'Task / Work Done' : 'Item Name'
  const priceLabel = isOperator ? 'Rate (₹)' : 'Unit Price (₹)'

  const calcBg = { background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 5 }
  const calcRow = (label, val) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.5)' }}>
      <span>{label}</span><span>₹{val.toFixed(2)}</span>
    </div>
  )

  return (
    <Modal title={isOperator ? 'Add Task' : 'Add Line Item'} onClose={onClose}>
      <div className="form-grid">
        {workRates.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setUseRate(true)}
              style={{ flex: 1, padding: '8px', borderRadius: 8, background: useRate ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              From Rates
            </button>
            <button onClick={() => setUseRate(false)}
              style={{ flex: 1, padding: '8px', borderRadius: 8, background: !useRate ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Custom
            </button>
          </div>
        )}

        {useRate && workRates.length > 0 && (
          <label className="form-label">Select Rate
            <select className="form-input" value={selectedRate} onChange={e => applyRate(e.target.value)}>
              {workRates.map(r => (
                <option key={r.id} value={r.id}>{r.title} — ₹{r.unitRate}/unit</option>
              ))}
            </select>
          </label>
        )}

        <label className="form-label">{itemLabel} *
          <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Description" />
        </label>

        {!isOperator && (
          <label className="form-label">HSN Code
            <input className="form-input" value={hsnCode} onChange={e => setHsnCode(e.target.value)} placeholder="e.g. 998314" />
          </label>
        )}

        <div className="form-row">
          <label className="form-label">Quantity
            <input className="form-input" value={quantity} onChange={e => setQuantity(e.target.value)} inputMode="decimal" />
          </label>
          <label className="form-label">{priceLabel}
            <input className="form-input" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} inputMode="decimal" placeholder="0.00" />
          </label>
        </div>

        {!isOperator && (
          <div className="form-row">
            <label className="form-label">CGST %
              <input className="form-input" value={cgstRate} onChange={e => setCgstRate(e.target.value)} inputMode="decimal" placeholder="0" />
            </label>
            <label className="form-label">SGST %
              <input className="form-input" value={sgstRate} onChange={e => setSgstRate(e.target.value)} inputMode="decimal" placeholder="0" />
            </label>
            <label className="form-label">IGST %
              <input className="form-input" value={igstRate} onChange={e => setIgstRate(e.target.value)} inputMode="decimal" placeholder="0" />
            </label>
          </div>
        )}

        {sub > 0 && (
          <div style={calcBg}>
            {calcRow('Subtotal', sub)}
            {!isOperator && cgst > 0 && calcRow(`CGST (${cgst}%)`, cgstAmt)}
            {!isOperator && sgst > 0 && calcRow(`SGST (${sgst}%)`, sgstAmt)}
            {!isOperator && igst > 0 && calcRow(`IGST (${igst}%)`, igstAmt)}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'white', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 6 }}>
              <span>Total</span><span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <button className="btn-primary" onClick={handleAdd} disabled={!title.trim() || qty <= 0 || price <= 0}
          style={{ marginTop: 4, width: '100%', padding: 14, borderRadius: 12, fontSize: 16 }}>
          Add {isOperator ? 'Task' : 'Item'}
        </button>
      </div>
    </Modal>
  )
}
