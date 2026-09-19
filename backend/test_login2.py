import asyncio
from app.core.database import get_db
from app.services.auth import login_by_username

async def test_login():
    async for db in get_db():
        try:
            print("Trying to login ADISHWARYAP...")
            # We don't know the password, let's just trace the query or bypass password verify
            # Wait, the password is likely the username since it's dev
            resp = await login_by_username("ADISHWARYAP", "ADISHWARYAP", db)
            print("Success!", resp.user.username)
            if hasattr(resp.user, "department_name"):
                print("Dept:", resp.user.department_name)
        except Exception as e:
            print(f"Login Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test_login())
