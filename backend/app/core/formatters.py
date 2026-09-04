"""Shared formatting functions for converting SQLAlchemy models to Pydantic schemas."""
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.utils import _fmt_datetime, _fmt_date, _fmt_time
from app.core.database import get_db
from app.models import (
    User, Department, Subject, FacultySubject, Timetable,
    AttendanceSession, AttendanceEntry, AttendanceStatus,
    Correction, LeaveRequest, LeaveApproval, Substitution, Notification,
    NotificationType, UserRole, LeaveStatus, CorrectionStatus,
    SubstitutionStatus, CalendarEventType, BackupType, BackupStatus,
    CalendarEvent, AuditLog, BackupSnapshot,
)
from app.schemas import (
    StudentRead, FacultyRead, DepartmentRead, SubjectRead,
    TimetableSlotRead, AttendanceRecordRead, AttendanceEntryRead,
    AttendanceHistoryEntry, StudentAttendanceSummary, AttendanceSummaryItem,
    CorrectionRequestRead, LeaveRequestRead, FacultyApproval, HodApproval,
    SubstitutionRequestRead, CalendarEventRead, AppNotificationRead,
    AuditLogRead, BackupSnapshotRead,
)


def _get_dept_name(dept_id, db_session):
    """Helper - but we need async, so use the async versions below."""
    pass


async def format_student(user: User, db: AsyncSession) -> StudentRead:
    dept_name = None
    if user.department_id:
        result = await db.execute(select(Department.name).where(Department.id == user.department_id))
        dept_name = result.scalar_one_or_none() or "Unknown"

    stmt = (
        select(AttendanceEntry.status, func.count(AttendanceEntry.id))
        .select_from(AttendanceEntry.__table__.join(AttendanceSession))
        .where(AttendanceEntry.student_id == user.id)
        .group_by(AttendanceEntry.status)
    )
    result = await db.execute(stmt)
    rows = result.all()
    total = sum(r[1] for r in rows) or 1
    present = sum(r[1] for r in rows if r[0] in (AttendanceStatus.present, AttendanceStatus.late, AttendanceStatus.od))
    pct = round((present / total) * 100, 1)

    return StudentRead(
        id=str(user.id), reg_no=user.reg_no or "", roll_no=user.roll_no or "",
        name=user.name, email=user.email, avatar=user.avatar,
        department_id=str(user.department_id) if user.department_id else "",
        department_name=dept_name or "", semester=user.semester or 0,
        section=user.section or "", batch=user.batch or "",
        overall_attendance_pct=pct,
        guardian_name=user.guardian_name or user.father_name or "",
        guardian_phone=user.parent_phone or "",
        father_name=user.father_name, mother_name=user.mother_name,
        phone=user.phone, address=user.address, gender=user.gender,
        dob=user.dob.isoformat() if user.dob else None,
        active=user.is_active,
    )


async def format_faculty(user: User, db: AsyncSession) -> FacultyRead:
    dept_name = None
    if user.department_id:
        result = await db.execute(select(Department.name).where(Department.id == user.department_id))
        dept_name = result.scalar_one_or_none() or ""

    result = await db.execute(select(FacultySubject.subject_id).where(FacultySubject.faculty_id == user.id))
    assigned = [str(r) for r in result.scalars().all()]

    result2 = await db.execute(select(Timetable.subject_id).where(Timetable.faculty_id == user.id))
    for sid in result2.scalars().all():
        if str(sid) not in assigned:
            assigned.append(str(sid))

    return FacultyRead(
        id=str(user.id), employee_id=user.employee_id or "",
        name=user.name, email=user.email, avatar=user.avatar,
        department_id=str(user.department_id) if user.department_id else "",
        department_name=dept_name or "",
        designation="Professor & HOD" if user.is_hod else "Assistant Professor",
        phone=user.phone or "", assigned_subject_ids=assigned,
        is_hod=user.is_hod, active=user.is_active,
    )


