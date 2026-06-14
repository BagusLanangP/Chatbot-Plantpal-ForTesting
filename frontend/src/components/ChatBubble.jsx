import React from 'react'
import ReactMarkdown from 'react-markdown'

export default function ChatBubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`chat-bubble-wrapper ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && <span className="bubble-avatar">🌿</span>}
      <div className={`chat-bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}`}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
      {isUser && <span className="bubble-avatar">👤</span>}
    </div>
  )
}
