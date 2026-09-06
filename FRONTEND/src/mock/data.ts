import {
  User,
  Student,
  Faculty,
  Department,
  Subject,
  TimetableSlot,
  AttendanceRecord,
  CorrectionRequest,
  LeaveRequest,
  SubstitutionRequest,
  CalendarEvent,
  AuditLog,
  BackupSnapshot,
  AppNotification,
  Circular,
  PeriodTiming
} from '../types';

export const mockPeriodTimes: PeriodTiming[] = [
  { id: 'p1', label: 'P1', periodNumber: 1, start: '09:00 AM', end: '09:50 AM' },
  { id: 'p2', label: 'P2', periodNumber: 2, start: '09:55 AM', end: '10:45 AM' },
  { id: 'p3', label: 'P3', periodNumber: 3, start: '10:50 AM', end: '11:25 AM' },
  { id: 'interval', label: 'Interval', periodNumber: null, start: '11:30 AM', end: '11:40 AM' },
  { id: 'p4', label: 'P4', periodNumber: 4, start: '11:40 AM', end: '12:30 PM' },
  { id: 'p5', label: 'P5', periodNumber: 5, start: '12:50 PM', end: '01:40 PM' }
];

export const mockUsers: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Dr. Robert Vance',
    email: 'admin@university.edu',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    role: 'admin',
    departmentName: 'Central Administration',
    employeeId: 'ADM-001',
    phone: '+1 (555) 019-2834',
    active: true,
    lastLogin: '2026-08-02 08:30 AM'
  },
  {
    id: 'usr-hod-1',
    name: 'Dr. Alan Turing',
    email: 'hod.cs@university.edu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    role: 'hod',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    employeeId: 'FAC-HOD-01',
    phone: '+1 (555) 012-9988',
    active: true,
    lastLogin: '2026-08-02 08:45 AM'
  },
  {
    id: 'usr-faculty-1',
    name: 'Prof. Sarah Jenkins',
    email: 'sarah.jenkins@university.edu',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    role: 'faculty',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    employeeId: 'FAC-102',
    phone: '+1 (555) 014-4321',
    active: true,
    lastLogin: '2026-08-02 09:10 AM'
  },
  {
    id: 'usr-student-1',
    name: 'Alex Mercer',
    email: 'alex.mercer@student.edu',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    role: 'student',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    regNo: '2024CS1042',
    phone: '+1 (555) 018-7711',
    active: true,
    lastLogin: '2026-08-02 09:15 AM'
  }
];

export const mockDepartments: Department[] = [
  {
    id: 'dept-cs',
    code: 'CS',
    name: 'Computer Science',
    hodId: 'usr-hod-1',
    hodName: 'Dr. Alan Turing',
    studentCount: 320,
    facultyCount: 24,
    subjectsCount: 18,
    avgAttendancePct: 88.4
  },
  {
    id: 'dept-it',
    code: 'IT',
    name: 'Information and Technology (IT)',
    hodId: 'fac-it-hod',
    hodName: 'Dr. Grace Hopper',
    studentCount: 210,
    facultyCount: 15,
    subjectsCount: 12,
    avgAttendancePct: 91.2
  }
];

