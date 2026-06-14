# PlantPal v2 — Implementation Plan
## Rebuild dari Streamlit → React + FastAPI

### Latar Belakang

Project PlantPal saat ini dibangun di atas **Streamlit** (Python) dengan 4 fitur utama:
1. **Chatbot** — chat berbasis teks dengan LLM (Together AI / LLaMA Vision)
2. **Rekomendasi** — input lokasi + kriteria → rekomendasi tanaman
3. **Generate Gambar** — input deskripsi → gambar tanaman via Together AI Image
4. **Deteksi** — upload foto → identifikasi tanaman via LLM Vision

**Masalah versi lama:**
- Streamlit = UI terbatas, tidak mobile-friendly, tidak bisa dikustomisasi penuh
- API key di-hardcode di source code (security risk)
- Together AI digunakan untuk semua fitur (berbayar)
- Rekomendasi tidak pakai data lingkungan nyata (Open-Meteo, SoilGrids)
- Tidak ada persistensi data (history hilang saat refresh)
- Image generation menggunakan Together AI (berbayar), padahal ada Pollinations.ai yang gratis

**Tujuan rebuild:**
- Stack modern: React (Vite) + Vanilla CSS
- Semua API gratis / free tier
- UI premium, mobile-first
- Data lingkungan nyata dari koordinat GPS
- Arsitektur yang bersih dan mudah diperluas

---

## Stack Teknologi

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend | React (Vite) + Vanilla CSS | Modern, cepat, tidak perlu Tailwind |
| Backend | FastAPI (Python 3.11+) | Ringan, async, auto-docs |
| Database | SQLite (dev) → PostgreSQL (prod) | Simpan history chat per sesi |
| AI / Chat | Google Gemini 1.5 Flash | Gratis, support vision + teks |
| Image Gen | Pollinations.ai | 100% gratis, tanpa API key |
| Cuaca | Open-Meteo API | Gratis, tidak perlu key |
| Tanah | SoilGrids API (ISRIC) | Gratis, global coverage |
| Maps | Leaflet.js (OpenStreetMap) | Gratis, tanpa billing |
| Deploy | Docker Compose | Mudah di VPS |

---

## Struktur Folder Project

```
plantpal-v2/
├── frontend/                    # React app (Vite)
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBubble.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── PlantCard.jsx
│   │   │   ├── ImageUpload.jsx
│   │   │   ├── MapPicker.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── TypingIndicator.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── ChatbotPage.jsx
│   │   │   ├── RekomendasiPage.jsx
│   │   │   ├── GeneratePage.jsx
│   │   │   └── DeteksiPage.jsx
│   │   ├── services/
│   │   │   └── api.js           # Axios instance ke backend
│   │   ├── hooks/
│   │   │   ├── useChat.js
│   │   │   └── useGeolocation.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                     # FastAPI app
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # Entry point FastAPI
│   │   ├── config.py            # Settings (env vars, Gemini key)
│   │   ├── database.py          # SQLAlchemy setup (SQLite/PostgreSQL)
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── chat.py          # Model database: ChatSession, Message
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── chatbot.py       # POST /api/chat
│   │   │   ├── rekomendasi.py   # POST /api/rekomendasi
│   │   │   ├── generate.py      # POST /api/generate-image
│   │   │   └── deteksi.py       # POST /api/deteksi
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── gemini.py        # Wrapper Gemini Flash API
│   │       ├── open_meteo.py    # Fetch cuaca dari koordinat
│   │       ├── soilgrids.py     # Fetch data tanah dari koordinat
│   │       └── pollinations.py  # Fetch image dari Pollinations.ai
│   ├── .env                     # API keys (TIDAK di-commit ke git)
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
```

---

## Phase 1 — Foundation & Chatbot

**Durasi:** 1-2 minggu  
**Output:** Aplikasi bisa jalan lokal, fitur chatbot berfungsi penuh

### 1.1 Setup Backend (FastAPI)

**File: `backend/requirements.txt`**
```
fastapi==0.111.0
uvicorn[standard]==0.30.0
google-generativeai==0.7.2
python-dotenv==1.0.1
sqlalchemy==2.0.30
aiosqlite==0.20.0
httpx==0.27.0
python-multipart==0.0.9
pillow==10.3.0
pydantic==2.7.1
```

