// Backwards-compatible academic-structure helpers.
//
// The canonical Programme -> Department -> Year -> Shift master structure now
// lives in ./programmeStructure. This module keeps a thin compatibility layer
// for callers that relied on the old semester + "UG/MSc" naming, and maps those
// onto the master structure ('UG'/'PG' + 'I/II/III YEAR' + shift).
import {
  Programme as MasterProgramme,
  DEPARTMENTS,
  programmeForSemester as masterProgrammeForSemester,
  yearForSemester,
  shiftForSemester
} from './programmeStructure';

// Re-export master Programme type (now 'UG' | 'PG').
export type Programme = MasterProgramme;

// Only two departments across the whole system: Computer Science and Information and Technology (IT).
export const ALLOWED_DEPARTMENT_IDS = ['dept-cs', 'dept-it'] as const;

// Allowed departments shown in every department-selection UI (id -> db code + display name).
export const ALLOWED_DEPARTMENTS: { id: string; code: string; name: string }[] = DEPARTMENTS.map((d) => ({
  id: d.id,
  code: d.code,
  name: d.name
}));

// For all non-student portals: CS -> UG + PG; IT -> PG ONLY.
export const PROGRAMMES_FOR_DEPARTMENT: Record<string, Programme[]> = {
  'dept-cs': ['UG', 'PG'],
  'dept-it': ['PG']
};

export const departmentProgrammes = (departmentId: string): Programme[] =>
  PROGRAMMES_FOR_DEPARTMENT[departmentId] || (departmentId === 'dept-cs' ? ['UG'] : []);

// Legacy numeric-semester -> programme mapping (sem <= 6 : UG, else PG).
export const programmeForSemester = masterProgrammeForSemester;

// Academic Year label, e.g. "UG 1st Year", "PG 1st Year".
export function academicYearLabel(programmeOrSem: Programme | number, sem?: number): string {
  let programme: Programme;
  let s: number;
  if (typeof programmeOrSem === 'number') {
    programme = masterProgrammeForSemester(programmeOrSem);
    s = programmeOrSem;
  } else {
    programme = programmeOrSem;
    s = sem ?? 1;
  }
  const year = yearForSemester(programme, s);
  const ord = { 'I YEAR': '1st', 'II YEAR': '2nd', 'III YEAR': '3rd' }[year] || '';
  return `${programme} ${ord} Year`;
}

// Full group label, e.g. "Computer Science – UG 1st Year".
export function fullAcademicGroupLabel(departmentName: string, programOrSem: Programme | number): string {
  return `${departmentName} – ${academicYearLabel(programOrSem)}`;
}

// Convenience: full master structure for a legacy semester.
export function masterStructureForSemester(sem: number) {
  return {
    programme: programmeForSemester(sem),
    year: yearForSemester(programmeForSemester(sem), sem),
    shift: shiftForSemester(programmeForSemester(sem), sem)
  };
}
