from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models import (
    User, Department, Subject, AttendanceSession, AttendanceEntry,
    AttendanceStatus, UserRole, LeaveRequest, LeaveStatus,
)
from app.schemas import ReportRequest, StudentAttendanceSummary, AttendanceSummaryItem
from app.core.formatters import get_student_attendance_summary
from app.core.utils import _fmt_datetime, _fmt_date
import json
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from io import BytesIO
from fastapi.responses import StreamingResponse

router = APIRouter()


@router.post("/generate")
async def generate_report(
    request: ReportRequest,
    export: str = "json",
    current_user: User = Depends(require_role("admin", "faculty", "hod")),
    db: AsyncSession = Depends(get_db),
):
    report_type = request.report_type
    date_from = datetime.strptime(request.date_from, "%Y-%m-%d").date() if request.date_from else date.today() - timedelta(days=30)
    date_to = datetime.strptime(request.date_to, "%Y-%m-%d").date() if request.date_to else date.today()

    if report_type == "daily":
        return await _generate_daily_report(db, request, date_from, date_to, current_user, export)
    elif report_type == "weekly":
        return await _generate_weekly_report(db, request, date_from, date_to, current_user, export)
    elif report_type == "monthly":
        return await _generate_monthly_report(db, request, date_from, date_to, current_user, export)
    elif report_type == "semester":
        return await _generate_semester_report(db, request, current_user, export)
    elif report_type == "subject_wise":
        return await _generate_subject_report(db, request, current_user, export)
    elif report_type == "low_attendance":
        return await _generate_low_attendance_report(db, request, current_user, export)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown report type: {report_type}")


async def _generate_daily_report(db, request, date_from, date_to, user, export):
    stmt = (
        select(AttendanceSession, Subject, User, Department)
        .join(Subject, Subject.id == AttendanceSession.subject_id)
        .join(User, User.id == AttendanceSession.faculty_id)
        .join(Department, Department.id == AttendanceSession.department_id)
        .where(func.date(AttendanceSession.date) == date_from)
        .order_by(AttendanceSession.period_number)
    )
    rows = (await db.execute(stmt)).all()

    data = []
    for sess, subj, fac, dept in rows:
        result = await db.execute(
            select(AttendanceEntry.status, func.count())
            .where(AttendanceEntry.session_id == sess.id)
            .group_by(AttendanceEntry.status)
        )
        counts = {"present": 0, "absent": 0, "late": 0, "od": 0, "leave": 0}
        for status, cnt in result.all():
            key = status.value if hasattr(status, "value") else status
            counts[key] = cnt
        data.append({
            "date": date_from.isoformat(),
            "period": sess.period_number,
            "subject_code": subj.code,
            "subject_name": subj.name,
            "faculty": fac.name,
            "department": dept.name,
            "section": sess.section,
            "present": counts["present"], "absent": counts["absent"],
            "late": counts["late"], "od": counts["od"], "leave": counts["leave"],
            "total": sum(counts.values()),
        })
    return _format_report(data, f"Daily Attendance Report - {date_from.isoformat()}", export)


async def _generate_weekly_report(db, request, date_from, date_to, user, export):
    stmt = (
        select(AttendanceSession, Subject)
        .join(Subject)
        .where(
            func.date(AttendanceSession.date) >= date_from,
            func.date(AttendanceSession.date) <= date_to,
        )
        .order_by(AttendanceSession.date.desc(), AttendanceSession.period_number)
    )
    rows = (await db.execute(stmt)).all()
    data = []
    for sess, subj in rows:
        result = await db.execute(
            select(func.count()).where(AttendanceEntry.session_id == sess.id)
        )
        total = result.scalar() or 0
        data.append({
            "date": sess.date.isoformat() if sess.date else "",
            "period": sess.period_number,
            "subject_code": subj.code,
            "subject_name": subj.name,
            "total_entries": total,
        })
    return _format_report(data, f"Weekly Report {date_from} to {date_to}", export)


async def _generate_monthly_report(db, request, date_from, date_to, user, export):
    stmt = (
        select(AttendanceEntry.status, func.count())
        .select_from(AttendanceEntry.__table__.join(AttendanceSession))
        .where(
            func.date(AttendanceSession.date) >= date_from,
            func.date(AttendanceSession.date) <= date_to,
        )
        .group_by(AttendanceEntry.status)
    )
    rows = (await db.execute(stmt)).all()
    counts = {"present": 0, "absent": 0, "late": 0, "od": 0, "leave": 0}
    for status, cnt in rows:
        key = status.value if hasattr(status, "value") else status
        counts[key] = cnt
    data = [{"status": k, "count": v} for k, v in counts.items()]
    return _format_report(data, f"Monthly Report {date_from} to {date_to}", export)


