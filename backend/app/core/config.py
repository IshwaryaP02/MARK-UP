from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # ── Database ──
    SUPABASE_DB_URL: str

    # ── JWT / Auth ──
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    DEV_MODE: bool = True
    
    # ── Initial administrator accounts ──
    ADMIN1_USERNAME: str
    ADMIN1_PASSWORD: str
    ADMIN1_NAME: str
    ADMIN1_EMAIL: str
    ADMIN2_USERNAME: str
    ADMIN2_PASSWORD: str
    ADMIN2_NAME: str
    ADMIN2_EMAIL: str

    # ── Supabase (optional — for storage etc.) ──
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_STORAGE_URL: str = ""

    # ── Email (Resend) ──
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "attendance@college.edu"

    # ── SMS (MSG91) ──
    SMS_API_KEY: str = ""
    SMS_SENDER_ID: str = "COLLEGE"

    # ── CORS ──
    FRONTEND_URL: str = "http://localhost:3000"

    # ── Redis ──
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
