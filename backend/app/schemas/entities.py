from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.models import (
    UserRole,
    AttendanceStatus,
    LeaveType,
    LeaveStatus,
    CorrectionStatus,
    SubstitutionStatus,
    CalendarEventType,
    NotificationType,
    BackupType,
    BackupStatus,
)


# ── Student ────────────────────────────────────────────────
class StudentRead(BaseModel):
    id: str
    reg_no: str
    roll_no: str
    name: str
    email: str
    avatar: Optional[str] = None
    department_id: str
    department_name: str
    semester: int
    section: str
    batch: str
    overall_attendance_pct: float
    guardian_name: str
    guardian_phone: str
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    active: bool = True

    model_config = ConfigDict(from_attributes=True)


class StudentCreate(BaseModel):
    name: str
    email: str
    reg_no: str
    roll_no: Optional[str] = None
    department_id: str
    semester: int
    section: str
    batch: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    parent_phone: Optional[str] = None


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    reg_no: Optional[str] = None
    roll_no: Optional[str] = None
    department_id: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    batch: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    parent_phone: Optional[str] = None
    is_active: Optional[bool] = None


# ── Faculty ────────────────────────────────────────────────
class FacultyRead(BaseModel):
    id: str
    employee_id: str
    name: str
    email: str
    avatar: Optional[str] = None
    department_id: str
    department_name: str
    designation: str
    phone: str
    assigned_subject_ids: List[str]
    is_hod: Optional[bool] = None
    active: bool = True

    model_config = ConfigDict(from_attributes=True)


class FacultyCreate(BaseModel):
    name: str
    email: str
    employee_id: str
    department_id: str
    designation: str
    phone: str
    assigned_subject_ids: Optional[List[str]] = None
    avatar: Optional[str] = None
    is_hod: Optional[bool] = False


class FacultyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    employee_id: Optional[str] = None
    department_id: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    assigned_subject_ids: Optional[List[str]] = None
    avatar: Optional[str] = None
    is_hod: Optional[bool] = None
    is_active: Optional[bool] = None


# ── Department ─────────────────────────────────────────────
class DepartmentRead(BaseModel):
    id: str
    code: str
    name: str
    hod_id: Optional[str] = None
    hod_name: Optional[str] = None
    student_count: int = 0
    faculty_count: int = 0
    subjects_count: int = 0
    avg_attendance_pct: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class DepartmentCreate(BaseModel):
    code: str
    name: str
    hod_id: Optional[str] = None


class DepartmentUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    hod_id: Optional[str] = None


# ── Subject ────────────────────────────────────────────────
class SubjectRead(BaseModel):
    id: str
    code: str
    name: str
    department_id: str
    department_name: str
    semester: int
    credits: int
    min_attendance_pct: int
    total_classes_held: int
    faculty_id: Optional[str] = None
    faculty_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SubjectCreate(BaseModel):
    code: str
    name: str
    department_id: str
    semester: int
    credits: int = 3
    min_attendance_pct: int = 75


class SubjectUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    department_id: Optional[str] = None
    semester: Optional[int] = None
    credits: Optional[int] = None
    min_attendance_pct: Optional[int] = None


# ── Timetable ──────────────────────────────────────────────
class TimetableSlotRead(BaseModel):
    id: str
    day: str
    period_number: int
    start_time: str
    end_time: str
    subject_id: str
    subject_code: str
    subject_name: str
    faculty_id: str
    faculty_name: str
    room_no: str
    department_id: str
    semester: int
    section: str

    model_config = ConfigDict(from_attributes=True)


class TimetableSlotCreate(BaseModel):
    day: str
    period_number: int
    start_time: str
    end_time: str
    subject_id: str
    faculty_id: str
    room_no: str
    department_id: str
    semester: int
    section: str


class TimetableSlotUpdate(BaseModel):
    day: Optional[str] = None
    period_number: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    subject_id: Optional[str] = None
    faculty_id: Optional[str] = None
    room_no: Optional[str] = None
    department_id: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None


