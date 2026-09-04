import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
} from '../types';
import { apiClient, setJwt, clearJwt } from '../lib/apiClient';

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
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  setActiveScreen: (screen: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  setAppTheme: (theme: string) => void;
  addToast: (title: string, message?: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
  setCurrentUser: (user: User) => void;

  // CRUD & Mutations
  addStudent: (student: Omit<Student, 'id' | 'overallAttendancePct'>) => Promise<void>;
  updateStudent: (student: Student) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  bulkImportStudents: (studentsList: Array<Omit<Student, 'id' | 'overallAttendancePct'>>) => Promise<void>;

  addFaculty: (fac: Omit<Faculty, 'id'>) => Promise<void>;
  updateFaculty: (fac: Faculty) => Promise<void>;
  deleteFaculty: (id: string) => Promise<void>;

  addDepartment: (dept: Omit<Department, 'id' | 'avgAttendancePct'>) => Promise<void>;
  updateDepartment: (dept: Department) => Promise<void>;

  addSubject: (sub: Omit<Subject, 'id' | 'totalClassesHeld'>) => Promise<void>;
  updateSubject: (sub: Subject) => Promise<void>;

  saveTimetableSlot: (slot: TimetableSlot) => Promise<void>;
  deleteTimetableSlot: (id: string) => Promise<void>;

  markAttendance: (record: AttendanceRecord) => Promise<void>;
  submitCorrectionRequest: (req: Omit<CorrectionRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  reviewCorrectionRequest: (id: string, status: 'approved' | 'rejected', reviewerName: string, comment?: string) => Promise<void>;

  submitLeaveRequest: (leave: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  reviewLeaveRequest: (id: string, stage: 'faculty' | 'hod', status: 'approved' | 'rejected', reviewerId: string, reviewerName: string, comment?: string) => Promise<void>;

  submitSubstitutionRequest: (sub: Omit<SubstitutionRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  reviewSubstitutionRequest: (id: string, action: 'accept' | 'reject' | 'approve') => Promise<void>;
  requestSubstitution: (sub: SubstitutionRequest) => Promise<void>;
  respondSubstitution: (id: string, action: 'approved' | 'rejected') => Promise<void>;

  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;

  triggerBackup: (type: 'manual' | 'automated') => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User>(() => {
    const saved = localStorage.getItem('smart_att_user');
    return saved ? JSON.parse(saved) : {} as User;
  });
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>([]);
  const [substitutionRequests, setSubstitutionRequests] = useState<SubstitutionRequest[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('smart_att_theme');
    return saved ? saved === 'dark' : false;
  });
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem('smart_att_color_palette') || 'palette-classic';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('smart_att_authed');
    return saved !== null ? saved === 'true' : false;
  });
  const [activeScreen, setActiveScreen] = useState<string>('dashboard');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('smart_att_color_palette', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('smart_att_authed', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('smart_att_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const setAppTheme = (theme: string) => {
    setCurrentTheme(theme);
  };

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
      ipAddress: '127.0.0.1',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
  };

  const loadDataForRole = useCallback(async (role: UserRole) => {
    async function load<T>(fn: () => Promise<T>, setter: (data: T) => void): Promise<void> {
      try {
        const data = await fn();
        setter(data);
      } catch {
        // Silently ignore 403s and other errors for unauthorized endpoints
      }
    }

    if (role === 'admin') {
      await Promise.all([
        load(() => apiClient.students(), setStudents),
        load(() => apiClient.faculty(), setFacultyList),
        load(() => apiClient.departments(), setDepartments),
        load(() => apiClient.subjects(), setSubjects),
        load(() => apiClient.timetable(), setTimetable),
        load(() => apiClient.calendarEvents(), setCalendarEvents),
        load(() => apiClient.auditLogs(), setAuditLogs),
        load(() => apiClient.backups(), setBackups),
        load(() => apiClient.notifications({ unreadOnly: false }), setNotifications),
        load(() => apiClient.users(), setUsers),
      ]);
    } else if (role === 'hod') {
      await Promise.all([
        load(() => apiClient.departments(), setDepartments),
        load(() => apiClient.subjects(), setSubjects),
        load(() => apiClient.hodCorrections(), setCorrectionRequests),
        load(() => apiClient.hodLeaves(), setLeaveRequests),
        load(() => apiClient.hodSubstitutions(), setSubstitutionRequests),
        load(() => apiClient.notifications({ unreadOnly: false }), setNotifications),
      ]);
    } else if (role === 'faculty') {
      await Promise.all([
        load(() => apiClient.students(), setStudents),
        load(() => apiClient.faculty(), setFacultyList),
        load(() => apiClient.subjects(), setSubjects),
        load(() => apiClient.timetable(), setTimetable),
        load(() => apiClient.facultyAttendanceHistory(), setAttendanceRecords),
        load(() => apiClient.facultyLeaveQueue(), setLeaveRequests),
        load(() => apiClient.facultySubstitutions(), setSubstitutionRequests),
        load(() => apiClient.facultyCorrections(), setCorrectionRequests),
        load(() => apiClient.calendarEvents(), setCalendarEvents),
        load(() => apiClient.notifications({ unreadOnly: false }), setNotifications),
        load(() => apiClient.users(), setUsers),
      ]);
    } else if (role === 'student') {
      await Promise.all([
        load(() => apiClient.departments(), setDepartments),
        load(() => apiClient.subjects(), setSubjects),
        load(() => apiClient.timetable(), setTimetable),
        load(() => apiClient.studentLeaves(), setLeaveRequests),
        load(() => apiClient.notifications({ unreadOnly: false }), setNotifications),
        load(() => apiClient.users(), setUsers),
      ]);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await apiClient.login(username, password);
      setJwt(response.accessToken);
      const apiUser = response.user;
      const mappedUser: User = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        avatar: apiUser.avatar,
        role: apiUser.role,
        departmentId: apiUser.departmentId,
        departmentName: apiUser.departmentName,
        regNo: apiUser.regNo,
        employeeId: apiUser.employeeId,
        phone: apiUser.phone,
        address: apiUser.address,
        gender: apiUser.gender,
        dob: apiUser.dob,
        fatherName: apiUser.fatherName,
        motherName: apiUser.motherName,
        parentPhone: apiUser.parentPhone,
        active: apiUser.active,
        lastLogin: apiUser.lastLogin,
      };
      setCurrentUserState(mappedUser);
      setIsAuthenticated(true);
      localStorage.setItem('smart_att_authed', 'true');
      setActiveScreen('dashboard');
      await loadDataForRole(apiUser.role);
      addToast('Welcome Back', `Logged in as ${mappedUser.name}`, 'success');
    } catch (error) {
      addToast('Login Failed', error instanceof Error ? error.message : 'Invalid credentials', 'danger');
      throw error;
    }
  }, [loadDataForRole]);

  const logout = useCallback(() => {
    clearJwt();
    setCurrentUserState({} as User);
    setIsAuthenticated(false);
    localStorage.setItem('smart_att_authed', 'false');
    setActiveScreen('login');
    addToast('Signed Out', 'You have been logged out safely', 'info');
  }, []);

  const switchRole = useCallback(async (role: UserRole) => {
    // In production, switching roles means logging in as a different account.
    // This can be done by admins for testing only.
    addToast('Role Switch', 'Please log in with the appropriate account credentials.', 'info');
  }, []);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    try {
      await apiClient.changePassword(oldPassword, newPassword);
      addToast('Password Changed', 'Your password has been updated successfully.', 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to change password', 'danger');
      throw error;
    }
  }, []);

  // Student CRUD
  const addStudent = useCallback(async (studentData: Omit<Student, 'id' | 'overallAttendancePct'>) => {
    try {
      const response = await apiClient.createStudent({
        name: studentData.name,
        email: studentData.email,
        regNo: studentData.regNo,
        rollNo: studentData.rollNo,
        departmentId: studentData.departmentId,
        semester: studentData.semester,
        section: studentData.section,
        batch: studentData.batch,
        phone: studentData.phone,
        avatar: studentData.avatar,
        gender: studentData.gender,
        dob: studentData.dob,
        address: studentData.address,
        fatherName: studentData.fatherName,
        motherName: studentData.motherName,
        guardianName: studentData.guardianName,
        guardianPhone: studentData.guardianPhone,
      });
      const newStudent: Student = {
        ...studentData,
        id: response.id,
        overallAttendancePct: 100.0,
      };
      setStudents((prev) => [newStudent, ...prev]);
      logAudit('CREATE_STUDENT', 'Students', `Created student ${newStudent.name} (${newStudent.regNo})`);
      addToast('Student Added', `${newStudent.name} registered successfully`, 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to add student', 'danger');
    }
  }, []);

  const updateStudent = useCallback(async (updated: Student) => {
    try {
      const response = await apiClient.updateStudent(updated.id, {
        name: updated.name,
        email: updated.email,
        regNo: updated.regNo,
        rollNo: updated.rollNo,
        departmentId: updated.departmentId,
        semester: updated.semester,
        section: updated.section,
        batch: updated.batch,
        phone: updated.phone,
        avatar: updated.avatar,
        gender: updated.gender,
        dob: updated.dob,
        address: updated.address,
        fatherName: updated.fatherName,
        motherName: updated.motherName,
        guardianName: updated.guardianName,
        guardianPhone: updated.guardianPhone,
      });
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? { ...response, overallAttendancePct: updated.overallAttendancePct, guardianName: response.guardianName || updated.guardianName, guardianPhone: response.guardianPhone || updated.guardianPhone } : s)));
      logAudit('UPDATE_STUDENT', 'Students', `Updated student record for ${updated.name}`);
      addToast('Student Updated', `Record saved for ${updated.name}`, 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to update student', 'danger');
    }
  }, []);

  const deleteStudent = useCallback(async (id: string) => {
    const target = students.find((s) => s.id === id);
    try {
      await apiClient.deleteStudent(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      logAudit('DELETE_STUDENT', 'Students', `Deleted student ${target?.name || id}`);
      addToast('Student Removed', 'Student record removed from system', 'warning');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to delete student', 'danger');
    }
  }, [students]);

  const bulkImportStudents = useCallback(async (list: Array<Omit<Student, 'id' | 'overallAttendancePct'>>) => {
    try {
      await apiClient.bulkImportStudents(list.map(s => ({
        name: s.name, email: s.email, regNo: s.regNo, rollNo: s.rollNo,
        departmentId: s.departmentId, semester: s.semester, section: s.section, batch: s.batch,
      })));
      const createdList: Student[] = list.map((item, idx) => ({
        ...item,
        id: 'std-bulk-' + Date.now() + '-' + idx,
        overallAttendancePct: 100.0,
      }));
      setStudents((prev) => [...createdList, ...prev]);
      logAudit('BULK_IMPORT_STUDENTS', 'Students', `Imported ${createdList.length} students via CSV`);
      addToast('CSV Import Complete', `Added ${createdList.length} students successfully`, 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to import students', 'danger');
    }
  }, []);

  // Faculty CRUD
  const addFaculty = useCallback(async (facData: Omit<Faculty, 'id'>) => {
    try {
      const response = await apiClient.createFaculty({
        name: facData.name,
        email: facData.email,
        employeeId: facData.employeeId,
        departmentId: facData.departmentId,
        designation: facData.designation,
        phone: facData.phone,
        assignedSubjectIds: facData.assignedSubjectIds,
        avatar: facData.avatar,
        isHOD: facData.isHOD,
      });
      const newFac: Faculty = {
        ...facData,
        id: response.id,
      };
      setFacultyList((prev) => [newFac, ...prev]);
      logAudit('CREATE_FACULTY', 'Faculty', `Added faculty member ${newFac.name}`);
      addToast('Faculty Registered', `${newFac.name} added to faculty roster`, 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to add faculty', 'danger');
    }
  }, []);

  const updateFaculty = useCallback(async (updated: Faculty) => {
    try {
      const response = await apiClient.updateFaculty(updated.id, {
        name: updated.name,
        email: updated.email,
        employeeId: updated.employeeId,
        departmentId: updated.departmentId,
        designation: updated.designation,
        phone: updated.phone,
        assignedSubjectIds: updated.assignedSubjectIds,
        avatar: updated.avatar,
        isHod: updated.isHOD,
      });
      setFacultyList((prev) => prev.map((f) => (f.id === updated.id ? { ...response, isHOD: response.isHod, assignedSubjectIds: response.assignedSubjectIds || updated.assignedSubjectIds } : f)));
      logAudit('UPDATE_FACULTY', 'Faculty', `Updated faculty profile for ${updated.name}`);
      addToast('Faculty Updated', `Saved profile for ${updated.name}`, 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to update faculty', 'danger');
    }
  }, []);

  const deleteFaculty = useCallback(async (id: string) => {
    try {
      await apiClient.deleteFaculty(id);
      setFacultyList((prev) => prev.filter((f) => f.id !== id));
      logAudit('DELETE_FACULTY', 'Faculty', `Deleted faculty ID ${id}`);
      addToast('Faculty Deleted', 'Faculty record removed', 'warning');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to delete faculty', 'danger');
    }
  }, []);

  // Department
  const addDepartment = useCallback(async (deptData: Omit<Department, 'id' | 'avgAttendancePct'>) => {
    try {
      const response = await apiClient.createDepartment({
        code: deptData.code,
        name: deptData.name,
        hodId: deptData.hodId,
      });
      const newDept: Department = {
        ...deptData,
        id: response.id,
        avgAttendancePct: 85.0,
      };
      setDepartments((prev) => [...prev, newDept]);
      logAudit('CREATE_DEPARTMENT', 'Departments', `Created department ${newDept.name}`);
      addToast('Department Created', `${newDept.name} added`, 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to add department', 'danger');
    }
  }, []);

  const updateDepartment = useCallback(async (updated: Department) => {
    try {
      const response = await apiClient.updateDepartment(updated.id, {
        code: updated.code,
        name: updated.name,
        hodId: updated.hodId,
      });
      setDepartments((prev) => prev.map((d) => (d.id === updated.id ? { ...response, studentCount: updated.studentCount, facultyCount: updated.facultyCount, subjectsCount: updated.subjectsCount, avgAttendancePct: updated.avgAttendancePct } : d)));
      logAudit('UPDATE_DEPARTMENT', 'Departments', `Updated department ${updated.name}`);
      addToast('Department Saved', `Updated ${updated.name}`, 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to update department', 'danger');
    }
  }, []);

  // Subject
  const addSubject = useCallback(async (subData: Omit<Subject, 'id' | 'totalClassesHeld'>) => {
    try {
      const response = await apiClient.createSubject({
        code: subData.code,
        name: subData.name,
        departmentId: subData.departmentId,
        semester: subData.semester,
        credits: subData.credits,
        minAttendancePct: subData.minAttendancePct,
      });
      const newSub: Subject = {
        ...subData,
        id: response.id,
        totalClassesHeld: 0,
      };
      setSubjects((prev) => [...prev, newSub]);
      logAudit('CREATE_SUBJECT', 'Subjects', `Created subject ${newSub.code} - ${newSub.name}`);
      addToast('Subject Created', `${newSub.code} added to curriculum`, 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to add subject', 'danger');
    }
  }, []);

  const updateSubject = useCallback(async (updated: Subject) => {
    try {
      const response = await apiClient.updateSubject(updated.id, {
        code: updated.code,
        name: updated.name,
        departmentId: updated.departmentId,
        semester: updated.semester,
        credits: updated.credits,
        minAttendancePct: updated.minAttendancePct,
      });
      setSubjects((prev) => prev.map((s) => (s.id === updated.id ? { ...response, totalClassesHeld: updated.totalClassesHeld, facultyId: response.facultyId || updated.facultyId, facultyName: response.facultyName || updated.facultyName } : s)));
      logAudit('UPDATE_SUBJECT', 'Subjects', `Updated subject ${updated.code}`);
      addToast('Subject Updated', `Subject ${updated.code} saved`, 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to update subject', 'danger');
    }
  }, []);

  // Timetable
  const saveTimetableSlot = useCallback(async (slot: TimetableSlot) => {
    try {
      const payload = {
        day: slot.day,
        periodNumber: slot.periodNumber,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subjectId: slot.subjectId,
        facultyId: slot.facultyId,
        roomNo: slot.roomNo,
        departmentId: slot.departmentId,
        semester: slot.semester,
        section: slot.section,
      };
      let response: any;
      if (slot.id.startsWith('tt-')) {
        response = await apiClient.saveTimetableSlot(payload);
      } else {
        response = await apiClient.updateTimetableSlot(slot.id, payload);
      }
      const savedSlot: TimetableSlot = {
        ...slot,
        id: response.id,
      };
      setTimetable((prev) => {
        const existingIdx = prev.findIndex((s) => s.id === slot.id);
        if (existingIdx >= 0) {
          const copy = [...prev];
          copy[existingIdx] = savedSlot;
          return copy;
        }
        return [...prev, savedSlot];
      });
      logAudit('SAVE_TIMETABLE', 'Timetable Builder', `Saved timetable slot ${slot.day} Period ${slot.periodNumber} (${slot.subjectCode})`);
      addToast('Timetable Slot Saved', `${slot.day} P${slot.periodNumber} assigned to ${slot.subjectCode}`, 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to save timetable slot', 'danger');
    }
  }, [timetable]);

  const deleteTimetableSlot = useCallback(async (id: string) => {
    try {
      await apiClient.deleteTimetableSlot(id);
      setTimetable((prev) => prev.filter((s) => s.id !== id));
      logAudit('DELETE_TIMETABLE_SLOT', 'Timetable Builder', `Removed slot ID ${id}`);
      addToast('Slot Removed', 'Timetable slot cleared', 'warning');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to delete timetable slot', 'danger');
    }
  }, []);

  // Mark Attendance
  const markAttendance = useCallback(async (record: AttendanceRecord) => {
    try {
      const response = await apiClient.markAttendance({
        date: record.date,
        periodNumber: record.periodNumber,
        subjectId: record.subjectId,
        facultyId: record.facultyId,
        roomNo: record.roomNo,
        departmentId: record.departmentId,
        semester: record.semester,
        section: record.section,
        entries: record.entries.map((e) => ({
          studentId: e.studentId,
          status: e.status,
          remarks: e.remarks,
        })),
      });
      const savedRecord: AttendanceRecord = {
        ...response,
        entries: response.entries,
      };
      setAttendanceRecords((prev) => {
        const idx = prev.findIndex((r) => r.id === record.id || (r.date === record.date && r.periodNumber === record.periodNumber && r.subjectId === record.subjectId));
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = savedRecord;
          return copy;
        }
        return [savedRecord, ...prev];
      });
      logAudit('MARK_ATTENDANCE', 'Attendance', `Submitted period ${record.periodNumber} for ${record.subjectCode} (${record.presentCount}/${record.totalStudents} present)`);
      addToast('Attendance Submitted', `Saved record for ${record.subjectCode} (Period ${record.periodNumber})`, 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to save attendance', 'danger');
    }
  }, []);

  // Corrections
  const submitCorrectionRequest = useCallback(async (req: Omit<CorrectionRequest, 'id' | 'createdAt' | 'status'>) => {
    try {
      const response = await apiClient.requestCorrection({
        attendanceSessionId: req.attendanceRecordId,
        studentId: req.studentId,
        date: req.date,
        periodNumber: req.periodNumber,
        originalStatus: req.originalStatus,
        proposedStatus: req.proposedStatus,
        reason: req.reason,
      });
      const newReq: CorrectionRequest = {
        ...req,
        id: response.id,
        status: 'pending',
        createdAt: response.createdAt,
      };
      setCorrectionRequests((prev) => [newReq, ...prev]);
      logAudit('REQUEST_CORRECTION', 'Attendance History', `Correction requested for ${newReq.studentName} (${newReq.subjectCode})`);
      addToast('Correction Requested', 'Submitted to HOD for review', 'info');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to submit correction', 'danger');
    }
  }, [correctionRequests]);

  const reviewCorrectionRequest = useCallback(async (id: string, status: 'approved' | 'rejected', reviewerName: string, comment?: string) => {
    try {
      await apiClient.reviewCorrection(id, status, comment);
      setCorrectionRequests((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            return { ...c, status, reviewedBy: reviewerName, reviewComment: comment };
          }
          return c;
        })
      );
      logAudit('REVIEW_CORRECTION', 'HOD Approvals', `Correction ${id} marked as ${status.toUpperCase()} by ${reviewerName}`);
      addToast('Correction Reviewed', `Request marked as ${status}`, status === 'approved' ? 'success' : 'warning');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to review correction', 'danger');
    }
  }, []);

  // Leaves
  const submitLeaveRequest = useCallback(async (leaveData: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
    try {
      const response = await apiClient.applyLeave({
        studentId: leaveData.studentId,
        studentName: leaveData.studentName,
        studentRegNo: leaveData.studentRegNo,
        departmentId: leaveData.departmentId,
        semester: leaveData.semester,
        section: leaveData.section,
        leaveType: leaveData.leaveType,
        startDate: leaveData.startDate,
        endDate: leaveData.endDate,
        totalDays: leaveData.totalDays,
        reason: leaveData.reason,
        attachmentUrl: leaveData.attachmentUrl,
      });
      const newLeave: LeaveRequest = {
        ...leaveData,
        id: response.id,
        status: 'pending_faculty',
        createdAt: response.createdAt,
      };
      setLeaveRequests((prev) => [newLeave, ...prev]);
      logAudit('SUBMIT_LEAVE', 'Student Leave', `Leave submitted by ${newLeave.studentName} for ${newLeave.totalDays} day(s)`);
      addToast('Leave Applied', 'Application sent to faculty advisor for review', 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to submit leave request', 'danger');
    }
  }, []);

  const reviewLeaveRequest = useCallback(async (id: string, stage: 'faculty' | 'hod', status: 'approved' | 'rejected', reviewerId: string, reviewerName: string, comment?: string) => {
    try {
      if (stage === 'faculty') {
        await apiClient.reviewFacultyLeave(id, stage, status, reviewerId, reviewerName, comment);
      } else {
        await apiClient.reviewLeaveHod(id, stage, status, reviewerId, reviewerName, comment);
      }
      setLeaveRequests((prev) =>
        prev.map((l) => {
          if (l.id === id) {
            if (stage === 'faculty') {
              if (status === 'rejected') {
                return {
                  ...l,
                  status: 'rejected',
                  facultyApproval: { facultyId: reviewerId, facultyName: reviewerName, approvedAt: new Date().toISOString(), comment },
                };
              }
              return {
                ...l,
                status: 'pending_hod',
                facultyApproval: { facultyId: reviewerId, facultyName: reviewerName, approvedAt: new Date().toISOString(), comment },
              };
            } else {
              return {
                ...l,
                status: status === 'approved' ? 'approved' : 'rejected',
                hodApproval: { hodId: reviewerId, hodName: reviewerName, approvedAt: new Date().toISOString(), comment },
              };
            }
          }
          return l;
        })
      );
      logAudit('REVIEW_LEAVE', 'Leave Module', `Leave ${id} ${status} by ${stage.toUpperCase()} (${reviewerName})`);
      addToast('Leave Request Updated', `Marked as ${status}`, status === 'approved' ? 'success' : 'warning');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to review leave request', 'danger');
    }
  }, []);

  // Substitutions
  const _mapSubstitutionFromApi = (apiSub: any): SubstitutionRequest => ({
    id: apiSub.id,
    requestingFacultyId: apiSub.requestingFacultyId,
    requestingFacultyName: apiSub.requestingFacultyName,
    substituteFacultyId: apiSub.substituteFacultyId,
    substituteFacultyName: apiSub.substituteFacultyName,
    date: apiSub.date,
    periodNumber: apiSub.periodNumber,
    subjectCode: apiSub.subjectCode,
    subjectName: apiSub.subjectName,
    roomNo: apiSub.roomNo,
    section: apiSub.section,
    reason: apiSub.reason,
    status: apiSub.status,
    createdAt: apiSub.createdAt,
  });

  const submitSubstitutionRequest = useCallback(async (subData: Omit<SubstitutionRequest, 'id' | 'createdAt' | 'status'>) => {
    try {
      const response = await apiClient.requestSubstitution({
        requestingFacultyId: subData.requestingFacultyId,
        requestingFacultyName: subData.requestingFacultyName,
        substituteFacultyId: subData.substituteFacultyId,
        substituteFacultyName: subData.substituteFacultyName,
        date: subData.date,
        periodNumber: subData.periodNumber,
        subjectCode: subData.subjectCode,
        subjectName: subData.subjectName,
        roomNo: subData.roomNo,
        section: subData.section,
        reason: subData.reason,
      });
      const newReq: SubstitutionRequest = {
        ...subData,
        id: response.id,
        status: 'pending',
        createdAt: response.createdAt,
      };
      setSubstitutionRequests((prev) => [newReq, ...prev]);
      logAudit('SUBMIT_SUBSTITUTION', 'Faculty Substitution', `Substitution requested with ${newReq.substituteFacultyName}`);
      addToast('Substitution Sent', `Request sent to ${newReq.substituteFacultyName}`, 'info');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to submit substitution request', 'danger');
    }
  }, []);

  const reviewSubstitutionRequest = useCallback(async (id: string, action: 'accept' | 'reject' | 'approve') => {
    try {
      const statusMap: Record<string, string> = {
        accept: 'accepted',
        reject: 'rejected_by_sub',
        approve: 'approved_by_hod',
      };
      await apiClient.respondSubstitution(id, statusMap[action]);
      setSubstitutionRequests((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            const newStatus = statusMap[action] as any;
            return { ...s, status: newStatus };
          }
          return s;
        })
      );
      addToast('Substitution Updated', `Status updated to ${action}`, 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to review substitution', 'danger');
    }
  }, []);

  const requestSubstitution = useCallback(async (sub: SubstitutionRequest) => {
    await submitSubstitutionRequest({
      requestingFacultyId: sub.requestingFacultyId,
      requestingFacultyName: sub.requestingFacultyName,
      substituteFacultyId: sub.substituteFacultyId,
      substituteFacultyName: sub.substituteFacultyName,
      date: sub.date,
      periodNumber: sub.periodNumber,
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      roomNo: sub.roomNo,
      section: sub.section,
      reason: sub.reason,
    });
  }, [submitSubstitutionRequest]);

  const respondSubstitution = useCallback(async (id: string, action: 'approved' | 'rejected') => {
    const map: Record<string, 'accept' | 'reject' | 'approve'> = {
      approved: 'accept',
      rejected: 'reject',
    };
    const ctxAction = map[action] || 'reject';
    await reviewSubstitutionRequest(id, ctxAction);
  }, [reviewSubstitutionRequest]);

  // Calendar Events
  const addCalendarEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>) => {
    try {
      const response = await apiClient.createCalendarEvent({
        date: event.date,
        type: event.type,
        title: event.title,
        description: event.description,
      });
      const newEv: CalendarEvent = { ...event, id: response.id };
      setCalendarEvents((prev) => [...prev, newEv]);
      addToast('Calendar Updated', `Added ${newEv.title} on ${newEv.date}`, 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to add calendar event', 'danger');
    }
  }, []);

  const deleteCalendarEvent = useCallback(async (id: string) => {
    try {
      await apiClient.deleteCalendarEvent(id);
      setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
      addToast('Event Removed', 'Calendar event deleted', 'info');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to delete calendar event', 'danger');
    }
  }, []);

  // Backups
  const triggerBackup = useCallback(async (type: 'manual' | 'automated') => {
    try {
      const response = await apiClient.triggerBackup(type);
      const newBkp: BackupSnapshot = {
        id: response.id || 'bkp-' + Date.now(),
        filename: response.filename,
        size: response.size,
        createdAt: response.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: type,
        status: response.status || 'success',
      };
      setBackups((prev) => [newBkp, ...prev]);
      logAudit('TRIGGER_BACKUP', 'Database Settings', `Created ${type} backup snapshot ${newBkp.filename}`);
      addToast('Backup Created', `Snapshot ${newBkp.filename} saved`, 'success');
    } catch (error) {
      addToast('Error', error instanceof Error ? error.message : 'Failed to create backup', 'danger');
    }
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await apiClient.markNotificationRead(id);
    } catch {
      // Silently ignore - local state already updated
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await apiClient.markAllNotificationsRead();
    } catch {
      // Silently ignore
    }
    addToast('Notifications Cleared', 'All marked as read', 'info');
  }, []);

  // Auto-login on initial mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('smart_att_token');
      const savedUser = localStorage.getItem('smart_att_user');
      if (token && savedUser && !isAuthenticated) {
        const user = JSON.parse(savedUser) as User;
        setCurrentUserState(user);
        setIsAuthenticated(true);
        await loadDataForRole(user.role || 'admin');
      }
    };
    initAuth();
  }, [isAuthenticated, loadDataForRole]);

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
        changePassword,
        setActiveScreen,
        setCommandPaletteOpen,
        toggleDarkMode,
        setAppTheme,
        addToast,
        removeToast,
        setCurrentUser,

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
        requestSubstitution,
        respondSubstitution,

        addCalendarEvent,
        deleteCalendarEvent,

        triggerBackup,
        markNotificationRead,
        clearAllNotifications,
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
