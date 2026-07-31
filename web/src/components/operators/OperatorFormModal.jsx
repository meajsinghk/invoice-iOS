import React, { useState } from 'react'
import { useStore, uuid } from '../../store/useStore'
import Modal from '../ui/Modal'

export default function OperatorFormModal({ operator, onClose }) {
  const { dispatch } = useStore()
  const [name, setName] = useState(operator?.name || '')
  const [phone, setPhone] = useState(operator?.phone || '')
  const [address, setAddress] = useState(operator?.address || '')
  const [panNumber, setPanNumber] = useState(operator?.panNumber || '')
  const [avatarUrl, setAvatarUrl] = useState(operator?.avatarUrl || '')

  function handleSave() {
    if (!name.trim()) return
    const payload = { id: operator?.id || uuid(), name, phone, address, panNumber, avatarUrl }
    dispatch({ type: operator ? 'UPDATE_OPERATOR' : 'ADD_OPERATOR', payload })
    onClose()
  }

  return (
    <Modal title={operator ? 'Edit Operator' : 'New Operator'} onClose={onClose}>
      <div className="form-grid">
        <label className="form-label">Full Name *
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Operator name" />
        </label>
        <label className="form-label">Phone
          <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
        </label>
        <label className="form-label">Address
          <textarea className="form-input form-textarea" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address…" rows={3} />
        </label>
        <label className="form-label">PAN Number
          <input className="form-input" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" />
        </label>
        <label className="form-label">Avatar Image URL (optional)
          <input className="form-input" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://…" />
        </label>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={!name.trim()}
          style={{ marginTop: 8, width: '100%', padding: '14px', borderRadius: 12, fontSize: 16 }}
        >
          {operator ? 'Save Changes' : 'Add Operator'}
        </button>
      </div>
    </Modal>
  )
}
