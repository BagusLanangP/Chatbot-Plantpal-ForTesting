from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.database import get_db
from app.models.chat import User
from app.routers.auth import get_current_user

DAILY_LIMIT = 15 # Maksimal 15 request per hari per user

async def get_current_user_with_rate_limit(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> User:
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    
    # Reset count if it's a new day
    if user.last_request_date != today_str:
        user.api_requests_today = 0
        user.last_request_date = today_str
    
    if user.api_requests_today >= DAILY_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Batas penggunaan harian Anda ({DAILY_LIMIT} permintaan) telah habis. Silakan coba lagi besok!"
        )
    
    # Increment requests count
    user.api_requests_today += 1
    db.add(user)
    await db.commit()
    
    return user
