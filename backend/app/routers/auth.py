import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.core.database import get_db
from app.core.security import verify_access_token, hash_password
from app.models import User
from app.schemas import (
    LoginResponse, UserRead, LoginRequest,
    ChangePasswordRequest, ResetPasswordRequest,
    EnablePasswordResetRequest, SetUserPasswordRequest,
)
from app.services.auth import login_by_username, change_password, reset_password, _format_user
from datetime import datetime

router = APIRouter()


# ─── Login ────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Login with username + password.
    Username = reg_no for students, employee_id for faculty/HOD,
    ADISHWARYAP / ADRICHERD for admins.
    Default password = username (change on first login).
    """
    try:
        response = await login_by_username(request.username, request.password, db)
        return response
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


# ─── Current user ─────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserRead)
async def get_current_user(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Get current authenticated user from Bearer token."""
    user = await _get_user_from_token(authorization, db)
    return _format_user(user)


@router.put("/me", response_model=UserRead)
async def update_current_user(
    user_data: dict,
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's own profile (name, phone, avatar etc.)."""
    user = await _get_user_from_token(authorization, db)
    # Only allow non-sensitive fields
    allowed = {"name", "phone", "address", "avatar", "gender", "dob", "email"}
    safe_data = {k: v for k, v in user_data.items() if k in allowed}
    stmt = update(User).where(User.id == user.id).values(**safe_data)
    await db.execute(stmt)
    await db.commit()
    result = await db.execute(select(User).where(User.id == user.id))
    updated = result.scalar_one()
    return _format_user(updated)


# ─── Change Password ──────────────────────────────────────────────────────────
@router.post("/change-password")
async def change_user_password(
    request: ChangePasswordRequest,
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Change own password — must know the old password."""
    user = await _get_user_from_token(authorization, db)
    try:
        await change_password(str(user.id), request.old_password, request.new_password, db)
        return {"message": "Password changed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ─── Reset Password (forgot-password flow) ────────────────────────────────────
@router.post("/reset-password")
async def reset_user_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Forgot-password reset — only works if admin has enabled reset for this user.
    No auth token required (user is locked out).
    """
    try:
        await reset_password(request.username, request.new_password, db)
        return {"message": "Password reset successfully. You can now log in."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


# ─── Check if reset is enabled (for forgot-password form) ────────────────────
@router.get("/reset-status/{username}")
async def check_reset_status(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    """Check if password reset is enabled for a given username (public endpoint)."""
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"username": username, "reset_enabled": user.password_reset_enabled or False}


# ─── Admin: list all users ────────────────────────────────────────────────────
@router.get("/users", response_model=list[UserRead])
async def list_users(
    role: str = None,
    department_id: str = None,
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """List all users (admin only)."""
    await _require_role(authorization, ["admin"], db)
    query = select(User).where(User.is_active == True)
    if role:
        query = query.where(User.role == role)
    if department_id:
        query = query.where(User.department_id == department_id)
    result = await db.execute(query)
    users = result.scalars().all()
    return [_format_user(u) for u in users]


# ─── Admin: enable / disable password reset for a user ───────────────────────
@router.put("/users/{user_id}/enable-reset")
async def enable_password_reset(
    user_id: str,
    request: EnablePasswordResetRequest,
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Admin enables or disables the password-reset flag for a user."""
    await _require_role(authorization, ["admin"], db)
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.password_reset_enabled = request.enabled
    await db.commit()
    return {"message": f"Password reset {'enabled' if request.enabled else 'disabled'} for {target.username}"}


# ─── Admin: set a user's password directly ───────────────────────────────────
@router.put("/users/{user_id}/set-password")
async def admin_set_user_password(
    user_id: str,
    request: SetUserPasswordRequest,
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Admin resets a user's password directly (no old password needed)."""
    await _require_role(authorization, ["admin"], db)
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.password_hash = hash_password(request.new_password)
    target.has_set_password = False  # force user to change on next login
    target.password_reset_enabled = False
    await db.commit()
    return {"message": f"Password reset for {target.username}"}


# ─── Admin: toggle user active status ────────────────────────────────────────
@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """Admin activates or deactivates a user account."""
    await _require_role(authorization, ["admin"], db)
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.is_active = not target.is_active
    await db.commit()
    return {"message": f"User {'activated' if target.is_active else 'deactivated'}", "is_active": target.is_active}


# ─── Helpers ─────────────────────────────────────────────────────────────────
async def _get_user_from_token(authorization: str | None, db: AsyncSession) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    token = authorization[7:]
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


async def _verify_token(authorization: str | None, db: AsyncSession) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    payload = verify_access_token(token)
    if not payload:
        return None
    user_id = payload.get("user_id")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    return result.scalar_one_or_none()


async def _require_role(authorization: str | None, roles: list[str], db: AsyncSession) -> User:
    user = await _verify_token(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if user.role not in roles:
        raise HTTPException(status_code=403, detail="Forbidden: insufficient permissions")
    return user
