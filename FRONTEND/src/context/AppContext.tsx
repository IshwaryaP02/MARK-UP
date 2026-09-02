import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
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
  CircularStatus,
  PeriodTiming,
  StaffOrder,
  StaffDayOrder,
  BonafideRequest,
  BonafideStatus
} from '../types';
import {
  mockUsers,
  mockDepartments,
  mockSubjects,
  mockFaculty,
  mockStudents,
  mockTimetableSlots,
  mockAttendanceRecords,
  mockLeaveRequests,
  mockCorrectionRequests,
  mockSubstitutionRequests,
  mockCalendarEvents,
  mockAuditLogs,
  mockBackupSnapshots,
  mockNotifications,
  mockCirculars,
  mockPeriodTimes,
  mockStaffDayOrders
} from '../mock/data';
import { studentsForCircular, circularRecipientLabel } from '../services/circularTargeting';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

interface AppContextType {
  currentUser: User;
  isAuthenticated: boolean;
  users: User[];
  students: Student[];
  facultyList: Faculty[];
  departments: Department[];
  subjects: Subject[];
  timetable: TimetableSlot[];
  periodTimes: PeriodTiming[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  correctionRequests: CorrectionRequest[];
  substitutionRequests: SubstitutionRequest[];
  calendarEvents: CalendarEvent[];
  auditLogs: AuditLog[];
  backups: BackupSnapshot[];
  notifications: AppNotification[];
  circulars: Circular[];
  isDarkMode: boolean;
  currentTheme: string;
  activeScreen: string;
  attendanceSubjectId: string | null;
  commandPaletteOpen: boolean;
  toasts: ToastMessage[];

  // Actions
  setAttendanceSubjectId: (subjectId: string | null) => void;
  login: (role?: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  setActiveScreen: (screen: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  setAppTheme: (theme: string) => void;
  addToast: (title: string, message?: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;

  // CRUD & Mutations
  addStudent: (student: Omit<Student, 'id' | 'overallAttendancePct'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  bulkImportStudents: (studentsList: Array<Omit<Student, 'id' | 'overallAttendancePct'>>) => void;

  addFaculty: (fac: Omit<Faculty, 'id'>) => void;
  updateFaculty: (fac: Faculty) => void;
  deleteFaculty: (id: string) => void;

  addDepartment: (dept: Omit<Department, 'id' | 'avgAttendancePct'>) => void;
  updateDepartment: (dept: Department) => void;

  addSubject: (sub: Omit<Subject, 'id' | 'totalClassesHeld'>) => void;
  updateSubject: (sub: Subject) => void;

  saveTimetableSlot: (slot: TimetableSlot) => void;
  deleteTimetableSlot: (id: string) => void;
  savePeriodTimes: (timings: PeriodTiming[]) => void;
  getPeriodTime: (periodNumber: number) => { start: string; end: string } | undefined;

  markAttendance: (record: AttendanceRecord) => void;
  submitCorrectionRequest: (req: Omit<CorrectionRequest, 'id' | 'createdAt' | 'status'>) => void;
  reviewCorrectionRequest: (id: string, status: 'approved' | 'rejected', reviewerName: string, comment?: string) => void;

  submitLeaveRequest: (leave: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => void;
  reviewLeaveRequest: (id: string, stage: 'faculty' | 'hod', status: 'approved' | 'rejected', reviewerId: string, reviewerName: string, comment?: string) => void;
  deleteLeaveRequest: (id: string) => void;

  submitSubstitutionRequest: (sub: Omit<SubstitutionRequest, 'id' | 'createdAt' | 'status'>) => void;
  reviewSubstitutionRequest: (id: string, action: 'accept' | 'reject' | 'approve', substituteFaculty?: { id: string; name: string }) => void;

  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateCalendarEvent: (event: CalendarEvent) => void;
  deleteCalendarEvent: (id: string) => void;

  staffOrders: StaffOrder[];
  addStaffOrder: (order: Omit<StaffOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStaffOrder: (order: StaffOrder) => void;
  deleteStaffOrder: (id: string) => void;

  staffDayOrders: StaffDayOrder[];
  saveStaffDayOrder: (data: Omit<StaffDayOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStaffDayOrder: (data: StaffDayOrder) => void;
  deleteStaffDayOrder: (id: string) => void;
  getDayOrderForDate: (date: string) => number | null;
  getCurrentDayOrder: () => number | null;

  triggerBackup: (type: 'manual' | 'automated') => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  addCircular: (circular: Omit<Circular, 'id' | 'createdAt' | 'recipientCount'>) => Circular;
  updateCircular: (circular: Circular) => void;
  deleteCircular: (id: string) => void;
  signCircular: (id: string, signerName: string) => void;
  publishCircular: (id: string, publisherName: string, providedCirc?: Circular) => void;
  archiveCircular: (id: string) => void;

  bonafideRequests: BonafideRequest[];
  submitBonafideRequest: (data: Omit<BonafideRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  reviewBonafideRequest: (
    id: string,
    stage: 'faculty' | 'hod' | 'principal',
    status: 'approve' | 'recommend' | 'reject',
    actorId: string,
    actorName: string,
    comment?: string
  ) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('smart_att_user');
    return saved ? JSON.parse(saved) : mockUsers[0]; // Admin default
  });

  const [users] = useState<User[]>(mockUsers);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [facultyList, setFacultyList] = useState<Faculty[]>(mockFaculty);
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [subjects, setSubjects] = useState<Subject[]>(mockSubjects);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(mockTimetableSlots);
  const [periodTimes, setPeriodTimes] = useState<PeriodTiming[]>(() => {
    try {
      const saved = localStorage.getItem('smart_att_period_times');
      return saved ? JSON.parse(saved) : mockPeriodTimes;
    } catch {
      return mockPeriodTimes;
    }
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>(mockCorrectionRequests);
  const [substitutionRequests, setSubstitutionRequests] = useState<SubstitutionRequest[]>(() => {
    try {
      const saved = localStorage.getItem('smart_att_substitutions');
      return saved ? JSON.parse(saved) : mockSubstitutionRequests;
    } catch {
      return mockSubstitutionRequests;
    }
  });
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(mockCalendarEvents);
  const [staffOrders, setStaffOrders] = useState<StaffOrder[]>(() => {
    try {
      const saved = localStorage.getItem('smart_att_staff_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [staffDayOrders, setStaffDayOrders] = useState<StaffDayOrder[]>(() => {
    try {
      const saved = localStorage.getItem('smart_att_staff_day_orders');
      return saved ? JSON.parse(saved) : mockStaffDayOrders;
    } catch {
      return mockStaffDayOrders;
    }
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [backups, setBackups] = useState<BackupSnapshot[]>(mockBackupSnapshots);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('smart_att_notifications');
      return saved ? JSON.parse(saved) : mockNotifications;
    } catch {
      return mockNotifications;
    }
  });
  const [circulars, setCirculars] = useState<Circular[]>(mockCirculars);
  const [bonafideRequests, setBonafideRequests] = useState<BonafideRequest[]>(() => {
    try {
      const saved = localStorage.getItem('smart_att_bonafide');
      return saved ? JSON.parse(saved) : [] as BonafideRequest[];
    } catch {
      return [] as BonafideRequest[];
    }
  });

  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('theme') || localStorage.getItem('smart_att_theme') || 'light';
  });

  const isDarkMode = theme === 'dark';

  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem('smart_att_color_palette') || 'palette-classic';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('smart_att_authed');
    return saved !== null ? saved === 'true' : true;
  });

  const [activeScreen, setActiveScreen] = useState<string>('dashboard');
  const [attendanceSubjectId, setAttendanceSubjectId] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply theme ONLY to authenticated portal pages.
  // The Login Page must stay in its original design and must never be themed.
  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('theme', theme);
    if (!isAuthenticated) {
      root.removeAttribute('data-theme');
      root.classList.remove('dark');
      document.body.classList.remove('dark');
      return;
    }
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme, isAuthenticated]);

  // Apply color palette theme (accent palettes kept for backwards compatibility)
  useEffect(() => {
    localStorage.setItem('smart_att_color_palette', currentTheme);
  }, [currentTheme]);

  const setAppTheme = (theme: string) => {
    setCurrentTheme(theme);
  };

  // Persist critical state
  useEffect(() => {
    localStorage.setItem('smart_att_authed', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('smart_att_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('smart_att_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('smart_att_faculty', JSON.stringify(facultyList));
  }, [facultyList]);

  useEffect(() => {
    localStorage.setItem('smart_att_depts', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('smart_att_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('smart_att_timetable', JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem('smart_att_period_times', JSON.stringify(periodTimes));
  }, [periodTimes]);

  useEffect(() => {
    localStorage.setItem('smart_att_records', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('smart_att_leaves', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('smart_att_corrections', JSON.stringify(correctionRequests));
  }, [correctionRequests]);

  useEffect(() => {
    localStorage.setItem('smart_att_substitutions', JSON.stringify(substitutionRequests));
  }, [substitutionRequests]);

  useEffect(() => {
    localStorage.setItem('smart_att_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addToast = (title: string, message?: string, type: 'success' | 'danger' | 'warning' | 'info' = 'info') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleDarkMode = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  const enrichUser = (target: User): User => {
    if (target.role !== 'student') return target;
    const studentRecord = students.find((s) => s.id === target.id);
    if (!studentRecord) return target;
    return {
      ...target,
      regNo: studentRecord.regNo,
      rollNo: studentRecord.rollNo,
      semester: studentRecord.semester,
      section: studentRecord.section,
      batch: studentRecord.batch,
      departmentId: studentRecord.departmentId,
      departmentName: studentRecord.departmentName,
      guardianName: studentRecord.guardianName,
      guardianPhone: studentRecord.guardianPhone,
      phone: studentRecord.phone || target.phone,
      avatar: studentRecord.avatar || target.avatar,
      address: studentRecord.address || target.address,
      dob: studentRecord.dob || target.dob,
      gender: studentRecord.gender || target.gender
    };
  };

  const login = (role?: UserRole) => {
    if (role) {
      const target = mockUsers.find((u) => u.role === role) || {
        id: 'usr-' + role,
        name: `Demo ${role.toUpperCase()} User`,
        email: `${role}@university.edu`,
        role,
        active: true,
        lastLogin: new Date().toLocaleTimeString()
      };
      setCurrentUser(enrichUser({ ...target, lastLogin: new Date().toLocaleTimeString() }));
    }
    setIsAuthenticated(true);
    localStorage.setItem('smart_att_authed', 'true');
    setActiveScreen('dashboard');
    addToast('Welcome Back', 'Successfully authenticated', 'success');
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('smart_att_authed', 'false');
    setActiveScreen('login');
    addToast('Signed Out', 'You have been logged out safely', 'info');
  };

  const switchRole = (role: UserRole) => {
    const target = mockUsers.find((u) => u.role === role) || {
      id: 'usr-' + role,
      name: `Demo ${role.toUpperCase()} User`,
      email: `${role}@university.edu`,
      role,
      active: true,
      lastLogin: new Date().toLocaleTimeString()
    };
    setCurrentUser(enrichUser({ ...target, lastLogin: new Date().toLocaleTimeString() }));
    setIsAuthenticated(true);
    localStorage.setItem('smart_att_authed', 'true');
    setActiveScreen('dashboard');
    addToast('Switched Role', `Now logged in as ${target.name} (${role.toUpperCase()})`, 'success');
  };

  const logAudit = (action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      action,
      module,
      details,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const pushNotification = (
    title: string,
    message: string,
    targetRole?: UserRole,
    targetClass?: { semester: number; section: string },
    type: AppNotification['type'] = 'info',
    link?: string
  ) => {
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      title,
      message,
      timestamp: 'Just now',
      read: false,
      type,
      link,
      targetRole,
      targetClass
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Student CRUD
  const addStudent = (studentData: Omit<Student, 'id' | 'overallAttendancePct'>) => {
    const newStudent: Student = {
      ...studentData,
      id: 'std-' + Date.now(),
      overallAttendancePct: 100.0
    };
    setStudents((prev) => [newStudent, ...prev]);
    logAudit('CREATE_STUDENT', 'Students', `Created student ${newStudent.name} (${newStudent.regNo})`);
    addToast('Student Added', `${newStudent.name} registered successfully`, 'success');
  };

  const updateStudent = (updated: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    logAudit('UPDATE_STUDENT', 'Students', `Updated student record for ${updated.name}`);
    addToast('Student Updated', `Record saved for ${updated.name}`, 'success');
  };

  const deleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    logAudit('DELETE_STUDENT', 'Students', `Deleted student ${target?.name || id}`);
    addToast('Student Removed', 'Student record removed from system', 'warning');
  };

  const bulkImportStudents = (list: Array<Omit<Student, 'id' | 'overallAttendancePct'>>) => {
    const createdList: Student[] = list.map((item, idx) => ({
      ...item,
      id: 'std-bulk-' + Date.now() + '-' + idx,
      overallAttendancePct: 100.0
    }));
    setStudents((prev) => [...createdList, ...prev]);
    logAudit('BULK_IMPORT_STUDENTS', 'Students', `Imported ${createdList.length} students via CSV`);
    addToast('CSV Import Complete', `Added ${createdList.length} students successfully`, 'success');
  };

  // Faculty CRUD
  const addFaculty = (facData: Omit<Faculty, 'id'>) => {
    const newFac: Faculty = { ...facData, id: 'fac-' + Date.now() };
    setFacultyList((prev) => [newFac, ...prev]);
    logAudit('CREATE_FACULTY', 'Faculty', `Added faculty member ${newFac.name}`);
    addToast('Faculty Registered', `${newFac.name} added to faculty roster`, 'success');
  };

  const updateFaculty = (updated: Faculty) => {
    setFacultyList((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    logAudit('UPDATE_FACULTY', 'Faculty', `Updated faculty profile for ${updated.name}`);
    addToast('Faculty Updated', `Saved profile for ${updated.name}`, 'success');
  };

  const deleteFaculty = (id: string) => {
    setFacultyList((prev) => prev.filter((f) => f.id !== id));
    logAudit('DELETE_FACULTY', 'Faculty', `Deleted faculty ID ${id}`);
    addToast('Faculty Deleted', 'Faculty record removed', 'warning');
  };

  // Department
  const addDepartment = (deptData: Omit<Department, 'id' | 'avgAttendancePct'>) => {
    const newDept: Department = {
      ...deptData,
      id: 'dept-' + Date.now(),
      avgAttendancePct: 85.0
    };
    setDepartments((prev) => [...prev, newDept]);
    logAudit('CREATE_DEPARTMENT', 'Departments', `Created department ${newDept.name}`);
    addToast('Department Created', `${newDept.name} added`, 'success');
  };

  const updateDepartment = (updated: Department) => {
    setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    logAudit('UPDATE_DEPARTMENT', 'Departments', `Updated department ${updated.name}`);
    addToast('Department Saved', `Updated ${updated.name}`, 'success');
  };

  // Subject
  const addSubject = (subData: Omit<Subject, 'id' | 'totalClassesHeld'>) => {
    const newSub: Subject = {
      ...subData,
      id: 'sub-' + Date.now(),
      totalClassesHeld: 0
    };
    setSubjects((prev) => [...prev, newSub]);
    logAudit('CREATE_SUBJECT', 'Subjects', `Created subject ${newSub.code} - ${newSub.name}`);
    addToast('Subject Created', `${newSub.code} added to curriculum`, 'success');
  };

  const updateSubject = (updated: Subject) => {
    setSubjects((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    logAudit('UPDATE_SUBJECT', 'Subjects', `Updated subject ${updated.code}`);
    addToast('Subject Updated', `Subject ${updated.code} saved`, 'success');
  };

  // Timetable
  const saveTimetableSlot = (slot: TimetableSlot) => {
    setTimetable((prev) => {
      const exists = prev.some((s) => s.id === slot.id);
      if (exists) {
        return prev.map((s) => (s.id === slot.id ? slot : s));
      }
      return [...prev, slot];
    });
    logAudit('SAVE_TIMETABLE', 'Timetable Builder', `Saved timetable slot ${slot.day} Period ${slot.periodNumber} (${slot.subjectCode})`);
    addToast('Timetable Slot Saved', `${slot.day} P${slot.periodNumber} assigned to ${slot.subjectCode}`, 'success');
  };

  const deleteTimetableSlot = (id: string) => {
    setTimetable((prev) => prev.filter((s) => s.id !== id));
    logAudit('DELETE_TIMETABLE_SLOT', 'Timetable Builder', `Removed slot ID ${id}`);
    addToast('Slot Removed', 'Timetable slot cleared', 'warning');
  };

  const savePeriodTimes = (timings: PeriodTiming[]) => {
    setPeriodTimes(timings);
    logAudit('UPDATE_PERIOD_TIMES', 'Timetable Builder', 'Updated period timings');
  };

  const getPeriodTime = (periodNumber: number): { start: string; end: string } | undefined => {
    const t = periodTimes.find((p) => p.periodNumber === periodNumber);
    return t ? { start: t.start, end: t.end } : undefined;
  };

  // Mark Attendance
  const markAttendance = (record: AttendanceRecord) => {
    setAttendanceRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === record.id || (r.date === record.date && r.periodNumber === record.periodNumber && r.subjectId === record.subjectId));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [record, ...prev];
    });

    logAudit('MARK_ATTENDANCE', 'Attendance', `Marked period ${record.periodNumber} for ${record.subjectCode} (${record.presentCount}/${record.totalStudents} present)`);
    addToast('Attendance Submitted', `Saved record for ${record.subjectCode} (Period ${record.periodNumber})`, 'success');
  };

  // Corrections
  const submitCorrectionRequest = (req: Omit<CorrectionRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: CorrectionRequest = {
      ...req,
      id: 'corr-' + Date.now(),
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setCorrectionRequests((prev) => [newReq, ...prev]);
    logAudit('REQUEST_CORRECTION', 'Attendance History', `Correction requested for ${newReq.studentName} (${newReq.subjectCode})`);
    pushNotification(
      'Attendance Correction Request',
      `${newReq.studentName} (${newReq.studentRegNo}) requested a correction for ${newReq.subjectCode} on ${newReq.date} (${newReq.originalStatus} → ${newReq.proposedStatus}).`,
      'hod',
      undefined,
      'info',
      'hod_corrections'
    );
    addToast('Correction Requested', 'Submitted to HOD for review', 'info');
  };

  const reviewCorrectionRequest = (id: string, status: 'approved' | 'rejected', reviewerName: string, comment?: string) => {
    let targetCorr: CorrectionRequest | undefined;
    setCorrectionRequests((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          targetCorr = c;
          return {
            ...c,
            status,
            reviewedBy: reviewerName,
            reviewComment: comment
          };
        }
        return c;
      })
    );
    if (targetCorr && status === 'approved') {
      pushNotification(
        'Correction Request Approved',
        `HOD approved your attendance correction for ${targetCorr.subjectCode} on ${targetCorr.date} (${targetCorr.proposedStatus}).`,
        'student',
        undefined,
        'success',
        'student_attendance'
      );
    }
    logAudit('REVIEW_CORRECTION', 'HOD Approvals', `Correction ${id} marked as ${status.toUpperCase()} by ${reviewerName}`);
    addToast('Correction Reviewed', `Request marked as ${status}`, status === 'approved' ? 'success' : 'warning');
  };

  // Leaves
  const submitLeaveRequest = (leaveData: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
    const newLeave: LeaveRequest = {
      ...leaveData,
      id: 'lv-' + Date.now(),
      status: 'pending_faculty',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setLeaveRequests((prev) => [newLeave, ...prev]);
    logAudit('SUBMIT_LEAVE', 'Student Leave', `Leave submitted by ${newLeave.studentName} for ${newLeave.totalDays} day(s)`);
    pushNotification(
      'Leave Request Pending Review',
      `${newLeave.studentName} (${newLeave.studentRegNo}) submitted a ${newLeave.leaveType} request for ${newLeave.startDate} to ${newLeave.endDate}.`,
      'faculty',
      { semester: newLeave.semester, section: newLeave.section },
      'info',
      'leave_queue'
    );
    addToast('Leave Applied', 'Application sent to faculty advisor for review', 'success');
  };

  const reviewLeaveRequest = (
    id: string,
    stage: 'faculty' | 'hod',
    status: 'approved' | 'rejected',
    reviewerId: string,
    reviewerName: string,
    comment?: string
  ) => {
    let targetLeave: LeaveRequest | undefined;
    setLeaveRequests((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          targetLeave = l;
          if (stage === 'faculty') {
            if (status === 'rejected') {
              return {
                ...l,
                status: 'rejected',
                facultyApproval: { facultyId: reviewerId, facultyName: reviewerName, approvedAt: new Date().toISOString(), comment }
              };
            }
            return {
              ...l,
              status: 'pending_hod',
              facultyApproval: { facultyId: reviewerId, facultyName: reviewerName, approvedAt: new Date().toISOString(), comment }
            };
          } else {
            return {
              ...l,
              status: status === 'approved' ? 'approved' : 'rejected',
              hodApproval: { hodId: reviewerId, hodName: reviewerName, approvedAt: new Date().toISOString(), comment }
            };
          }
        }
        return l;
      })
    );
    if (targetLeave) {
      pushNotification(
        status === 'approved'
          ? stage === 'hod'
            ? 'Leave Approved'
            : 'Leave Recommended'
          : 'Leave Rejected',
        `${stage === 'faculty' ? 'Faculty advisor' : 'HOD'} marked your ${targetLeave.leaveType} leave (${targetLeave.startDate} to ${targetLeave.endDate}) as ${status}.`,
        'student',
        { semester: targetLeave.semester, section: targetLeave.section },
        status === 'approved' ? 'success' : 'danger',
        'student_apply_leave'
      );
    }
    logAudit('REVIEW_LEAVE', 'Leave Module', `Leave ${id} ${status} by ${stage.toUpperCase()} (${reviewerName})`);
    addToast('Leave Request Updated', `Marked as ${status}`, status === 'approved' ? 'success' : 'warning');
  };

  const deleteLeaveRequest = (id: string) => {
    const target = leaveRequests.find((l) => l.id === id);
    setLeaveRequests((prev) => prev.filter((l) => l.id !== id));
    logAudit('DELETE_LEAVE', 'Student Leave', `Leave application ${id} deleted by ${target?.studentName || 'student'}`);
    addToast('Leave Deleted', 'Your leave application has been removed', 'warning');
  };

  // Substitutions
  const submitSubstitutionRequest = (subData: Omit<SubstitutionRequest, 'id' | 'createdAt' | 'status'>) => {
    const newSub: SubstitutionRequest = {
      ...subData,
      id: 'subst-' + Date.now(),
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setSubstitutionRequests((prev) => [newSub, ...prev]);
    logAudit('SUBMIT_SUBSTITUTION', 'Faculty Substitution', `Substitution requested with ${newSub.substituteFacultyName}`);
    pushNotification(
      'New Substitution Request',
      `${newSub.requestingFacultyName} requested coverage for ${newSub.subjectCode} (Period ${newSub.periodNumber}) on ${newSub.date}.`,
      'hod',
      undefined,
      'info',
      'hod_substitutions'
    );
    if (newSub.substituteFacultyId !== 'open') {
      pushNotification(
        'Substitution Coverage Request',
        `${newSub.requestingFacultyName} asked you to cover ${newSub.subjectCode} (Period ${newSub.periodNumber}) on ${newSub.date}.`,
        'faculty',
        undefined,
        'info',
        'substitution'
      );
    }
    addToast('Substitution Sent', `Request sent to ${newSub.substituteFacultyName}`, 'info');
  };

  const reviewSubstitutionRequest = (
    id: string,
    action: 'accept' | 'reject' | 'approve',
    substituteFaculty?: { id: string; name: string }
  ) => {
    let targetSub: SubstitutionRequest | undefined;
    setSubstitutionRequests((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          targetSub = s;
          if (action === 'accept')
            return {
              ...s,
              status: 'accepted',
              substituteFacultyId: substituteFaculty?.id ?? s.substituteFacultyId,
              substituteFacultyName: substituteFaculty?.name ?? s.substituteFacultyName
            };
          if (action === 'reject') return { ...s, status: 'rejected_by_sub' };
          if (action === 'approve')
            return {
              ...s,
              status: 'approved_by_hod' as const,
              substituteFacultyId: substituteFaculty?.id ?? s.substituteFacultyId,
              substituteFacultyName: substituteFaculty?.name ?? s.substituteFacultyName
            };
        }
        return s;
      })
    );
    if (targetSub) {
      if (action === 'approve') {
        pushNotification(
          'Substitution Approved by HOD',
          `HOD approved your substitution request — ${targetSub.substituteFacultyName} will cover ${targetSub.subjectCode} (Period ${targetSub.periodNumber}) on ${targetSub.date}.`,
          'faculty',
          undefined,
          'success',
          'substitution'
        );
      } else if (action === 'accept') {
        pushNotification(
          'Substitution Accepted',
          `${targetSub.substituteFacultyName} accepted your request to cover ${targetSub.subjectCode} (Period ${targetSub.periodNumber}) on ${targetSub.date}.`,
          'faculty',
          undefined,
          'success',
          'substitution'
        );
        pushNotification(
          'Substitution Awaiting Approval',
          `${targetSub.substituteFacultyName} accepted a substitution for ${targetSub.requestingFacultyName} (${targetSub.subjectCode}, Period ${targetSub.periodNumber} on ${targetSub.date}).`,
          'hod',
          undefined,
          'info',
          'hod_substitutions'
        );
      } else if (action === 'reject') {
        pushNotification(
          'Substitution Declined',
          `${targetSub.substituteFacultyName} declined your request to cover ${targetSub.subjectCode} (Period ${targetSub.periodNumber}) on ${targetSub.date}.`,
          'faculty',
          undefined,
          'warning',
          'substitution'
        );
      }
    }
  };

  // Calendar Events
  const addCalendarEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEv: CalendarEvent = { ...event, id: 'cal-' + Date.now() };
    setCalendarEvents((prev) => [...prev, newEv]);
    addToast('Calendar Updated', `Added ${newEv.title} on ${newEv.date}`, 'success');
  };

  const updateCalendarEvent = (event: CalendarEvent) => {
    setCalendarEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
    addToast('Calendar Updated', `Updated ${event.title} on ${event.date}`, 'success');
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
    addToast('Event Removed', 'Calendar event deleted', 'info');
  };

  // Monthly Staff Orders
  useEffect(() => {
    localStorage.setItem('smart_att_staff_orders', JSON.stringify(staffOrders));
  }, [staffOrders]);

  const addStaffOrder = (order: Omit<StaffOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().slice(0, 10);
    const newOrder: StaffOrder = { ...order, id: 'so-' + Date.now(), createdAt: now, updatedAt: now };
    setStaffOrders((prev) => [newOrder, ...prev]);
    addToast('Staff Order Created', `Monthly staff order for ${order.month} created`, 'success');
  };

  const updateStaffOrder = (order: StaffOrder) => {
    const now = new Date().toISOString().slice(0, 10);
    const updated = { ...order, updatedAt: now };
    setStaffOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    addToast('Staff Order Updated', `Monthly staff order for ${order.month} updated`, 'success');
  };

  const deleteStaffOrder = (id: string) => {
    setStaffOrders((prev) => prev.filter((o) => o.id !== id));
    addToast('Staff Order Deleted', 'Monthly staff order removed', 'info');
  };

  // Monthly Staff Day Order (OCR-extracted date → day order mapping)
  useEffect(() => {
    localStorage.setItem('smart_att_staff_day_orders', JSON.stringify(staffDayOrders));
  }, [staffDayOrders]);

  const saveStaffDayOrder = (data: Omit<StaffDayOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const trimmedEntries = data.entries
      .map((e) => ({ date: e.date, dayOrder: Number(e.dayOrder) || 1 }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    setStaffDayOrders((prev) => {
      const existing = prev.find((o) => o.month === data.month);
      const record: Omit<StaffDayOrder, 'id'> = {
        ...data,
        entries: trimmedEntries,
        createdAt: existing?.createdAt || now,
        updatedAt: now
      };
      if (existing) {
        return prev.map((o) => (o.id === existing.id ? { ...record, id: existing.id } : o));
      }
      return [{ ...record, id: 'sdo-' + Date.now() }, ...prev];
    });
    logAudit('SAVE_STAFF_DAY_ORDER', 'Monthly Staff Day Order', `Saved ${trimmedEntries.length} day order entries for ${data.month}`);
    addToast('Day Order Saved', `Saved ${trimmedEntries.length} dated day order entries (${data.month})`, 'success');
  };

  const updateStaffDayOrder = (data: StaffDayOrder) => {
    setStaffDayOrders((prev) => prev.map((o) => (o.id === data.id ? { ...data, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) } : o)));
    addToast('Day Order Updated', `Updated staff day order for ${data.month}`, 'success');
  };

  const deleteStaffDayOrder = (id: string) => {
    setStaffDayOrders((prev) => prev.filter((o) => o.id !== id));
    addToast('Day Order Deleted', 'Staff day order data removed', 'info');
  };

  const getDayOrderForDate = (date: string): number | null => {
    for (const record of staffDayOrders) {
      const entry = record.entries.find((e) => e.date === date);
      if (entry) return entry.dayOrder;
    }
    return null;
  };

  const getCurrentDayOrder = (): number | null => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return getDayOrderForDate(`${y}-${m}-${d}`);
  };

  // Backups
  const triggerBackup = (type: 'manual' | 'automated') => {
    const newBkp: BackupSnapshot = {
      id: 'bkp-' + Date.now(),
      filename: `smart_attendance_db_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${type}.sql`,
      size: (14 + Math.random() * 2).toFixed(1) + ' MB',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type,
      status: 'success'
    };
    setBackups((prev) => [newBkp, ...prev]);
    logAudit('TRIGGER_BACKUP', 'Database Settings', `Created ${type} backup snapshot ${newBkp.filename}`);
    addToast('Backup Created', `Snapshot ${newBkp.filename} saved`, 'success');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('Notifications Cleared', 'All marked as read', 'info');
  };

  // Circular CRUD
  useEffect(() => {
    localStorage.setItem('smart_att_circulars', JSON.stringify(circulars));
  }, [circulars]);

  // Bonafide persistence
  useEffect(() => {
    localStorage.setItem('smart_att_bonafide', JSON.stringify(bonafideRequests));
  }, [bonafideRequests]);

  const addCircular = (circularData: Omit<Circular, 'id' | 'createdAt' | 'recipientCount'>): Circular => {
    const recipientCount =
      circularData.target === 'all_faculty'
        ? facultyList.length
        : circularData.target === 'individual_faculty'
        ? circularData.selectedFacultyIds?.length || 0
        : circularData.target === 'all_students'
        ? studentsForCircular({ ...circularData, target: circularData.target }, students).length
        : circularData.target === 'tutor_class'
        ? studentsForCircular({ ...circularData, target: circularData.target }, students).length
        : circularData.target === 'specific_students'
        ? studentsForCircular({ ...circularData, target: circularData.target }, students).length
        : 0;
    const newCircular: Circular = {
      ...circularData,
      id: 'circ-' + Date.now(),
      createdByRole: circularData.createdByRole || currentUser.role,
      createdByName: circularData.createdByName || currentUser.name,
      recipientCount,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setCirculars((prev) => [newCircular, ...prev]);
    logAudit('CREATE_CIRCULAR', 'Circulars', `Created circular: ${newCircular.title}`);
    addToast('Circular Created', `"${newCircular.title}" saved as draft`, 'success');
    return newCircular;
  };

  const updateCircular = (updated: Circular) => {
    setCirculars((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    logAudit('UPDATE_CIRCULAR', 'Circulars', `Updated circular: ${updated.title}`);
    addToast('Circular Updated', `"${updated.title}" saved`, 'success');
  };

  const deleteCircular = (id: string) => {
    const target = circulars.find((c) => c.id === id);
    setCirculars((prev) => prev.filter((c) => c.id !== id));
    logAudit('DELETE_CIRCULAR', 'Circulars', `Deleted circular: ${target?.title || id}`);
    addToast('Circular Deleted', 'Circular removed from the system', 'info');
  };

  const signCircular = (id: string, signerName: string) => {
    setCirculars((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            status: 'signed' as CircularStatus,
            signedBy: signerName,
            signedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };
        }
        return c;
      })
    );
    logAudit('SIGN_CIRCULAR', 'Circulars', `Circular ${id} signed by ${signerName}`);
    addToast('Circular Signed', 'Ready for publishing', 'success');
  };

  const publishCircular = (id: string, publisherName: string, providedCirc?: Circular) => {
    setCirculars((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            status: 'published' as CircularStatus,
            publishedBy: publisherName,
            publishedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };
        }
        return c;
      })
    );

    // `providedCirc` lets callers publish a freshly-created circular before state commits.
    const circ = providedCirc || circulars.find((c) => c.id === id) || null;
    if (circ) {
      // Faculty-created circulars are ONLY visible to students and their notifications
      // are ONLY delivered to students.
      const isFacultyAuthor = circ.createdByRole === 'faculty';

      const targetRole: UserRole | undefined =
        circ.target === 'all_faculty' || circ.target === 'individual_faculty'
          ? (isFacultyAuthor ? undefined : 'faculty')
          : circ.target === 'all_students' || circ.target === 'specific_students' || circ.target === 'tutor_class'
          ? 'student'
          : undefined;

      const targetStudents = studentsForCircular(circ, students);
      const targetSemesters = Array.from(new Set(targetStudents.map((s) => s.semester)));
      const targetDepartmentIds = Array.from(new Set(targetStudents.map((s) => s.departmentId)));

      const newNotification: AppNotification = {
        id: 'notif-circ-' + Date.now(),
        title: `Circular: ${circ.title}`,
        message: `${circ.description.substring(0, 120)}${circ.description.length > 120 ? '...' : ''}`,
        timestamp: 'Just now',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        read: false,
        type: 'info',
        targetRole,
        link:
          circ.target === 'all_faculty' || circ.target === 'individual_faculty'
            ? 'hod_circulars'
            : 'student_circulars',
        circularId: circ.id,
        targetDepartmentIds: targetRole === 'student' ? targetDepartmentIds : undefined,
        targetSemesters: targetRole === 'student' && targetSemesters.length > 0 ? targetSemesters : undefined,
        targetClass: circ.target === 'tutor_class' ? circ.targetClass : undefined
      };

      setNotifications((prev) => [newNotification, ...prev]);
    }

    logAudit('PUBLISH_CIRCULAR', 'Circulars', `Circular ${id} published by ${publisherName}`);
    addToast('Circular Published', 'Now visible to recipients', 'success');
  };

  const archiveCircular = (id: string) => {
    setCirculars((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, status: 'archived' as CircularStatus };
        }
        return c;
      })
    );
    addToast('Circular Archived', 'Circular has been archived', 'info');
  };

  // ---- Bonafide Certificate ----

  const submitBonafideRequest = (data: Omit<BonafideRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newReq: BonafideRequest = {
      ...data,
      id: 'bnf-' + Date.now(),
      status: 'submitted',
      createdAt: now,
      updatedAt: now
    };
    setBonafideRequests((prev) => [newReq, ...prev]);
    logAudit('SUBMIT_BONAFIDE', 'Bonafide Certificate', `Bonafide requested by ${newReq.studentName} (${newReq.studentRegNo})`);
    pushNotification(
      'Bonafide Request Submitted',
      `${newReq.studentName} (${newReq.studentRegNo}) requested a bonafide certificate.`,
      'faculty',
      { semester: newReq.semester, section: newReq.section },
      'info',
      'faculty_bonafide'
    );
    addToast('Bonafide Requested', 'Submitted for faculty review', 'success');
  };

  const reviewBonafideRequest = (
    id: string,
    stage: 'faculty' | 'hod' | 'principal',
    status: 'approve' | 'recommend' | 'reject',
    actorId: string,
    actorName: string,
    comment?: string
  ) => {
    const now = new Date().toISOString();
    let target: BonafideRequest | undefined;

    setBonafideRequests((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        target = b;

        if (stage === 'faculty') {
          if (status === 'reject') {
            return { ...b, status: 'submitted' as BonafideStatus, updatedAt: now, facultyComment: comment };
          }
          // Faculty recommends → forwards to HOD
          return {
            ...b,
            status: 'faculty_recommended' as BonafideStatus,
            facultyId: actorId,
            facultyName: actorName,
            facultyRecommendedAt: now,
            facultyComment: comment,
            updatedAt: now
          };
        }

        if (stage === 'hod') {
          if (status === 'reject') {
            return { ...b, status: 'faculty_review' as BonafideStatus, updatedAt: now, hodComment: comment };
          }
          if (status === 'recommend') {
            // HOD recommends → forwards to Principal
            return {
              ...b,
              status: 'hod_recommended' as BonafideStatus,
              hodId: actorId,
              hodName: actorName,
              hodRecommendedAt: now,
              hodComment: comment,
              updatedAt: now
            };
          }
          // HOD approves final (after principal return) → Approved
          return {
            ...b,
            status: 'approved' as BonafideStatus,
            hodId: actorId,
            hodName: actorName,
            finalApprovedAt: now,
            hodComment: comment,
            updatedAt: now
          };
        }

        // Principal
        if (status === 'reject') {
          return { ...b, status: 'hod_review' as BonafideStatus, updatedAt: now, principalName: actorName };
        }
        // Principal approves → returned to HOD for final approval
        return {
          ...b,
          status: 'returned_to_hod' as BonafideStatus,
          principalName: actorName,
          principalApprovedAt: now,
          updatedAt: now
        };
      })
    );

    if (target) {
      if (stage === 'faculty') {
        if (status === 'recommend') {
          pushNotification(
            'Bonafide Recommended',
            `${actorName} recommended your bonafide request — forwarded to HOD.`,
            'student',
            { semester: target.semester, section: target.section },
            'info',
            'student_bonafide'
          );
          pushNotification(
            'Bonafide Pending HOD Review',
            `${target.studentName} (${target.studentRegNo})'s bonafide has been recommended by faculty and is awaiting your review.`,
            'hod',
            undefined,
            'info',
            'hod_bonafide'
          );
        } else {
          pushNotification(
            'Bonafide Returned',
            `${actorName} returned your bonafide request for corrections.`,
            'student',
            { semester: target.semester, section: target.section },
            'warning',
            'student_bonafide'
          );
        }
      } else if (stage === 'hod') {
        if (status === 'recommend') {
          const hodUser = mockUsers.find((u) => u.role === 'hod');
          pushNotification(
            'Bonafide Sent for Principal Approval',
            `${actorName} recommended ${target.studentName}'s bonafide — awaiting Principal approval.`,
            'hod',
            undefined,
            'info',
            'hod_bonafide'
          );
          if (hodUser) {
            pushNotification(
              'Bonafide Awaiting Principal',
              `${target.studentName} (${target.studentRegNo})'s bonafide is ready for your final approval.`,
              'hod',
              undefined,
              'info',
              'hod_bonafide'
            );
          }
        } else if (status === 'approve') {
          pushNotification(
            'Bonafide Approved',
            `Your bonafide certificate has been approved and is ready to print.`,
            'student',
            { semester: target.semester, section: target.section },
            'success',
            'student_bonafide'
          );
        } else {
          pushNotification(
            'Bonafide Returned to Faculty',
            `${actorName} returned ${target.studentName}'s bonafide to the faculty stage for corrections.`,
            'faculty',
            { semester: target.semester, section: target.section },
            'warning',
            'faculty_bonafide'
          );
        }
      } else {
        pushNotification(
          status === 'approve' ? 'Bonafide Approved by Principal' : 'Bonafide Returned',
          status === 'approve'
            ? `Principal approved ${target.studentName}'s bonafide certificate.`
            : `Principal returned ${target.studentName}'s bonafide to HOD.`,
          'hod',
          undefined,
          status === 'approve' ? 'success' : 'warning',
          'hod_bonafide'
        );
      }

      logAudit('REVIEW_BONAFIDE', 'Bonafide Certificate', `Bonafide ${id} ${status} by ${stage.toUpperCase()} (${actorName})`);
      addToast(
        'Bonafide Updated',
        `${stage.charAt(0).toUpperCase() + stage.slice(1)} marked request as ${status}`,
        status === 'reject' ? 'warning' : 'success'
      );
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        users,
        students,
        facultyList,
        departments,
        subjects,
        timetable,
        periodTimes,
        attendanceRecords,
        leaveRequests,
        correctionRequests,
        substitutionRequests,
        calendarEvents,
        staffOrders,
        staffDayOrders,
        auditLogs,
        backups,
        notifications,
        circulars,
        isDarkMode,
        currentTheme,
        activeScreen,
        attendanceSubjectId,
        commandPaletteOpen,
        toasts,

        login,
        logout,
        switchRole,
        setActiveScreen,
        setAttendanceSubjectId,
        setCommandPaletteOpen,
        toggleDarkMode,
        setAppTheme,
        addToast,
        removeToast,

        addStudent,
        updateStudent,
        deleteStudent,
        bulkImportStudents,

        addFaculty,
        updateFaculty,
        deleteFaculty,

        addDepartment,
        updateDepartment,

        addSubject,
        updateSubject,

        saveTimetableSlot,
        deleteTimetableSlot,
        savePeriodTimes,
        getPeriodTime,

        markAttendance,
        submitCorrectionRequest,
        reviewCorrectionRequest,

        submitLeaveRequest,
        reviewLeaveRequest,
        deleteLeaveRequest,

        submitSubstitutionRequest,
        reviewSubstitutionRequest,

        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        addStaffOrder,
        updateStaffOrder,
        deleteStaffOrder,
        saveStaffDayOrder,
        updateStaffDayOrder,
        deleteStaffDayOrder,
        getDayOrderForDate,
        getCurrentDayOrder,

        triggerBackup,
        markNotificationRead,
        clearAllNotifications,

        addCircular,
        updateCircular,
        deleteCircular,
        signCircular,
        publishCircular,
        archiveCircular,

        bonafideRequests,
        submitBonafideRequest,
        reviewBonafideRequest
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
