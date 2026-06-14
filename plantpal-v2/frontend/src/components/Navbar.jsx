import React from 'react'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">🌱</span>
        <span className="brand-text">PlantPal</span>
        <span className="brand-badge">v2</span>
      </div>
      <div className="navbar-actions">
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>AI Online</span>
        </div>
      </div>
    </nav>
  )
}
