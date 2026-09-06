import type { AttendanceRecord, AttendanceStatus } from '../types';

/* ============================================================================
 * attendanceService — LIVE-DATA LAYER FOR ALL ATTENDANCE GRAPHS
 * ----------------------------------------------------------------------------
 * Every attendance chart across the HOD / Faculty / Student dashboards reads
 * its data from this single service layer. Chart components stay dumb: they
 * only render whatever `data` (via props) they are handed by a dashboard.
 *
 * The backend/database is NOT wired up yet. Until it is, every service
 * function resolves to `[]`, so the charts render a proper empty state
 * ("Attendance data will appear here once data is available.").
 *
 * HOW TO CONNECT THE BACKEND LATER
 * ---------------------------------
 * 1. Make the API reachable at `attendanceServiceConfig.baseUrl`
 *    (default `http://localhost:4000`, override with VITE_ATTENDANCE_API_URL).
 * 2. `isBackendReady()` auto-detects it via `GET {baseUrl}/api/health`.
 * 3. `fetchAttendanceRecords()` is THE single place the future API call for
 *    raw attendance records lands:
 *
 *      GET {baseUrl}/api/attendance/records
 *      -> 200  `{ records: AttendanceRecord[] }`  OR  `AttendanceRecord[]`
 *
 *    Every `get*` function below then filters that real data and aggregates
 *    it with the pure helpers at the bottom of this file. No chart component
 *    or dashboard needs to change when the backend ships.
 * ========================================================================== */

/* ---------------------------------------------------------------------------
 * Configuration
 * ------------------------------------------------------------------------- */

export interface AttendanceServiceConfig {
  baseUrl: string;
  autoDetectBackend: boolean;
}

const envVars = (import.meta as { env?: Record<string, string | undefined> }).env;

export const attendanceServiceConfig: AttendanceServiceConfig = {
  baseUrl: envVars?.VITE_ATTENDANCE_API_URL || 'http://localhost:4000',
  autoDetectBackend: true
};

/** Set to `true` (or left at auto-detect) once the backend is live. */
export function configureAttendanceService(overrides: Partial<AttendanceServiceConfig>): void {
  Object.assign(attendanceServiceConfig, overrides);
}

/* ---------------------------------------------------------------------------
 * Chart data DTOs — the canonical shapes every chart component consumes.
 * Future API responses are mapped onto these exact types.
 * ------------------------------------------------------------------------- */

/** A single trend/comparison point: percentage + real present/absent counts. */
export interface AttendanceTrendPoint {
  name: string;
  /** Optional ISO date (YYYY-MM-DD) backing the point. */
  date?: string;
  pct: number;
  presentCount: number;
  absentCount: number;
  fullName?: string;
}

/** Point used for categorical comparisons (subjects, semesters, faculty, students). */
export type AttendanceComparisonPoint = AttendanceTrendPoint;

/** Paired present/absent counts for a category (e.g. a weekday). */
export interface AttendanceDualSeriesPoint {
  name: string;
  present: number;
  absent: number;
}

/** One slice of a donut/pie (e.g. Present vs Absent). `color` drives the slice. */
export interface AttendanceDonutSlice {
  name: string;
  value: number;
  color: string;
}

export type HeatmapCellStatus = 'present' | 'absent' | 'late' | 'od' | 'leave' | 'holiday' | 'none';

/** One calendar cell inside a monthly attendance heatmap. */
export interface AttendanceHeatmapCell {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Day of month, 1..31. */
  day: number;
  status: HeatmapCellStatus;
}

/* ---------------------------------------------------------------------------
 * Backend availability (auto-detected, cached for the session)
 * ------------------------------------------------------------------------- */

type BackendStatus = 'unknown' | 'connected' | 'disconnected';

let backendStatus: BackendStatus = 'unknown';
let healthProbe: Promise<boolean> | null = null;

export async function isBackendReady(forceProbe = false): Promise<boolean> {
  if (forceProbe) {
    backendStatus = 'unknown';
    healthProbe = null;
  }
  if (backendStatus !== 'unknown') return backendStatus === 'connected';
  if (!attendanceServiceConfig.autoDetectBackend) {
    backendStatus = 'disconnected';
    return false;
  }
  if (!healthProbe) {
    healthProbe = fetch(`${attendanceServiceConfig.baseUrl}/api/health`)
      .then((res) => res.ok)
      .catch(() => false);
  }
  const ready = await healthProbe;
  backendStatus = ready ? 'connected' : 'disconnected';
  return ready;
}

