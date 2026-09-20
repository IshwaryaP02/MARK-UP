"""
Timetable Service
=================
Handles all DB-level operations for the timetable system:
  - Committing OCR-parsed rows
  - Committing auto-allocated rows
  - Querying timetables for faculty / students / HOD
"""
from __future__ import annotations

import uuid
from datetime import time, datetime
from typing import Any

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import (
    Timetable, TimetableVersion, Subject, User, Department, UserRole
)

# ── Period timing constants (50 minutes each, two shifts) ────────────────────
SHIFT1_PERIODS = {
    1: (time(8, 0),  time(8, 50)),
    2: (time(9, 0),  time(9, 50)),
    3: (time(10, 10), time(11, 0)),
    4: (time(11, 10), time(12, 0)),
    5: (time(12, 10), time(13, 0)),
}
SHIFT2_PERIODS = {
    1: (time(13, 30), time(14, 20)),
    2: (time(14, 30), time(15, 20)),
    3: (time(15, 30), time(16, 20)),
    4: (time(16, 30), time(17, 20)),
    5: (time(17, 30), time(18, 20)),
}

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def _period_times(shift: str, period: int) -> tuple[time, time]:
    table = SHIFT1_PERIODS if "1" in shift or "first" in shift.lower() else SHIFT2_PERIODS
    return table.get(period, (time(8, 0), time(8, 50)))


def _fmt_time(t: time | None) -> str:
    if t is None:
        return ""
    h = t.hour
    m = t.minute
    ap = "AM" if h < 12 else "PM"
    h12 = h % 12 or 12
    return f"{h12}:{m:02d} {ap}"


