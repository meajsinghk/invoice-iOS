import React, { useState } from 'react'
import { useStore, uuid } from '../../store/useStore'
import Modal from '../ui/Modal'
import '../ui/forms.css'

export default function WorkRateFormModal({ item, onClose }) {
  const { dispatch } = useStore()
  const [title, setTitle] = useState(item?.title || '')
  const [hsnCode, setHsnCode] = useState(item?.hsnCode || '')
  const [unitRate, setUnitRate] = useState(item?.unitRate?.toString() || '')
  const [taxPct, setTaxPct] = useState(item?.defaultTaxPercentage?.toString() || '18')

  const rate = parseFloat(unitRate) || 0
  const tax = parseFloat(taxPct) || 0
  const cgst = rate * (tax / 2) / 100
  const total = rate + rate * tax / 100

  function handleSave() {
    if (!title.trim()) return
    const payload = { id: item?.id || uuid(), title, hsnCode, unitRate: rate, defaultTaxPercentage: tax }
    dispatch({ type: item ? 'UPDATE_WORK_RATE' : 'ADD_WORK_RATE', payload })
    onClose()
  }

  return (
    <Modal title={item ? 'Edit Rate' : 'New Rate'} onClose={onClose}>
      <div className="form-grid">
        <label className="form-label">Service / Item Name *
          <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Web Development" />
        </label>
        <label className="form-label">HSN Code
          <input className="form-input" value={hsnCode} onChange={e => setHsnCode(e.target.value)} placeholder="e.g. 998314" inputMode="numeric" />
        </label>
        <div className="form-row">
          <label className="form-label">Unit Rate (₹)
            <input className="form-input" value={unitRate} onChange={e => setUnitRate(e.target.value)} placeholder="0.00" inputMode="decimal" />
          </label>
          <label className="form-label">Tax %
            <input className="form-input" value={taxPct} onChange={e => setTaxPct(e.target.value)} placeholder="18" inputMode="decimal" />
          </label>
        </div>

        {rate > 0 && (
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
              <span>CGST ({(tax/2).toFixed(1)}%)</span><span>₹{cgst.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
              <span>SGST ({(tax/2).toFixed(1)}%)</span><span>₹{cgst.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#15803d', borderTop: '1px solid #e5e7eb', paddingTop: 6 }}>
              <span>Total per unit</span><span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <button className="btn-primary" onClick={handleSave} disabled={!title.trim()}
          style={{ marginTop: 4, width: '100%', padding: 14, borderRadius: 12, fontSize: 16 }}>
          {item ? 'Save Changes' : 'Add Rate'}
        </button>
      </div>
    </Modal>
  )
}