/* ---------------------------------------------------------------------------
 * Core data access — THE point where the future API call is connected.
 * All get* functions below funnel through here.
 * ------------------------------------------------------------------------- */

async function fetchAttendanceRecords(): Promise<AttendanceRecord[] | null> {
  if (!(await isBackendReady())) return null;

  // === FUTURE BACKEND WIRING =============================================
  // Replace this with the real endpoint once implemented. Expected payload:
  //   200 -> { records: AttendanceRecord[] }   OR   AttendanceRecord[]
  const res = await fetch(`${attendanceServiceConfig.baseUrl}/api/attendance/records`).catch(() => null);
  if (!res) return null;
  if (!res.ok) return null;
  const json: unknown = await res.json().catch(() => null);
  if (!json) return null;
  const records: unknown = Array.isArray(json) ? json : (json as { records?: unknown }).records;
  return Array.isArray(records) ? (records as AttendanceRecord[]) : null;
}

/* ===========================================================================
 * HOD DASHBOARD — live mapping
 * ========================================================================= */

export interface DepartmentAttendanceParams {
  departmentId?: string;
}

/** Department Overall Attendance — present % per day from real dept records. */
export async function getDepartmentAttendance(params: DepartmentAttendanceParams = {}): Promise<AttendanceTrendPoint[]> {
  const records = await fetchAttendanceRecords();
  if (!records) return [];
  const filtered = records.filter((r) => !params.departmentId || r.departmentId === params.departmentId);
  return aggregateTrendByDate(filtered);
}

/** Semester-wise Attendance — real semester attendance records. */
export async function getSemesterWiseAttendance(params: DepartmentAttendanceParams = {}): Promise<AttendanceComparisonPoint[]> {
  const records = await fetchAttendanceRecords();
  if (!records) return [];
  const filtered = records.filter((r) => !params.departmentId || r.departmentId === params.departmentId);
  return aggregateComparisonsByKey(filtered, {
    key: (r) => `sem-${r.semester}`,
    label: (r) => `Sem ${r.semester}`,
    subLabel: (r) => `Semester ${r.semester}`
  });
}

/** Faculty-wise Class Attendance — real faculty / class records. */
export async function getFacultyClassAttendance(params: DepartmentAttendanceParams = {}): Promise<AttendanceComparisonPoint[]> {
  const records = await fetchAttendanceRecords();
  if (!records) return [];
  const filtered = records.filter((r) => !params.departmentId || r.departmentId === params.departmentId);
  return aggregateComparisonsByKey(filtered, {
    key: (r) => r.facultyId || `fac-${r.facultyName}`,
    label: (r) => r.facultyName,
    subLabel: (r) => r.facultyName
  });
}

/** Low Attendance Students (< threshold %) — real student attendance records. */
export async function getLowAttendanceStudents(
  params: DepartmentAttendanceParams & { threshold?: number } = {}
): Promise<AttendanceComparisonPoint[]> {
  const records = await fetchAttendanceRecords();
  if (!records) return [];
  const threshold = params.threshold ?? 75;
  const filtered = records.filter((r) => !params.departmentId || r.departmentId === params.departmentId);
  return aggregateStudentsByAttainment(filtered, {
    threshold,
    key: (e) => e.studentId,
    name: (e) => e.studentName,
    sub: (e) => e.studentRegNo,
    sortBy: 'asc'
  });
}

/** Monthly Attendance Trend — real dated attendance records, bucketed by month. */
export async function getMonthlyAttendanceTrend(params: DepartmentAttendanceParams = {}): Promise<AttendanceTrendPoint[]> {
  const records = await fetchAttendanceRecords();
  if (!records) return [];
  const filtered = records.filter((r) => !params.departmentId || r.departmentId === params.departmentId);
  return aggregateTrendByMonth(filtered);
}

/* ===========================================================================
 * FACULTY DASHBOARD — live mapping
 * ========================================================================= */

export interface FacultyAttendanceParams {
  facultyId?: string;
}

/** My Class Attendance — real assigned-class attendance records (per student). */
export async function getMyClassAttendance(params: FacultyAttendanceParams = {}): Promise<AttendanceComparisonPoint[]> {
  const records = await fetchAttendanceRecords();
  if (!records) return [];
  const filtered = params.facultyId ? records.filter((r) => r.facultyId === params.facultyId) : records;
  return aggregateStudentsByAttainment(filtered, {
    key: (e) => e.studentId,
    name: (e) => e.studentName,
    sub: (e) => e.studentRegNo,
    sortBy: 'desc'
  });
}

