import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import HomePage from './pages/HomePage'
import ChatbotPage from './pages/ChatbotPage'
import RekomendasiPage from './pages/RekomendasiPage'
import GeneratePage from './pages/GeneratePage'
import DeteksiPage from './pages/DeteksiPage'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Navbar />
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
      </div>
    </BrowserRouter>
  )
}

export default App
