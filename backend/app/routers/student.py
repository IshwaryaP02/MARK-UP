from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models import (
    User, Department, Subject, Timetable, AttendanceSession, AttendanceEntry,
    LeaveRequest, LeaveApproval, Substitution, Notification,
    NotificationType, AttendanceStatus, UserRole, LeaveStatus,
    SubstitutionStatus, CalendarEvent, CalendarEventType,
)
from app.schemas import (
    StudentRead, StudentDashboard, StudentAttendanceSummary,
    AttendanceHistoryEntry, LeaveRequestCreate, LeaveRequestRead,
    AppNotificationRead, StudentUpdate, TimetableSlotRead,
    FacultyApproval, HodApproval,
)
from app.core.formatters import (
    format_student, format_attendance_record, format_leave,
    format_notification, format_timetable_slot, get_student_attendance_summary,
    get_student_attendance_history,
)
from app.core.utils import _fmt_datetime, _fmt_date, _fmt_time
from app.services.audit import create_audit_log
from app.services.notifications import send_notification_email

router = APIRouter()


@router.get("/dashboard", response_model=StudentDashboard)
async def student_dashboard(
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    summary = await get_student_attendance_summary(str(current_user.id), db)

    today_name = datetime.utcnow().strftime("%A")
    stmt = (
        select(Timetable).join(Subject)
        .where(Timetable.faculty_id == current_user.id)
        .order_by(Timetable.day, Timetable.period_number)
    )
    # Student's timetable
    tt_stmt = select(Timetable).where(
        Timetable.section == current_user.section,
        Timetable.semester == current_user.semester,
        Timetable.department_id == current_user.department_id,
    ).order_by(Timetable.day, Timetable.period_number)
    tt_result = await db.execute(tt_stmt)
    slots = tt_result.scalars().all()
    today_schedule = []
    for s in slots:
        if s.day == today_name:
            sub_result = await db.execute(select(Subject).where(Subject.id == s.subject_id))
            subj = sub_result.scalar_one_or_none()
            today_schedule.append({
                "period": s.period_number, "subject_code": subj.code if subj else "",
                "subject_name": subj.name if subj else "", "start": _fmt_time(s.start_time),
                "end": _fmt_time(s.end_time), "room": s.room_no or "",
            })

    leave_stmt = select(LeaveRequest).where(
        LeaveRequest.student_id == current_user.id,
        LeaveRequest.status.in_(["pending_faculty", "pending_hod"]),
    )
    active_leaves = len((await db.execute(leave_stmt)).scalars().all())

    notif_stmt = select(Notification).where(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    )
    notifications = (await db.execute(notif_stmt)).scalars().all()

    return StudentDashboard(
        overall_attendance_pct=summary.overall_attendance_pct,
        subject_breakdown=summary.subject_breakdown,
        today_schedule=today_schedule,
        active_leaves=active_leaves,
        notifications=[await format_notification(n, db) for n in notifications],
    )


@router.get("/attendance/summary", response_model=StudentAttendanceSummary)
async def attendance_summary(
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    return await get_student_attendance_summary(str(current_user.id), db)


@router.get("/attendance/history", response_model=list[AttendanceHistoryEntry])
async def attendance_history(
    subject_id: str = None,
    date_from: str = None,
    date_to: str = None,
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    return await get_student_attendance_history(str(current_user.id), db)


@router.get("/timetable", response_model=list[dict])
async def student_timetable(
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Timetable).where(
        Timetable.section == current_user.section,
        Timetable.semester == current_user.semester,
        Timetable.department_id == current_user.department_id,
    ).order_by(Timetable.day, Timetable.period_number)
    result = await db.execute(stmt)
    slots = result.scalars().all()
    items = [await _timetable_to_dict(s, db) for s in slots]
    day_order = {"Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6}
    items.sort(key=lambda x: (day_order.get(x["day"], 7), x["period"]))
    return items


@router.get("/leaves", response_model=list[LeaveRequestRead])
async def my_leaves(
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(LeaveRequest).where(
        LeaveRequest.student_id == current_user.id
    ).order_by(LeaveRequest.created_at.desc())
    result = await db.execute(stmt)
    leaves = result.scalars().all()
    return [await format_leave(l, db) for l in leaves]


@router.post("/leaves", response_model=LeaveRequestRead)
async def apply_leave(
    data: LeaveRequestCreate,
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    leave = LeaveRequest(
        id=uuid.uuid4(),
        student_id=current_user.id,
        department_id=current_user.department_id,
        semester=current_user.semester,
        section=current_user.section,
        leave_type=data.leave_type,
        start_date=datetime.strptime(data.start_date, "%Y-%m-%d").date(),
        end_date=datetime.strptime(data.end_date, "%Y-%m-%d").date(),
        total_days=data.total_days,
        reason=data.reason,
        attachment_url=data.attachment_url,
        status=LeaveStatus.pending_faculty,
        created_at=datetime.utcnow(),
    )
    db.add(leave)
    await db.commit()
    await db.refresh(leave)
    return await format_leave(leave, db)


@router.get("/notifications", response_model=list[AppNotificationRead])
async def my_notifications(
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Notification).where(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50)
    result = await db.execute(stmt)
    notifs = result.scalars().all()
    return [await format_notification(n, db) for n in notifs]


@router.get("/profile", response_model=StudentRead)
async def student_profile(
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    return await format_student(current_user, db)


@router.put("/profile", response_model=StudentRead)
async def update_profile(
    data: StudentUpdate,
    current_user: User = Depends(require_role("student")),
    db: AsyncSession = Depends(get_db),
):
    update_data = data.dict(exclude_unset=True)
    for key, val in update_data.items():
        if hasattr(current_user, key):
            setattr(current_user, key, val)
    await db.commit()
    await db.refresh(current_user)
    await create_audit_log(
        db, str(current_user.id), "UPDATE_PROFILE", "Student Profile",
        "Updated profile information", "127.0.0.1",
    )
    return await format_student(current_user, db)


async def _timetable_to_dict(slot: Timetable, db: AsyncSession) -> dict:
    faculty_name = ""
    if slot.faculty_id:
        result = await db.execute(select(User).where(User.id == slot.faculty_id))
        f = result.scalar_one_or_none()
        if f:
            faculty_name = f.name

    subj = None
    if slot.subject_id:
        result = await db.execute(select(Subject).where(Subject.id == slot.subject_id))
        subj = result.scalar_one_or_none()

    return {
        "id": str(slot.id),
        "day": slot.day if isinstance(slot.day, str) else str(slot.day),
        "period": slot.period_number,
        "start": _fmt_time(slot.start_time),
        "end": _fmt_time(slot.end_time),
        "subject_id": str(slot.subject_id) if slot.subject_id else "",
        "subject_code": subj.code if subj else "",
        "subject_name": subj.name if subj else "",
        "faculty_id": str(slot.faculty_id) if slot.faculty_id else "",
        "faculty_name": faculty_name,
        "room": slot.room_no or "",
        "department": "",
        "semester": slot.semester,
        "section": slot.section,
    }
