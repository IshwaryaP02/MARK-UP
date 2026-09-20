from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models.models import Circular, CircularStatus, UserRole, User
from app.services.audit import create_audit_log
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class CircularCreate(BaseModel):
    title: str
    content: str
    target_role: Optional[str] = None
    department_id: Optional[str] = None
    target_semester: Optional[int] = None
    target_section: Optional[str] = None


class CircularRead(BaseModel):
    id: str
    title: str
    content: str
    status: str
    target_role: Optional[str] = None
    department_id: Optional[str] = None
    target_semester: Optional[int] = None
    target_section: Optional[str] = None
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    signer_name: Optional[str] = None
    publisher_name: Optional[str] = None
    published_at: Optional[str] = None
    recipient_count: int = 0
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


def _fmt(c: Circular) -> CircularRead:
    return CircularRead(
        id=str(c.id),
        title=c.title,
        content=c.content,
        status=c.status.value if hasattr(c.status, 'value') else c.status,
        target_role=c.target_role.value if c.target_role and hasattr(c.target_role, 'value') else c.target_role,
        department_id=str(c.department_id) if c.department_id else None,
        target_semester=c.target_semester,
        target_section=c.target_section,
        author_id=str(c.author_id) if c.author_id else None,
        author_name=c.author.name if c.author else None,
        signer_name=c.signer_name,
        publisher_name=c.publisher_name,
        published_at=c.published_at.isoformat() if c.published_at else None,
        recipient_count=c.recipient_count or 0,
        created_at=c.created_at.isoformat() if c.created_at else '',
        updated_at=c.updated_at.isoformat() if c.updated_at else '',
    )


@router.get("", response_model=list[CircularRead])
async def list_circulars(
    current_user: User = Depends(require_role("admin", "hod", "faculty", "student")),
    db: AsyncSession = Depends(get_db),
):
    """Return circulars visible to the requesting user based on role."""
    stmt = select(Circular).order_by(Circular.created_at.desc())
    role = current_user.role
    if role in (UserRole.student, UserRole.faculty):
        # Students & faculty see only published circulars targeting them
        stmt = stmt.where(Circular.status == CircularStatus.published)
    result = await db.execute(stmt)
    return [_fmt(c) for c in result.scalars().all()]


@router.post("", response_model=CircularRead)
async def create_circular(
    data: CircularCreate,
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    circ = Circular(
        title=data.title,
        content=data.content,
        target_role=data.target_role,
        department_id=data.department_id,
        target_semester=data.target_semester,
        target_section=data.target_section,
        author_id=str(current_user.id),
        status=CircularStatus.draft,
    )
    db.add(circ)
    await db.commit()
    await db.refresh(circ)
    await create_audit_log(db, str(current_user.id), "CREATE_CIRCULAR", "Circulars",
                           f"Created circular: {data.title}", "127.0.0.1")
    return _fmt(circ)


@router.put("/{circular_id}", response_model=CircularRead)
async def update_circular(
    circular_id: str,
    data: CircularCreate,
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Circular).where(Circular.id == circular_id))
    circ = result.scalar_one_or_none()
    if not circ:
        raise HTTPException(status_code=404, detail="Circular not found")
    circ.title = data.title
    circ.content = data.content
    circ.target_role = data.target_role
    circ.department_id = data.department_id
    circ.target_semester = data.target_semester
    circ.target_section = data.target_section
    await db.commit()
    await db.refresh(circ)
    return _fmt(circ)


@router.post("/{circular_id}/sign", response_model=CircularRead)
async def sign_circular(
    circular_id: str,
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Circular).where(Circular.id == circular_id))
    circ = result.scalar_one_or_none()
    if not circ:
        raise HTTPException(status_code=404, detail="Circular not found")
    circ.status = CircularStatus.signed
    circ.signer_id = str(current_user.id)
    circ.signer_name = current_user.name
    await db.commit()
    await db.refresh(circ)
    return _fmt(circ)


@router.post("/{circular_id}/publish", response_model=CircularRead)
async def publish_circular(
    circular_id: str,
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Circular).where(Circular.id == circular_id))
    circ = result.scalar_one_or_none()
    if not circ:
        raise HTTPException(status_code=404, detail="Circular not found")
    circ.status = CircularStatus.published
    circ.publisher_id = str(current_user.id)
    circ.publisher_name = current_user.name
    circ.published_at = datetime.utcnow()
    await db.commit()
    await db.refresh(circ)
    await create_audit_log(db, str(current_user.id), "PUBLISH_CIRCULAR", "Circulars",
                           f"Published: {circ.title}", "127.0.0.1")
    return _fmt(circ)


@router.post("/{circular_id}/archive", response_model=CircularRead)
async def archive_circular(
    circular_id: str,
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Circular).where(Circular.id == circular_id))
    circ = result.scalar_one_or_none()
    if not circ:
        raise HTTPException(status_code=404, detail="Circular not found")
    circ.status = CircularStatus.archived
    await db.commit()
    await db.refresh(circ)
    return _fmt(circ)


@router.delete("/{circular_id}")
async def delete_circular(
    circular_id: str,
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(delete(Circular).where(Circular.id == circular_id))
    await db.commit()
    return {"message": "Circular deleted", "id": circular_id}
