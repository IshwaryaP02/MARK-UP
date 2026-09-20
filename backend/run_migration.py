import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv
import os

load_dotenv()

async def run_migration():
    # Use direct connection URL (port 5432) to bypass Supabase pooler issues for migrations
    db_url_raw = os.getenv("SUPABASE_STORAGE_URL")
    if not db_url_raw:
        print("Error: SUPABASE_STORAGE_URL not found in .env")
        return

    # Ensure it uses asyncpg driver
    if db_url_raw.startswith("postgresql://"):
        db_url = db_url_raw.replace("postgresql://", "postgresql+asyncpg://", 1)
    else:
        db_url = db_url_raw

    print(f"Connecting to {db_url.split('@')[1]} (direct)")
    engine = create_async_engine(db_url)
    
    import sys
    sql_file = sys.argv[1] if len(sys.argv) > 1 else "sql/migration_circulars_bonafide_dayorders.sql"
    with open(sql_file, "r") as f:
        sql = f.read()

    import re
    # Remove single line comments
    sql = re.sub(r'--.*', '', sql)
    statements = [s.strip() for s in sql.split(';') if s.strip()]

    async with engine.begin() as conn:
        from sqlalchemy import text
        print("Executing migration...")
        for stmt in statements:
            await conn.execute(text(stmt))
        print("Migration executed successfully.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())
