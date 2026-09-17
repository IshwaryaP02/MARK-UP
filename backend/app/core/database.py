import ssl

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

if not settings.SUPABASE_DB_URL.startswith("postgresql+asyncpg://"):
    raise RuntimeError("SUPABASE_DB_URL must use the PostgreSQL asyncpg Supabase connection URL")

# Create an SSL context that accepts Supabase's self-signed certificate chain
_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE

_engine_kwargs = {
    "pool_pre_ping": True,
    "pool_size": 5,
    "max_overflow": 5,
    "pool_recycle": 300,
    "connect_args": {
        "ssl": _ssl_ctx,
        "timeout": 30,
        "command_timeout": 30,
        "statement_cache_size": 0,   # required for pgbouncer transaction-mode pooler
    },
}

engine = create_async_engine(
    settings.SUPABASE_DB_URL,
    echo=False,
    **_engine_kwargs,
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
