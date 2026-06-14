from sqlalchemy import Column, String, Text, DateTime, ForeignKey
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