export const mockSubjects: Subject[] = [
  {
    id: 'sub-cs401',
    code: 'CS401',
    name: 'Data Structures & Algorithms',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    semester: 4,
    credits: 4,
    minAttendancePct: 75,
    totalClassesHeld: 42,
    facultyId: 'usr-faculty-1',
    facultyName: 'Prof. Sarah Jenkins'
  },
  {
    id: 'sub-cs402',
    code: 'CS402',
    name: 'Operating Systems',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    semester: 4,
    credits: 3,
    minAttendancePct: 75,
    totalClassesHeld: 38,
    facultyId: 'usr-hod-1',
    facultyName: 'Dr. Alan Turing'
  },
  {
    id: 'sub-cs403',
    code: 'CS403',
    name: 'Database Management Systems',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    semester: 4,
    credits: 4,
    minAttendancePct: 75,
    totalClassesHeld: 40,
    facultyId: 'fac-103',
    facultyName: 'Prof. David Miller'
  },
  {
    id: 'sub-cs404',
    code: 'CS404',
    name: 'Web Technology & Frameworks',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    semester: 4,
    credits: 3,
    minAttendancePct: 75,
    totalClassesHeld: 36,
    facultyId: 'usr-faculty-1',
    facultyName: 'Prof. Sarah Jenkins'
  },
  {
    id: 'sub-ec301',
    code: 'EC301',
    name: 'Digital Signal Processing',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    semester: 4,
    credits: 4,
    minAttendancePct: 75,
    totalClassesHeld: 35,
    facultyId: 'fac-ece-1',
    facultyName: 'Prof. Emily Watson'
  }
];

export const mockFaculty: Faculty[] = [
  {
    id: 'usr-faculty-1',
    employeeId: 'FAC-102',
    name: 'Prof. Sarah Jenkins',
    email: 'sarah.jenkins@university.edu',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',    phone: '+1 (555) 014-4321',
    assignedSubjectIds: ['sub-cs401', 'sub-cs404'],
    tutorFor: { semester: 4, section: 'A' },
    active: true
  },
  {
    id: 'usr-hod-1',
    employeeId: 'FAC-HOD-01',
    name: 'Dr. Alan Turing',
    email: 'hod.cs@university.edu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',    phone: '+1 (555) 012-9988',
    assignedSubjectIds: ['sub-cs402'],
    isHOD: true,
    active: true
  },
  {
    id: 'fac-103',
    employeeId: 'FAC-103',
    name: 'Prof. David Miller',
    email: 'david.miller@university.edu',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',    phone: '+1 (555) 019-8833',
    assignedSubjectIds: ['sub-cs403'],
    active: true
  },
  {
    id: 'fac-ece-1',
    employeeId: 'FAC-201',
    name: 'Prof. Emily Watson',
    email: 'emily.watson@university.edu',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',    phone: '+1 (555) 017-2244',
    assignedSubjectIds: ['sub-ec301'],
    active: true
  }
];

export const mockStudents: Student[] = [
  {
    id: 'usr-student-1',
    regNo: '2024CS1042',
    rollNo: '24CS01',
    name: 'Alex Mercer',
    email: 'alex.mercer@student.edu',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    semester: 4,
    section: 'A',
    batch: '2022-2026',
    overallAttendancePct: 86.5,
    guardianName: 'Richard Mercer',
    guardianPhone: '+1 (555) 998-1122',
    active: true
  },
  {
    id: 'std-102',
    regNo: '2024CS1043',
    rollNo: '24CS02',
    name: 'Beatrice Vance',
    email: 'beatrice.vance@student.edu',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    semester: 4,
    section: 'A',
    batch: '2022-2026',
    overallAttendancePct: 94.2,
    guardianName: 'Henry Vance',
    guardianPhone: '+1 (555) 998-3344',
    active: true
  },
  {
    id: 'std-103',
    regNo: '2024CS1044',
    rollNo: '24CS03',
    name: 'Carlos Mendez',
    email: 'carlos.mendez@student.edu',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    semester: 4,
    section: 'A',
    batch: '2022-2026',
    overallAttendancePct: 68.4, // Low attendance flag
    guardianName: 'Maria Mendez',
    guardianPhone: '+1 (555) 998-5566',
    active: true
  },
  {
    id: 'std-104',
    regNo: '2024CS1045',
    rollNo: '24CS04',
    name: 'Diana Prince',
    email: 'diana.prince@student.edu',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    semester: 4,
    section: 'A',
    batch: '2022-2026',
    overallAttendancePct: 91.0,
    guardianName: 'Hippolyta Prince',
    guardianPhone: '+1 (555) 998-7788',
    active: true
  },
  {
    id: 'std-105',
    regNo: '2024CS1046',
    rollNo: '24CS05',
    name: 'Ethan Hunt',
    email: 'ethan.hunt@student.edu',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    semester: 4,
    section: 'A',
    batch: '2022-2026',
    overallAttendancePct: 71.2, // Low attendance flag
    guardianName: 'Julia Hunt',
    guardianPhone: '+1 (555) 998-9900',
    active: true
  },
  {
    id: 'std-106',
    regNo: '2024CS1047',
    rollNo: '24CS06',
    name: 'Fiona Gallagher',
    email: 'fiona.g@student.edu',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    semester: 4,
    section: 'A',
    batch: '2022-2026',
    overallAttendancePct: 88.0,
    guardianName: 'Frank Gallagher',
    guardianPhone: '+1 (555) 998-1234',
    active: true
  }
];

