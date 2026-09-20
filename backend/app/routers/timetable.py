"""
Timetable Router
================
All endpoints for the Timetable Management System.

Roles:
  - admin  : full access to all departments
  - hod    : locked to their own department_id
  - faculty: read-only (own timetable)
  - student: read-only (own class timetable)

Module 1 — OCR Builder
  POST /api/timetable/ocr                → extract + preview
  POST /api/timetable/ocr/commit         → persist to DB

Module 2 — Auto Allocator
  POST /api/timetable/allocate           → generate + preview
  POST /api/timetable/allocate/commit    → persist to DB

Read endpoints
  GET  /api/timetable/departments        → list accessible departments
  GET  /api/timetable/{dept_id}          → full dept timetable
  GET  /api/timetable/faculty/{fac_id}   → specific faculty timetable (admin/hod)
  GET  /api/timetable/me                 → own timetable (faculty)
  GET  /api/timetable/student/me         → own class timetable (student)

Edit endpoints
  PUT  /api/timetable/slot/{slot_id}     → edit a single slot
  DELETE /api/timetable/slot/{slot_id}  → delete a single slot
"""
from __future__ import annotations

import io
import re
import uuid
from datetime import time
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models.models import (
    Timetable, Department, Subject, User, UserRole, TimetableVersion
)
from app.services.timetable_allocator import generate_timetable, read_requirements
from app.services.timetable_service import (
    commit_ocr_timetable,
    commit_allocation,
    get_department_timetable,
    get_faculty_timetable,
    get_student_timetable,
    format_timetable_slot,
    _period_times,
    DAYS,
)

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _dept_for(user: User, requested: str | None) -> str:
    """Return the target department_id, enforcing HOD scope."""
    if user.role in (UserRole.hod,):
        if not user.department_id:
            raise HTTPException(400, "Your HOD account has no department assigned.")
        return str(user.department_id)
    if not requested:
        raise HTTPException(422, "Admin must specify a target department_id.")
    return requested


def _parse_ocr_text(text: str) -> list[dict[str, str]]:
    """
    Parse raw OCR text into structured row dicts.
    Accepts lines containing a day name, a period number and at least one
    additional token (subject, teacher). Supports space, tab, or comma separated values.
    """
    rows: list[dict[str, str]] = []
    days_set = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday"}

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue

        # Extract Day
        day = ""
        for d in days_set:
            if re.search(rf"\b{d}\b", line, re.IGNORECASE):
                day = d.title()
                line = re.sub(rf"\b{d}\b", "", line, count=1, flags=re.IGNORECASE)
                break

        # Extract Period
        period_match = re.search(r"\b(?:period|p)?\s*([1-5])\b", line, re.IGNORECASE)
        if not day or not period_match:
            continue

        period = period_match.group(1)
        # Remove period from line
        line = line[:period_match.start()] + line[period_match.end():]

        # Extract remaining tokens (subject, teacher, section)
        # Split by typical separators or multiple spaces
        extras = [p.strip() for p in re.split(r"[,|\t;]+|\s{2,}", line.strip()) if p.strip()]
        
        # Fallback: if there are no clear column dividers, split by single spaces
        if len(extras) <= 1:
            extras = [p.strip() for p in line.split() if p.strip()]

        rows.append({
            "day": day,
            "period": period,
            "subject": extras[0] if len(extras) > 0 else "",
            "teacher": extras[1] if len(extras) > 1 else "",
            "section": extras[2] if len(extras) > 2 else "A",
        })
    return rows


# ── Module 1: OCR ─────────────────────────────────────────────────────────────

