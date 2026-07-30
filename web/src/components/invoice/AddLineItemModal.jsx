import React, { useState } from 'react'
import { useStore, uuid } from '../../store/useStore'
import Modal from '../ui/Modal'
import '../ui/forms.css'

export default function AddLineItemModal({ workRates, onAdd, onClose }) {
  const [useRate, setUseRate] = useState(workRates.length > 0)
  const [selectedRate, setSelectedRate] = useState(workRates[0]?.id || '')
  const [title, setTitle] = useState('')
  const [hsnCode, setHsnCode] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')
  const [taxPct, setTaxPct] = useState('18')

  function applyRate(rateId) {
    setSelectedRate(rateId)
    const r = workRates.find(r => r.id === rateId)
    if (r) {
      setTitle(r.title)
      setHsnCode(r.hsnCode)
      setUnitPrice(r.unitRate.toString())
      setTaxPct(r.defaultTaxPercentage.toString())
    }
  }

  const qty = parseFloat(quantity) || 0
  const price = parseFloat(unitPrice) || 0
  const tax = parseFloat(taxPct) || 0
  const sub = qty * price
  const cgst = sub * (tax / 2) / 100
  const total = sub + cgst * 2

  function handleAdd() {
    if (!title.trim() || qty <= 0 || price <= 0) return
    onAdd({ id: uuid(), title, hsnCode, quantity: qty, unitPrice: price, taxPercentage: tax })
    onClose()
  }

  return (
    <Modal title="Add Line Item" onClose={onClose}>
      <div className="form-grid">
        {workRates.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setUseRate(true)}
              style={{ flex: 1, padding: '8px', borderRadius: 8, background: useRate ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f3f4f6', color: useRate ? 'white' : '#374151', fontWeight: 600, fontSize: 13 }}>
              From Work Rates
            </button>
            <button onClick={() => setUseRate(false)}
              style={{ flex: 1, padding: '8px', borderRadius: 8, background: !useRate ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f3f4f6', color: !useRate ? 'white' : '#374151', fontWeight: 600, fontSize: 13 }}>
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

        <label className="form-label">Item Name *
          <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Description" />
        </label>
        <label className="form-label">HSN Code
          <input className="form-input" value={hsnCode} onChange={e => setHsnCode(e.target.value)} placeholder="e.g. 998314" />
        </label>
        <div className="form-row">
          <label className="form-label">Quantity
            <input className="form-input" value={quantity} onChange={e => setQuantity(e.target.value)} inputMode="decimal" />
          </label>
          <label className="form-label">Unit Price (₹)
            <input className="form-input" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} inputMode="decimal" placeholder="0.00" />
          </label>
        </div>
        <label className="form-label">Tax %
          <input className="form-input" value={taxPct} onChange={e => setTaxPct(e.target.value)} inputMode="decimal" />
        </label>

        {sub > 0 && (
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}><span>Subtotal</span><span>₹{sub.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}><span>CGST ({(tax/2).toFixed(1)}%)</span><span>₹{cgst.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}><span>SGST ({(tax/2).toFixed(1)}%)</span><span>₹{cgst.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#6366f1', borderTop: '1px solid #e5e7eb', paddingTop: 6 }}><span>Total</span><span>₹{total.toFixed(2)}</span></div>
          </div>
        )}

        <button className="btn-primary" onClick={handleAdd} disabled={!title.trim() || qty <= 0 || price <= 0}
          style={{ marginTop: 4, width: '100%', padding: 14, borderRadius: 12, fontSize: 16 }}>
          Add Item
        </button>
      </div>
    </Modal>
  )
}
