from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import chatbot, rekomendasi, generate, deteksi

app = FastAPI(title="PlantPal API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
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
