from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
import re
from typing import Any

from openpyxl import load_workbook

DAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
PERIODS = tuple(range(1, 6))
SHIFTS = ("First Shift", "Second Shift")


@dataclass(frozen=True)
class Requirement:
    teacher: str
    subject: str
    hours: int
    shift: str


def _key(value: Any) -> str:
    return re.sub(r"[^a-z0-9]", "", str(value or "").lower())


def _find_column(headers: dict[str, str], names: tuple[str, ...]) -> str | None:
    for name in names:
        wanted = _key(name)
        for actual, normalized in headers.items():
            if normalized == wanted or wanted in normalized or normalized in wanted:
                return actual
    return None


def _normalize_shift(value: Any) -> str:
    value = _key(value)
    if value in {"1", "first", "firstshift", "morning", "shift1"}:
        return SHIFTS[0]
    if value in {"2", "second", "secondshift", "evening", "shift2"}:
        return SHIFTS[1]
    raise ValueError(f"Unknown shift '{value}'. Use First Shift or Second Shift.")


def read_requirements(content: bytes) -> list[Requirement]:
    workbook = load_workbook(BytesIO(content), read_only=True, data_only=True)
    sheet = workbook.active
    rows = sheet.iter_rows(values_only=True)
    try:
        raw_headers = next(rows)
    except StopIteration as exc:
        raise ValueError("The Excel file is empty") from exc
    headers = {str(value).strip(): _key(value) for value in raw_headers if value is not None}
    teacher_col = _find_column(headers, ("Teacher_Name", "Teacher", "Faculty", "Instructor"))
    subject_col = _find_column(headers, ("Subject", "Course", "Subject_Name"))
    hours_col = _find_column(headers, ("Required_Hours", "Hours", "Weekly_Hours", "Required"))
    shift_col = _find_column(headers, ("Shift_Assigned", "Shift", "Session"))
    missing = [name for name, column in (("Teacher_Name", teacher_col), ("Subject", subject_col), ("Required_Hours", hours_col), ("Shift_Assigned", shift_col)) if not column]
    if missing:
        raise ValueError(f"Missing required Excel columns: {', '.join(missing)}")

    index = {name: list(headers).index(name) for name in headers}
    requirements: list[Requirement] = []
    for row_number, row in enumerate(rows, start=2):
        if not any(value is not None and str(value).strip() for value in row):
            continue
        teacher = str(row[index[teacher_col]] or "").strip()
        subject = str(row[index[subject_col]] or "").strip()
        try:
            hours = int(float(row[index[hours_col]]))
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Row {row_number}: Required_Hours must be a whole number") from exc
        if not teacher or not subject or hours < 1:
            raise ValueError(f"Row {row_number}: teacher, subject, and positive hours are required")
        requirements.append(Requirement(teacher, subject, hours, _normalize_shift(row[index[shift_col]])))
    if not requirements:
        raise ValueError("No timetable requirements were found in the Excel file")
    return requirements


def generate_timetable(requirements: list[Requirement], sections: list[str]) -> list[dict[str, Any]]:
    if not sections:
        raise ValueError("At least one class or section is required")
    teacher_shifts: dict[str, str] = {}
    for requirement in requirements:
        previous = teacher_shifts.setdefault(requirement.teacher, requirement.shift)
        if previous != requirement.shift:
            raise ValueError(f"Teacher {requirement.teacher} is assigned to both shifts")

    slots = [(day, period, section, shift) for day in DAYS for shift in SHIFTS for period in PERIODS for section in sections]
    teacher_busy: set[tuple[str, str, int]] = set()
    class_busy: set[tuple[str, str, int, str]] = set()
    subject_days: set[tuple[str, str, str]] = set()
    subject_teacher: dict[tuple[str, str], str] = {}
    allocation: list[dict[str, Any]] = []
    work = sorted(requirements, key=lambda item: item.hours, reverse=True)

    def place(requirement_index: int, remaining: int) -> bool:
        if requirement_index == len(work):
            return remaining == 0
        requirement = work[requirement_index]
        if remaining == 0:
            return place(requirement_index + 1, work[requirement_index + 1].hours if requirement_index + 1 < len(work) else 0)
        for day, period, section, shift in slots:
            if shift != requirement.shift:
                continue
            teacher_key = (requirement.teacher, day, period)
            class_key = (section, day, period, shift)
            day_subject_key = (section, day, requirement.subject)
            mapping_key = (section, requirement.subject)
            if teacher_key in teacher_busy or class_key in class_busy or day_subject_key in subject_days:
                continue
            mapped_teacher = subject_teacher.get(mapping_key)
            if mapped_teacher and mapped_teacher != requirement.teacher:
                continue
            teacher_busy.add(teacher_key)
            class_busy.add(class_key)
            subject_days.add(day_subject_key)
            subject_teacher[mapping_key] = requirement.teacher
            allocation.append({"day": day, "period": period, "section": section, "shift": shift, "teacher": requirement.teacher, "subject": requirement.subject})
            if place(requirement_index, remaining - 1):
                return True
            allocation.pop()
            teacher_busy.remove(teacher_key)
            class_busy.remove(class_key)
            subject_days.remove(day_subject_key)
            if not any(item["section"] == section and item["subject"] == requirement.subject for item in allocation):
                subject_teacher.pop(mapping_key, None)
        return False

    if not place(0, work[0].hours):
        raise ValueError("No feasible timetable satisfies all hours, shift, collision, and daily subject constraints")
    return allocation
