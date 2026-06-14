import React from 'react'

export default function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <span className="typing-avatar">🌿</span>
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span className="typing-text">PlantPal sedang mengetik...</span>
    </div>
  )
}