async def format_department(dept: Department, db: AsyncSession) -> DepartmentRead:
    student_count = await db.scalar(
        select(func.count(User.id)).where(User.department_id == dept.id, User.role == UserRole.student)
    )
    faculty_count = await db.scalar(
        select(func.count(User.id)).where(User.department_id == dept.id, User.role.in_([UserRole.faculty, UserRole.hod]))
    )
    subjects_count = await db.scalar(select(func.count(Subject.id)).where(Subject.department_id == dept.id))

    stmt = (
        select(AttendanceEntry.status, func.count(AttendanceEntry.id))
        .select_from(AttendanceEntry.__table__.join(AttendanceSession))
        .join(Subject, AttendanceSession.subject_id == Subject.id)
        .join(User, AttendanceEntry.student_id == User.id)
        .where(User.department_id == dept.id)
        .group_by(AttendanceEntry.status)
    )
    result = await db.execute(stmt)
    rows = result.all()
    total = sum(r[1] for r in rows) or 1
    present = sum(r[1] for r in rows if r[0] in (AttendanceStatus.present, AttendanceStatus.late, AttendanceStatus.od))
    avg_pct = round((present / total) * 100, 1)

    hod_id = None
    hod_name = None
    if dept.hod_user_id:
        result2 = await db.execute(select(User).where(User.id == dept.hod_user_id))
        hod_user = result2.scalar_one_or_none()
        if hod_user:
            hod_id = str(hod_user.id)
            hod_name = hod_user.name

    return DepartmentRead(
        id=str(dept.id), code=dept.code, name=dept.name,
        hod_id=hod_id, hod_name=hod_name,
        student_count=student_count or 0, faculty_count=faculty_count or 0,
        subjects_count=subjects_count or 0, avg_attendance_pct=avg_pct,
    )


async def format_subject(subject: Subject, db: AsyncSession) -> SubjectRead:
    dept_name = None
    if subject.department_id:
        result = await db.execute(select(Department.name).where(Department.id == subject.department_id))
        dept_name = result.scalar_one_or_none() or ""

    stmt = (
        select(User.id, User.name)
        .join(FacultySubject, FacultySubject.faculty_id == User.id)
        .where(FacultySubject.subject_id == subject.id)
        .limit(1)
    )
    result = await db.execute(stmt)
    row = result.first()
    faculty_id = str(row[0]) if row else None
    faculty_name = row[1] if row else None

    if not faculty_id:
        stmt2 = (
            select(User.id, User.name)
            .join(Timetable, Timetable.faculty_id == User.id)
            .where(Timetable.subject_id == subject.id)
            .limit(1)
        )
        result2 = await db.execute(stmt2)
        row2 = result2.first()
        if row2:
            faculty_id = str(row2[0])
            faculty_name = row2[1]

    total_classes = await db.scalar(
        select(func.count(AttendanceSession.id)).where(AttendanceSession.subject_id == subject.id)
    )

    return SubjectRead(
        id=str(subject.id), code=subject.code, name=subject.name,
        department_id=str(subject.department_id) if subject.department_id else "",
        department_name=dept_name or "", semester=subject.semester,
        credits=subject.credits, min_attendance_pct=subject.min_attendance_pct,
        total_classes_held=total_classes or 0,
        faculty_id=faculty_id, faculty_name=faculty_name,
    )


async def format_timetable_slot(slot: Timetable, db: AsyncSession) -> TimetableSlotRead:
    faculty_name = ""
    if slot.faculty_id:
        result = await db.execute(select(User).where(User.id == slot.faculty_id))
        f_user = result.scalar_one_or_none()
        if f_user:
            faculty_name = f_user.name

    subject_code = ""
    subject_name = ""
    if slot.subject_id:
        result = await db.execute(select(Subject).where(Subject.id == slot.subject_id))
        subj = result.scalar_one_or_none()
        if subj:
            subject_code = subj.code
            subject_name = subj.name

    dept_name = ""
    dept_id = ""
    if slot.department_id:
        result = await db.execute(select(Department).where(Department.id == slot.department_id))
        dept = result.scalar_one_or_none()
        if dept:
            dept_name = dept.name
            dept_id = str(dept.id)

    return TimetableSlotRead(
        id=str(slot.id),
        day=slot.day if isinstance(slot.day, str) else str(slot.day),
        period_number=slot.period_number,
        start_time=_fmt_time(slot.start_time),
        end_time=_fmt_time(slot.end_time),
        subject_id=str(slot.subject_id) if slot.subject_id else "",
        subject_code=subject_code, subject_name=subject_name,
        faculty_id=str(slot.faculty_id) if slot.faculty_id else "",
        faculty_name=faculty_name, room_no=slot.room_no or "",
        department_id=dept_id,
        semester=slot.semester, section=slot.section,
    )


