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
    model = get_model()
    # Format history matches google's expected structure
    formatted_history = []
    for h in history:
        formatted_history.append({
            "role": h["role"],
            "parts": h["parts"]
        })
    chat = model.start_chat(history=formatted_history)
    response = await chat.send_message_async(user_message)
    return response.text

async def analyze_image_with_gemini(image_bytes: bytes, prompt: str) -> str:
    import PIL.Image
    import io
    model = get_model(vision=True)
    image = PIL.Image.open(io.BytesIO(image_bytes))
    response = await model.generate_content_async([prompt, image])
    return response.text