# ── Active Period (faculty dashboard) ─────────────────────
class ActivePeriodRead(BaseModel):
    date: str
    period_number: int
    subject_id: str
    subject_code: str
    subject_name: str
    faculty_id: str
    faculty_name: str
    room_no: str
    department_id: str
    semester: int
    section: str
    start_time: str
    end_time: str


# ── Attendance ─────────────────────────────────────────────
class AttendanceEntryBase(BaseModel):
    student_id: str
    status: AttendanceStatus
    remarks: Optional[str] = None


class AttendanceEntryRead(AttendanceEntryBase):
    student_reg_no: Optional[str] = None
    student_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AttendanceRecordRead(BaseModel):
    id: str
    date: str
    period_number: int
    subject_id: str
    subject_code: str
    subject_name: str
    faculty_id: str
    faculty_name: str
    department_id: str
    semester: int
    section: str
    room_no: str
    entries: List[AttendanceEntryRead]
    total_students: int
    present_count: int
    absent_count: int
    late_count: int
    od_count: int
    leave_count: int
    submitted_at: str
    is_locked: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)


class AttendanceRecordCreate(BaseModel):
    date: str
    period_number: int
    subject_id: str
    faculty_id: str
    room_no: Optional[str] = None
    department_id: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    entries: List[AttendanceEntryBase]


# ── Attendance Summary (student view) ─────────────────────
class AttendanceSummaryItem(BaseModel):
    subject_id: str
    subject_code: str
    subject_name: str
    classes_held: int
    classes_attended: int
    classes_absent: int
    classes_late: int
    classes_od: int
    classes_leave: int
    attendance_pct: float
    min_attendance_pct: int
    is_below_threshold: bool


class StudentAttendanceSummary(BaseModel):
    student_id: str
    student_name: str
    student_reg_no: str
    overall_attendance_pct: float
    subject_breakdown: List[AttendanceSummaryItem]


class AttendanceHistoryEntry(BaseModel):
    date: str
    period_number: int
    subject_code: str
    subject_name: str
    faculty_name: str
    status: AttendanceStatus
    remarks: Optional[str] = None
    marked_at: str


# ── Corrections ────────────────────────────────────────────
class CorrectionRequestRead(BaseModel):
    id: str
    attendance_record_id: str
    date: str
    period_number: int
    subject_code: str
    subject_name: str
    faculty_id: str
    faculty_name: str
    student_id: str
    student_name: str
    student_reg_no: str
    original_status: AttendanceStatus
    proposed_status: AttendanceStatus
    reason: str
    status: CorrectionStatus
    created_at: str
    reviewed_by: Optional[str] = None
    review_comment: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CorrectionRequestCreate(BaseModel):
    attendance_session_id: str
    student_id: str
    subject_id: str
    date: str
    period_number: int
    original_status: AttendanceStatus
    proposed_status: AttendanceStatus
    reason: str


class CorrectionReview(BaseModel):
    status: CorrectionStatus
    reviewer_name: str
    comment: Optional[str] = None


# ── Leave ──────────────────────────────────────────────────
class FacultyApproval(BaseModel):
    faculty_id: str
    faculty_name: str
    approved_at: Optional[str] = None
    comment: Optional[str] = None


class HodApproval(BaseModel):
    hod_id: str
    hod_name: str
    approved_at: Optional[str] = None
    comment: Optional[str] = None


class LeaveRequestRead(BaseModel):
    id: str
    student_id: str
    student_name: str
    student_reg_no: str
    department_id: str
    semester: int
    section: str
    leave_type: LeaveType
    start_date: str
    end_date: str
    total_days: int
    reason: str
    attachment_url: Optional[str] = None
    status: LeaveStatus
    faculty_approval: Optional[FacultyApproval] = None
    hod_approval: Optional[HodApproval] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class LeaveRequestCreate(BaseModel):
    student_id: str
    student_name: str
    student_reg_no: str
    department_id: str
    semester: int
    section: str
    leave_type: LeaveType
    start_date: str
    end_date: str
    total_days: int
    reason: str
    attachment_url: Optional[str] = None