async def _get_or_create_subject(
    db: AsyncSession,
    code: str,
    name: str,
    dept_id: str,
    semester: int,
) -> str:
    """Return existing subject id or create new one."""
    result = await db.execute(
        select(Subject).where(
            Subject.code == code,
            Subject.department_id == dept_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return str(existing.id)
    new_sub = Subject(
        id=str(uuid.uuid4()),
        code=code,
        name=name or code,
        department_id=dept_id,
        semester=semester,
        credits=3,
        min_attendance_pct=75,
    )
    db.add(new_sub)
    await db.flush()
    return str(new_sub.id)


async def _resolve_faculty_by_employee_id(
    db: AsyncSession,
    employee_id: str,
    dept_id: str | None,
) -> str | None:
    """Look up a faculty user by employee_id. Returns user.id or None."""
    if not employee_id:
        return None
    stmt = select(User).where(User.employee_id == employee_id)
    if dept_id:
        stmt = stmt.where(User.department_id == dept_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if user:
        return str(user.id)
    # Retry without dept filter (in case employee_id is from another dept)
    result2 = await db.execute(select(User).where(User.employee_id == employee_id))
    user2 = result2.scalar_one_or_none()
    return str(user2.id) if user2 else None


# ── OCR Commit ───────────────────────────────────────────────────────────────

async def commit_ocr_timetable(
    rows: list[dict[str, Any]],
    dept_id: str,
    shift: str,
    semester: int,
    programme: str,
    year: int,
    published_by_id: str,
    db: AsyncSession,
) -> dict[str, Any]:
    """
    Persist OCR-parsed rows into the timetable table.
    Clears existing slots for dept+shift+semester first (idempotent).
    Returns a summary dict.
    """
    # Delete existing for this dept/shift/semester
    await db.execute(
        delete(Timetable).where(
            Timetable.department_id == dept_id,
            Timetable.shift == shift,
            Timetable.semester == semester,
            Timetable.programme == programme,
            Timetable.year == year,
        )
    )
    await db.flush()

    created = 0
    warnings: list[str] = []

    for row in rows:
        day: str = row.get("day", "").strip().title()
        if day not in DAYS:
            warnings.append(f"Skipped unknown day: {row.get('day')}")
            continue
        try:
            period = int(row.get("period", 0))
        except (TypeError, ValueError):
            warnings.append(f"Skipped row with invalid period: {row}")
            continue
        if period < 1 or period > 5:
            warnings.append(f"Skipped period {period} (must be 1–5)")
            continue

        subject_code: str = str(row.get("subject", "")).strip()
        subject_name: str = str(row.get("subject_name", subject_code)).strip()
        faculty_name: str = str(row.get("teacher", "")).strip()
        section: str = str(row.get("section", "A")).strip() or "A"

        # Try to find subject
        subject_id: str | None = None
        if subject_code:
            subject_id = await _get_or_create_subject(
                db, subject_code, subject_name, dept_id, semester
            )

        # Try to find faculty by name
        faculty_id: str | None = None
        if faculty_name:
            result = await db.execute(
                select(User).where(
                    User.name.ilike(f"%{faculty_name}%"),
                    User.role.in_([UserRole.faculty, UserRole.hod]),
                )
            )
            fac = result.scalar_one_or_none()
            if fac:
                faculty_id = str(fac.id)
            else:
                warnings.append(f"Faculty '{faculty_name}' not found in DB (slot saved without faculty link)")

        start_t, end_t = _period_times(shift, period)
        slot = Timetable(
            id=str(uuid.uuid4()),
            day=day,
            period_number=period,
            start_time=start_t,
            end_time=end_t,
            subject_id=subject_id,
            faculty_id=faculty_id,
            department_id=dept_id,
            semester=semester,
            section=section,
            shift=shift,
            programme=programme,
            year=year,
            source="ocr",
        )
        db.add(slot)
        created += 1

    # Record version
    version = TimetableVersion(
        id=str(uuid.uuid4()),
        department_id=dept_id,
        shift=shift,
        source="ocr",
        published_by=published_by_id,
        published_at=datetime.utcnow(),
        notes=f"OCR import: {created} slots",
    )
    db.add(version)
    await db.commit()

    return {"created": created, "warnings": warnings}


# ── Allocator Commit ─────────────────────────────────────────────────────────

async def commit_allocation(
    allocation: list[dict[str, Any]],
    dept_id: str,
    shift: str,
    semester: int,
    programme: str,
    year: int,
    published_by_id: str,
    db: AsyncSession,
) -> dict[str, Any]:
    """
    Persist auto-generated allocation into the timetable table.
    Clears existing slots for dept+shift first (idempotent replace).
    """
    await db.execute(
        delete(Timetable).where(
            Timetable.department_id == dept_id,
            Timetable.shift == shift,
            Timetable.semester == semester,
            Timetable.programme == programme,
            Timetable.year == year,
        )
    )
    await db.flush()

    created = 0
    warnings: list[str] = []

    for slot_data in allocation:
        day: str = slot_data.get("day", "")
        period: int = int(slot_data.get("period", 1))
        section: str = str(slot_data.get("section", "A"))
        teacher_name: str = str(slot_data.get("teacher", ""))
        employee_id: str = str(slot_data.get("employee_id", ""))
        subject_code: str = str(slot_data.get("subject", ""))
        subject_name: str = str(slot_data.get("subject_name", subject_code))

        # Resolve faculty
        faculty_id: str | None = None
        if employee_id:
            faculty_id = await _resolve_faculty_by_employee_id(db, employee_id, dept_id)
        if not faculty_id and teacher_name:
            res = await db.execute(
                select(User).where(
                    User.name.ilike(f"%{teacher_name}%"),
                    User.role.in_([UserRole.faculty, UserRole.hod]),
                )
            )
            fac = res.scalar_one_or_none()
            if fac:
                faculty_id = str(fac.id)
            else:
                warnings.append(
                    f"Faculty '{teacher_name}' (ID: '{employee_id}') not matched — slot saved without faculty link"
                )

        # Resolve subject
        subject_id: str | None = None
        if subject_code:
            subject_id = await _get_or_create_subject(
                db, subject_code, subject_name, dept_id, semester
            )

        start_t, end_t = _period_times(shift, period)
        slot = Timetable(
            id=str(uuid.uuid4()),
            day=day,
            period_number=period,
            start_time=start_t,
            end_time=end_t,
            subject_id=subject_id,
            faculty_id=faculty_id,
            department_id=dept_id,
            semester=semester,
            section=section,
            shift=shift,
            programme=programme,
            year=year,
            source="allocator",
        )
        db.add(slot)
        created += 1

    version = TimetableVersion(
        id=str(uuid.uuid4()),
        department_id=dept_id,
        shift=shift,
        source="allocator",
        published_by=published_by_id,
        published_at=datetime.utcnow(),
        notes=f"Auto-allocator: {created} slots",
    )
    db.add(version)
    await db.commit()

    return {"created": created, "warnings": warnings}


# ── Query Helpers ─────────────────────────────────────────────────────────────

async def format_timetable_slot(slot: Timetable, db: AsyncSession) -> dict[str, Any]:
    subject_code = subject_name = ""
    if slot.subject:
        subject_code = slot.subject.code
        subject_name = slot.subject.name
    faculty_name = faculty_emp_id = ""
    if slot.faculty:
        faculty_name = slot.faculty.name
        faculty_emp_id = slot.faculty.employee_id or ""
    return {
        "id": str(slot.id),
        "day": slot.day if isinstance(slot.day, str) else str(slot.day),
        "period": slot.period_number,
        "start_time": _fmt_time(slot.start_time),
        "end_time": _fmt_time(slot.end_time),
        "subject_id": str(slot.subject_id) if slot.subject_id else None,
        "subject_code": subject_code,
        "subject_name": subject_name,
        "faculty_id": str(slot.faculty_id) if slot.faculty_id else None,
        "faculty_name": faculty_name,
        "faculty_employee_id": faculty_emp_id,
        "room_no": slot.room_no or "",
        "department_id": str(slot.department_id) if slot.department_id else None,
        "semester": slot.semester,
        "section": slot.section,
        "shift": slot.shift or "First Shift",
        "source": slot.source or "manual",
    }


async def get_department_timetable(
    dept_id: str,
    db: AsyncSession,
    shift: str | None = None,
    semester: int | None = None,
    section: str | None = None,
) -> list[dict[str, Any]]:
    stmt = select(Timetable).where(Timetable.department_id == dept_id)
    if shift:
        stmt = stmt.where(Timetable.shift == shift)
    if semester:
        stmt = stmt.where(Timetable.semester == semester)
    if section:
        stmt = stmt.where(Timetable.section == section)
    day_order = {d: i for i, d in enumerate(DAYS)}
    result = await db.execute(stmt)
    slots = result.scalars().all()
    items = [await format_timetable_slot(s, db) for s in slots]
    items.sort(key=lambda x: (day_order.get(x["day"], 99), x["period"]))
    return items


async def get_faculty_timetable(
    faculty_id: str,
    db: AsyncSession,
) -> list[dict[str, Any]]:
    stmt = (
        select(Timetable)
        .where(Timetable.faculty_id == faculty_id)
        .order_by(Timetable.day, Timetable.period_number)
    )
    result = await db.execute(stmt)
    slots = result.scalars().all()
    day_order = {d: i for i, d in enumerate(DAYS)}
    items = [await format_timetable_slot(s, db) for s in slots]
    items.sort(key=lambda x: (day_order.get(x["day"], 99), x["period"]))
    return items


async def get_student_timetable(
    dept_id: str,
    semester: int,
    section: str,
    shift: str,
    db: AsyncSession,
) -> list[dict[str, Any]]:
    stmt = select(Timetable).where(
        Timetable.department_id == dept_id,
        Timetable.semester == semester,
        Timetable.section == section,
        Timetable.shift == shift,
    )
    result = await db.execute(stmt)
    slots = result.scalars().all()
    day_order = {d: i for i, d in enumerate(DAYS)}
    items = [await format_timetable_slot(s, db) for s in slots]
    items.sort(key=lambda x: (day_order.get(x["day"], 99), x["period"]))
    return items
