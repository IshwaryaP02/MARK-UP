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
  semester?: number;
  section?: string;
  rollNo?: string;
  batch?: string;
  guardianName?: string;
  guardianPhone?: string;
  phone?: string;
  address?: string;
  gender?: string;
  dob?: string;
  fatherName?: string;
  motherName?: string;
  parentPhone?: string;
  active: boolean;
  lastLogin?: string;
  profileSubmitted?: boolean;
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
  parentPhone?: string;
  address?: string;
  gender?: string;
  dob?: string;
  active: boolean;
  profileSubmitted?: boolean;
}

export interface Faculty {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  avatar?: string;
  departmentId: string;
  departmentName: string;
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
  periodNumber: number; // 1 to 5
  startTime: string; // "09:00 AM"
  endTime: string;   // "09:50 AM"
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
    departmentId: string;
    semester: number;
    section: string;
    shift?: string; // Optional shift label (e.g. First Shift / Second Shift / Morning / Evening)
    dayOrder?: number; // Optional Day Order (1, 2, 3...) this slot belongs to. Undefined = applies to all day orders.
  }

export interface PeriodTiming {
  id: 'p1' | 'p2' | 'p3' | 'interval' | 'p4' | 'p5';
  label: string;
  periodNumber: number | null;
  start: string; // "09:00 AM"
  end: string;   // "09:50 AM"
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

export interface StaffOrder {
  id: string;
  month: string; // YYYY-MM
  title: string;
  orderNumber: string;
  description?: string;
  issuedDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

// A single date → Day Order mapping extracted from an uploaded monthly schedule image.
export interface DayOrderEntry {
  date: string; // YYYY-MM-DD
  dayOrder: number; // 1, 2, 3, ...
}

// A monthly Staff Day Order schedule uploaded by Admin (image + OCR-extracted entries).
export interface StaffDayOrder {
  id: string;
  month: string; // YYYY-MM
  title: string;
  imageUrl: string; // base64 preview of the uploaded schedule image
  entries: DayOrderEntry[];
  createdAt: string;
  updatedAt: string;
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
  createdAt?: string;
  targetRole?: UserRole;
  targetClass?: { semester: number; section: string };
  // Extended targeting for circular-driven notifications.
  targetDepartmentIds?: string[]; // students belonging to these departments
  targetProgrammes?: string[];    // 'UG' | 'MSc' / programme names
  targetSemesters?: number[];     // students belonging to these semesters (covers both shifts)
  targetShift?: string;           // optional shift restriction
  circularId?: string;            // id of the source circular (to open/view it)
}

export type CircularTarget = 'all_faculty' | 'individual_faculty' | 'all_students' | 'specific_students' | 'tutor_class';
export type CircularStatus = 'draft' | 'signed' | 'published' | 'archived';

// ---- HOD Student Details (frontend-only, UMIS-style record) ----

export interface PreviousSchoolRecord {
  className: string; // '6' ... '12'
  district: string;
  schoolName: string;
  schoolType: string;
}

export interface StudentScholarship {
  name: string;
  availability: string;
  status: 'Active' | 'Inactive';
}

export interface StudentDetails {
  id: string;
  // General / Identity
  studentNameTamil?: string;
  studentNameEnglish: string;
  nameAsPerCertificate?: string;
  nameAsPerAadhaar?: string;
  salutation?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  community?: string;
  caste?: string;
  communityCertificateNumber?: string;
  aadhaarNumber?: string;
  emisId?: string;
  firstGraduateInFamily?: string;
  firstGraduateCertificateNumber?: string;
  specialAdmission?: string;
  differentlyAbled?: string; // 'Yes' | 'No'
  udidNumber?: string;
  disabilityType?: string;
  disabilityPercentage?: string;
  // College / Academic
  collegeName?: string;
  collegeCode?: string;
  collegeDistrict?: string;
  collegeRegion?: string;
  academicYearOfJoining?: string;
  streamType?: string;
  courseType: string; // 'UG' | 'PG'
  course: string;
  department: string;
  branch?: string;
  mediumOfInstruction?: string;
  modeOfStudy?: string;
  dateOfAdmission?: string;
  typeOfAdmission?: string;
  counsellingNumber?: string;
  regNo: string;
  rollNo: string;
  lateralEntry?: string;
  hostelStatus?: string;
  currentStudentStatus?: string;
  yearOfStudy?: string;
  semester: number;
  shift: string;
  // Contact Information
  mobileNumber?: string;
  emailId?: string;
  contactCountry?: string;
  contactState?: string;
  contactLocationType?: string;
  contactDistrict?: string;
  contactTaluk?: string;
  contactVillage?: string;
  contactBlock?: string;
  contactPanchayat?: string;
  contactPincode?: string;
  contactPostalAddress?: string;
  // Communication Address
  commCountry?: string;
  commState?: string;
  commLocationType?: string;
  commDistrict?: string;
  commTaluk?: string;
  commVillage?: string;
  commBlock?: string;
  commPanchayat?: string;
  commPincode?: string;
  commPostalAddress?: string;
  // Family Information
  orphanCategory?: string;
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  guardianSpouseName?: string;
  annualFamilyIncome?: string;
  incomeCertificateNumber?: string;
  parentMobileNumber?: string;
  // Bank Information
  bankAccountNumber?: string;
  bankMobileNumber?: string;
  bankName?: string;
  aadhaarSeedingStatus?: string;
  accountActiveStatus?: string;
  ifscCode?: string;
  bankBranch?: string;
  bankCity?: string;
  accountType?: string;
  // Previous School Details (Classes 6-12)
  previousSchools?: PreviousSchoolRecord[];
  // Scholarship Information
  scholarships?: StudentScholarship[];
  // Display / search helpers
  name: string; // English display name (same as studentNameEnglish)
  email?: string;
  avatar?: string;
  departmentId: string;
  active: boolean;
}

export type BonafideStatus =
  | 'submitted'
  | 'faculty_review'
  | 'faculty_recommended'
  | 'hod_review'
  | 'hod_recommended'
  | 'principal_approval'
  | 'returned_to_hod'
  | 'approved';

export type BonafidePurpose =
  | 'education'
  | 'admission'
  | 'bank'
  | 'scholarship'
  | 'passport'
  | 'visa'
  | 'government'
  | 'other';

export interface BonafideRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  departmentId: string;
  departmentName: string;
  semester: number;
  section: string;
  batch: string;
  rollNo: string;
  purpose: BonafidePurpose;
  purposeDescription?: string;
  requiredCopies?: number;
  status: BonafideStatus;
  // Approval trail
  facultyId?: string;
  facultyName?: string;
  facultyRecommendedAt?: string;
  facultyComment?: string;
  hodId?: string;
  hodName?: string;
  hodRecommendedAt?: string;
  hodComment?: string;
  principalName?: string;
  principalApprovedAt?: string;
  finalApprovedAt?: string;
  createdAt: string;
  updatedAt: string;
}

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
  createdByRole?: UserRole; // role of the user who created the circular
  createdByName?: string;
  createdAt: string;
}
