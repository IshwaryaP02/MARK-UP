import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';
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
  mockPeriodTimes
} from '../src/mock/data.ts';
import type { User, UserRole, Student, Faculty } from '../src/types/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'smartattendance.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS records (
    key TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (key, id)
  );
  CREATE TABLE IF NOT EXISTS accounts (
    role TEXT NOT NULL,
    identifier TEXT NOT NULL,
    user_id TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    PRIMARY KEY (role, identifier)
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_records_key ON records (key);
`);

export function allRows<T = any>(key: string): T[] {
  const rows = db
    .prepare('SELECT data FROM records WHERE key = ? ORDER BY created_at ASC, rowid ASC')
    .all(key) as unknown as Array<{ data: string }>;
  return rows.map((r) => JSON.parse(r.data));
}

export function getRow<T = any>(key: string, id: string): T | undefined {
  const row = db
    .prepare('SELECT data FROM records WHERE key = ? AND id = ?')
    .get(key, id) as unknown as { data: string } | undefined;
  return row ? JSON.parse(row.data) : undefined;
}

export function upsertRow(key: string, obj: any): void {
  db.prepare(
    `INSERT INTO records (key, id, data, updated_at) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(key, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  ).run(key, obj.id, JSON.stringify(obj));
}

export function deleteRow(key: string, id: string): void {
  db.prepare('DELETE FROM records WHERE key = ? AND id = ?').run(key, id);
}