/** Subject-wise Attendance — real subject attendance records. */
export async function getSubjectWiseAttendance(params: FacultyAttendanceParams = {}): Promise<AttendanceComparisonPoint[]> {
  const records = await fetchAttendanceRecords();
  if (!records) return [];
  const filtered = params.facultyId ? records.filter((r) => r.facultyId === params.facultyId) : records;
  return aggregateComparisonsByKey(filtered, {
    key: (r) => r.subjectId,
    label: (r) => r.subjectCode,
    subLabel: (r) => `${r.subjectCode} - ${r.subjectName}`
  });
}

/** Daily Attendance Trend — real daily attendance records. */
export async function getDailyAttendanceTrend(params: FacultyAttendanceParams = {}): Promise<AttendanceTrendPoint[]> {
  const records = await fetchAttendanceRecords();
  if (!records) return [];
  const filtered = params.facultyId ? records.filter((r) => r.facultyId === params.facultyId) : records;
  return aggregateTrendByDate(filtered);
}

/** Student Attendance Distribution — calculated from real student records. */
export async function getStudentAttendanceDistribution(params: FacultyAttendanceParams = {}): Promise<AttendanceDonutSlice[]> {
  const records = await fetchAttendanceRecords();
  if (!records) return [];
  const filtered = params.facultyId ? records.filter((r) => r.facultyId === params.facultyId) : records;
  return aggregateDonutDistribution(filtered);
}

/** Present vs Absent Weekly — calculated from real weekly records. */
export async function getPresentVsAbsentWeekly(params: FacultyAttendanceParams = {}): Promise<AttendanceDualSeriesPoint[]> {
  const records = await fetchAttendanceRecords();
  if (!records) return [];
  const filtered = params.facultyId ? records.filter((r) => r.facultyId === params.facultyId) : records;
  return aggregateWeeklyPresentAbsent(filtered);
}

/* ===========================================================================
 * STUDENT DASHBOARD — live mapping
 * ========================================================================= */

export interface StudentAttendanceParams {
  studentId?: string;
  year?: number;
  month?: number;
}

/** My Attendance Overview — the logged-in student's real records (Present vs Absent). */
export async function getMyAttendanceOverview(params: StudentAttendanceParams = {}): Promise<AttendanceDonutSlice[]> {
  const records = await fetchAttendanceRecords();
  if (!records) return [];
  const filtered = params.studentId ? recordsForStudent(records, params.studentId) : records;
  return aggregateDonutDistribution(filtered);
}

/** Semester-wise My Attendance — real semester records for the logged-in student. */
export async function getMySemesterWiseAttendance(params: StudentAttendanceParams = {}): Promise<AttendanceComparisonPoint[]> {
  const records = await fetchAttendanceRecords();
  if (!records) return [];
  const filtered = params.studentId ? recordsForStudent(records, params.studentId) : records;
  return aggregateComparisonsByKey(filtered, {
    key: (r) => `sem-${r.semester}`,
    label: (r) => `Sem ${r.semester}`,
    subLabel: (r) => `Semester ${r.semester}`
  });
}

/** Subject-wise My Attendance — real subject records for the logged-in student. */
export async function getMySubjectWiseAttendance(params: StudentAttendanceParams = {}): Promise<AttendanceComparisonPoint[]> {
  const records = await fetchAttendanceRecords();
  if (!records) return [];
  const filtered = params.studentId ? recordsForStudent(records, params.studentId) : records;
  return aggregateComparisonsByKey(filtered, {
    key: (r) => r.subjectId,
    label: (r) => r.subjectCode,
    subLabel: (r) => `${r.subjectCode} - ${r.subjectName}`
  });
}

/** Monthly Attendance Heatmap — real dated attendance records for one month. */
export async function getMyMonthlyAttendanceHeatmap(params: StudentAttendanceParams = {}): Promise<AttendanceHeatmapCell[]> {
  const records = await fetchAttendanceRecords();
  if (!records) return [];
  const now = new Date();
  const year = params.year ?? now.getFullYear();
  const month = params.month ?? now.getMonth() + 1;
  const filtered = params.studentId ? recordsForStudent(records, params.studentId) : records;
  return aggregateHeatmapForMonth(filtered, { year, month });
}

/** Attendance Trend (Last 30 Days) — real attendance records from the previous 30 days. */
export async function getMyAttendanceTrendLast30Days(params: StudentAttendanceParams = {}): Promise<AttendanceTrendPoint[]> {
  const records = await fetchAttendanceRecords();
  if (!records) return [];
  const filtered = params.studentId ? recordsForStudent(records, params.studentId) : records;
  return aggregateTrendLastNDays(filtered, 30);
}

