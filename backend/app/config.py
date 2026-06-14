from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str
    database_url: str = "sqlite+aiosqlite:///./plantpal.db"
    cors_origins: str = "http://localhost:5173"
    jwt_secret: str = "supersecret_plantpal_token_key_12345"

    class Config:
        env_file = ".env"


settings = Settings()
