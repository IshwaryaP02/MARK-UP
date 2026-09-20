import ssl

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

if not settings.SUPABASE_DB_URL.startswith("postgresql+asyncpg://"):
    raise RuntimeError("SUPABASE_DB_URL must use the PostgreSQL asyncpg Supabase connection URL")

# SSL context — Supabase pooler requires SSL but no hostname verification
_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE

_engine_kwargs = {
    # pool_pre_ping REMOVED — it fires a SELECT 1 round-trip on every checkout,
    # adding ~200-400 ms per request when connecting to overseas Supabase.
    # The transaction-mode pgbouncer pooler handles stale connections itself.
    "pool_size": 10,        # keep 10 warm connections ready
    "max_overflow": 10,     # allow burst to 20 total
    "pool_recycle": 60,     # recycle before pgbouncer's server_idle_timeout (default 60 s)
    "pool_timeout": 10,     # fail fast instead of hanging
    "connect_args": {
        "ssl": _ssl_ctx,
        "timeout": 10,              # connection handshake timeout
        "command_timeout": 30,      # per-statement timeout
        "statement_cache_size": 0,  # required for pgbouncer transaction-mode pooler
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