async def format_attendance_record(session_obj: AttendanceSession, db: AsyncSession) -> AttendanceRecordRead:
    subject_code = ""
    subject_name = ""
    if session_obj.subject_id:
        result = await db.execute(select(Subject).where(Subject.id == session_obj.subject_id))
        subj = result.scalar_one_or_none()
        if subj:
            subject_code = subj.code
            subject_name = subj.name

    faculty_name = ""
    if session_obj.faculty_id:
        result = await db.execute(select(User).where(User.id == session_obj.faculty_id))
        f = result.scalar_one_or_none()
        if f:
            faculty_name = f.name

    result = await db.execute(select(AttendanceEntry).where(AttendanceEntry.session_id == session_obj.id))
    entries_db = result.scalars().all()

    entry_list = []
    counts = {"present": 0, "absent": 0, "late": 0, "od": 0, "leave": 0}
    for entry in entries_db:
        student = None
        s_result = await db.execute(select(User).where(User.id == entry.student_id))
        student = s_result.scalar_one_or_none()
        entry_list.append(AttendanceEntryRead(
            student_id=str(entry.student_id),
            student_reg_no=student.reg_no if student else "",
            student_name=student.name if student else "",
            status=entry.status, remarks=entry.remarks,
        ))
        key = entry.status.value if hasattr(entry.status, "value") else entry.status
        counts[key] = counts.get(key, 0) + 1

    dept_id = ""
    if session_obj.department_id:
        dept_id = str(session_obj.department_id)

    return AttendanceRecordRead(
        id=str(session_obj.id),
        date=session_obj.date.isoformat() if session_obj.date else "",
        period_number=session_obj.period_number,
        subject_id=str(session_obj.subject_id) if session_obj.subject_id else "",
        subject_code=subject_code, subject_name=subject_name,
        faculty_id=str(session_obj.faculty_id) if session_obj.faculty_id else "",
        faculty_name=faculty_name,
        department_id=dept_id,
        semester=session_obj.semester or 0,
        section=session_obj.section or "",
        room_no=session_obj.room_no or "",
        entries=entry_list,
        total_students=len(entry_list),
        present_count=counts["present"], absent_count=counts["absent"],
        late_count=counts["late"], od_count=counts["od"], leave_count=counts["leave"],
        submitted_at=_fmt_datetime(session_obj.marked_at),
        is_locked=False,
    )


async def format_leave(leave: LeaveRequest, db: AsyncSession) -> LeaveRequestRead:
    student = None
    s_result = await db.execute(select(User).where(User.id == leave.student_id))
    student = s_result.scalar_one_or_none()

    faculty_approval = None
    hod_approval = None
    for approval in leave.approvals:
        approver = None
        a_result = await db.execute(select(User).where(User.id == approval.approver_id))
        approver = a_result.scalar_one_or_none()
        appr_dict = {
            "approved_at": _fmt_datetime(approval.approved_at),
            "comment": approval.comment,
        }
        if approval.approver_role.value == "faculty":
            faculty_approval = FacultyApproval(
                faculty_id=str(approval.approver_id) if approval.approver_id else "",
                faculty_name=approver.name if approver else "",
                **appr_dict,
            )
        else:
            hod_approval = HodApproval(
                hod_id=str(approval.approver_id) if approval.approver_id else "",
                hod_name=approver.name if approver else "",
                **appr_dict,
            )

    return LeaveRequestRead(
        id=str(leave.id),
        student_id=str(leave.student_id),
        student_name=student.name if student else "",
        student_reg_no=student.reg_no if student else "",
        department_id=str(leave.department_id) if leave.department_id else "",
        semester=leave.semester or 0,
        section=leave.section or "",
        leave_type=leave.leave_type,
        start_date=leave.start_date.isoformat() if leave.start_date else "",
        end_date=leave.end_date.isoformat() if leave.end_date else "",
        total_days=leave.total_days,
        reason=leave.reason,
        attachment_url=leave.attachment_url,
        status=leave.status,
        faculty_approval=faculty_approval,
        hod_approval=hod_approval,
        created_at=_fmt_datetime(leave.created_at),
    )


async def format_substitution(sub: Substitution, db: AsyncSession) -> SubstitutionRequestRead:
    orig = (await db.execute(select(User).where(User.id == sub.original_faculty_id))).scalar_one_or_none()
    sub_fac = (await db.execute(select(User).where(User.id == sub.substitute_faculty_id))).scalar_one_or_none()
    subject = (await db.execute(select(Subject).where(Subject.id == sub.subject_id))).scalar_one_or_none()

    tt_result = await db.execute(
        select(Timetable).where(
            Timetable.subject_id == sub.subject_id,
            Timetable.faculty_id == sub.original_faculty_id,
        )
    )
    tt_slots = tt_result.scalars().all()
    tt_slot = next(
        (s for s in tt_slots if sub.date and s.day == sub.date.strftime("%A").lower()),
        tt_slots[0] if tt_slots else None,
    )

    return SubstitutionRequestRead(
        id=str(sub.id),
        requesting_faculty_id=str(sub.original_faculty_id),
        requesting_faculty_name=orig.name if orig else "",
        substitute_faculty_id=str(sub.substitute_faculty_id),
        substitute_faculty_name=sub_fac.name if sub_fac else "",
        date=sub.date.isoformat() if sub.date else "",
        period_number=sub.period_number,
        subject_code=subject.code if subject else "",
        subject_name=subject.name if subject else "",
        room_no=tt_slot.room_no if tt_slot else "",
        section=tt_slot.section if tt_slot else "",
        reason=sub.reason or "",
        status=sub.status,
        created_at=_fmt_datetime(sub.created_at),
    )