export const mockTimetableSlots: TimetableSlot[] = [
  // Monday
  {
    id: 'tt-mon-p1',
    day: 'Monday',
    periodNumber: 1,
    startTime: '09:00 AM',
    endTime: '09:50 AM',
    subjectId: 'sub-cs401',
    subjectCode: 'CS401',
    subjectName: 'Data Structures & Algorithms',
    facultyId: 'usr-faculty-1',
    facultyName: 'Prof. Sarah Jenkins',    departmentId: 'dept-cs',
    semester: 4,
    section: 'A'
  },
  {
    id: 'tt-mon-p2',
    day: 'Monday',
    periodNumber: 2,
    startTime: '09:55 AM',
    endTime: '10:45 AM',
    subjectId: 'sub-cs402',
    subjectCode: 'CS402',
    subjectName: 'Operating Systems',
    facultyId: 'usr-hod-1',
    facultyName: 'Dr. Alan Turing',    departmentId: 'dept-cs',
    semester: 4,
    section: 'A'
  },
  {
    id: 'tt-mon-p3',
    day: 'Monday',
    periodNumber: 3,
    startTime: '10:50 AM',
    endTime: '11:25 AM',
    subjectId: 'sub-cs403',
    subjectCode: 'CS403',
    subjectName: 'Database Management Systems',
    facultyId: 'fac-103',
    facultyName: 'Prof. David Miller',    departmentId: 'dept-cs',
    semester: 4,
    section: 'A'
  },
  {
    id: 'tt-mon-p4',
    day: 'Monday',
    periodNumber: 4,
    startTime: '11:40 AM',
    endTime: '12:30 PM',
    subjectId: 'sub-cs404',
    subjectCode: 'CS404',
    subjectName: 'Web Technology & Frameworks',
    facultyId: 'usr-faculty-1',
    facultyName: 'Prof. Sarah Jenkins',    departmentId: 'dept-cs',
    semester: 4,
    section: 'A'
  },

  // Tuesday
  {
    id: 'tt-tue-p1',
    day: 'Tuesday',
    periodNumber: 1,
    startTime: '09:00 AM',
    endTime: '09:50 AM',
    subjectId: 'sub-cs404',
    subjectCode: 'CS404',
    subjectName: 'Web Technology & Frameworks',
    facultyId: 'usr-faculty-1',
    facultyName: 'Prof. Sarah Jenkins',    departmentId: 'dept-cs',
    semester: 4,
    section: 'A'
  },
  {
    id: 'tt-tue-p2',
    day: 'Tuesday',
    periodNumber: 2,
    startTime: '09:55 AM',
    endTime: '10:45 AM',
    subjectId: 'sub-cs401',
    subjectCode: 'CS401',
    subjectName: 'Data Structures & Algorithms',
    facultyId: 'usr-faculty-1',
    facultyName: 'Prof. Sarah Jenkins',    departmentId: 'dept-cs',
    semester: 4,
    section: 'A'
  },

  // Wednesday
  {
    id: 'tt-wed-p1',
    day: 'Wednesday',
    periodNumber: 1,
    startTime: '09:00 AM',
    endTime: '09:50 AM',
    subjectId: 'sub-cs401',
    subjectCode: 'CS401',
    subjectName: 'Data Structures & Algorithms',
    facultyId: 'usr-faculty-1',
    facultyName: 'Prof. Sarah Jenkins',    departmentId: 'dept-cs',
    semester: 4,
    section: 'A'
  },
  {
    id: 'tt-wed-p3',
    day: 'Wednesday',
    periodNumber: 3,
    startTime: '10:50 AM',
    endTime: '11:25 AM',
    subjectId: 'sub-cs404',
    subjectCode: 'CS404',
    subjectName: 'Web Technology & Frameworks',
    facultyId: 'usr-faculty-1',
    facultyName: 'Prof. Sarah Jenkins',    departmentId: 'dept-cs',
    semester: 4,
    section: 'A'
  },

  // Thursday
  {
    id: 'tt-thu-p2',
    day: 'Thursday',
    periodNumber: 2,
    startTime: '09:55 AM',
    endTime: '10:45 AM',
    subjectId: 'sub-cs401',
    subjectCode: 'CS401',
    subjectName: 'Data Structures & Algorithms',
    facultyId: 'usr-faculty-1',
    facultyName: 'Prof. Sarah Jenkins',    departmentId: 'dept-cs',
    semester: 4,
    section: 'A'
  },
  {
    id: 'tt-thu-p4',
    day: 'Thursday',
    periodNumber: 4,
    startTime: '11:40 AM',
    endTime: '12:30 PM',
    subjectId: 'sub-cs404',
    subjectCode: 'CS404',
    subjectName: 'Web Technology & Frameworks',
    facultyId: 'usr-faculty-1',
    facultyName: 'Prof. Sarah Jenkins',    departmentId: 'dept-cs',
    semester: 4,
    section: 'A'
  },

  // Friday
  {
    id: 'tt-fri-p1',
    day: 'Friday',
    periodNumber: 1,
    startTime: '09:00 AM',
    endTime: '09:50 AM',
    subjectId: 'sub-cs404',
    subjectCode: 'CS404',
    subjectName: 'Web Technology & Frameworks',
    facultyId: 'usr-faculty-1',
    facultyName: 'Prof. Sarah Jenkins',    departmentId: 'dept-cs',
    semester: 4,
    section: 'A'
  },
  {
    id: 'tt-fri-p3',
    day: 'Friday',
    periodNumber: 3,
    startTime: '10:50 AM',
    endTime: '11:25 AM',
    subjectId: 'sub-cs401',
    subjectCode: 'CS401',
    subjectName: 'Data Structures & Algorithms',
    facultyId: 'usr-faculty-1',
    facultyName: 'Prof. Sarah Jenkins',    departmentId: 'dept-cs',
    semester: 4,
    section: 'A'
  },

  // Saturday
  {
    id: 'tt-sat-p2',
    day: 'Saturday',
    periodNumber: 2,
    startTime: '09:55 AM',
    endTime: '10:45 AM',
    subjectId: 'sub-cs401',
    subjectCode: 'CS401',
    subjectName: 'Data Structures & Algorithms',
    facultyId: 'usr-faculty-1',
    facultyName: 'Prof. Sarah Jenkins',    departmentId: 'dept-cs',
    semester: 4,
    section: 'A'
  }
];

