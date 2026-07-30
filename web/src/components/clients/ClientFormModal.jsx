import React, { useState } from 'react'
import { useStore, uuid } from '../../store/useStore'
import Modal from '../ui/Modal'

export default function ClientFormModal({ client, onClose }) {
  const { dispatch } = useStore()
  const [name, setName] = useState(client?.name || '')
  const [email, setEmail] = useState(client?.email || '')
  const [phone, setPhone] = useState(client?.phone || '')
  const [address, setAddress] = useState(client?.address || '')
  const [gstin, setGstin] = useState(client?.gstin || client?.taxID || '')
  const [panNumber, setPanNumber] = useState(client?.panNumber || '')

  function handleSave() {
    if (!name.trim()) return
    const payload = { id: client?.id || uuid(), name, email, phone, address, gstin, panNumber }
    dispatch({ type: client ? 'UPDATE_CLIENT' : 'ADD_CLIENT', payload })
    onClose()
  }

  return (
    <Modal title={client ? 'Edit Client' : 'New Client'} onClose={onClose}>
      <div className="form-grid">
        <label className="form-label">Full Name *
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Client name" />
        </label>
        <div className="form-row">
          <label className="form-label">Email
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
          </label>
          <label className="form-label">Phone
            <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
          </label>
        </div>
        <label className="form-label">Address
          <textarea className="form-input form-textarea" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address…" rows={3} />
        </label>
        <div className="form-row">
          <label className="form-label">GSTIN
            <input className="form-input" value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} placeholder="29ABCDE1234F1Z5" />
          </label>
          <label className="form-label">PAN Number
            <input className="form-input" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" />
          </label>
        </div>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={!name.trim()}
          style={{ marginTop: 8, width: '100%', padding: '14px', borderRadius: 12, fontSize: 16 }}
        >
          {client ? 'Save Changes' : 'Add Client'}
        </button>
      </div>
    </Modal>
  )
}
