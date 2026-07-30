import React, { useState } from 'react'
import { useStore } from '../../store/useStore'
import ClientCard from './ClientCard'
import ClientFormModal from './ClientFormModal'
import './ClientsView.css'

export default function ClientsView() {
  const { state } = useStore()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editClient, setEditClient] = useState(null)

  const filtered = state.clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="view-container">
      <div className="search-bar-wrapper">
        <input
          className="search-input"
          type="text"
          placeholder="🔍  Search clients…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="add-btn" onClick={() => setShowAdd(true)}>+ Add</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No Clients Yet</h3>
          <p>Add your first client to get started</p>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Client</button>
        </div>
      ) : (
        <div className="card-list">
          {filtered.map(client => (
            <ClientCard key={client.id} client={client} onEdit={() => setEditClient(client)} />
          ))}
        </div>
      )}

      {showAdd && <ClientFormModal client={null} onClose={() => setShowAdd(false)} />}
      {editClient && <ClientFormModal client={editClient} onClose={() => setEditClient(null)} />}
    </div>
  )
}
