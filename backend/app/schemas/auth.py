from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.models import UserRole


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserRead"


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class ResetPasswordRequest(BaseModel):
    """Used when admin has enabled password reset for the user (forgot-password flow)."""
    username: str
    new_password: str


class EnablePasswordResetRequest(BaseModel):
    enabled: bool


class SetUserPasswordRequest(BaseModel):
    """Admin sets or resets a user's password directly."""
    new_password: str


class UserRead(BaseModel):
    id: str
    username: Optional[str] = None
    name: str
    email: Optional[str] = None
    avatar: Optional[str] = None
    role: UserRole
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    reg_no: Optional[str] = None
    employee_id: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    parent_phone: Optional[str] = None
    guardian_name: Optional[str] = None
    is_hod: bool = False
    active: bool = True
    last_login: Optional[str] = None
    password_reset_enabled: bool = False
    has_set_password: bool = False

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    email: Optional[str] = None
    name: str
    role: UserRole
    department_id: Optional[str] = None
    phone: Optional[str] = None
    is_hod: Optional[bool] = False
    employee_id: Optional[str] = None
    reg_no: Optional[str] = None
    roll_no: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    batch: Optional[str] = None
    avatar: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    guardian_name: Optional[str] = None
    parent_phone: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    department_id: Optional[str] = None
    phone: Optional[str] = None
    is_hod: Optional[bool] = None
    employee_id: Optional[str] = None
    reg_no: Optional[str] = None
    roll_no: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    batch: Optional[str] = None
    avatar: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    guardian_name: Optional[str] = None
    parent_phone: Optional[str] = None
    is_active: Optional[bool] = None
    last_login: Optional[str] = None
