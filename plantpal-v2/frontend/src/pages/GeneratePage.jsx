import React, { useState } from 'react'
import { generateAPI } from '../services/api'

export default function GeneratePage() {
  const [plantName, setPlantName] = useState('')
  const [imageUrl, setImageUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!plantName.trim()) return
    setIsLoading(true)
    setError(null)
    setImageUrl(null)
    try {
      const { data } = await generateAPI.generateImage(plantName)
      setImageUrl(data.image_url)
    } catch (err) {
      setError('Gagal generate gambar. Coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🎨 Generate Gambar Tanaman</h1>
        <p>Masukkan nama tanaman dan dapatkan visualisasi ilustrasi botanisnya secara gratis</p>
      </div>
      <div className="generate-input-area">
        <input
          id="plant-name-input"
          type="text"
          value={plantName}
          onChange={e => setPlantName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          placeholder="Contoh: Bunga Anggrek Bulan, Pohon Mangga, Bayam Merah..."
          className="text-input"
        />
        <button
          id="generate-image-btn"
          onClick={handleGenerate}
          disabled={isLoading || !plantName.trim()}
          className="btn-primary"
        >
          {isLoading ? '⏳ Generating...' : '✨ Generate'}
        </button>
      </div>

      {isLoading && (
        <div className="generate-loading glass-card" style={{ marginTop: '24px' }}>
          <div className="loading-animation">🌱</div>
          <p style={{ fontWeight: '500' }}>Sedang membuat ilustrasi botanis...</p>
          <p className="loading-hint">Proses ini bisa memakan waktu beberapa detik</p>
        </div>
      )}

      {imageUrl && !isLoading && (
        <div className="generate-result glass-card animate-fade-up" style={{ marginTop: '24px' }}>
          <img
            id="generated-plant-image"
            src={imageUrl}
            alt={plantName}
            className="generated-image"
            onError={() => setError('Gagal memuat gambar')}
          />
          <div className="generate-actions" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <p className="generated-label" style={{ fontWeight: '600', fontSize: '18px' }}>🌿 {plantName}</p>
            <a
              href={imageUrl}
              download={`plantpal-${plantName}.jpg`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ textDecoration: 'none' }}
            >
              ⬇️ Download Gambar
            </a>
          </div>
        </div>
      )}

      {error && <div className="error-message" style={{ color: '#f87171', marginTop: '16px' }}>❌ {error}</div>}
    </div>
  )
}
