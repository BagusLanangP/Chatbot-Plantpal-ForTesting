import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000,
})

export const chatAPI = {
  sendMessage: (sessionId, message) =>
    api.post('/api/chat', { session_id: sessionId, message }),
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