/* ===========================================================================
 * Pure aggregation helpers.
 * All charts are computed from REAL attendance records only — nothing is
 * hardcoded. These helpers are exported so the backend response (raw record
 * arrays) can be transformed into chart data automatically.
 * ========================================================================= */

export const PRESENT_STATUSES: ReadonlyArray<AttendanceStatus> = ['present', 'late', 'od'];

function countsOf(r: AttendanceRecord): { presentActs: number; absentActs: number } {
  const presentActs = r.presentCount + r.lateCount + r.odCount;
  const absentActs = r.absentCount + r.leaveCount;
  return { presentActs, absentActs };
}

function pctOf(presentActs: number, absentActs: number): number {
  const total = presentActs + absentActs;
  return total > 0 ? Math.round((presentActs / total) * 100) : 0;
}

function recordsForStudent(records: AttendanceRecord[], studentId: string): AttendanceRecord[] {
  return records.filter((r) => r.entries.some((e) => e.studentId === studentId));
}

function toDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dayLabel(date: string): string {
  const d = toDate(date);
  return `${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`;
}

function weekdayShort(date: string): string {
  return DAY_LABELS[toDate(date).getDay()];
}

/** Group records by date (YYYY-MM-DD) and emit one trend point per day. */
export function aggregateTrendByDate(records: AttendanceRecord[]): AttendanceTrendPoint[] {
  const buckets = new Map<string, { present: number; absent: number }>();

  for (const r of records) {
    const cur = buckets.get(r.date) || { present: 0, absent: 0 };
    const c = countsOf(r);
    cur.present += c.presentActs;
    cur.absent += c.absentActs;
    buckets.set(r.date, cur);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      name: dayLabel(date),
      date,
      pct: pctOf(v.present, v.absent),
      presentCount: v.present,
      absentCount: v.absent
    }));
}

/** Group records by month (YYYY-MM) and emit one trend point per month. */
export function aggregateTrendByMonth(records: AttendanceRecord[]): AttendanceTrendPoint[] {
  const buckets = new Map<string, { date: string; present: number; absent: number }>();

  for (const r of records) {
    const key = r.date.slice(0, 7);
    const cur = buckets.get(key) || { date: r.date.slice(0, 8) + '01', present: 0, absent: 0 };
    const c = countsOf(r);
    cur.present += c.presentActs;
    cur.absent += c.absentActs;
    buckets.set(key, cur);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const d = toDate(v.date);
      return {
        name: MONTH_LABELS[d.getMonth()],
        date: v.date,
        pct: pctOf(v.present, v.absent),
        presentCount: v.present,
        absentCount: v.absent
      };
    });
}

interface GroupByOptions {
  key: (r: AttendanceRecord) => string;
  label: (r: AttendanceRecord) => string;
  subLabel?: (r: AttendanceRecord) => string;
}

/** Group real records by any key (subject / semester / faculty) and summarize. */
export function aggregateComparisonsByKey(records: AttendanceRecord[], opts: GroupByOptions): AttendanceComparisonPoint[] {
  const groups = new Map<string, { label: string; subLabel?: string; present: number; absent: number }>();

  for (const r of records) {
    const key = opts.key(r);
    const cur = groups.get(key) || {
      label: opts.label(r),
      subLabel: opts.subLabel?.(r),
      present: 0,
      absent: 0
    };
    const c = countsOf(r);
    cur.present += c.presentActs;
    cur.absent += c.absentActs;
    groups.set(key, cur);
  }

  return [...groups.values()].map((g) => ({
    name: g.label,
    fullName: g.subLabel || g.label,
    pct: pctOf(g.present, g.absent),
    presentCount: g.present,
    absentCount: g.absent
  }));
}

interface StudentAttainmentOptions {
  key: (e: AttendanceRecord['entries'][number]) => string;
  name: (e: AttendanceRecord['entries'][number]) => string;
  sub?: (e: AttendanceRecord['entries'][number]) => string;
  threshold?: number;
  sortBy?: 'asc' | 'desc';
}

