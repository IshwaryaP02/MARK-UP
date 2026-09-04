from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models import (
    User, Department, Subject, Timetable, AttendanceSession, AttendanceEntry,
    Correction, LeaveRequest, LeaveApproval, Substitution, Notification,
    NotificationType, AttendanceStatus, UserRole, LeaveStatus,
    CorrectionStatus, SubstitutionStatus, CalendarEvent, AcademicSession,
)
from app.schemas import (
    HODDashboard, CorrectionRequestRead, CorrectionReview,
    LeaveRequestRead, LeaveReview, SubstitutionRequestRead, SubstitutionReview,
    FacultyMonitoring, DepartmentAnalysis,
)
from app.core.formatters import (
    format_correction, format_leave, format_substitution,
)
from app.core.utils import _fmt_datetime, _fmt_date, _fmt_time, _fmt_pct
from app.services.audit import create_audit_log

router = APIRouter()


@router.get("/dashboard", response_model=HODDashboard)
async def hod_dashboard(
    current_user: User = Depends(require_role("hod")),
    db: AsyncSession = Depends(get_db),
):
    # Department stats
    stmt = select(func.count()).select_from(User).where(
        User.department_id == current_user.department_id,
        User.role == UserRole.student,
    )
    student_total = (await db.execute(stmt)).scalar() or 0

    faculty_stmt = select(func.count()).select_from(User).where(
        User.department_id == current_user.department_id,
        User.role.in_([UserRole.faculty, UserRole.hod]),
    )
    faculty_total = (await db.execute(faculty_stmt)).scalar() or 0

    attendance_stmt = (
        select(AttendanceEntry.status, func.count())
        .select_from(AttendanceEntry.__table__.join(AttendanceSession))
        .join(User, AttendanceEntry.student_id == User.id)
        .where(User.department_id == current_user.department_id)
        .group_by(AttendanceEntry.status)
    )
    att_rows = (await db.execute(attendance_stmt)).all()
    total_e = sum(r[1] for r in att_rows) or 1
    present_e = sum(r[1] for r in att_rows if r[0] in (AttendanceStatus.present, AttendanceStatus.late, AttendanceStatus.od))
    avg_attendance = round((present_e / total_e) * 100, 1)

    # Pending leaves
    leave_stmt = select(LeaveRequest).where(
        LeaveRequest.department_id == current_user.department_id,
        LeaveRequest.status == LeaveStatus.pending_hod,
    ).order_by(LeaveRequest.created_at.desc()).limit(50)
    leaves = (await db.execute(leave_stmt)).scalars().all()

    # Pending substitutions
    sub_stmt = select(Substitution).where(
        Substitution.status == SubstitutionStatus.pending,
    ).order_by(Substitution.created_at.desc()).limit(50)
    subs = (await db.execute(sub_stmt)).scalars().all()

    # Attendance trend (last 7 days)
    trend = []
    for i in range(7):
        day = datetime.utcnow().date() - __import__("datetime").timedelta(days=i)
        day_stmt = (
            select(AttendanceEntry.status, func.count())
            .select_from(AttendanceEntry.__table__.join(AttendanceSession))
            .join(User, AttendanceEntry.student_id == User.id)
            .where(
                User.department_id == current_user.department_id,
                func.date(AttendanceSession.date) == day,
            )
            .group_by(AttendanceEntry.status)
        )
        day_rows = (await db.execute(day_stmt)).all()
        day_total = sum(r[1] for r in day_rows) or 1
        day_present = sum(r[1] for r in day_rows if r[0] in (AttendanceStatus.present, AttendanceStatus.late, AttendanceStatus.od))
        trend.append({
            "date": day.isoformat(),
            "attendance_pct": round((day_present / day_total) * 100, 1),
        })
    trend.reverse()

    # Flagged students (low attendance)
    flagged = []
    student_stmt = select(User).where(
        User.department_id == current_user.department_id,
        User.role == UserRole.student,
    )
    students = (await db.execute(student_stmt)).scalars().all()
    for s in students:
        att_stmt = (
            select(AttendanceEntry.status, func.count())
            .select_from(AttendanceEntry.__table__.join(AttendanceSession))
            .where(AttendanceEntry.student_id == s.id)
            .group_by(AttendanceEntry.status)
        )
        rows = (await db.execute(att_stmt)).all()
        t = sum(r[1] for r in rows) or 1
        p = sum(r[1] for r in rows if r[0] in (AttendanceStatus.present, AttendanceStatus.late, AttendanceStatus.od))
        pct = round((p / t) * 100, 1)
        if pct < 75:
            flagged.append({"student_id": str(s.id), "name": s.name, "reg_no": s.reg_no, "attendance_pct": pct})

    pending_leaves_out = []
    for l in leaves:
        student = (
            await db.execute(select(User).where(User.id == l.student_id))
        ).scalar_one_or_none()
        pending_leaves_out.append({
            "id": str(l.id),
            "student_name": student.name if student else "",
            "student_reg_no": student.reg_no if student and student.reg_no else "",
            "leave_type": l.leave_type,
            "start_date": _fmt_date(l.start_date) if l.start_date else "",
        })

    pending_subs_out = []
    for s in subs:
        requester = (
            await db.execute(select(User).where(User.id == s.original_faculty_id))
        ).scalar_one_or_none()
        subject = (
            await db.execute(select(Subject).where(Subject.id == s.subject_id))
        ).scalar_one_or_none()
        pending_subs_out.append({
            "id": str(s.id),
            "requesting_faculty_name": requester.name if requester else "",
            "subject_name": subject.name if subject else "",
        })

    return HODDashboard(
        department_stats={
            "total_students": student_total,
            "total_faculty": faculty_total,
            "avg_attendance_pct": avg_attendance,
        },
        pending_leaves=pending_leaves_out,
        pending_substitutions=pending_subs_out,
        attendance_trend=trend,
        flagged_students=flagged,
    )


