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
  const [sessionsList, setSessionsList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const messagesEndRef = useRef(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Load session list if authenticated
  useEffect(() => {
    if (token) {
      chatAPI.getSessions()
        .then(({ data }) => setSessionsList(data))
        .catch(err => console.error('Gagal mengambil history sesi:', err))
    }
  }, [token])

  const sendMessage = async () => {
    if (!token) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Akses ditolak. Silakan mendaftar atau masuk akun terlebih dahulu melalui menu utama untuk mulai mengobrol!' }])
      return
    }
    if (!input.trim() || isLoading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsLoading(true)
    try {
      const { data } = await chatAPI.sendMessage(sessionId, userMsg)
      
      // Update session list on first message of a new session
      if (!sessionId) {
        setSessionId(data.session_id)
        const { data: updatedList } = await chatAPI.getSessions()
        setSessionsList(updatedList)
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      let errMsg = 'Maaf, terjadi kesalahan. Coba lagi ya!'
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        errMsg = detail
      } else if (Array.isArray(detail)) {
        errMsg = detail.map(d => d.msg).join(', ')
      } else if (detail && typeof detail === 'object') {
        errMsg = JSON.stringify(detail)
      }
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${errMsg}` }])
    } finally {
      setIsLoading(false)
    }
  }

  const startNewSession = () => {
    setSessionId(null)
    setMessages([
      { role: 'assistant', content: 'Halo! 🌱 Aku PlantPal baru. Ada yang ingin kamu tanyakan lagi?' }
    ])
    setShowSessions(false)
  }

  return (
    <div className="chat-container">
      
      {/* Session List Sidebar for logged-in users */}
      {token && (
        <div className={`chat-sidebar-sessions glass-card ${showSessions ? 'open' : ''}`}>
          <button onClick={startNewSession} className="btn-primary" style={{ padding: '8px', fontSize: '13px', width: '100%' }}>
            ➕ Chat Baru
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Riwayat Sesi</span>
            {sessionsList.length === 0 ? (
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Belum ada obrolan</span>
            ) : (
              sessionsList.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSessionId(s.id)
                    setMessages([{ role: 'assistant', content: `[Sesi: ${s.id.substring(0,8)}] Halo! Kamu melanjutkan obrolan ini.` }])
                    setShowSessions(false)
                  }}
                  style={{
                    textAlign: 'left', background: s.id === sessionId ? 'var(--color-green-glow)' : 'transparent',
                    border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px',
                    fontSize: '12px', color: 'var(--color-text-primary)', cursor: 'pointer', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}
                >
                  💬 Sesi {s.created_at.substring(5,10)} {s.created_at.substring(11,16)}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main chat box */}
      <div className="chat-main-area">
        <div className="chat-header" style={{ marginBottom: '16px' }}>
          <div className="chat-header-mobile-bar">
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px' }}>💬 Chatbot PlantPal</h1>
            {token && (
              <button
                onClick={() => setShowSessions(!showSessions)}
                className="btn-secondary chat-toggle-btn"
                style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', borderRadius: '20px' }}
              >
                {showSessions ? '✕ Tutup' : '📜 Riwayat'}
              </button>
            )}
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Tanya apa saja tentang tanaman, aku siap membantu!</p>
        </div>

        {!token && (
          <div className="glass-card" style={{ borderLeft: '4px solid #fbbf24', padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>⚠️</span>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
              Obrolan AI memerlukan autentikasi aktif. Silakan <strong>Masuk / Daftar</strong> melalui menu utama terlebih dahulu.
            </p>
          </div>
        )}

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
            placeholder={token ? "Tanya tentang tanaman..." : "Silakan masuk akun terlebih dahulu..."}
            disabled={isLoading || !token}
            className="chat-input"
          />
          <button
            id="chat-send-btn"
            onClick={sendMessage}
            disabled={isLoading || !input.trim() || !token}
            className="btn-primary"
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  )
}
