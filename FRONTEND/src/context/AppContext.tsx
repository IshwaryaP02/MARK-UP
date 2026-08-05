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
  AppNotification
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
  mockNotifications
} from '../mock/data';

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
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  correctionRequests: CorrectionRequest[];
  substitutionRequests: SubstitutionRequest[];
  calendarEvents: CalendarEvent[];
  auditLogs: AuditLog[];
  backups: BackupSnapshot[];
  notifications: AppNotification[];
  isDarkMode: boolean;
  currentTheme: string;
  activeScreen: string;
  commandPaletteOpen: boolean;
  toasts: ToastMessage[];

  // Actions
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

  markAttendance: (record: AttendanceRecord) => void;
  submitCorrectionRequest: (req: Omit<CorrectionRequest, 'id' | 'createdAt' | 'status'>) => void;
  reviewCorrectionRequest: (id: string, status: 'approved' | 'rejected', reviewerName: string, comment?: string) => void;

  submitLeaveRequest: (leave: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => void;
  reviewLeaveRequest: (id: string, stage: 'faculty' | 'hod', status: 'approved' | 'rejected', reviewerId: string, reviewerName: string, comment?: string) => void;

  submitSubstitutionRequest: (sub: Omit<SubstitutionRequest, 'id' | 'createdAt' | 'status'>) => void;
  reviewSubstitutionRequest: (id: string, action: 'accept' | 'reject' | 'approve') => void;

  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  deleteCalendarEvent: (id: string) => void;

  triggerBackup: (type: 'manual' | 'automated') => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('smart_att_user');
    return saved ? JSON.parse(saved) : mockUsers[0]; // Admin default
  });

  const [users] = useState<User[]>(mockUsers);
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('smart_att_students');
    return saved ? JSON.parse(saved) : mockStudents;
  });
  const [facultyList, setFacultyList] = useState<Faculty[]>(() => {
    const saved = localStorage.getItem('smart_att_faculty');
    return saved ? JSON.parse(saved) : mockFaculty;
  });
  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('smart_att_depts');
    return saved ? JSON.parse(saved) : mockDepartments;
  });
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('smart_att_subjects');
    return saved ? JSON.parse(saved) : mockSubjects;
  });
  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => {
    const saved = localStorage.getItem('smart_att_timetable');
    return saved ? JSON.parse(saved) : mockTimetableSlots;
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('smart_att_records');
    return saved ? JSON.parse(saved) : mockAttendanceRecords;
  });
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('smart_att_leaves');
    return saved ? JSON.parse(saved) : mockLeaveRequests;
  });
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>(() => {
    const saved = localStorage.getItem('smart_att_corrections');
    return saved ? JSON.parse(saved) : mockCorrectionRequests;
  });
  const [substitutionRequests, setSubstitutionRequests] = useState<SubstitutionRequest[]>(() => {
    const saved = localStorage.getItem('smart_att_subs');
    return saved ? JSON.parse(saved) : mockSubstitutionRequests;
  });
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('smart_att_calendar');
    return saved ? JSON.parse(saved) : mockCalendarEvents;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [backups, setBackups] = useState<BackupSnapshot[]>(mockBackupSnapshots);
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('smart_att_theme');
    return saved ? saved === 'dark' : false;
  });

  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem('smart_att_color_palette') || 'palette-classic';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('smart_att_authed');
    return saved !== null ? saved === 'true' : true;
  });

  const [activeScreen, setActiveScreen] = useState<string>('dashboard');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply dark mode class to html & body element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('smart_att_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('smart_att_theme', 'light');
    }
  }, [isDarkMode]);

  // Apply color palette theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
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
    localStorage.setItem('smart_att_records', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('smart_att_leaves', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('smart_att_corrections', JSON.stringify(correctionRequests));
  }, [correctionRequests]);

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
    setIsDarkMode((prev) => !prev);
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
      setCurrentUser(target);
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
    setCurrentUser(target);
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
    addToast('Correction Requested', 'Submitted to HOD for review', 'info');
  };

  const reviewCorrectionRequest = (id: string, status: 'approved' | 'rejected', reviewerName: string, comment?: string) => {
    setCorrectionRequests((prev) =>
      prev.map((c) => {
        if (c.id === id) {
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
    setLeaveRequests((prev) =>
      prev.map((l) => {
        if (l.id === id) {
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
    logAudit('REVIEW_LEAVE', 'Leave Module', `Leave ${id} ${status} by ${stage.toUpperCase()} (${reviewerName})`);
    addToast('Leave Request Updated', `Marked as ${status}`, status === 'approved' ? 'success' : 'warning');
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
    addToast('Substitution Sent', `Request sent to ${newSub.substituteFacultyName}`, 'info');
  };

  const reviewSubstitutionRequest = (id: string, action: 'accept' | 'reject' | 'approve') => {
    setSubstitutionRequests((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          if (action === 'accept') return { ...s, status: 'accepted' };
          if (action === 'reject') return { ...s, status: 'rejected_by_sub' };
          if (action === 'approve') return { ...s, status: 'approved_by_hod' };
        }
        return s;
      })
    );
    addToast('Substitution Updated', `Status updated to ${action}`, 'success');
  };

  // Calendar Events
  const addCalendarEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEv: CalendarEvent = { ...event, id: 'cal-' + Date.now() };
    setCalendarEvents((prev) => [...prev, newEv]);
    addToast('Calendar Updated', `Added ${newEv.title} on ${newEv.date}`, 'success');
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
    addToast('Event Removed', 'Calendar event deleted', 'info');
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
        attendanceRecords,
        leaveRequests,
        correctionRequests,
        substitutionRequests,
        calendarEvents,
        auditLogs,
        backups,
        notifications,
        isDarkMode,
        currentTheme,
        activeScreen,
        commandPaletteOpen,
        toasts,

        login,
        logout,
        switchRole,
        setActiveScreen,
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

        markAttendance,
        submitCorrectionRequest,
        reviewCorrectionRequest,

        submitLeaveRequest,
        reviewLeaveRequest,

        submitSubstitutionRequest,
        reviewSubstitutionRequest,

        addCalendarEvent,
        deleteCalendarEvent,

        triggerBackup,
        markNotificationRead,
        clearAllNotifications
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
