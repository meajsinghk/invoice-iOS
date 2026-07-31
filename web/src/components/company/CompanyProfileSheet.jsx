import React, { useState } from 'react'
import { useStore } from '../../store/useStore'
import Modal from '../ui/Modal'
import '../ui/forms.css'

export default function CompanyProfileSheet({ onClose }) {
  const { state, dispatch, resetAll } = useStore()
  const p = state.companyProfile || {}

  const [form, setForm] = useState({ ...p })
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)

  function set(key) {
    return e => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function handleSave() {
    dispatch({ type: 'UPDATE_COMPANY_PROFILE', payload: form })
    onClose()
  }

  async function handleReset() {
    if (!confirmReset) { setConfirmReset(true); return }
    setResetting(true)
    await resetAll()
    setResetting(false)
    setConfirmReset(false)
    onClose()
  }

  return (
    <Modal title="⚙️ Company Profile" onClose={onClose} wide>
      <div className="form-grid">

        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          Business Identity
        </div>

        <label className="form-label">Company Name
          <input className="form-input" value={form.companyName || ''} onChange={set('companyName')} placeholder="e.g. MILAN CONSTRUCTION" />
        </label>
        <label className="form-label">Business Tagline
          <input className="form-input" value={form.businessTagline || ''} onChange={set('businessTagline')} placeholder="e.g. WORK CONTRACTOR & CIVIL CONTRACTOR" />
        </label>
        <label className="form-label">Business Services
          <input className="form-input" value={form.businessServices || ''} onChange={set('businessServices')} placeholder="e.g. ALL TYPES OF EARTH WORK..." />
        </label>

        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.08)', marginTop: 4 }}>
          Address & Contact
        </div>

        <label className="form-label">Address Line 1
          <input className="form-input" value={form.addressLine1 || ''} onChange={set('addressLine1')} placeholder="Village / Area" />
        </label>
        <label className="form-label">Address Line 2
          <input className="form-input" value={form.addressLine2 || ''} onChange={set('addressLine2')} placeholder="City, State, PIN" />
        </label>
        <label className="form-label">Phone
          <input className="form-input" type="tel" value={form.companyPhone || ''} onChange={set('companyPhone')} placeholder="+91 77708 55666" />
        </label>

        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.08)', marginTop: 4 }}>
          Tax Credentials
        </div>

        <div className="form-row">
          <label className="form-label">GSTIN
            <input className="form-input" value={form.companyGSTIN || ''} onChange={set('companyGSTIN')} placeholder="23ABCDE1234F1Z5" />
          </label>
          <label className="form-label">PAN
            <input className="form-input" value={form.companyPAN || ''} onChange={set('companyPAN')} placeholder="ABCDE1234F" />
          </label>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.08)', marginTop: 4 }}>
          Bank Details
        </div>

        <label className="form-label">Bank Name & Branch
          <input className="form-input" value={form.bankNameAndBranch || ''} onChange={set('bankNameAndBranch')} placeholder="HDFC BANK GWALIOR" />
        </label>
        <div className="form-row">
          <label className="form-label">Account Number
            <input className="form-input" value={form.bankAccountNo || ''} onChange={set('bankAccountNo')} placeholder="50200048493635" />
          </label>
          <label className="form-label">IFSC Code
            <input className="form-input" value={form.bankIFSCCode || ''} onChange={set('bankIFSCCode')} placeholder="HDFC0003707" />
          </label>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.08)', marginTop: 4 }}>
          Signatory
        </div>

        <label className="form-label">Authorised Signatory Name
          <input className="form-input" value={form.authorizedSignatoryName || ''} onChange={set('authorizedSignatoryName')} placeholder="e.g. Milandeep Virk" />
        </label>

        <button
          className="btn-primary"
          onClick={handleSave}
          style={{ marginTop: 10, width: '100%', padding: '14px', borderRadius: 12, fontSize: 16 }}
        >
          Save Profile
        </button>

        {/* Danger zone */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,60,60,0.2)' }}>
          <div style={{ color: 'rgba(255,100,100,0.6)', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            Danger Zone
          </div>
          {confirmReset ? (
            <div style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.3)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
              <p style={{ color: '#f87171', margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
                ⚠️ This will permanently delete ALL clients, operators, invoices, and transactions. Company profile is kept. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmReset(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: 14, fontWeight: 600 }}>
                  Cancel
                </button>
                <button onClick={handleReset} disabled={resetting} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,60,60,0.25)', border: '1px solid rgba(255,60,60,0.5)', color: '#f87171', fontSize: 14, fontWeight: 700 }}>
                  {resetting ? 'Resetting…' : '🗑️ Yes, Delete All'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={handleReset} style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.25)', color: '#f87171', fontSize: 14, fontWeight: 600 }}>
              🗑️ Reset All App Data
            </button>
          )}
        </div>

      </div>
    </Modal>
  )
}
