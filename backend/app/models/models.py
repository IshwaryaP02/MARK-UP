from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ForeignKey, Time, Date, Enum, TypeDecorator
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
from enum import Enum as PyEnum
import uuid as uuid_lib


class UUIDStr(TypeDecorator):
    """Cross-database UUID type that stores as string, works with both SQLite and PostgreSQL."""
    impl = String
    cache_ok = True

    def __init__(self, length=36, **kwargs):
        super().__init__(length, **kwargs)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid_lib.UUID):
            return str(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        try:
            return uuid_lib.UUID(str(value))
        except (ValueError, AttributeError):
            return value


def _gen_uuid():
    return str(uuid_lib.uuid4())


class UserRole(str, PyEnum):
    admin = "admin"
    hod = "hod"
    faculty = "faculty"
    student = "student"


class AttendanceStatus(str, PyEnum):
    present = "present"
    absent = "absent"
    late = "late"
    od = "od"
    leave = "leave"


class LeaveType(str, PyEnum):
    medical = "medical"
    casual = "casual"
    duty_leave = "duty_leave"
    on_duty = "on_duty"


class LeaveStatus(str, PyEnum):
    pending_faculty = "pending_faculty"
    pending_hod = "pending_hod"
    approved = "approved"
    rejected = "rejected"


class CorrectionStatus(str, PyEnum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class SubstitutionStatus(str, PyEnum):
    pending = "pending"
    accepted = "accepted"
    rejected_by_sub = "rejected_by_sub"
    approved_by_hod = "approved_by_hod"


class CalendarEventType(str, PyEnum):
    holiday = "holiday"
    exam = "exam"
    working = "working"
    event = "event"


class BackupType(str, PyEnum):
    manual = "manual"
    automated = "automated"


class BackupStatus(str, PyEnum):
    success = "success"
    failed = "failed"


class NotificationType(str, PyEnum):
    info = "info"
    warning = "warning"
    success = "success"
    danger = "danger"


def _uuid():
    return str(uuid_lib.uuid4())


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    code = Column(String(20), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    hod_user_id = Column(UUIDStr, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hod = relationship("User", primaryjoin="Department.hod_user_id == User.id", lazy="selectin")
    subjects = relationship("Subject", back_populates="department", lazy="selectin")
    users = relationship("User", primaryjoin="User.department_id == Department.id", back_populates="department", lazy="selectin")


class AcademicSession(Base):
    __tablename__ = "academic_sessions"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    name = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    calendar_events = relationship("CalendarEvent", back_populates="session", lazy="selectin")


class User(Base):
    __tablename__ = "users"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)

    # ── Auth credentials ──
    username = Column(String(100), unique=True, nullable=True, index=True)  # login ID
    password_hash = Column(String(255), nullable=True)  # bcrypt hash
    password_reset_enabled = Column(Boolean, default=False)  # admin enables for forgot-pass
    has_set_password = Column(Boolean, default=False)  # True once user sets own password

    email = Column(String(255), nullable=True, unique=True)
    name = Column(String(255), nullable=False)
    avatar = Column(Text, nullable=True)
    role = Column(Enum(UserRole), nullable=False)
    department_id = Column(UUIDStr, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)

    reg_no = Column(String(50), nullable=True)
    roll_no = Column(String(50), nullable=True)
    employee_id = Column(String(50), nullable=True)
    designation = Column(String(100), default="Assistant Professor")

    semester = Column(Integer, nullable=True)
    section = Column(String(20), nullable=True)
    batch = Column(String(50), nullable=True)
    programme = Column(String(20), nullable=True)
    year = Column(Integer, nullable=True)
    shift = Column(String(20), nullable=True)

    phone = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)
    gender = Column(String(20), nullable=True)
    dob = Column(Date, nullable=True)
    father_name = Column(String(255), nullable=True)
    mother_name = Column(String(255), nullable=True)
    guardian_name = Column(String(255), nullable=True)
    parent_phone = Column(String(30), nullable=True)

    # Customization
    theme = Column(String(50), default="Classic", nullable=True)
    wallpaper_url = Column(Text, nullable=True)

    # Class Adviser Role
    is_class_adviser = Column(Boolean, default=False)
    advising_programme = Column(String(20), nullable=True)
    advising_department_id = Column(UUIDStr, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    advising_year = Column(Integer, nullable=True)
    advising_shift = Column(String(20), nullable=True)

    is_hod = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = relationship("Department", primaryjoin="User.department_id == Department.id", lazy="selectin")
    advising_department = relationship("Department", primaryjoin="User.advising_department_id == Department.id", lazy="selectin")
    faculty_subjects = relationship("FacultySubject", back_populates="faculty", lazy="selectin")
    timetable_slots = relationship("Timetable", primaryjoin="User.id == Timetable.faculty_id", back_populates="faculty", lazy="selectin")
    attendance_sessions = relationship("AttendanceSession", primaryjoin="User.id == AttendanceSession.faculty_id", back_populates="faculty", lazy="selectin")
    audit_logs = relationship("AuditLog", back_populates="user", lazy="selectin")
    notifications = relationship("Notification", primaryjoin="User.id == Notification.user_id", back_populates="user", lazy="selectin")


class OdRequestStatus(str, PyEnum):
    pending = "pending"
    recommended = "recommended"
    approved = "approved"
    rejected = "rejected"


class OdRequest(Base):
    """On-Duty workflow: Student -> Class Adviser -> HOD."""
    __tablename__ = "od_requests"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    student_id = Column(UUIDStr, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    from_period = Column(Integer, nullable=False)
    to_period = Column(Integer, nullable=False)
    
    reason = Column(Text, nullable=False)
    proof_url = Column(Text, nullable=True)
    status = Column(Enum(OdRequestStatus), default=OdRequestStatus.pending, nullable=False)
    
    class_adviser_id = Column(UUIDStr, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    hod_id = Column(UUIDStr, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    adviser_comment = Column(Text, nullable=True)
    hod_comment = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("User", primaryjoin="OdRequest.student_id == User.id", lazy="selectin")
    class_adviser = relationship("User", primaryjoin="OdRequest.class_adviser_id == User.id", lazy="selectin")
    hod = relationship("User", primaryjoin="OdRequest.hod_id == User.id", lazy="selectin")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    code = Column(String(30), nullable=False)
    name = Column(String(255), nullable=False)
    department_id = Column(UUIDStr, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    semester = Column(Integer, nullable=False)
    credits = Column(Integer, default=3)
    min_attendance_pct = Column(Integer, default=75)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="subjects", lazy="selectin")
    faculty_subjects = relationship("FacultySubject", back_populates="subject", lazy="selectin")
    timetable_slots = relationship("Timetable", primaryjoin="Subject.id == Timetable.subject_id", back_populates="subject", lazy="selectin")


class FacultySubject(Base):
    __tablename__ = "faculty_subjects"

    faculty_id = Column(UUIDStr, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    subject_id = Column(UUIDStr, ForeignKey("subjects.id", ondelete="CASCADE"), primary_key=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    faculty = relationship("User", back_populates="faculty_subjects", lazy="selectin")
    subject = relationship("Subject", back_populates="faculty_subjects", lazy="selectin")


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    session_id = Column(UUIDStr, ForeignKey("academic_sessions.id", ondelete="SET NULL"), nullable=True)
    date = Column(Date, nullable=False)
    type = Column(Enum(CalendarEventType), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("AcademicSession", back_populates="calendar_events", lazy="selectin")


class Timetable(Base):
    __tablename__ = "timetable"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    day = Column(
        Enum(
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            name="day_of_week",
        ),
        nullable=False,
    )
    period_number = Column(Integer, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    subject_id = Column(UUIDStr, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True)
    faculty_id = Column(UUIDStr, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    room_no = Column(String(50), nullable=True)
    department_id = Column(UUIDStr, ForeignKey("departments.id"), nullable=True)
    semester = Column(Integer, nullable=False)
    section = Column(String(20), nullable=False)
    programme = Column(String(20), nullable=True)
    year = Column(Integer, nullable=True)
    shift = Column(String(20), nullable=True, default="First Shift")  # "First Shift" | "Second Shift"
    source = Column(String(20), nullable=True, default="manual")     # "manual" | "ocr" | "allocator"
    created_at = Column(DateTime, default=datetime.utcnow)

    subject = relationship("Subject", primaryjoin="Timetable.subject_id == Subject.id", lazy="selectin")
    faculty = relationship("User", primaryjoin="Timetable.faculty_id == User.id", back_populates="timetable_slots", lazy="selectin")


class Substitution(Base):
    __tablename__ = "substitutions"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    original_faculty_id = Column(UUIDStr, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    substitute_faculty_id = Column(UUIDStr, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(UUIDStr, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    period_number = Column(Integer, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(Enum(SubstitutionStatus), default=SubstitutionStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)

    original_faculty = relationship("User", primaryjoin="Substitution.original_faculty_id == User.id", lazy="selectin")
    substitute_faculty = relationship("User", primaryjoin="Substitution.substitute_faculty_id == User.id", lazy="selectin")
    subject = relationship("Subject", lazy="selectin")


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    subject_id = Column(UUIDStr, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(UUIDStr, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    date = Column(Date, nullable=False)
    period_number = Column(Integer, nullable=False)
    room_no = Column(String(50), nullable=True)
    department_id = Column(UUIDStr, ForeignKey("departments.id"), nullable=True)
    semester = Column(Integer, nullable=True)
    section = Column(String(20), nullable=True)
    is_substitution = Column(Boolean, default=False)
    marked_at = Column(DateTime, default=datetime.utcnow)
    marked_by = Column(UUIDStr, ForeignKey("users.id"), nullable=True)

    entries = relationship("AttendanceEntry", back_populates="session", lazy="selectin")
    subject = relationship("Subject", lazy="selectin")
    faculty = relationship("User", primaryjoin="AttendanceSession.faculty_id == User.id", back_populates="attendance_sessions", lazy="selectin")


class AttendanceEntry(Base):
    __tablename__ = "attendance_entries"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    session_id = Column(UUIDStr, ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUIDStr, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(AttendanceStatus), nullable=False)
    remarks = Column(Text, nullable=True)
    marked_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("AttendanceSession", back_populates="entries", lazy="selectin")
    student = relationship("User", primaryjoin="AttendanceEntry.student_id == User.id", lazy="selectin")


class Correction(Base):
    __tablename__ = "corrections"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    attendance_session_id = Column(UUIDStr, ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUIDStr, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(UUIDStr, ForeignKey("subjects.id"), nullable=True)
    date = Column(Date, nullable=False)
    period_number = Column(Integer, nullable=False)
    original_status = Column(Enum(AttendanceStatus), nullable=False)
    proposed_status = Column(Enum(AttendanceStatus), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(Enum(CorrectionStatus), default=CorrectionStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_by = Column(UUIDStr, ForeignKey("users.id"), nullable=True)
    review_comment = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    student = relationship("User", primaryjoin="Correction.student_id == User.id", lazy="selectin")
    reviewer = relationship("User", primaryjoin="Correction.reviewed_by == User.id", lazy="selectin")
    subject = relationship("Subject", lazy="selectin")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    student_id = Column(UUIDStr, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(UUIDStr, ForeignKey("departments.id"), nullable=True)
    semester = Column(Integer, nullable=True)
    section = Column(String(20), nullable=True)
    leave_type = Column(Enum(LeaveType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    attachment_url = Column(Text, nullable=True)
    status = Column(Enum(LeaveStatus), default=LeaveStatus.pending_faculty)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", primaryjoin="LeaveRequest.student_id == User.id", lazy="selectin")
    department = relationship("Department", lazy="selectin")
    approvals = relationship("LeaveApproval", back_populates="leave_request", lazy="selectin")


class LeaveApproval(Base):
    __tablename__ = "leave_approvals"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    leave_request_id = Column(UUIDStr, ForeignKey("leave_requests.id", ondelete="CASCADE"), nullable=False)
    approver_id = Column(UUIDStr, ForeignKey("users.id"), nullable=True)
    approver_role = Column(Enum(UserRole), nullable=False)
    status = Column(String(20), nullable=False)
    comment = Column(Text, nullable=True)
    approved_at = Column(DateTime, default=datetime.utcnow)

    leave_request = relationship("LeaveRequest", back_populates="approvals", lazy="selectin")
    approver = relationship("User", primaryjoin="LeaveApproval.approver_id == User.id", lazy="selectin")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    user_id = Column(UUIDStr, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    link = Column(Text, nullable=True)
    target_role = Column(Enum(UserRole), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", primaryjoin="Notification.user_id == User.id", back_populates="notifications", lazy="selectin")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    user_id = Column(UUIDStr, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    module = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    payload_diff = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", primaryjoin="AuditLog.user_id == User.id", back_populates="audit_logs", lazy="selectin")


class BackupSnapshot(Base):
    __tablename__ = "backup_snapshots"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    filename = Column(String(255), nullable=False)
    size = Column(String(50), nullable=False)
    type = Column(Enum(BackupType), nullable=False)
    status = Column(Enum(BackupStatus), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class TimetableVersion(Base):
    """Tracks each time a department timetable is published (via OCR or Allocator)."""
    __tablename__ = "timetable_versions"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    department_id = Column(UUIDStr, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    shift = Column(String(20), nullable=True)          # which shift was updated, None = all
    source = Column(String(20), nullable=False)        # "ocr" | "allocator" | "manual"
    published_by = Column(UUIDStr, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    published_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    department = relationship("Department", lazy="selectin")
    publisher = relationship("User", primaryjoin="TimetableVersion.published_by == User.id", lazy="selectin")


# ── NEW: Circulars ─────────────────────────────────────────────────────────────

class CircularStatus(str, PyEnum):
    draft = "draft"
    signed = "signed"
    published = "published"
    archived = "archived"


class Circular(Base):
    """Department/global circulars authored by admins/HODs, visible to students/faculty."""
    __tablename__ = "circulars"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(Enum(CircularStatus), default=CircularStatus.draft, nullable=False)
    target_role = Column(Enum(UserRole), nullable=True)          # None = everyone
    department_id = Column(UUIDStr, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    target_semester = Column(Integer, nullable=True)
    target_section = Column(String(20), nullable=True)
    author_id = Column(UUIDStr, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    signer_id = Column(UUIDStr, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    signer_name = Column(String(255), nullable=True)
    publisher_id = Column(UUIDStr, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    publisher_name = Column(String(255), nullable=True)
    published_at = Column(DateTime, nullable=True)
    recipient_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    author = relationship("User", primaryjoin="Circular.author_id == User.id", lazy="selectin")
    department = relationship("Department", lazy="selectin")


# ── NEW: Bonafide Requests ──────────────────────────────────────────────────────

class BonafideStage(str, PyEnum):
    pending_faculty = "pending_faculty"
    pending_hod = "pending_hod"
    pending_principal = "pending_principal"
    approved = "approved"
    rejected = "rejected"


class BonafideRequest(Base):
    """Student bonafide certificate workflow: student → tutor faculty → HOD → principal."""
    __tablename__ = "bonafide_requests"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    student_id = Column(UUIDStr, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    purpose = Column(String(255), nullable=False)
    address_to = Column(String(255), nullable=True)
    stage = Column(Enum(BonafideStage), default=BonafideStage.pending_faculty, nullable=False)
    faculty_id = Column(UUIDStr, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    faculty_comment = Column(Text, nullable=True)
    faculty_reviewed_at = Column(DateTime, nullable=True)
    hod_id = Column(UUIDStr, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    hod_comment = Column(Text, nullable=True)
    hod_reviewed_at = Column(DateTime, nullable=True)
    principal_comment = Column(Text, nullable=True)
    principal_reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("User", primaryjoin="BonafideRequest.student_id == User.id", lazy="selectin")
    faculty = relationship("User", primaryjoin="BonafideRequest.faculty_id == User.id", lazy="selectin")
    hod = relationship("User", primaryjoin="BonafideRequest.hod_id == User.id", lazy="selectin")


# ── NEW: Staff Day Orders ──────────────────────────────────────────────────────

class StaffDayOrder(Base):
    """Day-order schedule entries set by admin; maps calendar dates to day numbers."""
    __tablename__ = "staff_day_orders"

    id = Column(UUIDStr, primary_key=True, default=_gen_uuid)
    date = Column(Date, nullable=False, unique=True)
    day_number = Column(Integer, nullable=False)   # 1-6
    label = Column(String(100), nullable=True)     # e.g. "Day 3 (Monday schedule)"
    notes = Column(Text, nullable=True)
    created_by = Column(UUIDStr, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", lazy="selectin")

