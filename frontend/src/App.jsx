import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import MobileHeader from './components/MobileHeader'
import MobileNav from './components/MobileNav'
import HomePage from './pages/HomePage'
import ChatbotPage from './pages/ChatbotPage'
import RekomendasiPage from './pages/RekomendasiPage'
import GeneratePage from './pages/GeneratePage'
import DeteksiPage from './pages/DeteksiPage'
import './index.css'

import { useState, useEffect } from 'react'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  // On mobile, collapse sidebar by default on first load
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false)
    }
  }, [])

  // Sync theme to document element attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        {isSidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}
        <MobileHeader onToggleSidebar={toggleSidebar} theme={theme} onToggleTheme={toggleTheme} />
        <main className="main-content">
          <Navbar onToggleSidebar={toggleSidebar} theme={theme} onToggleTheme={toggleTheme} />
          <div className="content-body">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/chat" element={<ChatbotPage />} />
              <Route path="/rekomendasi" element={<RekomendasiPage />} />
              <Route path="/generate" element={<GeneratePage />} />
              <Route path="/deteksi" element={<DeteksiPage />} />
            </Routes>
          </div>
        </main>
        <MobileNav />
      </div>
    </BrowserRouter>
  )
}

export default App
