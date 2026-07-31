import React, { useState, useRef } from 'react'
import { useStore, uuid } from '../../store/useStore'
import Modal from '../ui/Modal'

export default function OperatorFormModal({ operator, onClose }) {
  const { dispatch } = useStore()
  const [name, setName] = useState(operator?.name || '')
  const [phone, setPhone] = useState(operator?.phone || '')
  const [address, setAddress] = useState(operator?.address || '')
  const [panNumber, setPanNumber] = useState(operator?.panNumber || '')
  const [avatarUrl, setAvatarUrl] = useState(operator?.avatarUrl || '')
  const fileRef = useRef()

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatarUrl(ev.target.result)
    reader.readAsDataURL(file)
  }

  function handleSave() {
    if (!name.trim()) return
    const payload = { id: operator?.id || uuid(), name, phone, address, panNumber, avatarUrl }
    dispatch({ type: operator ? 'UPDATE_OPERATOR' : 'ADD_OPERATOR', payload })
    onClose()
  }

  return (
    <Modal title={operator ? 'Edit Operator' : 'New Operator'} onClose={onClose}>
      <div className="form-grid">
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
          <div onClick={() => fileRef.current.click()} style={{
            width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.08)', border: '2px dashed rgba(255,255,255,0.2)',
            overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 22, opacity: 0.4 }}>📷</span>
            }
          </div>
          <div>
            <button type="button" onClick={() => fileRef.current.click()} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer',
            }}>Upload Photo</button>
            {avatarUrl && <button type="button" onClick={() => setAvatarUrl('')} style={{ marginLeft: 8, padding: '6px 10px', borderRadius: 8, fontSize: 12, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>Remove</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>

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
