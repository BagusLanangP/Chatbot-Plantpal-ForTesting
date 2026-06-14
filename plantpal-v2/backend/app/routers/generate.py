from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.pollinations import generate_plant_image
from app.services.gemini import chat_with_gemini
from app.models.chat import User
from app.services.rate_limit import get_current_user_with_rate_limit

router = APIRouter(prefix="/api/generate-image", tags=["generate"])

class GenerateRequest(BaseModel):
    plant_name: str
    description: str | None = None

class GenerateResponse(BaseModel):
    image_url: str
    prompt_used: str

@router.post("", response_model=GenerateResponse)
async def generate_image(
    req: GenerateRequest,
    user: User = Depends(get_current_user_with_rate_limit)
):
    translate_prompt = f"Translate this to English for botanical image generation: '{req.plant_name}'. Return only the translation, no other text."
    english_name = await chat_with_gemini([], translate_prompt)
    english_name = english_name.strip().split('\n')[0]

    image_url = await generate_plant_image(english_name)
    return GenerateResponse(image_url=image_url, prompt_used=english_name)
