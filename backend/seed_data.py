"""
Seed script: populates the Supabase Postgres DB with mock data matching the frontend's mock data.
Run: python backend/seed_data.py
"""
import asyncio
import uuid
from datetime import datetime, date, time, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal, engine, Base
from app.models import (
    User, Department, Subject, FacultySubject, Timetable,
    CalendarEvent, AttendanceSession, AttendanceEntry, Correction,
    LeaveRequest, LeaveApproval, Substitution, Notification,
    AuditLog, BackupSnapshot, AcademicSession,
    UserRole, AttendanceStatus, LeaveType, LeaveStatus,
    CorrectionStatus, SubstitutionStatus, CalendarEventType,
    NotificationType, BackupType, BackupStatus,
)


def _uid(s: str) -> uuid.UUID:
    """Generate deterministic UUID from string for consistent IDs."""
    return uuid.uuid5(uuid.NAMESPACE_DNS, s)


async def seed():
    async with AsyncSessionLocal() as db:
        # ── Clear existing data
        for model in [AttendanceEntry, AttendanceSession, Correction,
                       LeaveApproval, LeaveRequest, Substitution,
                       Notification, AuditLog, BackupSnapshot,
                       FacultySubject, Timetable, CalendarEvent,
                       Subject, User, Department]:
            await db.execute(model.__table__.delete())
        await db.commit()

        # ── Departments
        depts = {
            "cs": Department(
                id=_uid("dept-cs"), code="CSE",
                name="Computer Science & Engineering",
            ),
            "ece": Department(
                id=_uid("dept-ece"), code="ECE",
                name="Electronics & Comm. Engineering",
            ),
            "mech": Department(
                id=_uid("dept-mech"), code="MECH",
                name="Mechanical Engineering",
            ),
            "it": Department(
                id=_uid("dept-it"), code="IT",
                name="Information Technology",
            ),
        }
        for d in depts.values():
            db.add(d)
        await db.commit()

        # ── Users (Admin, HODs, Faculty, Students)
        users = {
            "usr-admin-1": User(
                id=_uid("usr-admin-1"), email="admin@university.edu",
                name="Dr. Robert Vance", role=UserRole.admin,
                employee_id="ADM-001", phone="+1 (555) 019-2834",
                is_active=True,
                avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
            ),
            "usr-hod-1": User(
                id=_uid("usr-hod-1"), email="hod.cs@university.edu",
                name="Dr. Alan Turing", role=UserRole.hod,
                department_id=_uid("dept-cs"), employee_id="FAC-HOD-01",
                phone="+1 (555) 012-9988", is_hod=True, is_active=True,
                avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
            ),
            "usr-faculty-1": User(
                id=_uid("usr-faculty-1"), email="sarah.jenkins@university.edu",
                name="Prof. Sarah Jenkins", role=UserRole.faculty,
                department_id=_uid("dept-cs"), employee_id="FAC-102",
                phone="+1 (555) 014-4321", is_active=True,
                avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
            ),
            "fac-103": User(
                id=_uid("fac-103"), email="david.miller@university.edu",
                name="Prof. David Miller", role=UserRole.faculty,
                department_id=_uid("dept-cs"), employee_id="FAC-103",
                phone="+1 (555) 019-8833", is_active=True,
                avatar="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
                designation="Associate Professor",
            ),
            "fac-ece-1": User(
                id=_uid("fac-ece-1"), email="emily.watson@university.edu",
                name="Prof. Emily Watson", role=UserRole.faculty,
                department_id=_uid("dept-ece"), employee_id="FAC-201",
                phone="+1 (555) 017-2244", is_active=True,
                avatar="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
            ),
        }
        # Add HODs for other departments
        for dept_code, dept_name in [("ece", "Electronics"), ("mech", "Mechanical"), ("it", "Information Tech")]:
            users[f"fac-{dept_code}-hod"] = User(
                id=_uid(f"fac-{dept_code}-hod"),
                email=f"hod.{dept_code}@university.edu",
                name=f"Dr. Eleanor {dept_name}",
                role=UserRole.hod,
                department_id=_uid(f"dept-{dept_code}"),
                employee_id=f"FAC-HOD-{dept_code.upper()}",
                phone=f"+1 (555) 020-{dept_code}",
                is_hod=True, is_active=True,
            )

        # Students
        student_names = [
            ("usr-student-1", "Alex Mercer", "alex.mercer@student.edu", "2024CS1042", "24CS01"),
            ("std-102", "Beatrice Vance", "beatrice.vance@student.edu", "2024CS1043", "24CS02"),
            ("std-103", "Carlos Mendez", "carlos.mendez@student.edu", "2024CS1044", "24CS03"),
            ("std-104", "Diana Prince", "diana.prince@student.edu", "2024CS1045", "24CS04"),
            ("std-105", "Ethan Hunt", "ethan.hunt@student.edu", "2024CS1046", "24CS05"),
            ("std-106", "Fiona Gallagher", "fiona.g@student.edu", "2024CS1047", "24CS06"),
        ]
        for uid, name, email, reg_no, roll_no in student_names:
            users[uid] = User(
                id=_uid(uid), email=email, name=name, role=UserRole.student,
                department_id=_uid("dept-cs"), reg_no=reg_no, roll_no=roll_no,
                semester=4, section="A", batch="2022-2026",
                phone=f"+1 (555) 018-{uid[-4:]}", is_active=True,
                avatar=f"https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
                parent_phone="+1 (555) 998-1122",
            )

        for u in users.values():
            db.add(u)
        await db.commit()

        # Set HOD on department
        depts["cs"].hod_user_id = _uid("usr-hod-1")
        await db.commit()

        # ── Subjects
        subjects = {
            "sub-cs401": Subject(id=_uid("sub-cs401"), code="CS401",
                name="Data Structures & Algorithms", department_id=_uid("dept-cs"),
                semester=4, credits=4, min_attendance_pct=75),
            "sub-cs402": Subject(id=_uid("sub-cs402"), code="CS402",
                name="Operating Systems", department_id=_uid("dept-cs"),
                semester=4, credits=3, min_attendance_pct=75),
            "sub-cs403": Subject(id=_uid("sub-cs403"), code="CS403",
                name="Database Management Systems", department_id=_uid("dept-cs"),
                semester=4, credits=4, min_attendance_pct=75),
            "sub-cs404": Subject(id=_uid("sub-cs404"), code="CS404",
                name="Web Technology & Frameworks", department_id=_uid("dept-cs"),
                semester=4, credits=3, min_attendance_pct=75),
            "sub-ec301": Subject(id=_uid("sub-ec301"), code="EC301",
                name="Digital Signal Processing", department_id=_uid("dept-ece"),
                semester=4, credits=4, min_attendance_pct=75),
        }
        for s in subjects.values():
            db.add(s)
        await db.commit()

        # ── Faculty-Subject assignments
        fs_assigns = [
            ("usr-faculty-1", "sub-cs401"), ("usr-faculty-1", "sub-cs404"),
            ("usr-hod-1", "sub-cs402"), ("fac-103", "sub-cs403"),
            ("fac-ece-1", "sub-ec301"),
        ]
        for fid, sid in fs_assigns:
            db.add(FacultySubject(faculty_id=_uid(fid), subject_id=_uid(sid)))
        await db.commit()

        # ── Timetable
        tt_slots = [
            ("tt-mon-p1", "Monday", 1, "09:00 AM", "09:50 AM", "sub-cs401", "usr-faculty-1", "Lab-302"),
            ("tt-mon-p2", "Monday", 2, "10:00 AM", "10:50 AM", "sub-cs402", "usr-hod-1", "LH-101"),
            ("tt-mon-p3", "Monday", 3, "11:00 AM", "11:50 AM", "sub-cs403", "fac-103", "LH-102"),
            ("tt-mon-p4", "Monday", 4, "01:30 PM", "02:20 PM", "sub-cs404", "usr-faculty-1", "Lab-104"),
            ("tt-tue-p1", "Tuesday", 1, "09:00 AM", "09:50 AM", "sub-cs404", "usr-faculty-1", "Lab-104"),
            ("tt-tue-p2", "Tuesday", 2, "10:00 AM", "10:50 AM", "sub-cs401", "usr-faculty-1", "Lab-302"),
        ]
        for sid, day, period, start, end, subj_id, fac_id, room in tt_slots:
            subj = subjects[subj_id]
            db.add(Timetable(
                id=_uid(sid), day=day, period_number=period,
                start_time=datetime.strptime(start, "%I:%M %p").time(),
                end_time=datetime.strptime(end, "%I:%M %p").time(),
                subject_id=_uid(subj_id), faculty_id=_uid(fac_id),
                room_no=room, department_id=subj.department_id,
                semester=4, section="A",
            ))
        await db.commit()

        # ── Calendar Events
        cal_events = [
            CalendarEvent(id=_uid("cal-1"), date=date(2026, 8, 15),
                type=CalendarEventType.holiday, title="Independence Day",
                description="National Holiday"),
            CalendarEvent(id=_uid("cal-2"), date=date(2026, 8, 20),
                type=CalendarEventType.exam, title="Mid-Semester Examination Begins",
                description="Sem 4 Midterms"),
            CalendarEvent(id=_uid("cal-3"), date=date(2026, 8, 25),
                type=CalendarEventType.working, title="Special Working Saturday",
                description="Compensation for fest day"),
        ]
        for e in cal_events:
            db.add(e)
        await db.commit()

        # ── Academic Session
        session_obj = AcademicSession(
            id=_uid("session-2022"),
            name="2022-2026 Academic Year",
            start_date=date(2022, 7, 1),
            end_date=date(2026, 6, 30),
            is_current=True,
        )
        db.add(session_obj)
        await db.commit()

        # ── Attendance Sessions + Entries
        # Record 1: 2026-08-01 Period 1, CS401
        sess1 = AttendanceSession(
            id=_uid("att-rec-20260801-p1"),
            subject_id=_uid("sub-cs401"), faculty_id=_uid("usr-faculty-1"),
            date=date(2026, 8, 1), period_number=1, room_no="Lab-302",
            department_id=_uid("dept-cs"), semester=4, section="A",
            is_substitution=False, marked_at=datetime(2026, 8, 1, 9, 52),
            marked_by=_uid("usr-faculty-1"),
        )
        db.add(sess1)
        await db.commit()

        entries1 = [
            ("usr-student-1", AttendanceStatus.present, None),
            ("std-102", AttendanceStatus.present, None),
            ("std-103", AttendanceStatus.absent, "Unexcused"),
            ("std-104", AttendanceStatus.present, None),
            ("std-105", AttendanceStatus.od, "Hackathon Participation"),
            ("std-106", AttendanceStatus.present, None),
        ]
        for eid, status, remarks in entries1:
            db.add(AttendanceEntry(
                id=_uid(f"att-{eid}-{sess1.id}"),
                session_id=sess1.id, student_id=_uid(eid),
                status=status, remarks=remarks, marked_at=datetime(2026, 8, 1, 9, 52),
            ))
        await db.commit()

        # Record 2: 2026-07-31 Period 2, CS402
        sess2 = AttendanceSession(
            id=_uid("att-rec-20260731-p2"),
            subject_id=_uid("sub-cs402"), faculty_id=_uid("usr-hod-1"),
            date=date(2026, 7, 31), period_number=2, room_no="LH-101",
            department_id=_uid("dept-cs"), semester=4, section="A",
            is_substitution=False, marked_at=datetime(2026, 7, 31, 10, 55),
            marked_by=_uid("usr-hod-1"),
        )
        db.add(sess2)
        await db.commit()

        entries2 = [
            ("usr-student-1", AttendanceStatus.present, None),
            ("std-102", AttendanceStatus.present, None),
            ("std-103", AttendanceStatus.absent, None),
            ("std-104", AttendanceStatus.present, None),
            ("std-105", AttendanceStatus.present, None),
            ("std-106", AttendanceStatus.present, None),
        ]
        for eid, status, remarks in entries2:
            db.add(AttendanceEntry(
                id=_uid(f"att2-{eid}-{sess2.id}"),
                session_id=sess2.id, student_id=_uid(eid),
                status=status, remarks=remarks, marked_at=datetime(2026, 7, 31, 10, 55),
            ))
        await db.commit()

        # ── Corrections
        correction = Correction(
            id=_uid("corr-001"),
            attendance_session_id=sess1.id,
            student_id=_uid("std-103"),
            subject_id=_uid("sub-cs401"),
            date=date(2026, 8, 1), period_number=1,
            original_status=AttendanceStatus.absent,
            proposed_status=AttendanceStatus.present,
            reason="Student arrived 5 minutes late due to bus breakdown and attended full lab session.",
            status=CorrectionStatus.pending, created_at=datetime(2026, 8, 1, 16, 0),
        )
        db.add(correction)
        await db.commit()

        # ── Leave Requests
        leave1 = LeaveRequest(
            id=_uid("lv-001"),
            student_id=_uid("usr-student-1"),
            department_id=_uid("dept-cs"),
            semester=4, section="A",
            leave_type=LeaveType.medical,
            start_date=date(2026, 8, 4), end_date=date(2026, 8, 5),
            total_days=2,
            reason="Severe flu and high fever. Doctor prescribed 2 days bed rest.",
            attachment_url="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600",
            status=LeaveStatus.pending_faculty, created_at=datetime(2026, 8, 1, 14, 30),
        )
        db.add(leave1)

        leave2 = LeaveRequest(
            id=_uid("lv-002"),
            student_id=_uid("std-103"),
            department_id=_uid("dept-cs"),
            semester=4, section="A",
            leave_type=LeaveType.on_duty,
            start_date=date(2026, 8, 6), end_date=date(2026, 8, 6),
            total_days=1,
            reason="Representing university at Inter-College Robotics Symposium.",
            status=LeaveStatus.pending_hod, created_at=datetime(2026, 8, 1, 11, 15),
        )
        db.add(leave2)
        await db.commit()

        # Leave approval for leave2 (faculty approved)
        db.add(LeaveApproval(
            id=_uid("la-001"),
            leave_request_id=leave2.id,
            approver_id=_uid("usr-faculty-1"),
            approver_role=UserRole.faculty,
            status="approved",
            comment="Recommended for OD approval.",
            approved_at=datetime(2026, 8, 1, 17, 10),
        ))
        await db.commit()

        # ── Substitution Requests
        sub_req = Substitution(
            id=_uid("subst-001"),
            original_faculty_id=_uid("usr-faculty-1"),
            substitute_faculty_id=_uid("fac-103"),
            subject_id=_uid("sub-cs404"),
            date=date(2026, 8, 5), period_number=4,
            reason="Attending IEEE Research Workshop session.",
            status=SubstitutionStatus.pending, created_at=datetime(2026, 8, 1, 15, 20),
        )
        db.add(sub_req)
        await db.commit()

        # ── Notifications
        notifs = [
            Notification(id=_uid("notif-1"), user_id=_uid("std-103"),
                title="Low Attendance Alert",
                message="Your overall attendance in CS403 is 68.4% (Below 75% threshold).",
                type=NotificationType.warning, is_read=False, created_at=datetime(2026, 8, 2, 10, 50)),
            Notification(id=_uid("notif-2"), user_id=_uid("usr-faculty-1"),
                title="Leave Request Pending Review",
                message="Alex Mercer submitted a Medical Leave request for 2026-08-04 to 2026-08-05.",
                type=NotificationType.info, is_read=False, created_at=datetime(2026, 8, 2, 11, 0)),
            Notification(id=_uid("notif-3"), user_id=_uid("usr-faculty-1"),
                title="Correction Request Approved",
                message="HOD approved your attendance correction for CS401 on 2026-08-01.",
                type=NotificationType.success, is_read=True, created_at=datetime(2026, 8, 2, 9, 0)),
        ]
        for n in notifs:
            db.add(n)

        # ── Audit Logs
        audit_logs = [
            AuditLog(id=_uid("log-101"), user_id=_uid("usr-faculty-1"),
                action="MARK_ATTENDANCE", module="Attendance Engine",
                details="Submitted period 1 attendance for CS401 (CSE-4A). Total: 6, Present: 5, Absent: 1.",
                ip_address="192.168.1.104",
                payload_diff='{"period": 1, "subject": "CS401"}',
                created_at=datetime(2026, 8, 2, 9, 12, 4)),
            AuditLog(id=_uid("log-102"), user_id=_uid("usr-admin-1"),
                action="CREATE_STUDENT", module="Student Directory",
                details="Added new student regNo: 2024CS1047 (Fiona Gallagher).",
                ip_address="10.0.0.12",
                created_at=datetime(2026, 8, 1, 16, 45, 12)),
        ]
        for a in audit_logs:
            db.add(a)

        # ── Backup Snapshots
        backups = [
            BackupSnapshot(id=_uid("bkp-001"),
                filename="smart_attendance_db_20260801_auto.sql",
                size="14.2 MB", type=BackupType.automated,
                status=BackupStatus.success, created_at=datetime(2026, 8, 1, 2, 0)),
            BackupSnapshot(id=_uid("bkp-002"),
                filename="smart_attendance_db_20260725_manual.sql",
                size="13.8 MB", type=BackupType.manual,
                status=BackupStatus.success, created_at=datetime(2026, 7, 25, 16, 15)),
        ]
        for b in backups:
            db.add(b)

        # Import AcademicSession (already imported above)
        # (already created above with session_obj)

        await db.commit()
        print("Seed data populated successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