class LeaveReview(BaseModel):
    stage: str  # 'faculty' or 'hod'
    status: str  # 'approved' or 'rejected'
    reviewer_id: str
    reviewer_name: str
    comment: Optional[str] = None


# ── Substitution ───────────────────────────────────────────
class SubstitutionRequestRead(BaseModel):
    id: str
    requesting_faculty_id: str
    requesting_faculty_name: str
    substitute_faculty_id: str
    substitute_faculty_name: str
    date: str
    period_number: int
    subject_code: str
    subject_name: str
    room_no: str
    section: str
    reason: str
    status: SubstitutionStatus
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class SubstitutionRequestCreate(BaseModel):
    requesting_faculty_id: str
    requesting_faculty_name: str
    substitute_faculty_id: str
    substitute_faculty_name: str
    date: str
    period_number: int
    subject_code: str
    subject_name: str
    room_no: str
    section: str
    reason: str


class SubstitutionReview(BaseModel):
    action: str  # 'accept', 'reject', 'approve'


# ── Calendar ───────────────────────────────────────────────
class CalendarEventRead(BaseModel):
    id: str
    date: str
    type: CalendarEventType
    title: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CalendarEventCreate(BaseModel):
    date: str
    type: CalendarEventType
    title: str
    description: Optional[str] = None


# ── Notifications ──────────────────────────────────────────
class AppNotificationRead(BaseModel):
    id: str
    title: str
    message: str
    timestamp: str
    read: bool
    type: NotificationType
    link: Optional[str] = None
    target_role: Optional[UserRole] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationCreate(BaseModel):
    user_id: Optional[str] = None
    title: str
    message: str
    type: NotificationType
    link: Optional[str] = None
    target_role: Optional[UserRole] = None


# ── Audit Logs ─────────────────────────────────────────────
class AuditLogRead(BaseModel):
    id: str
    timestamp: str
    user_id: str
    user_name: str
    role: UserRole
    action: str
    module: str
    details: str
    ip_address: str
    payload_diff: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AuditLogCreate(BaseModel):
    user_id: Optional[str] = None
    action: str
    module: str
    details: str
    ip_address: str
    payload_diff: Optional[str] = None


# ── Backups ────────────────────────────────────────────────
class BackupSnapshotRead(BaseModel):
    id: str
    filename: str
    size: str
    created_at: str
    type: BackupType
    status: BackupStatus

    model_config = ConfigDict(from_attributes=True)


class BackupTrigger(BaseModel):
    type: BackupType


# ── Reports ────────────────────────────────────────────────
class ReportRequest(BaseModel):
    report_type: str  # daily, weekly, monthly, semester, subject_wise, low_attendance
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    subject_id: Optional[str] = None
    student_id: Optional[str] = None
    department_id: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None


class DepartmentAnalysis(BaseModel):
    id: str
    code: str
    name: str
    student_count: int
    faculty_count: int
    avg_attendance_pct: float
    flagged_students: List[dict]


class FacultyMonitoring(BaseModel):
    faculty_id: str
    faculty_name: str
    department_name: str
    subjects: List[dict]
    total_classes_conducted: int
    avg_student_attendance: float


class AdminDashboard(BaseModel):
    total_students: int
    total_faculty: int
    total_departments: int
    total_subjects: int
    attendance_overview: dict
    department_performance: List[dict]
    weekly_trend: List[dict]


class FacultyDashboard(BaseModel):
    today_schedule: List[ActivePeriodRead]
    pending_leaves: int
    pending_substitutions: int
    assigned_courses: List[dict]


class StudentDashboard(BaseModel):
    overall_attendance_pct: float
    subject_breakdown: List[AttendanceSummaryItem]
    today_schedule: List[dict]
    active_leaves: int
    notifications: List[AppNotificationRead]


class HODDashboard(BaseModel):
    department_stats: dict
    pending_leaves: List[dict]
    pending_substitutions: List[dict]
    attendance_trend: List[dict]
    flagged_students: List[dict]
