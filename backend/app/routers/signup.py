import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.core.database import get_db
from app.core.security import hash_password
from app.models import User, Department
from app.schemas import UserRead
from app.services.auth import _format_user

router = APIRouter()

@router.get("/departments")
async def get_departments(db: AsyncSession = Depends(get_db)):
    """Public endpoint to get list of departments for the signup form."""
    result = await db.execute(select(Department).order_by(Department.name))
    departments = result.scalars().all()
    return [{"id": str(d.id), "code": d.code, "name": d.name} for d in departments]

class SignupRequest(BaseModel):
    username: str
    password: str
    name: str
    email: str
    phone: str = ""
    dob: str = ""
    gender: str = ""
    address: str = ""
    avatar: str = ""
    fatherName: str = ""
    motherName: str = ""
    parentPhone: str = ""
    
    # Class categorization fields
    programme: str = ""
    year: int = 1
    shift: str = ""
    department_id: str = ""

@router.post("/signup", response_model=UserRead)
async def signup_user(
    request: SignupRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    User self-signup. 
    The user must already exist in the database (added by admin) 
    and must not have set their password yet.
    """
    # 1. Find user by username (regNo for students, employee_id for others)
    result = await db.execute(select(User).where(User.username == request.username))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="ID not found. Please contact administrator.")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled.")

    if user.has_set_password:
        raise HTTPException(status_code=400, detail="Account is already registered. Please log in.")

    # 2. Update user profile details
    user.name = request.name
    user.email = request.email
    user.phone = request.phone
    user.gender = request.gender
    user.address = request.address
    
    if request.dob:
        from datetime import datetime
        try:
            user.dob = datetime.strptime(request.dob, "%Y-%m-%d").date()
        except ValueError:
            pass
    
    if request.avatar:
        user.avatar = request.avatar

    if user.role == 'student':
        user.father_name = request.fatherName
        user.mother_name = request.motherName
        user.parent_phone = request.parentPhone
                
        user.programme = request.programme
        user.year = request.year
        user.shift = request.shift
        if request.department_id:
            user.department_id = request.department_id

    # 3. Set password and flag as registered
    user.password_hash = hash_password(request.password)
    user.has_set_password = True

    await db.commit()
    
    # Reload user
    result = await db.execute(select(User).where(User.id == user.id))
    updated = result.scalar_one()
    
    return _format_user(updated)
