// ============================================================================
// Centralized Programme -> Department -> Year -> Shift master structure.
//
// This is the SINGLE source of truth for the academic selection cascade used
// by every portal (Admin / HOD / Faculty / Student). Do not re-declare these
// rules inside individual screens; import from here instead.
//
// Exact label names are REQUIRED and must not be changed:
//   Programme  : 'UG' | 'PG'
//   Department : 'COMPUTER SCIENCE (CS)' | 'INFORMATION & TECHNOLOGY (IT)'
//   Year       : 'I YEAR' | 'II YEAR' | 'III YEAR'
//   Shift      : 'First Shift' | 'Second Shift'
//
// Master rules (IT Technical Program):
//   Programme must be selected first.
//   UG  -> Department: COMPUTER SCIENCE (CS) ONLY
//          Year: I/II/III YEAR        Shift: First Shift + Second Shift
//   PG  -> Department: CS + IT
//          Year: I/II YEAR ONLY (no III YEAR)
//          Shift: First Shift ONLY  (Second Shift is INVALID for PG)
//
// Invalid combos (block on frontend AND backend):
//   UG   + INFORMATION & TECHNOLOGY (IT)
//   PG   + III YEAR
//   PG   + Second Shift
// ============================================================================

export type Programme = 'UG' | 'PG';
export type DepartmentId = 'dept-cs' | 'dept-it';
export type Shift = 'First Shift' | 'Second Shift';

export const PROGRAMMES: Programme[] = ['UG', 'PG'];

export const PROGRAMME_LABELS: Record<Programme, string> = {
  UG: 'UG',
  PG: 'PG'
};

// ---------- Departments ----------
export interface ProgrammeDepartmentOption {
  id: string;
  code: string;
  name: string;
}

// Exact display names required by the master structure.
export const DEPARTMENTS: ProgrammeDepartmentOption[] = [
  { id: 'dept-cs', code: 'CS', name: 'COMPUTER SCIENCE (CS)' },
  { id: 'dept-it', code: 'IT', name: 'INFORMATION & TECHNOLOGY (IT)' }
];

export const departmentNameOf = (id: string): string =>
  DEPARTMENTS.find((d) => d.id === id)?.name || id;

// ---------- Years ----------
export const UG_YEARS = ['I YEAR', 'II YEAR', 'III YEAR'] as const;
export const PG_YEARS = ['I YEAR', 'II YEAR'] as const;

// ---------- Shifts ----------
export const YEAR_SHIFTS: Record<Programme, Shift[]> = {
  UG: ['First Shift', 'Second Shift'],
  PG: ['First Shift']
};

// ---------- Cascade rules ----------
// Which departments are available for a given programme.
export const DEPARTMENTS_FOR_PROGRAMME: Record<Programme, ProgrammeDepartmentOption[]> = {
  UG: [DEPARTMENTS[0]], // CS only
  PG: DEPARTMENTS       // CS + IT
};

export const departmentsForProgramme = (programme: Programme): ProgrammeDepartmentOption[] =>
  DEPARTMENTS_FOR_PROGRAMME[programme] || [];

// Which years are available for a given programme.
export const YEARS_FOR_PROGRAMME: Record<Programme, readonly string[]> = {
  UG: UG_YEARS,
  PG: PG_YEARS
};

export const yearsForProgramme = (programme: Programme): readonly string[] =>
  YEARS_FOR_PROGRAMME[programme] || [];

// Which shifts are available for a given programme.
export const shiftsForProgramme = (programme: Programme): Shift[] => YEAR_SHIFTS[programme] || [];

// ---------- Validation ----------
export interface MasterSelection {
  programme?: Programme;
  departmentId?: string;
  year?: string;
  shift?: Shift;
}

// Returns a human-readable error message for an invalid selection, or null if valid.
export function validateMasterSelection(sel: MasterSelection): string | null {
  if (!sel.programme) return null;

  if (sel.departmentId) {
    const allowed = departmentsForProgramme(sel.programme);
    if (!allowed.some((d) => d.id === sel.departmentId)) {
      return `${sel.programme} does not allow the selected department.`;
    }
  }

  if (sel.year) {
    const allowed = yearsForProgramme(sel.programme);
    if (!allowed.includes(sel.year)) {
      return `${sel.programme} does not allow ${sel.year} (${sel.programme} years: ${allowed.join(', ')}).`;
    }
  }

  if (sel.shift) {
    const allowed = shiftsForProgramme(sel.programme);
    if (!allowed.includes(sel.shift)) {
      return `${sel.programme} allows ${allowed.join(' / ')} only (${sel.shift} is not valid for ${sel.programme}).`;
    }
  }

  return null;
}

// Convenience: is this a complete, valid selection?
export function isValidMasterSelection(sel: MasterSelection): boolean {
  return !!sel.programme && !!sel.departmentId && !!sel.year && !!sel.shift && validateMasterSelection(sel) === null;
}

// ---------- Semester mapping (backwards compatibility) ----------
// The legacy data model stores a numeric semester (1..10). This maps a
// semester onto the master structure so we can derive labels for legacy records
// that predate the explicit programme/year/shift fields.
//
//   UG: year I = sem 1-2, II = sem 3-4, III = sem 5-6
//   PG: year I = sem 7-8, II = sem 9-10
//   Shift inferred from semester parity (odd = First, even = Second).
export const programmeForSemester = (sem: number): Programme => (sem <= 6 ? 'UG' : 'PG');

export const yearForSemester = (programme: Programme, sem: number): string => {
  if (programme === 'UG') {
    if (sem <= 2) return 'I YEAR';
    if (sem <= 4) return 'II YEAR';
    return 'III YEAR';
  }
  return sem <= 8 ? 'I YEAR' : 'II YEAR';
};

export const shiftForSemester = (programme: Programme, sem: number): Shift => {
  if (programme === 'PG') return 'First Shift';
  return sem % 2 === 0 ? 'Second Shift' : 'First Shift';
};

export interface DerivedMasterStructure {
  programme: Programme;
  year: string;
  shift: Shift;
}

// Derive the full master structure for a legacy semester.
export const masterStructureForSemester = (sem: number): DerivedMasterStructure => {
  const programme = programmeForSemester(sem);
  return {
    programme,
    year: yearForSemester(programme, sem),
    shift: shiftForSemester(programme, sem)
  };
};

// Reverse map: for a valid selection, return the semester(s) it represents.
// Returns an empty array for invalid selections.
export const semestersForSelection = (sel: MasterSelection): number[] => {
  if (!sel.programme || !sel.departmentId || !sel.year) return [];
  if (validateMasterSelection({ ...sel, shift: undefined })) return [];

  const isPg = sel.programme === 'PG';
  const yearIdx = yearsForProgramme(sel.programme).indexOf(sel.year);
  const base = isPg ? 6 : 0;
  const sems = [base + yearIdx * 2 + 1, base + yearIdx * 2 + 2];

  if (sel.shift) {
    // Second Shift only covers even semesters; First Shift odd semesters.
    return sems.filter((s) => {
      if (sel.shift === 'Second Shift') return s % 2 === 0;
      return s % 2 === 1;
    });
  }
  return sems;
};

// Full human-readable summary of a selection, e.g.
// "UG · COMPUTER SCIENCE (CS) · II YEAR · First Shift"
export function masterSelectionLabel(sel: MasterSelection): string {
  const parts = [
    sel.programme,
    sel.departmentId ? departmentNameOf(sel.departmentId) : '',
    sel.year,
    sel.shift
  ].filter(Boolean);
  return parts.join(' · ');
}
