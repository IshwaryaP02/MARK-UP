import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.core.database import _engine_kwargs
import re

async def run_migration():
    print(f"Connecting to {settings.SUPABASE_DB_URL}")
    engine = create_async_engine(settings.SUPABASE_DB_URL, **_engine_kwargs)
    
    with open("sql/migration_od_customization.sql", "r") as f:
        sql = f.read()

    sql = re.sub(r'--.*', '', sql)
    statements = [s.strip() for s in sql.split(';') if s.strip()]

    async with engine.begin() as conn:
        from sqlalchemy import text
        print("Executing migration...")
        for stmt in statements:
            try:
                await conn.execute(text(stmt))
                print(f"Executed: {stmt[:30]}...")
            except Exception as e:
                print(f"Failed to execute: {stmt[:30]}... Error: {e}")
        print("Migration executed successfully.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())
