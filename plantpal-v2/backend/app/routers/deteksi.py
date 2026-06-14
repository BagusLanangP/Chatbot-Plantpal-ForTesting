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