@router.get("/departments/{dept_id}/analysis", response_model=DepartmentAnalysis)
async def department_analysis(
    dept_id: str,
    current_user: User = Depends(require_role("hod")),
    db: AsyncSession = Depends(get_db),
):
    dept = (await db.execute(select(Department).where(Department.id == dept_id))).scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    # Only HOD of this department can access
    if current_user.department_id != dept.id:
        raise HTTPException(status_code=403, detail="Not authorized for this department")

    stmt = select(User).where(
        User.department_id == dept_id,
        User.role == UserRole.student,
    )
    students = (await db.execute(stmt)).scalars().all()

    dept_name_result = await db.execute(select(Department.name).where(Department.id == dept_id))
    dept_name = dept_name_result.scalar_one_or_none() or ""

    dept_read = DepartmentAnalysis(
        id=str(dept.id), code=dept.code, name=dept.name,
        student_count=len(students), faculty_count=0,
        avg_attendance_pct=0, flagged_students=[],
    )

    flagged = []
    for s in students:
        att_stmt = (
            select(AttendanceEntry.status, func.count())
            .select_from(AttendanceEntry.__table__.join(AttendanceSession))
            .where(AttendanceEntry.student_id == s.id)
            .group_by(AttendanceEntry.status)
        )
        rows = (await db.execute(att_stmt)).all()
        t = sum(r[1] for r in rows) or 1
        p = sum(r[1] for r in rows if r[0] in (AttendanceStatus.present, AttendanceStatus.late, AttendanceStatus.od))
        pct = round((p / t) * 100, 1)
        if pct < 75:
            flagged.append({"student_id": str(s.id), "name": s.name, "reg_no": s.reg_no, "attendance_pct": pct})

    dept_read.avg_attendance_pct = round(sum(f["attendance_pct"] for f in flagged) / len(flagged), 1) if flagged else 0
    dept_read.flagged_students = flagged
    return dept_read