export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'att-rec-20260801-p1',
    date: '2026-08-01',
    periodNumber: 1,
    subjectId: 'sub-cs401',
    subjectCode: 'CS401',
    subjectName: 'Data Structures & Algorithms',
    facultyId: 'usr-faculty-1',
    facultyName: 'Prof. Sarah Jenkins',
    departmentId: 'dept-cs',
    semester: 4,
    section: 'A',    totalStudents: 6,
    presentCount: 4,
    absentCount: 1,
    lateCount: 0,
    odCount: 1,
    leaveCount: 0,
    submittedAt: '2026-08-01 09:52 AM',
    entries: [
      { studentId: 'usr-student-1', studentRegNo: '2024CS1042', studentName: 'Alex Mercer', status: 'present' },
      { studentId: 'std-102', studentRegNo: '2024CS1043', studentName: 'Beatrice Vance', status: 'present' },
      { studentId: 'std-103', studentRegNo: '2024CS1044', studentName: 'Carlos Mendez', status: 'absent', remarks: 'Unexcused' },
      { studentId: 'std-104', studentRegNo: '2024CS1045', studentName: 'Diana Prince', status: 'present' },
      { studentId: 'std-105', studentRegNo: '2024CS1046', studentName: 'Ethan Hunt', status: 'od', remarks: 'Hackathon Participation' },
      { studentId: 'std-106', studentRegNo: '2024CS1047', studentName: 'Fiona Gallagher', status: 'present' }
    ]
  },
  {
    id: 'att-rec-20260731-p2',
    date: '2026-07-31',
    periodNumber: 2,
    subjectId: 'sub-cs402',
    subjectCode: 'CS402',
    subjectName: 'Operating Systems',
    facultyId: 'usr-hod-1',
    facultyName: 'Dr. Alan Turing',
    departmentId: 'dept-cs',
    semester: 4,
    section: 'A',    totalStudents: 6,
    presentCount: 5,
    absentCount: 1,
    lateCount: 0,
    odCount: 0,
    leaveCount: 0,
    submittedAt: '2026-07-31 10:55 AM',
    entries: [
      { studentId: 'usr-student-1', studentRegNo: '2024CS1042', studentName: 'Alex Mercer', status: 'present' },
      { studentId: 'std-102', studentRegNo: '2024CS1043', studentName: 'Beatrice Vance', status: 'present' },
      { studentId: 'std-103', studentRegNo: '2024CS1044', studentName: 'Carlos Mendez', status: 'absent' },
      { studentId: 'std-104', studentRegNo: '2024CS1045', studentName: 'Diana Prince', status: 'present' },
      { studentId: 'std-105', studentRegNo: '2024CS1046', studentName: 'Ethan Hunt', status: 'present' },
      { studentId: 'std-106', studentRegNo: '2024CS1047', studentName: 'Fiona Gallagher', status: 'present' }
    ]
  }
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'lv-001',
    studentId: 'usr-student-1',
    studentName: 'Alex Mercer',
    studentRegNo: '2024CS1042',
    departmentId: 'dept-cs',
    semester: 4,
    section: 'A',
    leaveType: 'medical',
    startDate: '2026-08-04',
    endDate: '2026-08-05',
    totalDays: 2,
    reason: 'Severe flu and high fever. Doctor prescribed 2 days bed rest.',
    attachmentUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
    status: 'pending_faculty',
    createdAt: '2026-08-01 02:30 PM'
  },
  {
    id: 'lv-002',
    studentId: 'std-103',
    studentName: 'Carlos Mendez',
    studentRegNo: '2024CS1044',
    departmentId: 'dept-cs',
    semester: 4,
    section: 'A',
    leaveType: 'on_duty',
    startDate: '2026-08-06',
    endDate: '2026-08-06',
    totalDays: 1,
    reason: 'Representing university at Inter-College Robotics Symposium.',
    status: 'pending_hod',
    facultyApproval: {
      facultyId: 'usr-faculty-1',
      facultyName: 'Prof. Sarah Jenkins',
      approvedAt: '2026-08-01 05:10 PM',
      comment: 'Recommended for OD approval.'
    },
    createdAt: '2026-08-01 11:15 AM'
  }
];

