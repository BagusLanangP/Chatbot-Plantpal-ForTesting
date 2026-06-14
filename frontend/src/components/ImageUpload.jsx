import React, { useState, useRef } from 'react'

export default function ImageUpload({ onImageSelect }) {
  const [preview, setPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef()

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
    onImageSelect(file)
  }

  return (
    <div
      id="image-upload-area"
      className={`upload-area ${isDragging ? 'dragging' : ''} glass-card`}
      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]) }}
      onClick={() => inputRef.current.click()}
      style={{ minHeight: '220px', justifyContent: 'center' }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={e => handleFile(e.target.files[0])}
        style={{ display: 'none' }}
        id="file-input"
      />
      {preview ? (
        <img src={preview} alt="Preview" className="upload-preview" />
      ) : (
        <div className="upload-placeholder">
          <div className="upload-icon">📸</div>
          <p style={{ fontWeight: '500', marginTop: '8px' }}>Drag & drop atau klik untuk upload foto tanaman</p>
          <p className="upload-hint" style={{ marginTop: '4px' }}>Mendukung JPG, PNG (maks 10MB)</p>
        </div>
      )}
    </div>
  )
}
