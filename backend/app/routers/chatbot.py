from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.chat import ChatSession, Message, User
from app.services.gemini import chat_with_gemini
from app.services.rate_limit import get_current_user_with_rate_limit

router = APIRouter(prefix="/api/chat", tags=["chatbot"])

class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str

class ChatResponse(BaseModel):
    session_id: str
    reply: str

@router.get("/sessions")
async def list_sessions(user: User = Depends(get_current_user_with_rate_limit), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user.id)
        .order_by(ChatSession.created_at.desc())
    )
    sessions = result.scalars().all()
    return [{"id": s.id, "created_at": s.created_at.isoformat()} for s in sessions]

@router.post("", response_model=ChatResponse)
async def chat(
    req: ChatRequest, 
    db: AsyncSession = Depends(get_db), 
    user: User = Depends(get_current_user_with_rate_limit)
):
    session_id = req.session_id
    if not session_id:
        session = ChatSession(user_id=user.id)
        db.add(session)
        await db.commit()
        session_id = session.id
    else:
        result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
        session = result.scalars().first()
        if session and session.user_id is None:
            session.user_id = user.id
            await db.commit()

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