export const mockCorrectionRequests: CorrectionRequest[] = [
  {
    id: 'corr-001',
    attendanceRecordId: 'att-rec-20260801-p1',
    date: '2026-08-01',
    periodNumber: 1,
    subjectCode: 'CS401',
    subjectName: 'Data Structures & Algorithms',
    facultyId: 'usr-faculty-1',
    facultyName: 'Prof. Sarah Jenkins',
    studentId: 'std-103',
    studentName: 'Carlos Mendez',
    studentRegNo: '2024CS1044',
    originalStatus: 'absent',
    proposedStatus: 'present',
    reason: 'Student arrived 5 minutes late due to bus breakdown and attended full lab session.',
    status: 'pending',
    createdAt: '2026-08-01 04:00 PM'
  }
];

export const mockSubstitutionRequests: SubstitutionRequest[] = [
  {
    id: 'subst-001',
    requestingFacultyId: 'usr-faculty-1',
    requestingFacultyName: 'Prof. Sarah Jenkins',
    substituteFacultyId: 'fac-103',
    substituteFacultyName: 'Prof. David Miller',
    date: '2026-08-05',
    periodNumber: 4,
    subjectCode: 'CS404',
    subjectName: 'Web Technology',    section: 'CSE-4A',
    reason: 'Attending IEEE Research Workshop session.',
    status: 'pending',
    createdAt: '2026-08-01 03:20 PM'
  }
];

