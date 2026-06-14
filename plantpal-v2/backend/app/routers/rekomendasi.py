from fastapi import APIRouter
from pydantic import BaseModel
import asyncio
from app.services.gemini import chat_with_gemini
from app.services.open_meteo import get_weather
from app.services.soilgrids import get_soil_data

router = APIRouter(prefix="/api/rekomendasi", tags=["rekomendasi"])

class RekomendasiRequest(BaseModel):
    lat: float
    lon: float
    kriteria: str
    lokasi_nama: str

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
    weather, soil = await asyncio.gather(
        get_weather(req.lat, req.lon),
        get_soil_data(req.lat, req.lon)
    )

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
    import json, re
    raw = await chat_with_gemini([], prompt)
    json_match = re.search(r'\[.*\]', raw, re.DOTALL)
    plants = json.loads(json_match.group()) if json_match else []

    return RekomendasiResponse(
        lokasi=req.lokasi_nama,
        cuaca=weather,
        tanah=soil,
        tanaman=plants,
        ringkasan_lingkungan=raw[:500]
    )