export function replaceCollection(key: string, items: any[]): void {
  const del = db.prepare('DELETE FROM records WHERE key = ?');
  const ins = db.prepare('INSERT INTO records (key, id, data) VALUES (?, ?, ?)');
  db.exec('BEGIN');
  try {
    del.run(key);
    for (const o of items) ins.run(key, o.id, JSON.stringify(o));
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

export function insertMany(key: string, items: any[]): void {
  const ins = db.prepare('INSERT OR IGNORE INTO records (key, id, data) VALUES (?, ?, ?)');
  db.exec('BEGIN');
  try {
    for (const o of items) ins.run(key, o.id, JSON.stringify(o));
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

export function sha256(value: string): string {
  return createHash('sha256').update('smartatt::' + value).digest('hex');
}

export function uid(prefix: string): string {
  return prefix + '-' + Date.now().toString(36) + '-' + randomBytes(3).toString('hex');
}

export function nowTs(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function setAccount(role: UserRole, identifier: string, userId: string, password: string): void {
  db.prepare(
    `INSERT INTO accounts (role, identifier, user_id, password_hash) VALUES (?, ?, ?, ?)
     ON CONFLICT(role, identifier) DO UPDATE SET user_id = excluded.user_id, password_hash = excluded.password_hash`
  ).run(role, String(identifier).toLowerCase(), userId, sha256(password));
}

export function removeAccountsForUser(userId: string): void {
  db.prepare('DELETE FROM accounts WHERE user_id = ?').run(userId);
}

export function getAccount(role: string, identifier: string): { user_id: string; password_hash: string } | undefined {
  return db
    .prepare('SELECT user_id, password_hash FROM accounts WHERE role = ? AND identifier = ?')
    .get(role, String(identifier).toLowerCase()) as unknown as { user_id: string; password_hash: string } | undefined;
}

export function createSession(userId: string): string {
  const token = randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
  return token;
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function getSessionUserId(token: string): string | undefined {
  const row = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token) as unknown as
    | { user_id: string }
    | undefined;
  return row?.user_id;
}

export function setLastLogin(userId: string): void {
  const user = getRow<User>('users', userId);
  if (user) {
    upsertRow('users', { ...user, lastLogin: new Date().toLocaleTimeString() });
  }
}

export function enrichUser(target: User): User {
  if (target.role !== 'student') return target;
  const studentRecord = getRow<Student>('students', target.id);
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
    gender: studentRecord.gender || target.gender,
    dob: studentRecord.dob || target.dob,
    fatherName: studentRecord.fatherName || target.fatherName,
    motherName: studentRecord.motherName || target.motherName,
    parentPhone: studentRecord.parentPhone || target.parentPhone
  };
}

function studentToUser(s: Student): User {
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    role: 'student',
    departmentId: s.departmentId,
    departmentName: s.departmentName,
    regNo: s.regNo,
    rollNo: s.rollNo,
    semester: s.semester,
    section: s.section,
    batch: s.batch,
    guardianName: s.guardianName,
    guardianPhone: s.guardianPhone,
    phone: s.phone,
    avatar: s.avatar,
    address: s.address,
    gender: s.gender,
    dob: s.dob,
    fatherName: s.fatherName,
    motherName: s.motherName,
    parentPhone: s.parentPhone,
    active: s.active
  };
}

function facultyToUser(f: Faculty): User {
  return {
    id: f.id,
    name: f.name,
    email: f.email,
    role: f.isHOD ? 'hod' : 'faculty',
    departmentId: f.departmentId,
    departmentName: f.departmentName,
    employeeId: f.employeeId,
    phone: f.phone,
    avatar: f.avatar,
    active: f.active
  };
}

export function syncAccountFor(key: string, item: any): void {
  if (key === 'students' && item?.id && item.regNo) {
    upsertRow('users', studentToUser(item));
    removeAccountsForUser(item.id);
    setAccount('student', item.regNo, item.id, 'student123');
  } else if (key === 'faculty' && item?.id && item.employeeId) {
    upsertRow('users', facultyToUser(item));
    removeAccountsForUser(item.id);
    const role: UserRole = item.isHOD ? 'hod' : 'faculty';
    setAccount(role, item.employeeId, item.id, item.isHOD ? 'hod123' : 'faculty123');
  }
}

export function unsyncAccountFor(key: string, id: string): void {
  if (key === 'students' || key === 'faculty') {
    removeAccountsForUser(id);
    deleteRow('users', id);
  }
}

function seed(): void {
  const { c } = db.prepare('SELECT COUNT(*) AS c FROM records').get() as { c: number };
  if (c > 0) return;

  const collections: Array<[string, any[]]> = [
    ['periodTimes', mockPeriodTimes],
    ['users', mockUsers],
    ['departments', mockDepartments],
    ['subjects', mockSubjects],
    ['faculty', mockFaculty],
    ['students', mockStudents],
    ['timetable', mockTimetableSlots],
    ['attendanceRecords', mockAttendanceRecords],
    ['leaveRequests', mockLeaveRequests],
    ['correctionRequests', mockCorrectionRequests],
    ['substitutionRequests', mockSubstitutionRequests],
    ['calendarEvents', mockCalendarEvents],
    ['auditLogs', mockAuditLogs],
    ['backups', mockBackupSnapshots],
    ['notifications', mockNotifications],
    ['circulars', mockCirculars]
  ];

  const ins = db.prepare('INSERT OR IGNORE INTO records (key, id, data) VALUES (?, ?, ?)');
  db.exec('BEGIN');
  try {
    for (const [key, items] of collections) {
      for (const o of items) ins.run(key, o.id, JSON.stringify(o));
    }

    const admin = mockUsers.find((u) => u.role === 'admin');
    if (admin) setAccount('admin', 'admin', admin.id, 'admin123');

    for (const f of mockFaculty) {
      const existing = mockUsers.find((u) => u.id === f.id);
      if (!existing) ins.run('users', f.id, JSON.stringify(facultyToUser(f)));
      setAccount(f.isHOD ? 'hod' : 'faculty', f.employeeId, f.id, f.isHOD ? 'hod123' : 'faculty123');
    }
    for (const s of mockStudents) {
      const existing = mockUsers.find((u) => u.id === s.id);
      if (!existing) ins.run('users', s.id, JSON.stringify(studentToUser(s)));
      setAccount('student', s.regNo, s.id, 'student123');
    }

    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

seed();

export { db };