**File: `backend/.env`** (JANGAN di-commit ke git, tambahkan ke .gitignore)
```
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite+aiosqlite:///./plantpal.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**File: `backend/app/config.py`**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str
    database_url: str = "sqlite+aiosqlite:///./plantpal.db"
    cors_origins: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"

settings = Settings()
```

**File: `backend/app/database.py`**
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

engine = create_async_engine(settings.database_url)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

**File: `backend/app/models/chat.py`**
```python
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.sqlite import BLOB
from datetime import datetime
import uuid
from app.database import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("chat_sessions.id"))
    role = Column(String)       # "user" atau "assistant"
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
```

**File: `backend/app/services/gemini.py`**
```python
import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.gemini_api_key)

SYSTEM_PROMPT = """Kamu adalah PlantPal, asisten ahli tanaman yang ramah dan berpengetahuan luas.
Kamu fokus pada:
- Identifikasi dan klasifikasi tanaman
- Cara perawatan tanaman (penyiraman, pupuk, cahaya)
- Rekomendasi tanaman berdasarkan lokasi dan kondisi
- Diagnosa penyakit dan hama tanaman
- Teknik pertanian dan berkebun
- Ekologi dan habitat tanaman

Kamu berbicara dalam bahasa Indonesia yang ramah dan mudah dipahami.
Jika pertanyaan tidak berkaitan dengan tanaman, arahkan kembali ke topik tanaman dengan sopan."""

def get_model(vision: bool = False):
    return genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_PROMPT
    )

async def chat_with_gemini(history: list[dict], user_message: str) -> str:
    """
    history: list of {"role": "user"/"model", "parts": ["text"]}
    """
    model = get_model()
    chat = model.start_chat(history=history)
    response = await chat.send_message_async(user_message)
    return response.text

async def analyze_image_with_gemini(image_bytes: bytes, prompt: str) -> str:
    """Analisis gambar dengan Gemini Vision"""
    import PIL.Image
    import io
    model = get_model(vision=True)
    image = PIL.Image.open(io.BytesIO(image_bytes))
    response = await model.generate_content_async([prompt, image])
    return response.text
```

**File: `backend/app/routers/chatbot.py`**
```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.chat import ChatSession, Message
from app.services.gemini import chat_with_gemini

router = APIRouter(prefix="/api/chat", tags=["chatbot"])

class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str

class ChatResponse(BaseModel):
    session_id: str
    reply: str

@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    # Buat session baru jika belum ada
    if not req.session_id:
        session = ChatSession()
        db.add(session)
        await db.commit()
        session_id = session.id
    else:
        session_id = req.session_id

    # Ambil history dari DB
    result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()

    # Format untuk Gemini
    history = []
    for msg in messages:
        role = "user" if msg.role == "user" else "model"
        history.append({"role": role, "parts": [msg.content]})

    # Panggil Gemini
    reply = await chat_with_gemini(history, req.message)

    # Simpan ke DB
    db.add(Message(session_id=session_id, role="user", content=req.message))
    db.add(Message(session_id=session_id, role="assistant", content=reply))
    await db.commit()

    return ChatResponse(session_id=session_id, reply=reply)
```

**File: `backend/app/main.py`**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import chatbot, rekomendasi, generate, deteksi

app = FastAPI(title="PlantPal API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()

app.include_router(chatbot.router)
app.include_router(rekomendasi.router)
app.include_router(generate.router)
app.include_router(deteksi.router)

@app.get("/")
async def root():
    return {"message": "PlantPal API v2.0 is running 🌱"}
```

### 1.2 Setup Frontend (React + Vite)

**Cara init project:**
```bash
cd plantpal-v2/frontend
npm create vite@latest . -- --template react
npm install
npm install react-router-dom axios react-markdown
```

**File: `frontend/src/index.css`** — Design System lengkap
```css
/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;600;700&display=swap');

:root {
  /* Color Palette — Dark Nature Theme */
  --color-bg-primary: #0a0f0a;
  --color-bg-secondary: #111811;
  --color-bg-card: #151e15;
  --color-bg-glass: rgba(255,255,255,0.04);

  --color-green-primary: #4ade80;
  --color-green-secondary: #22c55e;
  --color-green-dark: #16a34a;
  --color-green-muted: #15803d;
  --color-green-glow: rgba(74, 222, 128, 0.15);

  --color-text-primary: #f0fdf4;
  --color-text-secondary: #86efac;
  --color-text-muted: #6b7280;

  --color-border: rgba(74, 222, 128, 0.15);
  --color-border-hover: rgba(74, 222, 128, 0.4);

  /* Typography */
  --font-body: 'Inter', sans-serif;
  --font-heading: 'Outfit', sans-serif;

  /* Spacing */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 28px;

  /* Shadows */
  --shadow-green: 0 0 20px rgba(74, 222, 128, 0.2);
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.4);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  min-height: 100vh;
  overflow-x: hidden;
}