async def _generate_semester_report(db, request, user, export):
    stmt = (
        select(User, AttendanceEntry.status, func.count())
        .select_from(User.__table__.join(AttendanceEntry).join(AttendanceSession))
        .where(User.department_id == user.department_id if hasattr(user, 'department_id') else None)
        .group_by(User.id, AttendanceEntry.status)
        .order_by(User.name)
    )
    rows = (await db.execute(stmt)).all()
    data = []
    student_map = {}
    for u, status, cnt in rows:
        if str(u.id) not in student_map:
            student_map[str(u.id)] = {"name": u.name, "reg_no": u.reg_no or "", "counts": {}}
        key = status.value if hasattr(status, "value") else status
        student_map[str(u.id)]["counts"][key] = cnt
    for sid, info in student_map.items():
        counts = info["counts"]
        total = sum(counts.values()) or 1
        present = counts.get("present", 0) + counts.get("late", 0) + counts.get("od", 0)
        data.append({
            "name": info["name"], "reg_no": info["reg_no"],
            "attendance_pct": round((present / total) * 100, 1),
            "total": total,
        })
    return _format_report(data, "Semester Report", export)


async def _generate_subject_report(db, request, user, export):
    subject_id = request.subject_id
    data = []
    if subject_id:
        stmt = (
            select(AttendanceEntry, AttendanceSession, User)
            .join(AttendanceSession, AttendanceEntry.session_id == AttendanceSession.id)
            .join(User, AttendanceEntry.student_id == User.id)
            .where(AttendanceSession.subject_id == subject_id)
        )
        rows = (await db.execute(stmt)).all()
        student_map = {}
        for entry, sess, student in rows:
            if str(student.id) not in student_map:
                student_map[str(student.id)] = {
                    "name": student.name, "reg_no": student.reg_no or "",
                    "present": 0, "absent": 0, "total": 0,
                }
            key = entry.status.value if hasattr(entry.status, "value") else entry.status
            student_map[str(student.id)]["total"] += 1
            if key in ("present", "late", "od"):
                student_map[str(student.id)]["present"] += 1
            else:
                student_map[str(student.id)]["absent"] += 1
        for sid, info in student_map.items():
            pct = round((info["present"] / info["total"] * 100) if info["total"] > 0 else 0, 1)
            data.append({"name": info["name"], "reg_no": info["reg_no"], "present": info["present"],
                         "absent": info["absent"], "total": info["total"], "pct": pct})
    return _format_report(data, "Subject-wise Report", export)


async def _generate_low_attendance_report(db, request, user, export):
    dept_id = request.department_id or user.department_id if hasattr(user, 'department_id') else None
    stmt = select(User).where(User.role == UserRole.student)
    if dept_id:
        stmt = stmt.where(User.department_id == dept_id)
    if request.semester:
        stmt = stmt.where(User.semester == request.semester)
    if request.section:
        stmt = stmt.where(User.section == request.section)
    students = (await db.execute(stmt)).scalars().all()

    data = []
    for s in students:
        summary = await get_student_attendance_summary(str(s.id), db)
        if summary.overall_attendance_pct < 75:
            data.append({
                "name": s.name, "reg_no": s.reg_no or "",
                "overall_pct": summary.overall_attendance_pct,
                "subjects": [{"code": item.subject_code, "name": item.subject_name,
                              "pct": item.attendance_pct} for item in summary.subject_breakdown if item.is_below_threshold],
            })
    return _format_report(data, "Low Attendance Report", export)


def _format_report(data: list, title: str, export: str):
    if export == "json":
        return {"title": title, "data": data}

    if export == "csv":
        import csv, io
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={title}.csv"},
        )

    if export == "excel":
        wb = Workbook()
        ws = wb.active
        ws.title = title[:31]
        if data:
            headers = list(data[0].keys())
            ws.append(headers)
            for row in data:
                ws.append(list(row.values()))
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={title}.xlsx"},
        )

    if export == "pdf":
        output = BytesIO()
        doc = SimpleDocTemplate(output, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = [Paragraph(title, styles["Title"]), Spacer(10, 10)]
        if data:
            headers = list(data[0].keys())
            table_data = [headers]
            for row in data:
                table_data.append([str(row.get(h, "")) for h in headers])
            t = Table(table_data)
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ]))
            elements.append(t)
        doc.build(elements)
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={title}.pdf"},
        )

    return {"title": title, "data": data}


@router.get("/formats")
async def report_formats(
    current_user: User = Depends(require_role("admin", "faculty", "hod")),
):
    return {
        "types": ["daily", "weekly", "monthly", "semester", "subject_wise", "low_attendance"],
        "export_formats": ["json", "csv", "excel", "pdf"],
    }
