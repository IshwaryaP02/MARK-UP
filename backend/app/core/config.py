from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # ── Database ──
    SUPABASE_DB_URL: str = "sqlite+aiosqlite:///./dev.db"

    # ── JWT / Auth ──
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DEV_MODE: bool = True
    
    # ── Admin Credentials ──
    ADMIN1_PASSWORD: str = "ADISHWARYAP"
    ADMIN2_PASSWORD: str = "ADRICHERD"

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
