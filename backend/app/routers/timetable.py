from __future__ import annotations

import io
import re
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from PIL import Image

from app.dependencies.auth import require_role
from app.models import User
from app.services.timetable_allocator import generate_timetable, read_requirements

router = APIRouter()


def _department_for(user: User, requested: str | None) -> str:
    if user.role.value == "hod":
        if not user.department_id:
            raise HTTPException(status_code=400, detail="Your HOD account has no department assigned")
        return str(user.department_id)
    if not requested:
        raise HTTPException(status_code=422, detail="Admin must specify a target department")
    return requested


def _parse_ocr_rows(text: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    days = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday"}
    for line in text.splitlines():
        parts = [part.strip() for part in re.split(r"[,|\t;]+", line) if part.strip()]
        if len(parts) < 3:
            continue
        day = next((part.title() for part in parts if part.lower() in days), "")
        period_match = next((re.search(r"(?:period|p)?\s*([1-5])$", part.lower()) for part in parts), None)
        if not day or not period_match:
            continue
        period_index = next(i for i, part in enumerate(parts) if re.search(r"(?:period|p)?\s*[1-5]$", part.lower()))
        values = [part for i, part in enumerate(parts) if i not in (period_index, next(i for i, value in enumerate(parts) if value.lower() == day.lower()))]
        rows.append({
            "day": day,
            "period": period_match.group(1),
            "subject": values[0] if values else "",
            "teacher": values[1] if len(values) > 1 else "",
            "section": values[2] if len(values) > 2 else "",
        })
    return rows


@router.post("/ocr")
async def timetable_ocr(
    file: Annotated[UploadFile, File(...)],
    department_id: Annotated[str | None, Form()] = None,
    current_user: User = Depends(require_role("admin", "hod")),
):
    target_department = _department_for(current_user, department_id)
    content = await file.read()
    try:
        import pytesseract
        image = Image.open(io.BytesIO(content))
        text = pytesseract.image_to_string(image)
    except ImportError as exc:
        raise HTTPException(status_code=503, detail="Install pytesseract and the Tesseract executable to use OCR") from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not read timetable image: {exc}") from exc
    return {"department_id": target_department, "raw_text": text, "rows": _parse_ocr_rows(text)}


@router.post("/allocate")
async def timetable_allocate(
    file: Annotated[UploadFile, File(...)],
    sections: Annotated[str, Form()],
    total_classes: Annotated[int, Form()] = 0,
    department_id: Annotated[str | None, Form()] = None,
    current_user: User = Depends(require_role("admin", "hod")),
):
    target_department = _department_for(current_user, department_id)
    section_list = [value.strip() for value in sections.split(",") if value.strip()]
    if total_classes and total_classes != len(section_list):
        raise HTTPException(status_code=422, detail="total_classes must match the number of supplied sections")
    if not section_list and total_classes > 0:
        section_list = [f"Class {index}" for index in range(1, total_classes + 1)]
    try:
        requirements = read_requirements(await file.read())
        allocation = generate_timetable(requirements, section_list)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {
        "department_id": target_department,
        "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "periods_per_shift": 5,
        "period_minutes": 50,
        "allocation": allocation,
        "total_slots": len(allocation),
    }
