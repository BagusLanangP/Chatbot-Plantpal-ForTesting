import React from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/', icon: '🏠', label: 'Beranda' },
  { path: '/chat', icon: '💬', label: 'Chatbot' },
  { path: '/rekomendasi', icon: '📍', label: 'Rekomendasi' },
  { path: '/generate', icon: '🎨', label: 'Generate' },
  { path: '/deteksi', icon: '🔍', label: 'Deteksi' },
]

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          end={item.path === '/'}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
