import React, { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default marker icons in Vite bundler
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function LocationMarker({ onSelect }) {
  const [position, setPosition] = useState(null)
  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      onSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return position ? <Marker position={position} /> : null
}

export default function MapPicker({ onLocationSelect }) {
  return (
    <div className="map-picker-wrapper" style={{ marginBottom: '16px' }}>
      <p className="map-hint" style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
        📍 Klik pada peta untuk memilih lokasi:
      </p>
      <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
        <MapContainer
          center={[-8.4095, 115.1889]} // Default: Bali
          zoom={9}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onSelect={onLocationSelect} />
        </MapContainer>
      </div>
    </div>
  )
}
