from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models import (
    User, Department, Subject, Timetable, AttendanceSession, AttendanceEntry,
    Correction, LeaveRequest, LeaveApproval, Substitution, Notification,
    NotificationType, AttendanceStatus, UserRole, LeaveStatus,
    SubstitutionStatus, CorrectionStatus,
)
from app.schemas import (
    ActivePeriodRead, StudentRead, AttendanceRecordCreate, AttendanceRecordRead,
    FacultyDashboard, LeaveRequestRead, LeaveReview,
    SubstitutionRequestCreate, SubstitutionRequestRead, SubstitutionReview,
    CorrectionRequestCreate, CorrectionRequestRead, CorrectionReview,
)
from app.services.attendance import get_active_periods_for_faculty
from app.services.audit import create_audit_log
from app.services.notifications import send_notification_email, send_sms
from app.core.formatters import (
    format_student, format_attendance_record, format_leave,
    format_substitution, format_correction, format_timetable_slot_simple,
)
from app.core.utils import _fmt_datetime, _fmt_time
from app.core.config import settings

router = APIRouter()


@router.get("/dashboard", response_model=FacultyDashboard)
async def faculty_dashboard(
    current_user: User = Depends(require_role("faculty", "hod")),
    db: AsyncSession = Depends(get_db),
):
    from app.services.attendance import get_active_periods_for_faculty
    active = await get_active_periods_for_faculty(str(current_user.id), db)

    stmt = select(LeaveRequest).where(
        or_(LeaveRequest.status == "pending_faculty", LeaveRequest.status == "pending_hod")
    ).order_by(LeaveRequest.created_at.desc()).limit(50)
    leaves = (await db.execute(stmt)).scalars().all()

    stmt2 = select(Substitution).where(
        Substitution.substitute_faculty_id == current_user.id,
        Substitution.status == SubstitutionStatus.pending,
    )
    subs = (await db.execute(stmt2)).scalars().all()

    day_stmt = (
        select(Timetable, Subject, Department)
        .join(Subject, Subject.id == Timetable.subject_id)
        .join(Department, Department.id == Timetable.department_id)
        .where(Timetable.faculty_id == current_user.id)
    )
    tt_rows = (await db.execute(day_stmt)).all()
    assigned_courses = [
        {"subject_id": str(t.id), "subject_code": s.code, "subject_name": s.name,
         "department": d.name, "semester": t.semester, "section": t.section}
        for t, s, d in tt_rows
    ]

    return FacultyDashboard(
        today_schedule=[ActivePeriodRead(**p.dict()) for p in active],
        pending_leaves=len(leaves),
        pending_substitutions=len(subs),
        assigned_courses=assigned_courses,
    )


@router.get("/active-periods", response_model=list[ActivePeriodRead])
async def get_active_periods(
    current_user: User = Depends(require_role("faculty", "hod")),
    db: AsyncSession = Depends(get_db),
):
    return await get_active_periods_for_faculty(str(current_user.id), db)