/* Scrollbar custom */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--color-bg-secondary); }
::-webkit-scrollbar-thumb { background: var(--color-green-muted); border-radius: 3px; }

/* Utility */
.glass-card {
  background: var(--color-bg-glass);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(12px);
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-green-secondary), var(--color-green-dark));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 12px 24px;
  font-family: var(--font-body);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-green);
}

.btn-secondary {
  background: transparent;
  color: var(--color-green-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 24px;
  font-family: var(--font-body);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: var(--color-border-hover);
  background: var(--color-green-glow);
}

/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-green {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes typing-dot {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.animate-fade-up { animation: fadeInUp 0.4s ease forwards; }
```

**File: `frontend/src/App.jsx`**
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import HomePage from './pages/HomePage'
import ChatbotPage from './pages/ChatbotPage'
import RekomendasiPage from './pages/RekomendasiPage'
import GeneratePage from './pages/GeneratePage'
import DeteksiPage from './pages/DeteksiPage'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chat" element={<ChatbotPage />} />
            <Route path="/rekomendasi" element={<RekomendasiPage />} />
            <Route path="/generate" element={<GeneratePage />} />
            <Route path="/deteksi" element={<DeteksiPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
```

**File: `frontend/src/services/api.js`**
```js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000, // 60 detik (image gen bisa lama)
})

export const chatAPI = {
  sendMessage: (sessionId, message) =>
    api.post('/api/chat', { session_id: sessionId, message }),
}

export const rekomendasiAPI = {
  getRekomendasi: (lat, lon, kriteria) =>
    api.post('/api/rekomendasi', { lat, lon, kriteria }),
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
```

**File: `frontend/src/components/Navbar.jsx`**
```jsx
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: '🌿 PlantPal', isLogo: true },
]

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">🌱</span>
        <span className="brand-text">PlantPal</span>
        <span className="brand-badge">v2</span>
      </div>
      <div className="navbar-actions">
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>AI Online</span>
        </div>
      </div>
    </nav>
  )
}
```

**File: `frontend/src/components/Sidebar.jsx`**
```jsx
import { NavLink } from 'react-router-dom'

const menuItems = [
  { path: '/', icon: '🏠', label: 'Beranda' },
  { path: '/chat', icon: '💬', label: 'Chatbot' },
  { path: '/rekomendasi', icon: '📍', label: 'Rekomendasi' },
  { path: '/generate', icon: '🎨', label: 'Generate' },
  { path: '/deteksi', icon: '🔍', label: 'Deteksi' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🌿</div>
        <div className="logo-text">PlantPal</div>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            end={item.path === '/'}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p>PlantPal © 2024</p>
        <p>Powered by Gemini</p>
      </div>
    </aside>
  )
}
```

**File: `frontend/src/components/TypingIndicator.jsx`**
```jsx
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
```

**File: `frontend/src/components/ChatBubble.jsx`**
```jsx
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
```

**File: `frontend/src/pages/ChatbotPage.jsx`**
```jsx
import { useState, useRef, useEffect } from 'react'
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
      <div className="chat-header">
        <h1>💬 Chatbot PlantPal</h1>
        <p>Tanya apa saja tentang tanaman, aku siap membantu!</p>
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
```

### 1.3 Cara Menjalankan (Development)

```bash
# Terminal 1 — Backend
cd plantpal-v2/backend
pip install -r requirements.txt
cp .env.example .env   # isi GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd plantpal-v2/frontend
npm install
npm run dev            # jalan di http://localhost:5173
```

---

## Phase 2 — Rekomendasi + Lokasi (Map + Cuaca + Tanah)

**Durasi:** 2-3 minggu  
**Output:** Fitur rekomendasi dengan data lingkungan nyata dari koordinat GPS

### 2.1 Services Backend

**File: `backend/app/services/open_meteo.py`**
```python
import httpx

async def get_weather(lat: float, lon: float) -> dict:
    """Ambil data cuaca dari Open-Meteo (gratis, tanpa API key)"""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "timezone": "Asia/Makassar",
        "forecast_days": 7
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
    
    current = data.get("current", {})
    return {
        "temperature": current.get("temperature_2m"),
        "humidity": current.get("relative_humidity_2m"),
        "precipitation": current.get("precipitation"),
        "wind_speed": current.get("wind_speed_10m"),
    }
```

**File: `backend/app/services/soilgrids.py`**
```python
import httpx

async def get_soil_data(lat: float, lon: float) -> dict:
    """Ambil data tanah dari SoilGrids ISRIC (gratis)"""
    url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    params = {
        "lon": lon,
        "lat": lat,
        "property": ["phh2o", "clay", "sand", "soc"],  # pH, liat, pasir, karbon organik
        "depth": "0-5cm",
        "value": "mean"
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url, params=params)
        if response.status_code != 200:
            return {"error": "SoilGrids data not available"}
        data = response.json()
    
    properties = {}
    for layer in data.get("properties", {}).get("layers", []):
        name = layer.get("name")
        depths = layer.get("depths", [])
        if depths:
            mean_val = depths[0].get("values", {}).get("mean")
            if mean_val is not None:
                # SoilGrids returns scaled values
                if name == "phh2o":
                    properties["ph"] = mean_val / 10  # scale: 10x
                elif name == "clay":
                    properties["clay_percent"] = mean_val / 10
                elif name == "sand":
                    properties["sand_percent"] = mean_val / 10
                elif name == "soc":
                    properties["organic_carbon"] = mean_val / 10
    return properties
```

**File: `backend/app/services/pollinations.py`**
```python
import httpx
import urllib.parse

async def generate_plant_image(plant_name: str) -> str:
    """
    Generate gambar tanaman menggunakan Pollinations.ai
    Benar-benar gratis, tidak perlu API key
    Return: URL gambar yang bisa langsung ditampilkan di browser
    """
    prompt = f"detailed botanical illustration of {plant_name}, scientific accuracy, vivid colors, white background, high quality"
    encoded = urllib.parse.quote(prompt)
    # Pollinations.ai image URL langsung bisa dipakai sebagai src
    image_url = f"https://image.pollinations.ai/prompt/{encoded}?width=512&height=512&nologo=true"
    return image_url
```

**File: `backend/app/routers/rekomendasi.py`**
```python
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.gemini import chat_with_gemini
from app.services.open_meteo import get_weather
from app.services.soilgrids import get_soil_data

router = APIRouter(prefix="/api/rekomendasi", tags=["rekomendasi"])

class RekomendasiRequest(BaseModel):
    lat: float
    lon: float
    kriteria: str     # contoh: "tanaman hias tahan kering"
    lokasi_nama: str  # nama tempat dari reverse geocoding frontend

class PlantRecommendation(BaseModel):
    nama: str
    nama_ilmiah: str
    deskripsi: str
    cara_perawatan: str
    cocok_untuk: str

class RekomendasiResponse(BaseModel):
    lokasi: str
    cuaca: dict
    tanah: dict
    tanaman: list[PlantRecommendation]
    ringkasan_lingkungan: str

@router.post("", response_model=RekomendasiResponse)
async def get_rekomendasi(req: RekomendasiRequest):
    # Ambil data lingkungan secara paralel
    weather, soil = await asyncio.gather(
        get_weather(req.lat, req.lon),
        get_soil_data(req.lat, req.lon)
    )

    # Buat prompt kaya konteks untuk Gemini
    env_context = f"""
Lokasi: {req.lokasi_nama} (koordinat: {req.lat}, {req.lon})
Kondisi Cuaca Saat Ini:
- Suhu: {weather.get('temperature', 'tidak diketahui')}°C
- Kelembaban: {weather.get('humidity', 'tidak diketahui')}%
- Curah Hujan: {weather.get('precipitation', 'tidak diketahui')} mm
- Kecepatan Angin: {weather.get('wind_speed', 'tidak diketahui')} km/h

Data Tanah:
- pH Tanah: {soil.get('ph', 'tidak diketahui')}
- Kadar Liat: {soil.get('clay_percent', 'tidak diketahui')}%
- Kadar Pasir: {soil.get('sand_percent', 'tidak diketahui')}%
- Karbon Organik: {soil.get('organic_carbon', 'tidak diketahui')} g/kg

Permintaan Pengguna: {req.kriteria}
"""

    prompt = f"""
{env_context}

Berikan rekomendasi 5 tanaman yang paling cocok untuk kondisi di atas.
Untuk setiap tanaman, berikan respons dalam format JSON array berikut:
[
  {{
    "nama": "Nama Umum Tanaman",
    "nama_ilmiah": "Nama Ilmiah",
    "deskripsi": "Deskripsi singkat 2-3 kalimat mengapa cocok dengan kondisi ini",
    "cara_perawatan": "Tips perawatan utama",
    "cocok_untuk": "Cocok untuk apa (hias/konsumsi/dll)"
  }}
]

Sertakan juga ringkasan kondisi lingkungan dalam 1 paragraf.
Respons harus valid JSON.
"""
    # Parse response dari Gemini (pastikan JSON valid)
    import json, re
    raw = await chat_with_gemini([], prompt)
    # Ekstrak JSON dari respons
    json_match = re.search(r'\[.*\]', raw, re.DOTALL)
    plants = json.loads(json_match.group()) if json_match else []

    return RekomendasiResponse(
        lokasi=req.lokasi_nama,
        cuaca=weather,
        tanah=soil,
        tanaman=plants,
        ringkasan_lingkungan=raw[:500]
    )
```

### 2.2 MapPicker Component (Frontend)

Install Leaflet:
```bash
npm install leaflet react-leaflet
```

**File: `frontend/src/components/MapPicker.jsx`**
```jsx
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import L from 'leaflet'

// Fix ikon Leaflet di Vite
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
    <div className="map-picker-wrapper">
      <p className="map-hint">📍 Klik pada peta untuk memilih lokasi</p>
      <MapContainer
        center={[-8.4095, 115.1889]} // Default: Bali
        zoom={10}
        style={{ height: '350px', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onSelect={onLocationSelect} />
      </MapContainer>
    </div>
  )
}
```

**File: `frontend/src/components/PlantCard.jsx`**
```jsx
import { useState } from 'react'
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
          <p>{plant.cara_perawatan}</p>
        </div>
        <button
          id={`generate-btn-${plant.nama.replace(/\s/g, '-')}`}
          onClick={handleGenerate}
          disabled={isGenerating}
          className="btn-secondary plant-generate-btn"
        >
          {isGenerating ? '⏳ Generating...' : '🎨 Generate Gambar'}
        </button>
      </div>
    </div>
  )
}
```

**File: `frontend/src/pages/RekomendasiPage.jsx`**
```jsx
import { useState } from 'react'
import { rekomendasiAPI } from '../services/api'
import MapPicker from '../components/MapPicker'
import PlantCard from '../components/PlantCard'

export default function RekomendasiPage() {
  const [location, setLocation] = useState(null) // {lat, lon}
  const [locationName, setLocationName] = useState('')
  const [kriteria, setKriteria] = useState('')
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Reverse geocoding menggunakan Nominatim (gratis)
  const handleMapSelect = async (lat, lon) => {
    setLocation({ lat, lon })
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      )
      const data = await resp.json()
      setLocationName(data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`)
    } catch {
      setLocationName(`${lat.toFixed(4)}, ${lon.toFixed(4)}`)
    }
  }

  const handleSubmit = async () => {
    if (!location || !kriteria.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await rekomendasiAPI.getRekomendasi(
        location.lat, location.lon, kriteria, locationName
      )
      setResult(data)
    } catch (err) {
      setError('Gagal mendapatkan rekomendasi. Coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📍 Rekomendasi Tanaman</h1>
        <p>Pilih lokasi di peta dan masukkan preferensimu untuk rekomendasi tanaman yang tepat</p>
      </div>
      <MapPicker onLocationSelect={handleMapSelect} />
      {locationName && (
        <div className="location-selected">
          <span>📌 Lokasi dipilih: <strong>{locationName}</strong></span>
        </div>
      )}
      <div className="input-group">
        <label>Kriteria / Jenis Tanaman</label>
        <input
          id="kriteria-input"
          type="text"
          value={kriteria}
          onChange={e => setKriteria(e.target.value)}
          placeholder="Contoh: tanaman hias yang mudah dirawat, atau sayuran untuk urban farming"
          className="text-input"
        />
      </div>
      <button
        id="get-rekomendasi-btn"
        onClick={handleSubmit}
        disabled={!location || !kriteria || isLoading}
        className="btn-primary"
      >
        {isLoading ? '⏳ Menganalisis lingkungan...' : '🌱 Dapatkan Rekomendasi'}
      </button>

      {result && (
        <div className="rekomendasi-result">
          <div className="env-summary glass-card">
            <h3>🌍 Kondisi Lingkungan</h3>
            <div className="env-grid">
              <div>🌡️ Suhu: {result.cuaca.temperature}°C</div>
              <div>💧 Kelembaban: {result.cuaca.humidity}%</div>
              <div>🌧️ Curah Hujan: {result.cuaca.precipitation} mm</div>
              <div>🧪 pH Tanah: {result.tanah.ph}</div>
            </div>
          </div>
          <h3>🌿 Tanaman yang Direkomendasikan</h3>
          <div className="plant-cards-grid">
            {result.tanaman.map((plant, i) => (
              <PlantCard key={i} plant={plant} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Phase 3 — Image Generation

**Durasi:** 1 minggu  
**Output:** Generate gambar tanaman gratis menggunakan Pollinations.ai

### 3.1 Backend Router

**File: `backend/app/routers/generate.py`**
```python
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.pollinations import generate_plant_image
from app.services.gemini import chat_with_gemini

router = APIRouter(prefix="/api/generate-image", tags=["generate"])

class GenerateRequest(BaseModel):
    plant_name: str
    description: str | None = None

class GenerateResponse(BaseModel):
    image_url: str
    prompt_used: str

@router.post("", response_model=GenerateResponse)
async def generate_image(req: GenerateRequest):
    # Buat prompt bahasa Inggris yang detail untuk kualitas gambar lebih baik
    translate_prompt = f"Translate this to English for botanical image generation: '{req.plant_name}'. Return only the translation, no other text."
    english_name = await chat_with_gemini([], translate_prompt)
    english_name = english_name.strip().split('\n')[0]  # ambil baris pertama saja

    image_url = await generate_plant_image(english_name)
    return GenerateResponse(image_url=image_url, prompt_used=english_name)
```

### 3.2 Frontend Generate Page

**File: `frontend/src/pages/GeneratePage.jsx`**
```jsx
import { useState } from 'react'
import { generateAPI } from '../services/api'

export default function GeneratePage() {
  const [plantName, setPlantName] = useState('')
  const [imageUrl, setImageUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!plantName.trim()) return
    setIsLoading(true)
    setError(null)
    setImageUrl(null)
    try {
      const { data } = await generateAPI.generateImage(plantName)
      setImageUrl(data.image_url)
    } catch (err) {
      setError('Gagal generate gambar. Coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🎨 Generate Gambar Tanaman</h1>
        <p>Masukkan nama tanaman dan dapatkan visualisasi ilustrasi botanisnya</p>
      </div>
      <div className="generate-input-area">
        <input
          id="plant-name-input"
          type="text"
          value={plantName}
          onChange={e => setPlantName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          placeholder="Contoh: Bunga Anggrek Bulan, Pohon Mangga, Bayam Merah..."
          className="text-input"
        />
        <button
          id="generate-image-btn"
          onClick={handleGenerate}
          disabled={isLoading || !plantName.trim()}
          className="btn-primary"
        >
          {isLoading ? '⏳ Generating...' : '✨ Generate'}
        </button>
      </div>

      {isLoading && (
        <div className="generate-loading glass-card">
          <div className="loading-animation">🌱</div>
          <p>Sedang membuat ilustrasi botanis...</p>
          <p className="loading-hint">Proses ini bisa memakan 10-20 detik</p>
        </div>
      )}

      {imageUrl && !isLoading && (
        <div className="generate-result glass-card animate-fade-up">
          <img
            id="generated-plant-image"
            src={imageUrl}
            alt={plantName}
            className="generated-image"
            onError={() => setError('Gagal memuat gambar')}
          />
          <div className="generate-actions">
            <p className="generated-label">🌿 {plantName}</p>
            <a
              href={imageUrl}
              download={`plantpal-${plantName}.jpg`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              ⬇️ Download Gambar
            </a>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  )
}
```

---

## Phase 4 — Deteksi Tanaman (Gemini Vision)

**Durasi:** 1 minggu  
**Output:** Upload foto → identifikasi tanaman + deteksi penyakit via Gemini Vision

### 4.1 Backend Router

**File: `backend/app/routers/deteksi.py`**
```python
from fastapi import APIRouter, File, UploadFile
from pydantic import BaseModel
from app.services.gemini import analyze_image_with_gemini

router = APIRouter(prefix="/api/deteksi", tags=["deteksi"])

DETECTION_PROMPT = """Kamu adalah ahli botani. Analisis gambar tanaman ini dan berikan informasi dalam format JSON:

{
  "nama_umum": "Nama tanaman dalam bahasa Indonesia",
  "nama_ilmiah": "Nama ilmiah (Latin)",
  "ciri_ciri": "Deskripsi ciri fisik yang terlihat di gambar",
  "habitat": "Habitat alami tanaman ini",
  "cara_perawatan": "Tips perawatan utama (penyiraman, pupuk, cahaya)",
  "kondisi_kesehatan": "Sehat / Ada Penyakit / Ada Hama",
  "diagnosa_masalah": "Jika ada masalah, jelaskan penyakitnya atau hama yang terdeteksi",
  "solusi": "Saran penanganan jika ada masalah",
  "tingkat_kepercayaan": "Tinggi / Sedang / Rendah"
}

Jika gambar bukan tanaman, kembalikan:
{"error": "Gambar bukan tanaman atau tidak dapat diidentifikasi"}"""

class DeteksiResponse(BaseModel):
    nama_umum: str | None = None
    nama_ilmiah: str | None = None
    ciri_ciri: str | None = None
    habitat: str | None = None
    cara_perawatan: str | None = None
    kondisi_kesehatan: str | None = None
    diagnosa_masalah: str | None = None
    solusi: str | None = None
    tingkat_kepercayaan: str | None = None
    error: str | None = None

@router.post("", response_model=DeteksiResponse)
async def deteksi_tanaman(file: UploadFile = File(...)):
    contents = await file.read()
    raw = await analyze_image_with_gemini(contents, DETECTION_PROMPT)

    import json, re
    json_match = re.search(r'\{.*\}', raw, re.DOTALL)
    if json_match:
        result = json.loads(json_match.group())
        return DeteksiResponse(**result)
    return DeteksiResponse(error="Gagal menganalisis gambar")
```

### 4.2 Frontend Upload Page

**File: `frontend/src/components/ImageUpload.jsx`**
```jsx
import { useState, useRef } from 'react'

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
          <p>Drag & drop atau klik untuk upload foto tanaman</p>
          <p className="upload-hint">Mendukung JPG, PNG (maks 10MB)</p>
        </div>
      )}
    </div>
  )
}
```

**File: `frontend/src/pages/DeteksiPage.jsx`**
```jsx
import { useState } from 'react'
import { deteksiAPI } from '../services/api'
import ImageUpload from '../components/ImageUpload'

export default function DeteksiPage() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAnalyze = async () => {
    if (!file) return
    setIsLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const { data } = await deteksiAPI.detectPlant(formData)
      if (data.error) setError(data.error)
      else setResult(data)
    } catch (err) {
      setError('Gagal menganalisis gambar. Coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const healthColor = {
    'Sehat': 'var(--color-green-primary)',
    'Ada Penyakit': '#f87171',
    'Ada Hama': '#fbbf24',
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🔍 Deteksi Tanaman</h1>
        <p>Upload foto tanaman untuk identifikasi spesies dan diagnosis kesehatan</p>
      </div>
      <ImageUpload onImageSelect={setFile} />
      {file && (
        <button
          id="analyze-plant-btn"
          onClick={handleAnalyze}
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? '⏳ Menganalisis...' : '🔬 Analisis Tanaman'}
        </button>
      )}

      {result && (
        <div className="deteksi-result glass-card animate-fade-up">
          <div className="result-header">
            <h2>{result.nama_umum}</h2>
            <p className="result-scientific">{result.nama_ilmiah}</p>
            {result.kondisi_kesehatan && (
              <span
                className="health-badge"
                style={{ color: healthColor[result.kondisi_kesehatan] }}
              >
                ● {result.kondisi_kesehatan}
              </span>
            )}
          </div>
          <div className="result-grid">
            <div className="result-item">
              <strong>📋 Ciri-ciri</strong>
              <p>{result.ciri_ciri}</p>
            </div>
            <div className="result-item">
              <strong>🌍 Habitat</strong>
              <p>{result.habitat}</p>
            </div>
            <div className="result-item">
              <strong>💧 Perawatan</strong>
              <p>{result.cara_perawatan}</p>
            </div>
            {result.diagnosa_masalah && (
              <div className="result-item warning">
                <strong>⚠️ Diagnosa</strong>
                <p>{result.diagnosa_masalah}</p>
              </div>
            )}
            {result.solusi && (
              <div className="result-item">
                <strong>💊 Solusi</strong>
                <p>{result.solusi}</p>
              </div>
            )}
          </div>
          <div className="result-confidence">
            Tingkat Kepercayaan: <strong>{result.tingkat_kepercayaan}</strong>
          </div>
        </div>
      )}
      {error && <div className="error-message">❌ {error}</div>}
    </div>
  )
}
```

---

## Phase 5 — Polish & Deploy (Docker)

**Durasi:** 1 minggu  
**Output:** Aplikasi siap production di VPS dengan Docker Compose

### 5.1 Docker Setup

**File: `backend/Dockerfile`**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**File: `frontend/Dockerfile`**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**File: `frontend/nginx.conf`**
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API ke backend
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**File: `docker-compose.yml`**
```yaml
version: '3.9'

services:
  backend:
    build: ./backend
    container_name: plantpal-backend
    restart: unless-stopped
    env_file: ./backend/.env
    volumes:
      - ./backend/plantpal.db:/app/plantpal.db
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    container_name: plantpal-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

  # Opsional: Untuk HTTPS gunakan Traefik or Nginx + Certbot
```

### 5.2 Cara Deploy ke VPS

```bash
# Di VPS (Ubuntu)
git clone <repo-url> plantpal-v2
cd plantpal-v2

# Buat file .env
cp backend/.env.example backend/.env
nano backend/.env   # isi GEMINI_API_KEY

# Build dan jalankan
docker compose up -d --build

# Cek logs
docker compose logs -f
```

### 5.3 .gitignore penting

```
backend/.env
backend/plantpal.db
backend/__pycache__/
frontend/node_modules/
frontend/dist/
```

---

## Prioritas Urutan Pengerjaan

```
PHASE 1 (WAJIB PERTAMA)
✅ Setup FastAPI + Gemini
✅ Endpoint POST /api/chat
✅ React + Vite setup
✅ Sidebar + Navbar
✅ ChatbotPage dengan history

PHASE 2 (SETELAH PHASE 1 SELESAI)
✅ Service Open-Meteo
✅ Service SoilGrids
✅ Endpoint POST /api/rekomendasi
✅ MapPicker dengan Leaflet
✅ PlantCard dengan generate button inline

PHASE 3 (BISA DIKERJAKAN BERSAMAAN DENGAN PHASE 2)
✅ Service Pollinations.ai
✅ Endpoint POST /api/generate-image
✅ GeneratePage

PHASE 4 (SETELAH PHASE 1 SELESAI)
✅ Endpoint POST /api/deteksi (multipart)
✅ ImageUpload component
✅ DeteksiPage

PHASE 5 (TERAKHIR)
✅ Dockerfile backend
✅ Dockerfile frontend + nginx
✅ docker-compose.yml
✅ SSL dengan Let's Encrypt
```

---

## API Keys yang Dibutuhkan

| API | Cara Dapat | Free Tier |
|---|---|---|
| **Google Gemini** | https://aistudio.google.com/ → Get API key | 15 RPM, 1M token/hari (cukup untuk dev) |
| **Open-Meteo** | Tidak perlu daftar | Tidak terbatas |
| **SoilGrids** | Tidak perlu daftar | Tidak terbatas |
| **Pollinations.ai** | Tidak perlu daftar | Tidak terbatas |
| **Leaflet + OSM** | Tidak perlu daftar | Tidak terbatas |

**Satu-satunya API key yang perlu dibuat: Google Gemini Flash** (gratis di https://aistudio.google.com)

---

## Checklist Akhir Sebelum Launch

- [ ] Semua API key ada di `.env` dan **tidak** di source code
- [ ] `.env` ada di `.gitignore`
- [ ] Error handling di semua endpoint (try/catch)
- [ ] Loading state di semua action button
- [ ] Responsive di mobile (min-width 320px)
- [ ] Test chatbot dengan 10 pertanyaan tanaman berbeda
- [ ] Test rekomendasi dengan lokasi Bali, Jakarta, Surabaya
- [ ] Test generate gambar dengan 5 nama tanaman berbeda
- [ ] Test deteksi dengan foto daun sehat dan daun sakit
- [ ] Docker compose berjalan tanpa error
- [ ] Domain + SSL terpasang
