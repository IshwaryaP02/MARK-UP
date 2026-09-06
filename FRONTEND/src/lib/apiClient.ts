/// <reference types="vite/client" />

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

type FetchOptions = {
  skipAuth?: boolean;
  params?: Record<string, string | number | boolean>;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
};

function getJwt(): string | null {
  return localStorage.getItem('smart_att_token');
}

export function setJwt(token: string): void {
  localStorage.setItem('smart_att_token', token);
}

export function clearJwt(): void {
  localStorage.removeItem('smart_att_token');
}

function toCamelCase(str: string): string {
  if (str === 'is_hod') return 'isHOD';
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function camelizeKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(camelizeKeys);
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      toCamelCase(key),
      camelizeKeys(value),
    ])
  );
}

function snakifyKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(snakifyKeys);
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      toSnakeCase(key),
      snakifyKeys(value),
    ])
  );
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth = false, headers, body, params, method, signal } = options;
  const token = getJwt();

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (!skipAuth && token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    if (qs) url += `?${qs}`;
  }

  let finalBody: string | undefined;
  if (body !== undefined && body !== null) {
    finalBody = JSON.stringify(snakifyKeys(body));
  }

  const resp = await fetch(url, {
    method: method || 'GET',
    signal,
    headers: finalHeaders,
    body: finalBody,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: 'Unknown error' }));
    const detail = typeof err.detail === 'string'
      ? err.detail
      : Array.isArray(err.detail)
        ? (err.detail as { loc?: string[]; msg?: string }[])
            .map((d) => d.msg || 'Error')
            .join(', ')
        : 'Unknown error';
    throw new Error(detail);
  }

  if (resp.status === 204) return undefined as T;
  const raw = await resp.json();
  return camelizeKeys(raw) as T;
}

