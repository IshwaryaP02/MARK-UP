from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

_is_sqlite = "sqlite" in settings.SUPABASE_DB_URL

_engine_kwargs = {}
if not _is_sqlite:
    _engine_kwargs = {"pool_pre_ping": True, "pool_size": 20, "max_overflow": 30}

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
