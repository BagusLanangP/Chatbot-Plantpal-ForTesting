import React, { useState } from 'react'
import { deteksiAPI } from '../services/api'
import ImageUpload from '../components/ImageUpload'

export default function DeteksiPage() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAnalyze = async () => {
    if (!file) return
    setIsLoading(true)
    setError(null)
    setResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const { data } = await deteksiAPI.detectPlant(formData)
      if (data.error) setError(data.error)
      else setResult(data)
    } catch (err) {
      setError('Gagal menganalisis gambar. Coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const healthColor = {
    'Sehat': 'var(--color-green-primary)',
    'Ada Penyakit': '#f87171',
    'Ada Hama': '#fbbf24',
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔍 Deteksi Tanaman</h1>
        <p>Upload foto tanaman untuk identifikasi spesies dan diagnosis kesehatan</p>
      </div>
      <ImageUpload onImageSelect={setFile} />
      {file && (
        <button
          id="analyze-plant-btn"
          onClick={handleAnalyze}
          disabled={isLoading}
          className="btn-primary"
          style={{ alignSelf: 'flex-start' }}
        >
          {isLoading ? '⏳ Menganalisis...' : '🔬 Analisis Tanaman'}
        </button>
      )}

      {result && (
        <div className="deteksi-result glass-card animate-fade-up">
          <div className="result-header">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px' }}>{result.nama_umum}</h2>
            <p className="result-scientific">{result.nama_ilmiah}</p>
            {result.kondisi_kesehatan && (
              <span
                className="health-badge"
                style={{ color: healthColor[result.kondisi_kesehatan] }}
              >
                ● {result.kondisi_kesehatan}
              </span>
            )}
          </div>
          <div className="result-grid">
            <div className="result-item">
              <strong>📋 Ciri-ciri</strong>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{result.ciri_ciri}</p>
            </div>
            <div className="result-item">
              <strong>🌍 Habitat</strong>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{result.habitat}</p>
            </div>
            <div className="result-item">
              <strong>💧 Perawatan</strong>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{result.cara_perawatan}</p>
            </div>
            {result.diagnosa_masalah && (
              <div className="result-item warning">
                <strong>⚠️ Diagnosa Masalah</strong>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{result.diagnosa_masalah}</p>
              </div>
            )}
            {result.solusi && (
              <div className="result-item">
                <strong>💊 Solusi Penanganan</strong>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{result.solusi}</p>
              </div>
            )}
          </div>
          <div className="result-confidence" style={{ marginTop: '16px', fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'right' }}>
            Tingkat Kepercayaan Analisis: <strong>{result.tingkat_kepercayaan}</strong>
          </div>
        </div>
      )}
      {error && <div className="error-message" style={{ color: '#f87171', marginTop: '16px' }}>❌ {error}</div>}
    </div>
  )
}
