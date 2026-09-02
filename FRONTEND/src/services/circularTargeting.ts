import { AppNotification, Circular, Student, User } from '../types';

// True for any postgraduate course label. At this college UG is the only
// undergraduate programme; everything else (M.Sc / MCS / M.Sc IT / MSc IT / ...) is PG.
export function isPgCourse(course?: string): boolean {
  if (!course) return false;
  const c = course.toLowerCase();
  return c !== 'ug' && c !== 'all' && c !== '';
}

// Year → actual semester batches. UG spans semesters 1-6 (First/Second/Third Year),
// PG (MSc) spans semesters 7-10 (First/Second Year).
export const YEAR_SEMESTER_MAP: Record<string, number[]> = {
  'First Year': [1, 2],
  'Second Year': [3, 4],
  'Third Year': [5, 6]
};

export const PG_YEAR_SEMESTER_MAP: Record<string, number[]> = {
  'First Year': [7, 8],
  'Second Year': [9, 10]
};

// Legacy one-letter year codes used by existing circular forms ('I','II','III').
const LEGACY_YEAR_TO_SEM: Record<string, number[]> = {
  I: [1, 2],
  II: [3, 4],
  III: [5, 6]
};

// Map a course/program + year label to semester numbers, covering BOTH shifts automatically.
export function semestersForCourseYear(course?: string, year?: string): number[] | null {
  if (!year) return null;
  const pg = isPgCourse(course);

  if (year in YEAR_SEMESTER_MAP) {
    if (pg) {
      const idx = Object.keys(YEAR_SEMESTER_MAP).indexOf(year);
      return Object.keys(PG_YEAR_SEMESTER_MAP)[idx] ? PG_YEAR_SEMESTER_MAP[year in PG_YEAR_SEMESTER_MAP ? year : Object.keys(PG_YEAR_SEMESTER_MAP)[idx]] : null;
    }
    return YEAR_SEMESTER_MAP[year];
  }
  if (year in PG_YEAR_SEMESTER_MAP) {
    return pg ? PG_YEAR_SEMESTER_MAP[year] : null;
  }

  if (year.length === 1 && year in LEGACY_YEAR_TO_SEM) {
    return pg ? [Number(year) * 2 + 5, Number(year) * 2 + 6] : LEGACY_YEAR_TO_SEM[year];
  }
  return null;
}

// Does this student belong to the given year (both shifts)?
export function studentInYear(student: Student, course?: string, year?: string): boolean {
  const sems = semestersForCourseYear(course, year);
  if (!sems) return false;
  return sems.includes(student.semester);
}

// Compute the student-recipient list for a circular's targeting.
export function studentsForCircular(
  circular: Pick<Circular, 'target' | 'departmentId' | 'course' | 'year' | 'shift' | 'targetClass'>,
  students: Student[]
): Student[] {
  if (circular.target === 'all_students') {
    return students.filter((s) => s.active && (!circular.departmentId || s.departmentId === circular.departmentId));
  }

  if (circular.target === 'tutor_class') {
    return students.filter(
      (s) =>
        s.active &&
        s.semester === circular.targetClass?.semester &&
        s.section === circular.targetClass?.section
    );
  }

  // specific_students (and any other student target)
  let filtered = students.filter((s) => s.active);

  if (circular.departmentId) {
    filtered = filtered.filter((s) => s.departmentId === circular.departmentId);
  }

  if (circular.course && circular.course !== 'All' && circular.course !== 'UG' && circular.course !== '') {
    // Specific PG programme (M.Sc / MCS / M.Sc IT / MSc IT / ...) → PG semesters only.
    filtered = filtered.filter((s) => s.semester > 6);
  } else if (circular.course === 'UG') {
    filtered = filtered.filter((s) => s.semester <= 6);
  }

  if (circular.year && circular.year !== 'All' && circular.year !== '') {
    const sems = semestersForCourseYear(circular.course, circular.year);
    if (sems) {
      filtered = filtered.filter((s) => sems.includes(s.semester));
    }
  }

  if (circular.shift && circular.shift !== 'All' && circular.shift !== 'All Shifts' && circular.shift !== '') {
    // Best-effort shift split for students who carry no explicit shift field.
    const shiftSems = circular.shift.toLowerCase().includes('second')
      ? [2, 4, 6, 8, 10]
      : [1, 3, 5, 7, 9];
    filtered = filtered.filter((s) => shiftSems.includes(s.semester));
  }

  return filtered;
}