/** Per-student present % from real per-student entries (low-attendance & class charts). */
export function aggregateStudentsByAttainment(records: AttendanceRecord[], opts: StudentAttainmentOptions): AttendanceComparisonPoint[] {
  const groups = new Map<string, { name: string; sub?: string; present: number; total: number }>();

  for (const r of records) {
    for (const e of r.entries) {
      const key = opts.key(e);
      const cur = groups.get(key) || { name: opts.name(e), sub: opts.sub?.(e), present: 0, total: 0 };
      cur.total++;
      if (PRESENT_STATUSES.includes(e.status)) cur.present++;
      groups.set(key, cur);
    }
  }

  let points: AttendanceComparisonPoint[] = [...groups.values()].map((g) => ({
    name: g.sub || g.name,
    fullName: g.name,
    pct: pctOf(g.present, g.total - g.present),
    presentCount: g.present,
    absentCount: g.total - g.present
  }));

  if (typeof opts.threshold === 'number') {
    points = points.filter((p) => p.pct < (opts.threshold as number));
  }

  if (opts.sortBy) {
    points.sort((a, b) => (opts.sortBy === 'asc' ? a.pct - b.pct : b.pct - a.pct));
  }

  return points;
}

/** Present vs Absent totals across records as two donut slices. */
export function aggregateDonutDistribution(records: AttendanceRecord[]): AttendanceDonutSlice[] {
  let present = 0;
  let absent = 0;

  for (const r of records) {
    const c = countsOf(r);
    present += c.presentActs;
    absent += c.absentActs;
  }

  return [
    { name: 'Present', value: present, color: '#22C55E' },
    { name: 'Absent', value: absent, color: '#EF4444' }
  ];
}

/** Present vs Absent counts bucketed by weekday (Mon..Sat). */
export function aggregateWeeklyPresentAbsent(records: AttendanceRecord[]): AttendanceDualSeriesPoint[] {
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const buckets = new Map<string, { present: number; absent: number }>();

  for (const r of records) {
    const name = weekdayShort(r.date);
    const cur = buckets.get(name) || { present: 0, absent: 0 };
    const c = countsOf(r);
    cur.present += c.presentActs;
    cur.absent += c.absentActs;
    buckets.set(name, cur);
  }

  return order
    .filter((name) => buckets.has(name))
    .map((name) => {
      const b = buckets.get(name)!;
      return { name, present: b.present, absent: b.absent };
    });
}

/** One status per day of a given month (from real dated records). */
export function aggregateHeatmapForMonth(
  records: AttendanceRecord[],
  opts: { year: number; month: number }
): AttendanceHeatmapCell[] {
  const { year, month } = opts;
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const byDay = new Map<number, { status: HeatmapCellStatus; rank: number }>();

  const dayRecords = records.filter((r) => r.date.startsWith(prefix));
  if (dayRecords.length === 0) return [];

  for (const r of dayRecords) {
    const day = Number(r.date.slice(8, 10));
    const cur = byDay.get(day) || { status: 'none' as HeatmapCellStatus, rank: 0 };
    for (const e of r.entries) {
      const { status, rank } = stackStatus(e.status);
      if (rank > cur.rank) {
        byDay.set(day, { status, rank });
      }
    }
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: AttendanceHeatmapCell[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const found = byDay.get(day);
    cells.push({
      date: `${prefix}-${String(day).padStart(2, '0')}`,
      day,
      status: found?.status || 'none'
    });
  }
  return cells;
}

/** Present% per date restricted to the last N days (from the latest record or today). */
export function aggregateTrendLastNDays(records: AttendanceRecord[], days: number): AttendanceTrendPoint[] {
  if (records.length === 0) return [];

  const latest = records.reduce<string>((max, r) => (r.date > max ? r.date : max), records[0].date);
  const latestDate = toDate(latest);
  const start = new Date(latestDate);
  start.setDate(start.getDate() - (days - 1));

  const filtered = records.filter((r) => r.date >= toIso(start));

  const buckets = new Map<string, { present: number; absent: number }>();
  for (const r of filtered) {
    const cur = buckets.get(r.date) || { present: 0, absent: 0 };
    const c = countsOf(r);
    cur.present += c.presentActs;
    cur.absent += c.absentActs;
    buckets.set(r.date, cur);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      name: dayLabel(date),
      date,
      pct: pctOf(v.present, v.absent),
      presentCount: v.present,
      absentCount: v.absent
    }));
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const STATUS_RANK: Record<HeatmapCellStatus, number> = {
  none: 0,
  od: 1,
  present: 2,
  late: 3,
  leave: 4,
  holiday: 5,
  absent: 6
};

function stackStatus(status: AttendanceStatus): { status: HeatmapCellStatus; rank: number } {
  const mapped: HeatmapCellStatus = status === 'absent' || status === 'leave' ? status : status === 'late' ? 'late' : status === 'od' ? 'od' : 'present';
  return { status: mapped, rank: STATUS_RANK[mapped] };
}