export const mockCalendarEvents: CalendarEvent[] = [
  { id: 'cal-1', date: '2026-08-15', type: 'holiday', title: 'Independence Day', description: 'National Holiday' },
  { id: 'cal-2', date: '2026-08-20', type: 'exam', title: 'Mid-Semester Examination Begins', description: 'Sem 4 Midterms' },
  { id: 'cal-3', date: '2026-08-25', type: 'working', title: 'Special Working Saturday', description: 'Compensation for fest day' }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-101',
    timestamp: '2026-08-02 09:12:04',
    userId: 'usr-faculty-1',
    userName: 'Prof. Sarah Jenkins',
    role: 'faculty',
    action: 'MARK_ATTENDANCE',
    module: 'Attendance Engine',
    details: 'Submitted period 1 attendance for CS401 (CSE-4A). Total: 6, Present: 5, Absent: 1.',
    ipAddress: '192.168.1.104',
    payloadDiff: '{"period": 1, "subject": "CS401", "present": ["2024CS1042", "2024CS1043", "2024CS1045"]}'
  },
  {
    id: 'log-102',
    timestamp: '2026-08-01 16:45:12',
    userId: 'usr-admin-1',
    userName: 'Dr. Robert Vance',
    role: 'admin',
    action: 'CREATE_STUDENT',
    module: 'Student Directory',
    details: 'Added new student regNo: 2024CS1047 (Fiona Gallagher).',
    ipAddress: '10.0.0.12'
  }
];

export const mockBackupSnapshots: BackupSnapshot[] = [
  { id: 'bkp-001', filename: 'smart_attendance_db_20260801_auto.sql', size: '14.2 MB', createdAt: '2026-08-01 02:00 AM', type: 'automated', status: 'success' },
  { id: 'bkp-002', filename: 'smart_attendance_db_20260725_manual.sql', size: '13.8 MB', createdAt: '2026-07-25 04:15 PM', type: 'manual', status: 'success' }
];

export const mockNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Low Attendance Alert',
    message: 'Your overall attendance in CS403 Database Management Systems is 71.2% (Below 75% threshold).',
    timestamp: '10 mins ago',
    read: false,
    type: 'warning',
    targetRole: 'student'
  },
  {
    id: 'notif-2',
    title: 'Leave Request Pending Review',
    message: 'Alex Mercer submitted a Medical Leave request for 2026-08-04 to 2026-08-05.',
    timestamp: '1 hour ago',
    read: false,
    type: 'info',
    targetRole: 'faculty'
  },
  {
    id: 'notif-3',
    title: 'Correction Request Approved',
    message: 'HOD approved your attendance correction for CS401 on 2026-08-01.',
    timestamp: '2 hours ago',
    read: true,
    type: 'success'
  }
];

