from datetime import datetime, date, time, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.core.config import settings
from app.models import (
    User, Department, Subject, FacultySubject, Timetable, CalendarEvent,
    AttendanceSession, AttendanceEntry, Correction, LeaveRequest,
    Substitution, Notification, AuditLog, BackupSnapshot, AttendanceStatus, UserRole
)
from app.schemas import (
    ActivePeriodRead, AttendanceSummaryItem, StudentAttendanceSummary,
    AttendanceHistoryEntry, AttendanceRecordRead, AttendanceEntryRead,
    TimetableSlotRead, FacultyMonitoring,
)


class Grader:
    GRACE_MINUTES = 15


def _time_from_str(ts: str) -> time:
    """Parse '09:00 AM' format to datetime.time."""
    for fmt in ("%I:%M %p", "%H:%M"):
        try:
            return datetime.strptime(ts.strip(), fmt).time()
        except ValueError:
            continue
    raise ValueError(f"Cannot parse time: {ts}")


def _format_time(t: time) -> str:
    """Format datetime.time to '09:00 AM'."""
    dt = datetime.combine(date.today(), t)
    return dt.strftime("%I:%M %p").lstrip("0")


def _now_local() -> datetime:
    return datetime.utcnow()


async def get_active_periods_for_faculty(
    faculty_id: str,
    db: AsyncSession,
    now: datetime | None = None,
) -> list[ActivePeriodRead]:
    """
    Return timetable slots that are currently active or within the grace window
    for the given faculty member.
    Applies: timetable join + calendar + substitutions logic.
    Only faculty assigned to teach the slot (or substitute) can see it.
    """
    now = now or _now_local()
    today_name = now.strftime("%A")
    current_time = now.time()

    # Fetch today's timetable for this faculty
    stmt = (
        select(Timetable).where(
            Timetable.faculty_id == faculty_id,
            Timetable.day == today_name,
        )
    )
    result = await db.execute(stmt)
    slots = result.scalars().all()

    # Fetch calendar events for today
    stmt = select(CalendarEvent).where(
        func.date(CalendarEvent.date) == now.date()
    )
    result = await db.execute(stmt)
    calendar_events = {e.date.isoformat(): e for e in result.scalars().all()}

    # Fetch active substitutions for today
    stmt = (
        select(Substitution).where(
            Substitution.substitute_faculty_id == faculty_id,
            Substitution.date == now.date(),
            Substitution.status == "accepted",
        )
    )
    result = await db.execute(stmt)
    substitutions = {
        (s.period_number, str(s.subject_id)): s for s in result.scalars().all()
    }

    active_periods = []
    for slot in slots:
        start_t = _time_from_str(_format_time(slot.start_time)) if isinstance(slot.start_time, str) else slot.start_time
        end_t = _time_from_str(_format_time(slot.end_time)) if isinstance(slot.end_time, str) else slot.end_time

        # Check if within grace window
        grace_end = (datetime.combine(now.date(), end_t) + timedelta(minutes=Grader.GRACE_MINUTES)).time()

        is_current_or_grace = current_time >= start_t and current_time <= grace_end
        if not is_current_or_grace:
            continue

        sub_key = (slot.period_number, str(slot.subject_id))
        is_subst = sub_key in substitutions

        # Load subject
        result2 = await db.execute(select(Subject).where(Subject.id == slot.subject_id))
        subject = result2.scalar_one_or_none()

        # Load faculty (original or self)
        faculty_id_val = str(slot.faculty_id) if slot.faculty_id else faculty_id
        result3 = await db.execute(select(User).where(User.id == faculty_id_val))
        faculty_user = result3.scalar_one_or_none()

        # Load department
        dept_name = None
        if slot.department_id:
            result4 = await db.execute(select(Department).where(Department.id == slot.department_id))
            dept = result4.scalar_one_or_none()
            if dept:
                dept_name = dept.name

        active_periods.append(ActivePeriodRead(
            date=now.date().isoformat(),
            period_number=slot.period_number,
            subject_id=str(slot.subject_id) if slot.subject_id else "",
            subject_code=subject.code if subject else "",
            subject_name=subject.name if subject else "",
            faculty_id=faculty_id_val,
            faculty_name=faculty_user.name if faculty_user else "",
            room_no=slot.room_no or "",
            department_id=str(slot.department_id) if slot.department_id else "",
            semester=slot.semester,
            section=slot.section,
            start_time=_format_time(start_t),
            end_time=_format_time(end_t),
        ))

    return active_periods
