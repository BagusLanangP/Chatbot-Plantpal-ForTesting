import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import AuthModal from './AuthModal'

const menuItems = [
  { path: '/', icon: '🏠', label: 'Beranda' },
  { path: '/chat', icon: '💬', label: 'Chatbot' },
  { path: '/rekomendasi', icon: '📍', label: 'Rekomendasi' },
  { path: '/generate', icon: '🎨', label: 'Generate' },
  { path: '/deteksi', icon: '🔍', label: 'Deteksi' },
]

export default function Sidebar({ isOpen, onClose }) {
  const [userEmail, setUserEmail] = useState(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  useEffect(() => {
    const email = localStorage.getItem('userEmail')
    if (email) {
      setUserEmail(email)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    setUserEmail(null)
    window.location.reload()
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">🌿</div>
        <div className="logo-text">PlantPal</div>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            end={item.path === '/'}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-auth" style={{ marginTop: 'auto', padding: '16px 8px', borderTop: '1px solid var(--color-border)' }}>
        {userEmail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              👤 {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
            >
              Keluar Akun
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="btn-primary"
            style={{ width: '100%', padding: '10px 16px', fontSize: '14px' }}
          >
            Masuk / Daftar
          </button>
        )}
      </div>

      <div className="sidebar-footer">
        <p>PlantPal © 2026</p>
        <p>Powered by Gemini</p>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(email) => {
          setUserEmail(email)
          window.location.reload()
        }}
      />
    </aside>
  )
}
