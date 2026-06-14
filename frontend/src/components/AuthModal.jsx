import React, { useState } from 'react'
import axios from 'axios'

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const url = isLogin ? '/api/auth/login' : '/api/auth/register'
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + url

    try {
      const { data } = await axios.post(apiUrl, { email, password })
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('userEmail', data.email)
      onAuthSuccess(data.email)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex',
      alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
    }}>
      <div className="glass-card" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)' }}>{isLogin ? '🔑 Masuk Akun' : '📝 Daftar Akun'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="text-input"
              placeholder="nama@email.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="text-input"
              placeholder="••••••••"
            />
          </div>
          {error && <div style={{ color: '#f87171', fontSize: '14px' }}>⚠️ {error}</div>}
          <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            {isLoading ? '⏳ Memproses...' : isLogin ? 'Masuk' : 'Daftar'}
          </button>
        </form>
        <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
          {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null) }}
            style={{ background: 'none', border: 'none', color: 'var(--color-green-primary)', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Daftar Sekarang' : 'Masuk Sini'}
          </button>
        </div>
      </div>
    </div>
  )
}
