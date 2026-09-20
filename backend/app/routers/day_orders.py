from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models.models import StaffDayOrder, User
from app.services.audit import create_audit_log
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class DayOrderCreate(BaseModel):
    date: str           # YYYY-MM-DD
    day_number: int     # 1-6
    label: Optional[str] = None
    notes: Optional[str] = None


class DayOrderRead(BaseModel):
    id: str
    date: str
    day_number: int
    label: Optional[str] = None
    notes: Optional[str] = None
    created_at: str


def _fmt(d: StaffDayOrder) -> DayOrderRead:
    return DayOrderRead(
        id=str(d.id),
        date=d.date.isoformat() if d.date else '',
        day_number=d.day_number,
        label=d.label,
        notes=d.notes,
        created_at=d.created_at.isoformat() if d.created_at else '',
    )


@router.get("", response_model=list[DayOrderRead])
async def list_day_orders(
    current_user: User = Depends(require_role("admin", "hod", "faculty", "student")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(StaffDayOrder).order_by(StaffDayOrder.date.desc()))
    return [_fmt(d) for d in result.scalars().all()]


@router.post("", response_model=DayOrderRead)
async def create_day_order(
    data: DayOrderCreate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    if not 1 <= data.day_number <= 6:
        raise HTTPException(status_code=400, detail="day_number must be between 1 and 6")
    try:
        date_obj = datetime.strptime(data.date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")

    # Upsert: if date already exists, update it
    existing = await db.execute(select(StaffDayOrder).where(StaffDayOrder.date == date_obj))
    entry = existing.scalar_one_or_none()
    if entry:
        entry.day_number = data.day_number
        entry.label = data.label
        entry.notes = data.notes
    else:
        entry = StaffDayOrder(
            date=date_obj,
            day_number=data.day_number,
            label=data.label,
            notes=data.notes,
            created_by=str(current_user.id),
        )
        db.add(entry)
    await db.commit()
    await db.refresh(entry)
    await create_audit_log(db, str(current_user.id), "SAVE_DAY_ORDER", "DayOrders",
                           f"Set {data.date} → Day {data.day_number}", "127.0.0.1")
    return _fmt(entry)


@router.put("/{order_id}", response_model=DayOrderRead)
async def update_day_order(
    order_id: str,
    data: DayOrderCreate,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(StaffDayOrder).where(StaffDayOrder.id == order_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Day order not found")
    try:
        entry.date = datetime.strptime(data.date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    entry.day_number = data.day_number
    entry.label = data.label
    entry.notes = data.notes
    await db.commit()
    await db.refresh(entry)
    return _fmt(entry)


@router.delete("/{order_id}")
async def delete_day_order(
    order_id: str,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(delete(StaffDayOrder).where(StaffDayOrder.id == order_id))
    await db.commit()
    return {"message": "Deleted", "id": order_id}
