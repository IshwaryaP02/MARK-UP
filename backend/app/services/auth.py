from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User, UserRole
from app.schemas import LoginResponse, UserRead


# ─── Hardcoded admin usernames ───────────────────────────────────────────────
ADMIN_USERNAMES = ["ADISHWARYAP", "ADRICHERD"]


def _format_user(user: User) -> UserRead:
    dept_name = None
    if user.department:
        dept_name = user.department.name
    return UserRead(
        id=str(user.id),
        username=user.username,
        name=user.name,
        email=user.email,
        avatar=user.avatar,
        role=user.role,
        department_id=str(user.department_id) if user.department_id else None,
        department_name=dept_name,
        reg_no=user.reg_no,
        employee_id=user.employee_id,
        phone=user.phone,
        address=user.address,
        gender=user.gender,
        dob=user.dob.isoformat() if user.dob else None,
        father_name=user.father_name,
        mother_name=user.mother_name,
        parent_phone=user.parent_phone,
        guardian_name=user.guardian_name,
        is_hod=user.is_hod or False,
        active=user.is_active,
        last_login=user.last_login.isoformat() if user.last_login else None,
        password_reset_enabled=user.password_reset_enabled or False,
        has_set_password=user.has_set_password or False,
    )


async def seed_admin_users(db: AsyncSession) -> None:
    """Seed the two hardcoded admin accounts on startup if they don't exist."""
    admin_configs = [
        {"username": "ADISHWARYAP", "name": "Dr. Ishwarya P (Admin)", "email": "admin1@college.edu"},
        {"username": "ADRICHERD",   "name": "Dr. Richard (Admin)",    "email": "admin2@college.edu"},
    ]
    for cfg in admin_configs:
        result = await db.execute(select(User).where(User.username == cfg["username"]))
        existing = result.scalar_one_or_none()
        if not existing:
            admin = User(
                username=cfg["username"],
                name=cfg["name"],
                email=cfg["email"],
                role=UserRole.admin,
                is_active=True,
                # Default password = username itself (admin must change on first login)
                password_hash=hash_password(cfg["username"]),
                has_set_password=False,
            )
            db.add(admin)
    await db.commit()


async def login_by_username(username: str, password: str, db: AsyncSession) -> LoginResponse:
    """
    Production login: look up user by username, verify bcrypt password.
    Username formats:
      - Student  : their registration number   e.g. 22CS001
      - Faculty  : their employee ID            e.g. GFCSE01
      - HOD      : their employee ID            e.g. GHCSE1
      - Admin    : hardcoded ADISHWARYAP / ADRICHERD
    Default password = username (admin should reset for new users).
    """
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if not user:
        raise ValueError("Invalid username or password")

    if not user.is_active:
        raise ValueError("Account is deactivated. Contact administrator.")

    if not user.password_hash:
        raise ValueError("No password set for this account. Contact administrator.")

    if not verify_password(password, user.password_hash):
        raise ValueError("Invalid username or password")

    user.last_login = datetime.utcnow()
    await db.commit()
    await db.refresh(user)

    token = create_access_token({
        "user_id": str(user.id),
        "role": user.role.value,
        "username": user.username,
    })
    return LoginResponse(access_token=token, token_type="bearer", user=_format_user(user))


async def change_password(user_id: str, old_password: str, new_password: str, db: AsyncSession) -> None:
    """Allow a user to change their own password (must know old password)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")

    if not user.password_hash:
        raise ValueError("No password set. Contact administrator.")

    if not verify_password(old_password, user.password_hash):
        raise ValueError("Old password is incorrect")

    user.password_hash = hash_password(new_password)
    user.has_set_password = True
    user.password_reset_enabled = False  # clear reset flag after successful change
    await db.commit()


async def reset_password(username: str, new_password: str, db: AsyncSession) -> None:
    """
    Forgot-password reset: only allowed when admin has set password_reset_enabled = True.
    After reset, the flag is cleared automatically.
    """
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")

    if not user.password_reset_enabled:
        raise ValueError("Password reset not enabled. Please contact administrator.")

    user.password_hash = hash_password(new_password)
    user.has_set_password = True
    user.password_reset_enabled = False
    await db.commit()
