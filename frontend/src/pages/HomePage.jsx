import React from 'react'
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="page-container hero-section">
      <div className="hero-badge">🌿 Memperkenalkan PlantPal v2</div>
      <h1 className="hero-title">Temukan dan Rawat Tanaman Impian Anda</h1>
      <p className="hero-desc">
        Aplikasi asisten berkebun cerdas berbasis AI untuk menganalisis lokasi secara geografis, merawat kesehatan tumbuhan, dan memvisualisasikan flora secara instan.
      </p>
      
      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
        <Link to="/chat" className="btn-primary" style={{ textDecoration: 'none' }}>
          Mulai Chatting 💬
        </Link>
        <Link to="/rekomendasi" className="btn-secondary" style={{ textDecoration: 'none' }}>
          Cari Rekomendasi 📍
        </Link>
      </div>

      <div className="features-grid">
        <div className="feature-card glass-card">
          <div className="feature-icon">💬</div>
          <h3>Asisten Pintar</h3>
          <p>Tanya tentang cara perawatan, penyiraman, pemupukan, dan hama secara langsung dengan chatbot AI ahli botani.</p>
        </div>
        <div className="feature-card glass-card">
          <div className="feature-icon">📍</div>
          <h3>Lokasi-Aware</h3>
          <p>Rekomendasi tanaman kontekstual berdasarkan tipe keasaman (pH) tanah dan data cuaca daerah geografis Anda.</p>
        </div>
        <div className="feature-card glass-card">
          <div className="feature-icon">🎨</div>
          <h3>Generate Visual</h3>
          <p>Gunakan generator gambar instan untuk memvisualisasikan bentuk botani dari benih tanaman yang ingin Anda tanam.</p>
        </div>
        <div className="feature-card glass-card">
          <div className="feature-icon">🔍</div>
          <h3>Deteksi Penyakit</h3>
          <p>Unggah foto tanaman Anda untuk mendapatkan identifikasi varietas dan diagnosa masalah kesehatan secara instan.</p>
        </div>
      </div>
    </div>
  )
}
