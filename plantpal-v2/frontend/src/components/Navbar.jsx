import React from 'react'

export default function Navbar({ onToggleSidebar, theme, onToggleTheme }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <button 
          onClick={onToggleSidebar}
          className="btn-secondary"
          style={{ 
            padding: '8px 12px', 
            fontSize: '18px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginRight: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px'
          }}
        >
          ☰
        </button>
        <span className="brand-icon">🌱</span>
        <span className="brand-text">PlantPal</span>
        <span className="brand-badge">v2</span>
      </div>
      <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={onToggleTheme}
          className="btn-secondary"
          style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
        >
          {theme === 'dark' ? '☀️ Terang' : '🌙 Gelap'}
        </button>
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>AI Online</span>
        </div>
      </div>
    </nav>
  )
}