@router.post("/attendance", response_model=AttendanceRecordRead)
async def mark_attendance(
    data: AttendanceRecordCreate,
    current_user: User = Depends(require_role("faculty", "hod")),
    db: AsyncSession = Depends(get_db),
):
    faculty_id_str = str(current_user.id)
    if data.faculty_id != faculty_id_str:
        sub_stmt = select(Substitution).where(
            Substitution.substitute_faculty_id == current_user.id,
            Substitution.date == datetime.strptime(data.date, "%Y-%m-%d").date(),
            Substitution.period_number == data.period_number,
        )
        sub = (await db.execute(sub_stmt)).scalar_one_or_none()
        if not sub or sub.status != SubstitutionStatus.accepted:
            raise HTTPException(status_code=403, detail="Not authorized for this period")

    now = datetime.utcnow()
    parsed_date = datetime.strptime(data.date, "%Y-%m-%d").date()
    if parsed_date != now.date() and not current_user.is_hod:
        raise HTTPException(status_code=400, detail="Can only mark attendance for today")

    # Check if already marked
    existing = (await db.execute(select(AttendanceSession).where(
        func.date(AttendanceSession.date) == parsed_date,
        AttendanceSession.period_number == data.period_number,
        AttendanceSession.subject_id == uuid.UUID(data.subject_id) if data.subject_id else None,
        AttendanceSession.section == data.section,
    ))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already marked for this session")

    session_obj = AttendanceSession(
        id=uuid.uuid4(),
        subject_id=uuid.UUID(data.subject_id) if data.subject_id else None,
        faculty_id=uuid.UUID(data.faculty_id) if data.faculty_id else None,
        date=parsed_date,
        period_number=data.period_number,
        room_no=data.room_no,
        department_id=uuid.UUID(data.department_id) if data.department_id else None,
        semester=data.semester,
        section=data.section,
        marked_at=now,
        marked_by=current_user.id,
    )
    db.add(session_obj)
    await db.commit()
    await db.refresh(session_obj)

    for entry in data.entries:
        student_result = await db.execute(select(User).where(User.id == entry.student_id))
        student = student_result.scalar_one_or_none()
        db_entry = AttendanceEntry(
            id=uuid.uuid4(),
            session_id=session_obj.id,
            student_id=entry.student_id,
            status=entry.status,
            remarks=entry.remarks,
            marked_at=now,
        )
        db.add(db_entry)

        if entry.status == AttendanceStatus.absent and student:
            notif = Notification(
                title="Low Attendance Alert",
                message=f"{student.name} was marked ABSENT for period {data.period_number} today.",
                type=NotificationType.warning,
                user_id=entry.student_id,
                target_role=UserRole.student,
            )
            db.add(notif)
            if student.email:
                await send_notification_email(
                    student.email, "Attendance Marked: Absent",
                    f"Dear {student.name}, your attendance was marked ABSENT for today's class (Period {data.period_number}).",
                )
            if student.parent_phone:
                await send_sms(student.parent_phone,
                    f"Attendance Alert: {student.name} marked ABSENT today. Please check.")

    await db.commit()
    await db.refresh(session_obj)

    await create_audit_log(
        db, str(current_user.id), "MARK_ATTENDANCE", "Attendance Engine",
        f"Marked period {data.period_number} ({len(data.entries)} entries)", "127.0.0.1",
    )

    return await format_attendance_record(session_obj, db)


@router.get("/attendance", response_model=list[AttendanceRecordRead])
async def attendance_history(
    date_from: str = None,
    date_to: str = None,
    subject_id: str = None,
    section: str = None,
    current_user: User = Depends(require_role("faculty", "hod")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AttendanceSession).where(AttendanceSession.faculty_id == current_user.id)
    if date_from:
        stmt = stmt.where(AttendanceSession.date >= datetime.strptime(date_from, "%Y-%m-%d").date())
    if date_to:
        stmt = stmt.where(AttendanceSession.date <= datetime.strptime(date_to, "%Y-%m-%d").date())
    if subject_id:
        stmt = stmt.where(AttendanceSession.subject_id == uuid.UUID(subject_id))
    if section:
        stmt = stmt.where(AttendanceSession.section == section)
    stmt = stmt.order_by(AttendanceSession.date.desc(), AttendanceSession.period_number.desc()).limit(100)
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    return [await format_attendance_record(s, db) for s in sessions]


@router.get("/attendance/today", response_model=list[AttendanceRecordRead])
async def attendance_today(
    current_user: User = Depends(require_role("faculty", "hod")),
    db: AsyncSession = Depends(get_db),
):
    today = datetime.utcnow().date()
    stmt = select(AttendanceSession).where(
        func.date(AttendanceSession.date) == today,
        AttendanceSession.faculty_id == current_user.id,
    ).order_by(AttendanceSession.period_number)
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    return [await format_attendance_record(s, db) for s in sessions]


@router.get("/students/search", response_model=list[StudentRead])
async def student_search(
    query: str = None,
    subject_id: str = None,
    section: str = None,
    current_user: User = Depends(require_role("faculty", "hod")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.role == UserRole.student)
    if current_user.department_id:
        stmt = stmt.where(User.department_id == current_user.department_id)
    if query:
        stmt = stmt.where(or_(
            User.name.ilike(f"%{query}%"),
            User.reg_no.ilike(f"%{query}%"),
            User.roll_no.ilike(f"%{query}%"),
        ))
    if section:
        stmt = stmt.where(User.section == section)
    result = await db.execute(stmt)
    users = result.scalars().all()
    return [await format_student(u, db) for u in users]


@router.get("/my-classes", response_model=list[dict])
async def my_classes(
    current_user: User = Depends(require_role("faculty", "hod")),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Timetable).join(Subject, Subject.id == Timetable.subject_id)
        .where(Timetable.faculty_id == current_user.id)
        .order_by(Timetable.day, Timetable.period_number)
    )
    result = await db.execute(stmt)
    slots = result.scalars().all()
    return [await format_timetable_slot_simple(s, db) for s in slots]


@router.get("/timetable", response_model=list[dict])
async def faculty_timetable(
    current_user: User = Depends(require_role("faculty", "hod")),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Timetable).where(Timetable.faculty_id == current_user.id)
        .order_by(Timetable.day, Timetable.period_number)
    )
    result = await db.execute(stmt)
    slots = result.scalars().all()
    items = [await format_timetable_slot_simple(s, db) for s in slots]
    day_order = {"Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6}
    items.sort(key=lambda x: (day_order.get(x["day"], 7), x["period"]))
    return items


@router.get("/leave-queue", response_model=list[LeaveRequestRead])
async def leave_queue(
    current_user: User = Depends(require_role("faculty", "hod")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(LeaveRequest).where(
        LeaveRequest.status.in_([LeaveStatus.pending_faculty, LeaveStatus.pending_hod])
    ).order_by(LeaveRequest.created_at.desc()).limit(50)
    result = await db.execute(stmt)
    leaves = result.scalars().all()
    return [await format_leave(l, db) for l in leaves]


@router.put("/leaves/{leave_id}/review")
async def review_leave(
    leave_id: str,
    review: LeaveReview,
    current_user: User = Depends(require_role("faculty", "hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))
    leave = result.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    approval = LeaveApproval(
        id=uuid.uuid4(),
        leave_request_id=leave_id,
        approver_id=current_user.id,
        approver_role=current_user.role,
        status=review.status,
        comment=review.comment,
        approved_at=datetime.utcnow(),
    )
    db.add(approval)

    if review.stage == "faculty":
        leave.status = LeaveStatus.rejected if review.status == "rejected" else LeaveStatus.pending_hod
    else:
        leave.status = LeaveStatus.approved if review.status == "approved" else LeaveStatus.rejected

    db.add(leave)
    await db.commit()
    await db.refresh(leave)

    student = (await db.execute(select(User).where(User.id == leave.student_id))).scalar_one_or_none()
    if student:
        notif = Notification(
            title="Leave Request Updated",
            message=f"Your leave request has been {leave.status.value}.",
            type=NotificationType.info,
            user_id=leave.student_id,
            target_role=UserRole.student,
        )
        db.add(notif)
        if student.email:
            await send_notification_email(student.email, "Leave Request Update",
                f"Your leave request has been {leave.status.value}.")
    await db.commit()
    return await format_leave(leave, db)


@router.get("/substitutions", response_model=list[SubstitutionRequestRead])
async def list_substitutions(
    current_user: User = Depends(require_role("faculty")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Substitution).where(
        or_(Substitution.original_faculty_id == current_user.id,
            Substitution.substitute_faculty_id == current_user.id)
    ).order_by(Substitution.created_at.desc()).limit(50)
    result = await db.execute(stmt)
    subs = result.scalars().all()
    return [await format_substitution(s, db) for s in subs]


@router.post("/substitutions", response_model=SubstitutionRequestRead)
async def create_substitution(
    data: SubstitutionRequestCreate,
    current_user: User = Depends(require_role("faculty")),
    db: AsyncSession = Depends(get_db),
):
    sub = Substitution(
        id=uuid.uuid4(),
        original_faculty_id=uuid.UUID(data.requesting_faculty_id),
        substitute_faculty_id=uuid.UUID(data.substitute_faculty_id),
        subject_id=uuid.UUID(data.subject_id) if data.subject_id else None,
        date=datetime.strptime(data.date, "%Y-%m-%d").date() if data.date else None,
        period_number=data.period_number,
        reason=data.reason,
        status=SubstitutionStatus.pending,
        created_at=datetime.utcnow(),
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)

    notif = Notification(
        title="New Substitution Request",
        message=f"{current_user.name} requested a substitute for {data.subject_name}.",
        type=NotificationType.info,
        user_id=data.substitute_faculty_id,
        target_role=UserRole.faculty,
    )
    db.add(notif)
    await db.commit()
    return await format_substitution(sub, db)


@router.put("/substitutions/{sub_id}/respond")
async def respond_substitution(
    sub_id: str,
    action: str,
    current_user: User = Depends(require_role("faculty")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Substitution).where(Substitution.id == sub_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Substitution request not found")
    if sub.substitute_faculty_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to respond")

    if action == "accept":
        sub.status = SubstitutionStatus.accepted
    elif action == "reject":
        sub.status = SubstitutionStatus.rejected_by_sub
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    sub.responded_at = datetime.utcnow()
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return await format_substitution(sub, db)


@router.post("/corrections", response_model=CorrectionRequestRead)
async def create_correction(
    data: CorrectionRequestCreate,
    current_user: User = Depends(require_role("faculty")),
    db: AsyncSession = Depends(get_db),
):
    correction = Correction(
        attendance_session_id=data.attendance_session_id,
        student_id=data.student_id,
        subject_id=data.subject_id,
        date=datetime.strptime(data.date, "%Y-%m-%d").date() if data.date else datetime.utcnow().date(),
        period_number=data.period_number,
        original_status=data.original_status,
        proposed_status=data.proposed_status,
        reason=data.reason,
        status=CorrectionStatus.pending,
        created_at=datetime.utcnow(),
    )
    db.add(correction)
    await db.commit()
    await db.refresh(correction)

    await create_audit_log(
        db, str(current_user.id), "REQUEST_CORRECTION", "Attendance History",
        f"Correction requested for student {data.student_id} in {data.subject_id}",
        "127.0.0.1",
    )

    notif = Notification(
        user_id=current_user.id,
        title="Correction Request Submitted",
        message=f"Correction request for {data.subject_id} on {data.date} has been submitted to HOD.",
        type=NotificationType.info,
        is_read=False,
    )
    db.add(notif)
    await db.commit()

    return await format_correction(correction, db)


@router.get("/corrections", response_model=list[CorrectionRequestRead])
async def faculty_corrections(
    current_user: User = Depends(require_role("faculty")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Correction).where(Correction.student_id == current_user.id).order_by(Correction.created_at.desc()).limit(50)
    result = await db.execute(stmt)
    corrections = result.scalars().all()
    return [await format_correction(c, db) for c in corrections]
