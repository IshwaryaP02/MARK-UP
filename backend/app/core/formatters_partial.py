from datetime import datetime, date, time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from app.models import (
    User, Department, Subject, FacultySubject, Timetable,
    AttendanceSession, AttendanceEntry, AttendanceStatus,
    Correction, LeaveRequest, LeaveApproval,
    Substitution, Notification, AuditLog, BackupSnapshot,
    CalendarEvent, NotificationType, UserRole,
)
from app.schemas import (
    StudentRead, FacultyRead, DepartmentRead, SubjectRead,
    TimetableSlotRead, AttendanceEntryRead, AttendanceRecordRead,
    AttendanceSummaryItem, StudentAttendanceSummary, AttendanceHistoryEntry,
    CorrectionRequestRead, LeaveRequestRead, FacultyApproval, HodApproval,
    SubstitutionRequestRead, CalendarEventRead, AppNotificationRead,
    AuditLogRead, BackupSnapshotRead, ActivePeriodRead,
)
from app.core.utils import _fmt_datetime, _fmt_date, _fmt_time, _fmt_pct


async def format_student(user: User, db: AsyncSession) -> StudentRead:
    dept_name = None
    if user.department_id:
        result = await db.execute(select(Department.name).where(Department.id == user.department_id))
        dept_name = result.scalar_one_or_none() or "Unknown"

    stmt = (
        select(AttendanceEntry.status, func.count(AttendanceEntry.id))
        .select_from(AttendanceEntry.__table__.join(AttendanceSession))
        .where(
            AttendanceEntry.student_id == user.id,
            AttendanceSession.subject_id.in_(
                select(Subject.id).where(Subject.department_id == user.department_id)
            ),
        )
        .group_by(AttendanceEntry.status)
    )
    result = await db.execute(stmt)
    rows = result.all()

    total = sum(r[1] for r in rows) or 1
    present_count = sum(r[1] for r in rows if r[0] in (AttendanceStatus.present, AttendanceStatus.late, AttendanceStatus.od))
    pct = _fmt_pct((present_count / total) * 100)

    guardian_phone = user.parent_phone or user.guardian_name or ""

    return StudentRead(
        id=str(user.id),
        reg_no=user.reg_no or "",
        roll_no=user.roll_no or "",
        name=user.name,
        email=user.email,
        avatar=user.avatar,
        department_id=str(user.department_id) if user.department_id else "",
        department_name=dept_name or "",
        semester=user.semester or 0,
        section=user.section or "",
        batch=user.batch or "",
        overall_attendance_pct=pct,
        guardian_name=user.guardian_name or user.father_name or "",
        guardian_phone=guardian_phone,
        father_name=user.father_name,
        mother_name=user.mother_name,
        phone=user.phone,
        address=user.address,
        gender=user.gender,
        dob=user.dob.isoformat() if user.dob else None,
        active=user.is_active,
    )
