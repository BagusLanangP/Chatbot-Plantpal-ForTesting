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
    if not req.session_id:
        session = ChatSession()
        db.add(session)
        await db.commit()
        session_id = session.id
    else:
        session_id = req.session_id

    # Retrieve history
    result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()

    # Format history
    history = []
    for msg in messages:
        role = "user" if msg.role == "user" else "model"
        history.append({"role": role, "parts": [msg.content]})

    # Ask Gemini
    reply = await chat_with_gemini(history, req.message)

    # Save messages
    db.add(Message(session_id=session_id, role="user", content=req.message))
    db.add(Message(session_id=session_id, role="assistant", content=reply))
    await db.commit()

    return ChatResponse(session_id=session_id, reply=reply)