async def format_correction(corr: Correction, db: AsyncSession) -> CorrectionRequestRead:
    student = (await db.execute(select(User).where(User.id == corr.student_id))).scalar_one_or_none()
    subject = (await db.execute(select(Subject).where(Subject.id == corr.subject_id))).scalar_one_or_none()

    session_obj = (await db.execute(select(AttendanceSession).where(AttendanceSession.id == corr.attendance_session_id))).scalar_one_or_none()

    faculty_name = ""
    faculty_id = ""
    if session_obj and session_obj.faculty_id:
        f_result = await db.execute(select(User).where(User.id == session_obj.faculty_id))
        f_user = f_result.scalar_one_or_none()
        if f_user:
            faculty_name = f_user.name
            faculty_id = str(f_user.id)

    reviewer_name = ""
    if corr.reviewed_by:
        rev_result = await db.execute(select(User).where(User.id == corr.reviewed_by))
        rev_user = rev_result.scalar_one_or_none()
        if rev_user:
            reviewer_name = rev_user.name

    return CorrectionRequestRead(
        id=str(corr.id),
        attendance_record_id=str(corr.attendance_session_id),
        date=corr.date.isoformat() if corr.date else "",
        period_number=corr.period_number,
        subject_code=subject.code if subject else "",
        subject_name=subject.name if subject else "",
        faculty_id=faculty_id,
        faculty_name=faculty_name,
        student_id=str(corr.student_id),
        student_name=student.name if student else "",
        student_reg_no=student.reg_no if student else "",
        original_status=corr.original_status,
        proposed_status=corr.proposed_status,
        reason=corr.reason,
        status=corr.status,
        created_at=_fmt_datetime(corr.created_at),
        reviewed_by=reviewer_name,
        review_comment=corr.review_comment,
    )


async def format_notification(notif: Notification, db: AsyncSession) -> AppNotificationRead:
    user_name = ""
    if notif.user_id:
        result = await db.execute(select(User).where(User.id == notif.user_id))
        user = result.scalar_one_or_none()
        if user:
            user_name = user.name

    return AppNotificationRead(
        id=str(notif.id),
        title=notif.title,
        message=notif.message,
        timestamp=_fmt_datetime(notif.created_at) or "",
        read=notif.is_read,
        type=notif.type,
        link=notif.link,
        target_role=notif.target_role,
    )


async def format_audit_log(log: AuditLog, db: AsyncSession) -> AuditLogRead:
    user_name = ""
    role = ""
    if log.user_id:
        result = await db.execute(select(User).where(User.id == log.user_id))
        user = result.scalar_one_or_none()
        if user:
            user_name = user.name
            role = user.role.value if hasattr(user.role, "value") else user.role

    return AuditLogRead(
        id=str(log.id),
        timestamp=_fmt_datetime(log.created_at),
        user_id=str(log.user_id) if log.user_id else "",
        user_name=user_name,
        role=role,
        action=log.action,
        module=log.module,
        details=log.details,
        ip_address=log.ip_address or "",
        payload_diff=log.payload_diff,
    )


async def format_backup(b: BackupSnapshot, db: AsyncSession) -> BackupSnapshotRead:
    return BackupSnapshotRead(
        id=str(b.id),
        filename=b.filename,
        size=b.size,
        created_at=_fmt_datetime(b.created_at),
        type=b.type,
        status=b.status,
    )


async def format_calendar_event(e: CalendarEvent, db: AsyncSession) -> CalendarEventRead:
    return CalendarEventRead(
        id=str(e.id),
        date=e.date.isoformat() if e.date else "",
        type=e.type,
        title=e.title,
        description=e.description,
    )


