import asyncio
from app.core.database import get_db
from app.services.auth import login_by_username

async def test_login():
    async for db in get_db():
        try:
            print("Trying to login admin1...")
            resp = await login_by_username("admin", "admin", db)
            print("Success!", resp.user.username)
        except Exception as e:
            print(f"Login Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test_login())
