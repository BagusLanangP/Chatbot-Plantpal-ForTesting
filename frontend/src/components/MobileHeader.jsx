import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AuthModal from './AuthModal'

export default function MobileHeader({ onToggleSidebar, theme, onToggleTheme }) {
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
    <header className="mobile-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          onClick={onToggleSidebar}
          className="btn-secondary"
          style={{ padding: '6px 10px', fontSize: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px' }}
        >
          ☰
        </button>
        <Link to="/" className="mobile-header-logo">
          <span className="mobile-header-logo-icon">🌿</span>
          <span className="mobile-header-logo-text">PlantPal</span>
        </Link>
      </div>
      
      <div className="mobile-header-auth" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          onClick={onToggleTheme}
          className="btn-secondary"
          style={{ padding: '6px 10px', fontSize: '14px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {userEmail ? (
          <>
            <span className="mobile-header-user">
              👤 {userEmail.split('@')[0]}
            </span>
            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '20px' }}
            >
              Keluar
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '20px' }}
          >
            Masuk
          </button>
        )}
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(email) => {
          setUserEmail(email)
          window.location.reload()
        }}
      />
    </header>
  )
}
