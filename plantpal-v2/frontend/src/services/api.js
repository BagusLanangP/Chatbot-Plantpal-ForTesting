import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000,
})

// Inject JWT Token to authorization header automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => {
  return Promise.reject(error)
})

export const chatAPI = {
  sendMessage: (sessionId, message) =>
    api.post('/api/chat', { session_id: sessionId, message }),
  getSessions: () =>
    api.get('/api/chat/sessions'),
}

export const rekomendasiAPI = {
  getRekomendasi: (lat, lon, kriteria, lokasiNama) =>
    api.post('/api/rekomendasi', { lat, lon, kriteria, lokasi_nama: lokasiNama }),
}

export const generateAPI = {
  generateImage: (plantName) =>
    api.post('/api/generate-image', { plant_name: plantName }),
}

export const deteksiAPI = {
  detectPlant: (formData) =>
    api.post('/api/deteksi', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export default api
