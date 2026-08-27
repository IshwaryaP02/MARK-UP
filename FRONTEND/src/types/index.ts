export type UserRole = 'admin' | 'faculty' | 'student' | 'hod';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'od' | 'leave';

export type LeaveType = 'medical' | 'casual' | 'duty_leave' | 'on_duty';

export type LeaveStatus = 'pending_faculty' | 'pending_hod' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  regNo?: string;
  employeeId?: string;
  phone?: string;
  address?: string;
  gender?: string;
  dob?: string;
  fatherName?: string;
  motherName?: string;
  parentPhone?: string;
  active: boolean;
  lastLogin?: string;
}

export interface Student {
  id: string;
  regNo: string;
  rollNo: string;
  name: string;
  email: string;
  avatar?: string;
  departmentId: string;
  departmentName: string;
  semester: number;
  section: string;
  batch: string;
  overallAttendancePct: number;
  guardianName: string;
  guardianPhone: string;
  fatherName?: string;
  motherName?: string;
  phone?: string;
  address?: string;
  gender?: string;
  dob?: string;
  active: boolean;
}

export interface Faculty {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  avatar?: string;
  departmentId: string;
  departmentName: string;
  designation: string;
  phone: string;
  assignedSubjectIds: string[];
  isHOD?: boolean;
  tutorFor?: { semester: number; section: string };
  active: boolean;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  hodId?: string;
  hodName?: string;
  studentCount: number;
  facultyCount: number;
  subjectsCount: number;
  avgAttendancePct: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  departmentName: string;
  semester: number;
  credits: number;
  minAttendancePct: number; // e.g. 75
  totalClassesHeld: number;
  facultyId?: string;
  facultyName?: string;
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  periodNumber: number; // 1 to 6
  startTime: string; // "09:00 AM"
  endTime: string;   // "09:50 AM"
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  roomNo: string;
  departmentId: string;
  semester: number;
  section: string;
}

export interface AttendanceEntry {
  studentId: string;
  studentRegNo: string;
  studentName: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  periodNumber: number;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  departmentId: string;
  semester: number;
  section: string;
  roomNo: string;
  entries: AttendanceEntry[];
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  odCount: number;
  leaveCount: number;
  submittedAt: string;
  isLocked?: boolean;
}

export interface CorrectionRequest {
  id: string;
  attendanceRecordId: string;
  date: string;
  periodNumber: number;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  originalStatus: AttendanceStatus;
  proposedStatus: AttendanceStatus;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewComment?: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  departmentId: string;
  semester: number;
  section: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentUrl?: string;
  status: LeaveStatus;
  facultyApproval?: {
    facultyId: string;
    facultyName: string;
    approvedAt?: string;
    comment?: string;
  };
  hodApproval?: {
    hodId: string;
    hodName: string;
    approvedAt?: string;
    comment?: string;
  };
  createdAt: string;
}

export interface SubstitutionRequest {
  id: string;
  requestingFacultyId: string;
  requestingFacultyName: string;
  substituteFacultyId: string;
  substituteFacultyName: string;
  date: string;
  periodNumber: number;
  subjectCode: string;
  subjectName: string;
  roomNo: string;
  section: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected_by_sub' | 'approved_by_hod';
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'holiday' | 'exam' | 'working' | 'event';
  title: string;
  description?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string; // e.g. "MARK_ATTENDANCE", "UPDATE_STUDENT", "APPROVE_LEAVE"
  module: string;
  details: string;
  ipAddress: string;
  payloadDiff?: string;
}

export interface BackupSnapshot {
  id: string;
  filename: string;
  size: string;
  createdAt: string;
  type: 'manual' | 'automated';
  status: 'success' | 'failed';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'danger';
  link?: string;
  targetRole?: UserRole;
  targetClass?: { semester: number; section: string };
}

export type CircularTarget = 'all_faculty' | 'individual_faculty' | 'all_students' | 'specific_students' | 'tutor_class';
export type CircularStatus = 'draft' | 'signed' | 'published' | 'archived';

export interface Circular {
  id: string;
  title: string;
  description: string;
  target: CircularTarget;
  departmentId: string;
  departmentName: string;
  course?: string;
  year?: string;
  shift?: string;
  attachmentUrl?: string;
  validFrom: string;
  validUntil: string;
  status: CircularStatus;
  signedBy?: string;
  signedAt?: string;
  publishedAt?: string;
  publishedBy?: string;
  recipientCount: number;
  selectedFacultyIds?: string[];
  targetClass?: { semester: number; section: string };
  createdBy: string;
  createdAt: string;
}