export const apiClient = {
  // Auth
  login: (username: string, password: string) =>
    request<{ accessToken: string; tokenType: string; user: any }>('/auth/login', {
      method: 'POST',
      body: { username, password },
      skipAuth: true,
    }),

  // Password management
  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: { oldPassword, newPassword },
    }),

  resetPassword: (username: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { username, newPassword },
      skipAuth: true,
    }),

  checkResetStatus: (username: string) =>
    request<{ username: string; resetEnabled: boolean }>(`/auth/reset-status/${username}`, {
      skipAuth: true,
    }),

  // Admin: password management for users
  adminSetPassword: (userId: string, newPassword: string) =>
    request<{ message: string }>(`/auth/users/${userId}/set-password`, {
      method: 'PUT',
      body: { newPassword },
    }),

  adminEnableReset: (userId: string, enabled: boolean) =>
    request<{ message: string }>(`/auth/users/${userId}/enable-reset`, {
      method: 'PUT',
      body: { enabled },
    }),

  adminToggleActive: (userId: string) =>
    request<{ message: string; isActive: boolean }>(`/auth/users/${userId}/toggle-active`, {
      method: 'PUT',
    }),

  // Current user
  me: () => request<any>('/auth/me'),

  updateMe: (data: Record<string, unknown>) =>
    request<any>('/auth/me', {
      method: 'PUT',
      body: data,
    }),

  // Students (admin)
  students: (params?: Record<string, string | number | boolean>) =>
    request<any[]>('/admin/students', { params }),

  studentDetail: (id: string) => request<any>(`/admin/students/${id}`),

  createStudent: (data: Record<string, unknown>) =>
    request<any>('/admin/students', {
      method: 'POST',
      body: data,
    }),

  updateStudent: (id: string, data: Record<string, unknown>) =>
    request<any>(`/admin/students/${id}`, {
      method: 'PUT',
      body: data,
    }),

  deleteStudent: (id: string) =>
    request<void>(`/admin/students/${id}`, {
      method: 'DELETE',
    }),

  bulkImportStudents: (studentsList: Array<Record<string, unknown>>) =>
    request<any>('/admin/students/bulk-import-json', {
      method: 'POST',
      body: studentsList,
    }),

  // Faculty (admin)
  faculty: (params?: Record<string, string | number | boolean>) =>
    request<any[]>('/admin/faculty', { params }),

  createFaculty: (data: Record<string, unknown>) =>
    request<any>('/admin/faculty', {
      method: 'POST',
      body: data,
    }),

  updateFaculty: (id: string, data: Record<string, unknown>) =>
    request<any>(`/admin/faculty/${id}`, {
      method: 'PUT',
      body: data,
    }),

  deleteFaculty: (id: string) =>
    request<void>(`/admin/faculty/${id}`, {
      method: 'DELETE',
    }),

  // Departments
  departments: () => request<any[]>('/admin/departments'),
  createDepartment: (data: Record<string, unknown>) =>
    request<any>('/admin/departments', {
      method: 'POST',
      body: data,
    }),
  updateDepartment: (id: string, data: Record<string, unknown>) =>
    request<any>(`/admin/departments/${id}`, {
      method: 'PUT',
      body: data,
    }),

  // Subjects
  subjects: (params?: Record<string, string | number | boolean>) =>
    request<any[]>('/admin/subjects', { params }),
  createSubject: (data: Record<string, unknown>) =>
    request<any>('/admin/subjects', {
      method: 'POST',
      body: data,
    }),
  updateSubject: (id: string, data: Record<string, unknown>) =>
    request<any>(`/admin/subjects/${id}`, {
      method: 'PUT',
      body: data,
    }),

  // Timetable
  timetable: (params?: Record<string, string | number | boolean>) =>
    request<any[]>('/admin/timetable', { params }),
  saveTimetableSlot: (slot: Record<string, unknown>) =>
    request<any>('/admin/timetable', {
      method: 'POST',
      body: slot,
    }),
  updateTimetableSlot: (id: string, data: Record<string, unknown>) =>
    request<any>(`/admin/timetable/${id}`, {
      method: 'PUT',
      body: data,
    }),
  deleteTimetableSlot: (id: string) =>
    request<void>(`/admin/timetable/${id}`, {
      method: 'DELETE',
    }),

  // Calendar
  calendarEvents: () => request<any[]>('/admin/calendar'),
  createCalendarEvent: (data: Record<string, unknown>) =>
    request<any>('/admin/calendar', {
      method: 'POST',
      body: data,
    }),
  deleteCalendarEvent: (id: string) =>
    request<void>(`/admin/calendar/${id}`, {
      method: 'DELETE',
    }),

  // Audit logs
  auditLogs: () => request<any[]>('/admin/audit'),

  // Backups
  backups: () => request<any[]>('/admin/backups'),
  triggerBackup: (type: 'manual' | 'automated') =>
    request<any>('/admin/backups', {
      method: 'POST',
      body: { type },
    }),

  // Faculty endpoints
  facultyDashboard: () => request<any>('/faculty/dashboard'),
  facultyActivePeriods: () => request<any[]>('/faculty/active-periods'),
  facultyAttendanceHistory: (params?: Record<string, string | number | boolean>) =>
    request<any[]>('/faculty/attendance', { params }),
  facultyAttendanceToday: () => request<any[]>('/faculty/attendance/today'),
  markAttendance: (data: Record<string, unknown>) =>
    request<any>('/faculty/attendance', {
      method: 'POST',
      body: data,
    }),
  facultyStudentSearch: (q?: string) =>
    request<any[]>('/faculty/students/search', { params: q ? { q } : undefined }),
  facultyMyClasses: () => request<any[]>('/faculty/my-classes'),
  facultyTimetable: () => request<any[]>('/faculty/timetable'),
  facultyLeaveQueue: () => request<any[]>('/faculty/leave-queue'),
  reviewFacultyLeave: (id: string, stage: string, status: string, reviewerId: string, reviewerName: string, comment?: string) =>
    request<any>(`/faculty/leaves/${id}/review`, {
      method: 'PUT',
      body: { stage, status, reviewerId, reviewerName, comment },
    }),
  facultySubstitutions: () => request<any[]>('/faculty/substitutions'),
  requestSubstitution: (data: Record<string, unknown>) =>
    request<any>('/faculty/substitutions', {
      method: 'POST',
      body: data,
    }),
  respondSubstitution: (id: string, status: string) =>
    request<any>(`/faculty/substitutions/${id}/respond`, {
      method: 'PUT',
      body: { status },
    }),
  facultyCorrections: () => request<any[]>('/faculty/corrections'),
  requestCorrection: (data: Record<string, unknown>) =>
    request<any>('/faculty/corrections', {
      method: 'POST',
      body: data,
    }),

  // Student endpoints
  studentDashboard: () => request<any>('/student/dashboard'),
  studentAttendanceSummary: () => request<any>('/student/attendance/summary'),
  studentAttendanceHistory: (params?: Record<string, string | number | boolean>) =>
    request<any[]>('/student/attendance/history', { params }),
  studentTimetable: () => request<any[]>('/student/timetable'),
  studentLeaves: () => request<any[]>('/student/leaves'),
  applyLeave: (data: Record<string, unknown>) =>
    request<any>('/student/leaves', {
      method: 'POST',
      body: data,
    }),
  studentNotifications: () => request<any[]>('/student/notifications'),
  studentProfile: () => request<any>('/student/profile'),
  updateStudentProfile: (data: Record<string, unknown>) =>
    request<any>('/student/profile', {
      method: 'PUT',
      body: data,
    }),

  // HOD endpoints
  hodDashboard: () => request<any>('/hod/dashboard'),
  hodAnalysis: (deptId: string) => request<any>(`/hod/departments/${deptId}/analysis`),
  hodAllClasses: () => request<any[]>('/hod/all-classes'),
  hodMonitoring: () => request<any[]>('/hod/faculty-monitoring'),
  hodCorrections: () => request<any[]>('/hod/corrections'),
  hodLeaves: () => request<any[]>('/hod/leaves'),
  hodSubstitutions: () => request<any[]>('/hod/substitutions'),
  reviewCorrection: (id: string, status: string, comment?: string) =>
    request<any>(`/hod/corrections/${id}/review`, {
      method: 'PUT',
      body: { status, comment },
    }),
  reviewLeaveHod: (id: string, stage: string, status: string, reviewerId: string, reviewerName: string, comment?: string) =>
    request<any>(`/hod/leaves/${id}/review`, {
      method: 'PUT',
      body: { stage, status, reviewerId, reviewerName, comment },
    }),
  reviewSubstitution: (id: string, status: string) =>
    request<any>(`/hod/substitutions/${id}/review`, {
      method: 'PUT',
      body: { status },
    }),

  // Users (admin)
  users: (params?: Record<string, string | number | boolean>) =>
    request<any[]>('/auth/users', { params }),

  // Reports
  generateReport: (data: Record<string, unknown>, exportType?: string) =>
    request<any>(`/reports/generate?export=${exportType || 'json'}`, {
      method: 'POST',
      body: data,
    }),

  // Notifications (global)
  notifications: (params?: Record<string, string | number | boolean>) =>
    request<any[]>('/notifications/', { params }),
  markNotificationRead: (id: string) =>
    request<void>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllNotificationsRead: () =>
    request<void>('/notifications/read-all', {
      method: 'PUT',
    }),
};