@router.get("/all-classes", response_model=list[dict])
async def all_classes(
    current_user: User = Depends(require_role("hod")),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Timetable, Subject, User, Department)
        .join(Subject, Subject.id == Timetable.subject_id)
        .join(User, User.id == Timetable.faculty_id)
        .join(Department, Department.id == Timetable.department_id)
        .where(Timetable.department_id == current_user.department_id)
        .order_by(Timetable.day, Timetable.period_number)
    )
    result = await db.execute(stmt)
    rows = result.all()
    day_order = {"Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6}
    items = []
    for t, s, f, d in rows:
        items.append({
            "day": t.day if isinstance(t.day, str) else str(t.day),
            "period": t.period_number, "start": _fmt_time(t.start_time), "end": _fmt_time(t.end_time),
            "subject_code": s.code, "subject_name": s.name,
            "faculty_name": f.name, "room": t.room_no or "",
            "department": d.name, "semester": t.semester, "section": t.section,
        })
    items.sort(key=lambda x: (day_order.get(x["day"], 7), x["period"]))
    return items


@router.get("/faculty-monitoring", response_model=list[FacultyMonitoring])
async def faculty_monitoring(
    current_user: User = Depends(require_role("hod")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(
        User.department_id == current_user.department_id,
        User.role == UserRole.faculty,
    )
    result = await db.execute(stmt)
    faculty_list = result.scalars().all()

    output = []
    for fac in faculty_list:
        subject_stmt = select(Subject).join(FacultySubject).where(FacultySubject.faculty_id == fac.id)
        subjects = (await db.execute(subject_stmt)).scalars().all()

        classes_stmt = select(func.count(AttendanceSession.id)).where(AttendanceSession.faculty_id == fac.id)
        classes_conducted = (await db.execute(classes_stmt)).scalar() or 0

        att_stmt = (
            select(AttendanceEntry.status, func.count())
            .select_from(AttendanceEntry.__table__.join(AttendanceSession))
            .where(AttendanceSession.faculty_id == fac.id)
            .group_by(AttendanceEntry.status)
        )
        rows = (await db.execute(att_stmt)).all()
        total = sum(r[1] for r in rows) or 1
        present = sum(r[1] for r in rows if r[0] in (AttendanceStatus.present, AttendanceStatus.late, AttendanceStatus.od))
        avg_pct = round((present / total) * 100, 1)

        dept_name = ""
        if fac.department_id:
            dept_result = await db.execute(select(Department.name).where(Department.id == fac.department_id))
            dept = dept_result.scalar_one_or_none()
            if dept:
                dept_name = dept.name

        output.append(FacultyMonitoring(
            faculty_id=str(fac.id), faculty_name=fac.name,
            department_name=dept_name,
            subjects=[{"id": str(s.id), "code": s.code, "name": s.name} for s in subjects],
            total_classes_conducted=classes_conducted,
            avg_student_attendance=avg_pct,
        ))

    return output


@router.get("/corrections", response_model=list[CorrectionRequestRead])
async def list_corrections(
    current_user: User = Depends(require_role("hod")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Correction).where(Correction.status == CorrectionStatus.pending).order_by(Correction.created_at.desc()).limit(100)
    result = await db.execute(stmt)
    corrections = result.scalars().all()
    return [await format_correction(c, db) for c in corrections]


@router.put("/corrections/{corr_id}/review")
async def review_correction(
    corr_id: str,
    review: CorrectionReview,
    current_user: User = Depends(require_role("hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Correction).where(Correction.id == corr_id))
    corr = result.scalar_one_or_none()
    if not corr:
        raise HTTPException(status_code=404, detail="Correction request not found")

    corr.status = review.status
    corr.reviewed_by = current_user.id
    corr.review_comment = review.comment
    corr.reviewed_at = datetime.utcnow()

    if review.status == CorrectionStatus.approved:
        session_result = await db.execute(select(AttendanceSession).where(AttendanceSession.id == corr.attendance_session_id))
        session_obj = session_result.scalar_one_or_none()
        if session_obj:
            entry_result = await db.execute(
                select(AttendanceEntry).where(
                    AttendanceEntry.session_id == session_obj.id,
                    AttendanceEntry.student_id == corr.student_id,
                )
            )
            entry = entry_result.scalar_one_or_none()
            if entry:
                entry.status = corr.proposed_status
                await db.commit()

    db.add(corr)
    await db.commit()
    await db.refresh(corr)
    await create_audit_log(
        db, str(current_user.id), "REVIEW_CORRECTION", "HOD Approvals",
        f"Correction {corr_id} marked as {review.status}", "127.0.0.1",
    )
    return await format_correction(corr, db)


@router.get("/leaves", response_model=list[LeaveRequestRead])
async def list_leaves(
    current_user: User = Depends(require_role("hod")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(LeaveRequest).where(LeaveRequest.department_id == current_user.department_id)
    result = await db.execute(stmt)
    leaves = result.scalars().all()
    return [await format_leave(l, db) for l in leaves]


@router.put("/leaves/{leave_id}/review")
async def review_leave(
    leave_id: str,
    review: LeaveReview,
    current_user: User = Depends(require_role("hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))
    leave = result.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if leave.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Not authorized for this department")

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

    leave.status = LeaveStatus.approved if review.status == "approved" else LeaveStatus.rejected
    db.add(leave)
    await db.commit()
    await db.refresh(leave)

    from app.services.notifications import send_notification_email
    student_result = await db.execute(select(User).where(User.id == leave.student_id))
    student = student_result.scalar_one_or_none()
    if student and student.email:
        await send_notification_email(
            student.email, "Leave Request Update",
            f"Your leave request has been {leave.status.value} by HOD.",
        )
    return await format_leave(leave, db)


@router.get("/substitutions", response_model=list[SubstitutionRequestRead])
async def list_substitutions(
    current_user: User = Depends(require_role("hod")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Substitution).order_by(Substitution.created_at.desc()).limit(100)
    result = await db.execute(stmt)
    subs = result.scalars().all()
    return [await format_substitution(s, db) for s in subs]


@router.put("/substitutions/{sub_id}/review")
async def review_substitution(
    sub_id: str,
    review: SubstitutionReview,
    current_user: User = Depends(require_role("hod")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Substitution).where(Substitution.id == sub_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Substitution request not found")

    if review.action == "approve":
        sub.status = SubstitutionStatus.approved_by_hod
    elif review.action == "reject":
        sub.status = SubstitutionStatus.rejected_by_sub
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return await format_substitution(sub, db)
