import React from 'react'
import { NavLink } from 'react-router-dom'

const menuItems = [
  { path: '/', icon: '🏠', label: 'Beranda' },
  { path: '/chat', icon: '💬', label: 'Chatbot' },
  { path: '/rekomendasi', icon: '📍', label: 'Rekomendasi' },
  { path: '/generate', icon: '🎨', label: 'Generate' },
  { path: '/deteksi', icon: '🔍', label: 'Deteksi' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🌿</div>
        <div className="logo-text">PlantPal</div>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            end={item.path === '/'}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p>PlantPal © 2026</p>
        <p>Powered by Gemini</p>
      </div>
    </aside>
  )
}