@router.post("/ocr")
async def timetable_ocr(
    file: Annotated[UploadFile, File(...)],
    department_id: Annotated[str | None, Form()] = None,
    shift: Annotated[str, Form()] = "First Shift",
    semester: Annotated[int, Form()] = 1,
    programme: Annotated[str, Form()] = "UG",
    year: Annotated[int, Form()] = 1,
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a timetable image, run OCR, and return a structured preview.
    Does NOT write to the DB — call /ocr/commit to persist.
    """
    target_dept = _dept_for(current_user, department_id)
    content = await file.read()

    # ── OCR extraction ───────────────────────────────────────────────────────
    raw_text = ""
    ocr_engine = "none"
    try:
        import pytesseract
        from PIL import Image

        image = Image.open(io.BytesIO(content))
        # Pre-process: convert to greyscale for better accuracy
        image = image.convert("L")
        raw_text = pytesseract.image_to_string(image, config="--psm 6")
        ocr_engine = "pytesseract"
    except ImportError:
        raise HTTPException(
            503,
            "Tesseract OCR is not installed. "
            "Install Tesseract and pytesseract to use this feature. "
            "See: https://github.com/UB-Mannheim/tesseract/wiki",
        )
    except Exception as exc:
        raise HTTPException(422, f"Could not process image: {exc}")

    rows = _parse_ocr_text(raw_text)

    return {
        "department_id": target_dept,
        "shift": shift,
        "semester": semester,
        "programme": programme,
        "year": year,
        "ocr_engine": ocr_engine,
        "raw_text": raw_text,
        "rows": rows,
        "row_count": len(rows),
    }


@router.post("/ocr/commit")
async def timetable_ocr_commit(
    rows: list[dict[str, Any]],
    department_id: str,
    shift: str = "First Shift",
    semester: int = 1,
    programme: str = "UG",
    year: int = 1,
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """
    Persist the OCR-parsed rows returned by /ocr into the DB.
    Replaces existing timetable for the given dept + shift + semester.
    """
    target_dept = _dept_for(current_user, department_id)
    result = await commit_ocr_timetable(
        rows=rows,
        dept_id=target_dept,
        shift=shift,
        semester=semester,
        programme=programme,
        year=year,
        published_by_id=str(current_user.id),
        db=db,
    )
    return {"status": "committed", **result}


# ── Module 2: Allocator ───────────────────────────────────────────────────────

@router.post("/allocate")
async def timetable_allocate(
    file: Annotated[UploadFile, File(...)],
    sections: Annotated[str, Form()],
    shift: Annotated[str, Form()] = "First Shift",
    semester: Annotated[int, Form()] = 1,
    department_id: Annotated[str | None, Form()] = None,
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload an Excel sheet of teacher requirements, run the constraint-
    satisfaction allocator, and return a preview of the generated timetable.
    Does NOT write to DB — call /allocate/commit to persist.

    Excel columns: Teacher_Name, Faculty_ID, Subject, Required_Hours, Shift_Assigned
    """
    target_dept = _dept_for(current_user, department_id)
    section_list = [s.strip() for s in sections.split(",") if s.strip()]
    if not section_list:
        raise HTTPException(422, "At least one section is required (e.g., 'A,B,C').")

    try:
        content = await file.read()
        requirements = read_requirements(content)
        allocation = generate_timetable(requirements, section_list)
    except ValueError as exc:
        raise HTTPException(422, str(exc))

    return {
        "department_id": target_dept,
        "shift": shift,
        "semester": semester,
        "sections": section_list,
        "days": list(DAYS),
        "periods_per_shift": 5,
        "period_minutes": 50,
        "allocation": allocation,
        "total_slots": len(allocation),
    }


@router.post("/allocate/commit")
async def timetable_allocate_commit(
    allocation: list[dict[str, Any]],
    department_id: str,
    shift: str = "First Shift",
    semester: int = 1,
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """
    Persist an auto-generated allocation (from /allocate) into the DB.
    Replaces existing timetable for the given dept + shift + semester.
    """
    target_dept = _dept_for(current_user, department_id)
    result = await commit_allocation(
        allocation=allocation,
        dept_id=target_dept,
        shift=shift,
        semester=semester,
        published_by_id=str(current_user.id),
        db=db,
    )
    return {"status": "committed", **result}


# ── Read Endpoints ────────────────────────────────────────────────────────────

@router.get("/departments")
async def list_timetable_departments(
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """List departments this user may manage timetables for."""
    if current_user.role == UserRole.hod:
        if not current_user.department_id:
            return []
        result = await db.execute(
            select(Department).where(Department.id == current_user.department_id)
        )
        depts = result.scalars().all()
    else:
        result = await db.execute(select(Department))
        depts = result.scalars().all()

    return [
        {"id": str(d.id), "code": d.code, "name": d.name}
        for d in depts
    ]


@router.get("/me")
async def my_timetable(
    current_user: User = Depends(require_role("faculty", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """Faculty / HOD: get own weekly timetable."""
    return await get_faculty_timetable(str(current_user.id), db)


@router.get("/student/me")
async def student_my_timetable(
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    """Student: get their class timetable based on dept/semester/section."""
    if not current_user.department_id or not current_user.semester or not current_user.section:
        raise HTTPException(
            400,
            "Your account is missing department, semester, or section. Please contact admin.",
        )
    # Determine shift from section (A–E → Shift 1, F–Z → Shift 2)
    # HOD/admin can override this; for students it's inferred from section letter
    section_first_char = current_user.section.upper()[0] if current_user.section else "A"
    shift = "First Shift" if section_first_char <= "E" else "Second Shift"
    return await get_student_timetable(
        dept_id=str(current_user.department_id),
        semester=current_user.semester,
        section=current_user.section,
        shift=shift,
        db=db,
    )


@router.get("/faculty/{faculty_id}")
async def faculty_timetable_by_id(
    faculty_id: str,
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """Admin / HOD: view any faculty member's timetable."""
    # HOD: only view faculty in their department
    if current_user.role == UserRole.hod:
        fac_result = await db.execute(select(User).where(User.id == faculty_id))
        fac = fac_result.scalar_one_or_none()
        if not fac:
            raise HTTPException(404, "Faculty not found.")
        if str(fac.department_id) != str(current_user.department_id):
            raise HTTPException(403, "You can only view timetables within your department.")

    return await get_faculty_timetable(faculty_id, db)


@router.get("/{dept_id}")
async def department_timetable(
    dept_id: str,
    shift: str | None = Query(None),
    semester: int | None = Query(None),
    section: str | None = Query(None),
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """Full timetable for a department (filterable by shift/semester/section)."""
    # HOD scope check
    if current_user.role == UserRole.hod:
        if str(current_user.department_id) != dept_id:
            raise HTTPException(403, "You can only view your own department's timetable.")

    dept = (await db.execute(select(Department).where(Department.id == dept_id))).scalar_one_or_none()
    if not dept:
        raise HTTPException(404, "Department not found.")

    slots = await get_department_timetable(dept_id, db, shift=shift, semester=semester, section=section)
    return {
        "department_id": dept_id,
        "department_name": dept.name,
        "department_code": dept.code,
        "slots": slots,
        "total": len(slots),
    }


# ── Edit / Delete Single Slot ─────────────────────────────────────────────────

@router.put("/slot/{slot_id}")
async def update_slot(
    slot_id: str,
    data: dict[str, Any],
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """Edit a single timetable slot."""
    result = await db.execute(select(Timetable).where(Timetable.id == slot_id))
    slot = result.scalar_one_or_none()
    if not slot:
        raise HTTPException(404, "Timetable slot not found.")

    if current_user.role == UserRole.hod:
        if str(slot.department_id) != str(current_user.department_id):
            raise HTTPException(403, "Not authorized to edit this slot.")

    # Apply updatable fields
    for field_name in ("day", "period_number", "subject_id", "faculty_id", "room_no", "section", "shift", "semester"):
        if field_name in data:
            setattr(slot, field_name, data[field_name])

    # Recompute start/end time if period changed
    if "period_number" in data or "shift" in data:
        period = slot.period_number
        shift = slot.shift or "First Shift"
        start_t, end_t = _period_times(shift, period)
        slot.start_time = start_t
        slot.end_time = end_t

    db.add(slot)
    await db.commit()
    await db.refresh(slot)
    return await format_timetable_slot(slot, db)


@router.delete("/slot/{slot_id}")
async def delete_slot(
    slot_id: str,
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single timetable slot."""
    result = await db.execute(select(Timetable).where(Timetable.id == slot_id))
    slot = result.scalar_one_or_none()
    if not slot:
        raise HTTPException(404, "Timetable slot not found.")

    if current_user.role == UserRole.hod:
        if str(slot.department_id) != str(current_user.department_id):
            raise HTTPException(403, "Not authorized to delete this slot.")

    await db.execute(delete(Timetable).where(Timetable.id == slot_id))
    await db.commit()
    return {"deleted": slot_id}


# ── Version History ───────────────────────────────────────────────────────────

@router.get("/{dept_id}/versions")
async def timetable_versions(
    dept_id: str,
    current_user: User = Depends(require_role("admin", "hod")),
    db: AsyncSession = Depends(get_db),
):
    """List recent timetable publish events for a department."""
    if current_user.role == UserRole.hod:
        if str(current_user.department_id) != dept_id:
            raise HTTPException(403, "Access restricted to your department.")

    stmt = (
        select(TimetableVersion)
        .where(TimetableVersion.department_id == dept_id)
        .order_by(TimetableVersion.published_at.desc())
        .limit(20)
    )
    result = await db.execute(stmt)
    versions = result.scalars().all()
    return [
        {
            "id": str(v.id),
            "shift": v.shift,
            "source": v.source,
            "published_by": v.publisher.name if v.publisher else "Unknown",
            "published_at": v.published_at.isoformat() if v.published_at else "",
            "notes": v.notes,
        }
        for v in versions
    ]
