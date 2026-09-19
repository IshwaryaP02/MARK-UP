import asyncio
import sys
import uuid
import os
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import User
from app.services.auth import login_by_username

async def test_db():
    async for db in get_db():
        try:
            print("Connecting to DB...")
            # Just fetch any user
            result = await db.execute(select(User).limit(1))
            user = result.scalar_one_or_none()
            if user:
                print(f"Found user: {user.username}, ID: {user.id} ({type(user.id)})")
                
                # Test the query that fails in auth.py:
                try:
                    q = select(User).where(User.id == uuid.UUID(str(user.id)))
                    res = await db.execute(q)
                    print("Query by UUID object succeeded!")
                except Exception as e:
                    print(f"Query by UUID object failed: {type(e).__name__}: {e}")
                    
                # Test query by string
                try:
                    q = select(User).where(User.id == str(user.id))
                    res = await db.execute(q)
                    print("Query by string succeeded!")
                except Exception as e:
                    print(f"Query by string failed: {type(e).__name__}: {e}")
                    
            else:
                print("No users found.")
        except Exception as e:
            print(f"DB Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test_db())
