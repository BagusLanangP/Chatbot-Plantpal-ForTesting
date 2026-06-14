import React, { useState } from 'react'
import { generateAPI } from '../services/api'

export default function PlantCard({ plant }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const { data } = await generateAPI.generateImage(plant.nama)
      setImageUrl(data.image_url)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="plant-card glass-card">
      {imageUrl && (
        <img src={imageUrl} alt={plant.nama} className="plant-card-image" />
      )}
      <div className="plant-card-body">
        <div className="plant-card-header">
          <h3 className="plant-name">{plant.nama}</h3>
          <span className="plant-badge">{plant.cocok_untuk}</span>
        </div>
        <p className="plant-scientific">{plant.nama_ilmiah}</p>
        <p className="plant-desc">{plant.deskripsi}</p>
        <div className="plant-care">
          <strong>🌿 Perawatan:</strong>
          <p style={{ marginTop: '4px', color: 'var(--color-text-muted)', fontSize: '13px' }}>{plant.cara_perawatan}</p>
        </div>
        <button
          id={`generate-btn-${plant.nama.replace(/\s/g, '-')}`}
          onClick={handleGenerate}
          disabled={isGenerating}
          className="btn-secondary plant-generate-btn"
          style={{ marginTop: '12px', width: '100%' }}
        >
          {isGenerating ? '⏳ Generating...' : '🎨 Generate Gambar'}
        </button>
      </div>
    </div>
  )
}
