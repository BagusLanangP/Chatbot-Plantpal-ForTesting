import React, { useState, useRef, useEffect } from 'react'
import { chatAPI } from '../services/api'
import ChatBubble from '../components/ChatBubble'
import TypingIndicator from '../components/TypingIndicator'

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Halo! 🌱 Aku PlantPal, asisten tanaman kamu. Ada yang ingin kamu tanyakan tentang tanaman?' }
  ])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsLoading(true)
    try {
      const { data } = await chatAPI.sendMessage(sessionId, userMsg)
      setSessionId(data.session_id)
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Maaf, terjadi kesalahan. Coba lagi ya!' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-header" style={{ marginBottom: '16px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px' }}>💬 Chatbot PlantPal</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Tanya apa saja tentang tanaman, aku siap membantu!</p>
      </div>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Tanya tentang tanaman..."
          disabled={isLoading}
          className="chat-input"
        />
        <button
          id="chat-send-btn"
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="btn-primary"
        >
          {isLoading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  )
}
