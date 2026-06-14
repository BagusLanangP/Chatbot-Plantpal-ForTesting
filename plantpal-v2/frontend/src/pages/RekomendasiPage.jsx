import React, { useState } from 'react'
import { rekomendasiAPI } from '../services/api'
import MapPicker from '../components/MapPicker'
import PlantCard from '../components/PlantCard'

export default function RekomendasiPage() {
  const [location, setLocation] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [kriteria, setKriteria] = useState('')
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleMapSelect = async (lat, lon) => {
    setLocation({ lat, lon })
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      )
      const data = await resp.json()
      setLocationName(data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`)
    } catch {
      setLocationName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`)
    }
  }

  const handleSubmit = async () => {
    if (!location || !kriteria.trim()) return
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await rekomendasiAPI.getRekomendasi(
        location.lat, location.lon, kriteria, locationName
      )
      setResult(data)
    } catch (err) {
      setError('Gagal mendapatkan rekomendasi. Coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📍 Rekomendasi Tanaman</h1>
        <p>Pilih lokasi di peta dan masukkan preferensimu untuk rekomendasi tanaman yang tepat</p>
      </div>
      <MapPicker onLocationSelect={handleMapSelect} />
      {locationName && (
        <div className="location-selected" style={{ padding: '8px 16px', background: 'var(--color-green-glow)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px' }}>
          <span>📌 Lokasi dipilih: <strong>{locationName}</strong></span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontWeight: '500', fontSize: '15px' }}>Kriteria / Jenis Tanaman</label>
        <input
          id="kriteria-input"
          type="text"
          value={kriteria}
          onChange={e => setKriteria(e.target.value)}
          placeholder="Contoh: tanaman hias yang mudah dirawat, atau sayuran untuk urban farming"
          className="text-input"
        />
      </div>
      <button
        id="get-rekomendasi-btn"
        onClick={handleSubmit}
        disabled={!location || !kriteria.trim() || isLoading}
        className="btn-primary"
        style={{ width: 'fit-content' }}
      >
        {isLoading ? '⏳ Menganalisis lingkungan...' : '🌱 Dapatkan Rekomendasi'}
      </button>

      {error && <div className="error-message" style={{ color: '#f87171' }}>❌ {error}</div>}

      {result && (
        <div className="rekomendasi-result" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="env-summary glass-card">
            <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '16px' }}>🌍 Kondisi Lingkungan</h3>
            <div className="env-grid">
              <div>🌡️ Suhu: {result.cuaca.temperature !== null ? `${result.cuaca.temperature}°C` : 'N/A'}</div>
              <div>💧 Kelembaban: {result.cuaca.humidity !== null ? `${result.cuaca.humidity}%` : 'N/A'}</div>
              <div>Curah Hujan: {result.cuaca.precipitation !== null ? `${result.cuaca.precipitation} mm` : '0 mm'}</div>
              <div>🧪 pH Tanah: {result.tanah.ph !== undefined ? result.tanah.ph : 'N/A'}</div>
            </div>
            <p style={{ marginTop: '16px', fontSize: '14px', lineHeight: '1.6', color: 'var(--color-text-muted)' }}>
              {result.ringkasan_lingkungan}
            </p>
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', marginBottom: '16px' }}>🌿 Tanaman yang Direkomendasikan</h3>
            <div className="plant-cards-grid">
              {result.tanaman.map((plant, i) => (
                <PlantCard key={i} plant={plant} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
