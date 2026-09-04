from app.core.config import settings
from app.core.database import Base, engine, AsyncSessionLocal

import app.models.models  # noqa: F401 — ensures all models registered

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import auth, admin, faculty, student, hod, reports, notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all DB tables on startup (safe: won't drop existing tables)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Seed the two hardcoded admin accounts
    async with AsyncSessionLocal() as db:
        from app.services.auth import seed_admin_users
        await seed_admin_users(db)
    yield


app = FastAPI(
    title="Smart Attendance Management System API",
    description="Enterprise-grade attendance tracking backend for college use.",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_V1 = "/api"

app.include_router(auth.router, prefix=f"{API_V1}/auth", tags=["authentication"])
app.include_router(admin.router, prefix=f"{API_V1}/admin", tags=["admin"])
app.include_router(faculty.router, prefix=f"{API_V1}/faculty", tags=["faculty"])
app.include_router(student.router, prefix=f"{API_V1}/student", tags=["student"])
app.include_router(hod.router, prefix=f"{API_V1}/hod", tags=["hod"])
app.include_router(reports.router, prefix=f"{API_V1}/reports", tags=["reports"])
app.include_router(notifications.router, prefix=f"{API_V1}/notifications", tags=["notifications"])


@app.get(f"{API_V1}/health")
async def health_check():
    return {"status": "healthy", "service": "smart-attendance-api", "version": "2.0.0"}


@app.get(f"{API_V1}/")
async def root():
    return {
        "service": "Smart Attendance Management System API",
        "version": "2.0.0",
        "docs": f"{API_V1}/docs",
        "health": f"{API_V1}/health",
    }
