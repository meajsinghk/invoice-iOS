import React, { useState } from 'react'
import { useStore } from '../../store/useStore'
import WorkRateCard from './WorkRateCard'
import WorkRateFormModal from './WorkRateFormModal'
import '../clients/ClientsView.css'

export default function WorkRatesView() {
  const { state } = useStore()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)

  const filtered = state.workRates.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.hsnCode || '').toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="view-container">
      <div className="search-bar-wrapper">
        <input
          className="search-input"
          type="text"
          placeholder="🔍  Search work rates…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="add-btn" onClick={() => setShowAdd(true)}>+ Add</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💰</div>
          <h3>No Work Rates</h3>
          <p>Add your standard services & pricing</p>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Rate</button>
        </div>
      ) : (
        <div className="card-list">
          {filtered.map(item => (
            <WorkRateCard key={item.id} item={item} onEdit={() => setEditItem(item)} />
          ))}
        </div>
      )}

      {showAdd && <WorkRateFormModal item={null} onClose={() => setShowAdd(false)} />}
      {editItem && <WorkRateFormModal item={editItem} onClose={() => setEditItem(null)} />}
    </div>
  )
}
