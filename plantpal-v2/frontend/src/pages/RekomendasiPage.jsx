import React, { useState } from 'react'
import { rekomendasiAPI } from '../services/api'
import MapPicker from '../components/MapPicker'
import PlantCard from '../components/PlantCard'

export default function RekomendasiPage() {
  const [inputType, setInputType] = useState('map') // 'map' atau 'text'
  const [location, setLocation] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [manualLocation, setManualLocation] = useState('')
  const [kriteria, setKriteria] = useState('')
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const token = localStorage.getItem('token')

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
    if (!token) {
      setError('Akses ditolak. Silakan daftar atau masuk akun terlebih dahulu di sidebar kiri.')
      return
    }

    const isMapMode = inputType === 'map'
    const finalLocationName = isMapMode ? locationName : manualLocation.trim()
    
    if (isMapMode && !location) {
      setError('Mohon pilih lokasi di peta terlebih dahulu.')
      return
    }
    if (!isMapMode && !finalLocationName) {
      setError('Mohon masukkan nama wilayah/kota.')
      return
    }
    if (!kriteria.trim()) {
      setError('Mohon isi kriteria tanaman.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const { data } = await rekomendasiAPI.getRekomendasi(
        isMapMode ? location.lat : null,
        isMapMode ? location.lon : null,
        kriteria,
        finalLocationName
      )
      setResult(data)
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Gagal mendapatkan rekomendasi. Coba lagi.'
      setError(errMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📍 Rekomendasi Tanaman</h1>
        <p>Pilih metode input lokasi dan masukkan preferensimu untuk rekomendasi tanaman yang tepat</p>
      </div>

      {!token && (
        <div className="glass-card" style={{ borderLeft: '4px solid #fbbf24', padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>⚠️</span>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Fitur ini memerlukan autentikasi. Silakan <strong>Masuk / Daftar</strong> melalui menu di sidebar kiri terlebih dahulu.
          </p>
        </div>
      )}

      {/* Tabs untuk memilih metode input */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
        <button
          onClick={() => { setInputType('map'); setResult(null); setError(null); }}
          className={inputType === 'map' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 16px', fontSize: '14px' }}
          disabled={!token}
        >
          🗺️ Pilih Lewat Peta
        </button>
        <button
          onClick={() => { setInputType('text'); setResult(null); setError(null); }}
          className={inputType === 'text' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 16px', fontSize: '14px' }}
          disabled={!token}
        >
          ✍️ Tulis Nama Wilayah
        </button>
      </div>

      {inputType === 'map' ? (
        <>
          <MapPicker onLocationSelect={handleMapSelect} />
          {locationName && (
            <div className="location-selected" style={{ padding: '8px 16px', background: 'var(--color-green-glow)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px' }}>
              <span>📌 Lokasi dipilih: <strong>{locationName}</strong></span>
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '500', fontSize: '15px' }}>Nama Wilayah / Kota / Desa</label>
          <input
            type="text"
            value={manualLocation}
            onChange={e => setManualLocation(e.target.value)}
            placeholder="Contoh: Kintamani, Bali atau Lembang, Bandung"
            className="text-input"
            disabled={!token}
          />
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
          disabled={!token}
        />
      </div>
      
      <button
        id="get-rekomendasi-btn"
        onClick={handleSubmit}
        disabled={isLoading || !token}
        className="btn-primary"
        style={{ width: 'fit-content' }}
      >
        {isLoading ? '⏳ Menganalisis lingkungan...' : '🌱 Dapatkan Rekomendasi'}
      </button>

      {error && <div className="error-message" style={{ color: '#f87171', marginTop: '16px' }}>❌ {error}</div>}

      {result && (
        <div className="rekomendasi-result" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="env-summary glass-card">
            <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '16px' }}>🌍 Kondisi Lingkungan</h3>
            {result.cuaca && result.tanah ? (
              <div className="env-grid">
                <div>🌡️ Suhu: {result.cuaca.temperature !== null ? `${result.cuaca.temperature}°C` : 'N/A'}</div>
                <div>💧 Kelembaban: {result.cuaca.humidity !== null ? `${result.cuaca.humidity}%` : 'N/A'}</div>
                <div>Curah Hujan: {result.cuaca.precipitation !== null ? `${result.cuaca.precipitation} mm` : '0 mm'}</div>
                <div>🧪 pH Tanah: {result.tanah.ph !== undefined ? result.tanah.ph : 'N/A'}</div>
              </div>
            ) : (
              <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                ℹ️ Menggunakan database kecerdasan buatan untuk analisis wilayah (peta koordinat tidak dipilih).
              </div>
            )}
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
