import React from 'react'
import './FloatingTabBar.css'

export default function FloatingTabBar({ activeTab, onTabChange, onPlus }) {
  return (
    <div className="tab-bar-wrapper">
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => onTabChange('clients')}
        >
          <span className="tab-icon">👥</span>
          <span className="tab-label">Clients</span>
        </button>

        <div className="tab-bar-center">
          <button className="plus-btn" onClick={onPlus} title="New Invoice">
            <span className="plus-icon">+</span>
          </button>
        </div>

        <button
          className={`tab-btn ${activeTab === 'rates' ? 'active' : ''}`}
          onClick={() => onTabChange('rates')}
        >
          <span className="tab-icon">💰</span>
          <span className="tab-label">Rates</span>
        </button>
      </div>
    </div>
  )
}