// Whether a published circular is visible to a given student.
export function circularVisibleToStudent(c: Circular, user: User): boolean {
  if (c.status !== 'published') return false;
  const deptId = user.departmentId || c.departmentId || 'dept-cs';
  if (c.departmentId && c.departmentId !== deptId) return false;

  if (c.target === 'all_students' || c.target === 'specific_students') {
    return studentsForCircular(c, [
      {
        id: user.id,
        regNo: user.regNo || '',
        rollNo: user.rollNo || '',
        name: user.name,
        email: user.email,
        departmentId: user.departmentId || 'dept-cs',
        departmentName: user.departmentName || 'Computer Science',
        semester: user.semester || 1,
        section: user.section || 'A',
        batch: user.batch || '',
        overallAttendancePct: 0,
        guardianName: user.guardianName || '',
        guardianPhone: user.guardianPhone || '',
        active: user.active,
        profileSubmitted: user.profileSubmitted
      }
    ]).some((s) => s.id === user.id);
  }

  if (c.target === 'tutor_class') {
    return c.targetClass?.semester === user.semester && c.targetClass?.section === user.section;
  }

  return false;
}

// Whether a notification is visible to a given user (used across Navbar / NotificationCenter).
export function notificationVisibleToUser(n: AppNotification, user: User): boolean {
  if (n.targetRole && n.targetRole !== user.role) return false;

  if (n.targetClass) {
    if (user.semester !== n.targetClass.semester || user.section !== n.targetClass.section) {
      return false;
    }
    return true;
  }

  // Extended student targeting (department / programme / semester / shift)
  if (n.targetDepartmentIds && n.targetDepartmentIds.length > 0) {
    if (!user.departmentId || !n.targetDepartmentIds.includes(user.departmentId)) return false;
  }
  if (n.targetSemesters && n.targetSemesters.length > 0) {
    if (!user.semester || !n.targetSemesters.includes(user.semester)) return false;
  }
  if (n.targetShift) {
    const shiftSems = n.targetShift.toLowerCase().includes('second') ? [2, 4, 6, 8, 10] : [1, 3, 5, 7, 9];
    if (!user.semester || !shiftSems.includes(user.semester)) return false;
  }

  return true;
}

// Short human-readable summary of a circular's audience.
export function circularRecipientLabel(c: Circular): string {
  if (c.target === 'all_faculty') return 'All Faculty';
  if (c.target === 'individual_faculty') return 'Selected Faculty';
  if (c.target === 'tutor_class') {
    return c.targetClass
      ? `Tutor Class (Sem ${c.targetClass.semester} Sec ${c.targetClass.section})`
      : 'Tutor Class';
  }
  if (c.target === 'all_students') return 'All Students · All Departments';
  const parts = [c.departmentName || '', c.course || 'UG', c.year ? `Year ${c.year}` : '', c.shift && c.shift !== 'All' && c.shift !== 'All Shifts' ? c.shift : ''].filter(
    (p) => p && p !== 'All'
  );
  if (parts.length === 0) return 'Specific Students';
  return parts.join(' · ');
}

// Human-readable recipient breakdown for a student-targeted circular
// (e.g. departments, covered academic years, and both shifts notation).
export function circularStudentSummary(c: Circular, students: Student[]): string {
  const matches = studentsForCircular(c, students);
  if (matches.length === 0) return '0 students match this selection';
  const semesters = Array.from(new Set(matches.map((s) => s.semester))).sort((a, b) => a - b);
  const sections = Array.from(new Set(matches.map((s) => s.section))).sort();
  const looksShifted = semesters.some((s) => s % 2 === 0) && semesters.some((s) => s % 2 === 1);
  const semesterLabel = semesters.map((s) => `Sem ${s}`).join(', ');
  return `${matches.length} students · ${semesterLabel} · Sections ${sections.join(', ')}${looksShifted ? ' · Both Shifts covered' : ''}`;
}