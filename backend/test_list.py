import asyncio
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import User

async def list_users():
    async for db in get_db():
        result = await db.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"User: {u.username}, Role: {u.role}, Active: {u.is_active}")

if __name__ == "__main__":
    asyncio.run(list_users())