// Optional seed Day Order data so the auto day-order timetable works out of the box.
// Entries map specific dates to a Day Order number (1..n) for the current month.
export const mockStaffDayOrders: {
  id: string;
  month: string;
  title: string;
  imageUrl: string;
  entries: { date: string; dayOrder: number }[];
  createdAt: string;
  updatedAt: string;
}[] = [
  {
    id: 'sdo-2026-09',
    month: '2026-09',
    title: 'September 2026 Staff Day Order',
    imageUrl: '',
    entries: [
      { date: '2026-09-01', dayOrder: 1 },
      { date: '2026-09-02', dayOrder: 2 },
      { date: '2026-09-03', dayOrder: 3 },
      { date: '2026-09-04', dayOrder: 1 },
      { date: '2026-09-07', dayOrder: 2 },
      { date: '2026-09-08', dayOrder: 3 },
      { date: '2026-09-09', dayOrder: 1 },
      { date: '2026-09-10', dayOrder: 2 },
      { date: '2026-09-11', dayOrder: 3 },
      { date: '2026-09-14', dayOrder: 1 },
      { date: '2026-09-15', dayOrder: 2 },
      { date: '2026-09-16', dayOrder: 3 },
      { date: '2026-09-17', dayOrder: 1 },
      { date: '2026-09-18', dayOrder: 2 },
      { date: '2026-09-21', dayOrder: 3 },
      { date: '2026-09-22', dayOrder: 1 },
      { date: '2026-09-23', dayOrder: 2 },
      { date: '2026-09-24', dayOrder: 3 },
      { date: '2026-09-25', dayOrder: 1 },
      { date: '2026-09-28', dayOrder: 2 },
      { date: '2026-09-29', dayOrder: 3 },
      { date: '2026-09-30', dayOrder: 1 }
    ],
    createdAt: '2026-08-31 09:00:00',
    updatedAt: '2026-08-31 09:00:00'
  }
];

export const mockCirculars: Circular[] = [
  {
    id: 'circ-001',
    title: 'Mid-Semester Examination Schedule',
    description: 'The mid-semester examinations for even semester courses will commence from 20th August 2026. All students are advised to check their individual timetables and report to examination halls 15 minutes before the scheduled time.',
    target: 'all_students',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    course: 'UG',
    year: 'III',
    shift: 'First Shift',
    validFrom: '2026-08-15',
    validUntil: '2026-08-25',
    status: 'published',
    signedBy: 'Dr. Alan Turing',
    signedAt: '2026-08-10 10:30 AM',
    publishedAt: '2026-08-10 11:00 AM',
    publishedBy: 'Dr. Alan Turing',
    recipientCount: 60,
    createdBy: 'Dr. Alan Turing',
    createdByRole: 'hod',
    createdByName: 'Dr. Alan Turing',
    createdAt: '2026-08-10 09:15 AM'
  },
  {
    id: 'circ-002',
    title: 'Department Meeting - August 2026',
    description: 'Monthly department meeting to discuss curriculum updates, lab infrastructure upgrades, and upcoming accreditation preparations. All faculty members are requested to attend.',
    target: 'all_faculty',
    departmentId: 'dept-cs',
    departmentName: 'Computer Science',
    validFrom: '2026-08-12',
    validUntil: '2026-08-14',
    status: 'signed',
    signedBy: 'Dr. Alan Turing',
    signedAt: '2026-08-12 08:00 AM',
    recipientCount: 4,
    createdBy: 'Dr. Alan Turing',
    createdByRole: 'hod',
    createdByName: 'Dr. Alan Turing',
    createdAt: '2026-08-11 03:00 PM'
  }
];
