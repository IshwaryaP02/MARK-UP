from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models.models import BonafideRequest, BonafideStage, UserRole, User
from app.services.audit import create_audit_log
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class BonafideCreate(BaseModel):
    purpose: str
    address_to: Optional[str] = None


class BonafideReview(BaseModel):
    status: str  # "approve"/"recommend"/"reject"
    comment: Optional[str] = None


class BonafideRead(BaseModel):
    id: str
    student_id: str
    student_name: str
    purpose: str
    address_to: Optional[str] = None
    stage: str
    faculty_id: Optional[str] = None
    faculty_comment: Optional[str] = None
    faculty_reviewed_at: Optional[str] = None
    hod_comment: Optional[str] = None
    hod_reviewed_at: Optional[str] = None
    principal_comment: Optional[str] = None
    principal_reviewed_at: Optional[str] = None
    created_at: str
    updated_at: str


def _fmt(b: BonafideRequest) -> BonafideRead:
    return BonafideRead(
        id=str(b.id),
        student_id=str(b.student_id),
        student_name=b.student.name if b.student else "",
        purpose=b.purpose,
        address_to=b.address_to,
        stage=b.stage.value if hasattr(b.stage, 'value') else b.stage,
        faculty_id=str(b.faculty_id) if b.faculty_id else None,
        faculty_comment=b.faculty_comment,
        faculty_reviewed_at=b.faculty_reviewed_at.isoformat() if b.faculty_reviewed_at else None,
        hod_comment=b.hod_comment,
        hod_reviewed_at=b.hod_reviewed_at.isoformat() if b.hod_reviewed_at else None,
        principal_comment=b.principal_comment,
        principal_reviewed_at=b.principal_reviewed_at.isoformat() if b.principal_reviewed_at else None,
        created_at=b.created_at.isoformat() if b.created_at else '',
        updated_at=b.updated_at.isoformat() if b.updated_at else '',
    )


@router.get("", response_model=list[BonafideRead])
async def list_bonafide(
    current_user: User = Depends(require_role("admin", "hod", "faculty", "student")),
    db: AsyncSession = Depends(get_db),
):
    """Return bonafide requests scoped to the user's role."""
    stmt = select(BonafideRequest).order_by(BonafideRequest.created_at.desc())
    if current_user.role == UserRole.student:
        stmt = stmt.where(BonafideRequest.student_id == str(current_user.id))
    elif current_user.role == UserRole.faculty:
        stmt = stmt.where(BonafideRequest.stage == BonafideStage.pending_faculty)
    elif current_user.role == UserRole.hod:
        stmt = stmt.where(BonafideRequest.stage == BonafideStage.pending_hod)
    # admin sees all
    result = await db.execute(stmt)
    return [_fmt(b) for b in result.scalars().all()]


@router.post("", response_model=BonafideRead)
async def submit_bonafide(
    data: BonafideCreate,
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    req = BonafideRequest(
        student_id=str(current_user.id),
        purpose=data.purpose,
        address_to=data.address_to,
        stage=BonafideStage.pending_faculty,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return _fmt(req)


@router.put("/{req_id}/review", response_model=BonafideRead)
async def review_bonafide(
    req_id: str,
    data: BonafideReview,
    current_user: User = Depends(require_role("admin", "hod", "faculty")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BonafideRequest).where(BonafideRequest.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Bonafide request not found")

    now = datetime.utcnow()
    role = current_user.role

    if data.status == "reject":
        req.stage = BonafideStage.rejected
        if role == UserRole.faculty:
            req.faculty_comment = data.comment
            req.faculty_reviewed_at = now
        elif role == UserRole.hod:
            req.hod_comment = data.comment
            req.hod_reviewed_at = now
        else:
            req.principal_comment = data.comment
            req.principal_reviewed_at = now
    elif role == UserRole.faculty and req.stage == BonafideStage.pending_faculty:
        req.faculty_id = str(current_user.id)
        req.faculty_comment = data.comment
        req.faculty_reviewed_at = now
        req.stage = BonafideStage.pending_hod
    elif role in (UserRole.hod, UserRole.admin) and req.stage == BonafideStage.pending_hod:
        req.hod_id = str(current_user.id)
        req.hod_comment = data.comment
        req.hod_reviewed_at = now
        req.stage = BonafideStage.pending_principal
    elif role == UserRole.admin and req.stage == BonafideStage.pending_principal:
        req.principal_comment = data.comment
        req.principal_reviewed_at = now
        req.stage = BonafideStage.approved
    else:
        raise HTTPException(status_code=400, detail="Cannot review at this stage with your role")

    await db.commit()
    await db.refresh(req)
    await create_audit_log(db, str(current_user.id), "REVIEW_BONAFIDE", "Bonafide",
                           f"Reviewed bonafide {req_id}: {data.status}", "127.0.0.1")
    return _fmt(req)


@router.delete("/{req_id}")
async def delete_bonafide(
    req_id: str,
    current_user: User = Depends(require_role("admin", "student")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BonafideRequest).where(BonafideRequest.id == req_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Not found")
    # Students can only delete their own pending requests
    if current_user.role == UserRole.student:
        if str(req.student_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not allowed")
        if req.stage not in (BonafideStage.pending_faculty,):
            raise HTTPException(status_code=400, detail="Cannot delete a request that is already being processed")
    await db.execute(delete(BonafideRequest).where(BonafideRequest.id == req_id))
    await db.commit()
    return {"message": "Deleted", "id": req_id}