async def format_timetable_slot_simple(slot: Timetable, db: AsyncSession) -> dict:
    """Returns timetable slot as dict with subject/faculty names for faculty views."""
    faculty_name = ""
    if slot.faculty_id:
        result = await db.execute(select(User).where(User.id == slot.faculty_id))
        f_user = result.scalar_one_or_none()
        if f_user:
            faculty_name = f_user.name

    subject_code = ""
    subject_name = ""
    if slot.subject_id:
        result = await db.execute(select(Subject).where(Subject.id == slot.subject_id))
        subj = result.scalar_one_or_none()
        if subj:
            subject_code = subj.code
            subject_name = subj.name

    dept_name = ""
    if slot.department_id:
        result = await db.execute(select(Department).where(Department.id == slot.department_id))
        dept = result.scalar_one_or_none()
        if dept:
            dept_name = dept.name

    return {
        "id": str(slot.id),
        "day": slot.day if isinstance(slot.day, str) else str(slot.day),
        "period": slot.period_number,
        "start": _fmt_time(slot.start_time),
        "end": _fmt_time(slot.end_time),
        "subject_id": str(slot.subject_id) if slot.subject_id else "",
        "subject_code": subject_code,
        "subject_name": subject_name,
        "faculty_id": str(slot.faculty_id) if slot.faculty_id else "",
        "faculty_name": faculty_name,
        "room": slot.room_no or "",
        "department": dept_name,
        "semester": slot.semester,
        "section": slot.section,
    }


async def get_student_attendance_summary(student_id: str, db: AsyncSession) -> StudentAttendanceSummary:
    student_result = await db.execute(select(User).where(User.id == student_id))
    student = student_result.scalar_one_or_none()
    if not student:
        raise ValueError("Student not found")

    dept_subjects = await db.execute(
        select(Subject).where(Subject.department_id == student.department_id)
    )
    subjects = dept_subjects.scalars().all()

    breakdown = []
    total_present = 0
    total_held = 0

    for subj in subjects:
        stmt = (
            select(AttendanceEntry.status, func.count(AttendanceEntry.id))
            .select_from(AttendanceEntry.__table__.join(AttendanceSession))
            .where(AttendanceEntry.student_id == student_id, AttendanceSession.subject_id == subj.id)
            .group_by(AttendanceEntry.status)
        )
        result = await db.execute(stmt)
        rows = result.all()

        counts = {"present": 0, "absent": 0, "late": 0, "od": 0, "leave": 0}
        total = 0
        for status, count in rows:
            key = status.value if hasattr(status, "value") else status
            counts[key] = count
            total += count

        present = counts["present"] + counts["late"] + counts["od"]
        pct = round((present / total * 100) if total > 0 else 0, 1)
        total_present += present
        total_held += total

        breakdown.append(AttendanceSummaryItem(
            subject_id=str(subj.id), subject_code=subj.code, subject_name=subj.name,
            classes_held=total, classes_attended=counts["present"],
            classes_absent=counts["absent"], classes_late=counts["late"],
            classes_od=counts["od"], classes_leave=counts["leave"],
            attendance_pct=pct, min_attendance_pct=subj.min_attendance_pct,
            is_below_threshold=pct < subj.min_attendance_pct if total > 0 else False,
        ))

    overall_pct = round((total_present / total_held * 100) if total_held > 0 else 0, 1)

    return StudentAttendanceSummary(
        student_id=str(student.id),
        student_name=student.name,
        student_reg_no=student.reg_no or "",
        overall_attendance_pct=overall_pct,
        subject_breakdown=breakdown,
    )


async def get_student_attendance_history(student_id: str, db: AsyncSession) -> list[AttendanceHistoryEntry]:
    stmt = (
        select(AttendanceSession, AttendanceEntry, Subject, User)
        .join(AttendanceEntry, AttendanceEntry.session_id == AttendanceSession.id)
        .join(Subject, Subject.id == AttendanceSession.subject_id)
        .join(User, User.id == AttendanceSession.faculty_id)
        .where(AttendanceEntry.student_id == student_id)
        .order_by(AttendanceSession.date.desc(), AttendanceSession.period_number)
    )
    result = await db.execute(stmt)
    entries = []
    for sess, entry, subj, faculty in result.all():
        entries.append(AttendanceHistoryEntry(
            date=sess.date.isoformat() if sess.date else "",
            period_number=sess.period_number,
            subject_code=subj.code if subj else "",
            subject_name=subj.name if subj else "",
            faculty_name=faculty.name if faculty else "",
            status=entry.status,
            remarks=entry.remarks,
            marked_at=_fmt_datetime(entry.marked_at),
        ))
    return entries
