export type Programme = 'UG' | 'MSc';

// Only two departments across the whole system: Computer Science and Information and Technology (IT).
export const ALLOWED_DEPARTMENT_IDS = ['dept-cs', 'dept-it'] as const;

// Allowed departments shown in every department-selection UI (id -> db code + display name).
export const ALLOWED_DEPARTMENTS: { id: string; code: string; name: string }[] = [
  { id: 'dept-cs', code: 'CS', name: 'Computer Science' },
  { id: 'dept-it', code: 'IT', name: 'Information and Technology (IT)' }
];

// Student Portal alone keeps its existing programme options, so nothing here forces a strict list on it.
// For all other portals (Admin / HOD / Faculty):
//   Computer Science -> UG + MSc
//   Information and Technology (IT) -> MSc ONLY
export const PROGRAMMES_FOR_DEPARTMENT: Record<string, Programme[]> = {
  'dept-cs': ['UG', 'MSc'],
  'dept-it': ['MSc']
};

export const departmentProgrammes = (departmentId: string): Programme[] =>
  PROGRAMMES_FOR_DEPARTMENT[departmentId] || (departmentId === 'dept-cs' ? ['UG'] : []);

// UG -> 3 years (1st [1,2], 2nd [3,4], 3rd [5,6]); MSc -> 2 years (1st [7,8], 2nd [9,10]).
export const YEAR_SEMESTERS: Record<Programme, Record<string, [number, number]>> = {
  UG: {
    'First Year': [1, 2],
    'Second Year': [3, 4],
    'Third Year': [5, 6]
  },
  MSc: {
    'First Year': [7, 8],
    'Second Year': [9, 10]
  }
};

export const YEAR_OPTIONS: Record<Programme, string[]> = {
  UG: ['First Year', 'Second Year', 'Third Year'],
  MSc: ['First Year', 'Second Year']
};

// Programme determined from a student/timetable semester using the shared structure.
export const programmeForSemester = (sem: number): Programme => (sem <= 6 ? 'UG' : 'MSc');

// Academic Year label, e.g. "UG 1st Year", "UG 3rd Year", "MSc 1st Year", "MSc 2nd Year".
export const academicYearLabel = (sem: number): string => {
  if (sem <= 6) {
    if (sem <= 2) return 'UG 1st Year';
    if (sem <= 4) return 'UG 2nd Year';
    return 'UG 3rd Year';
  }
  return sem <= 8 ? 'MSc 1st Year' : 'MSc 2nd Year';
};

// Full group label, e.g. "Computer Science – UG 1st Year".
export const fullAcademicGroupLabel = (departmentName: string, sem: number): string =>
  `${departmentName} – ${academicYearLabel(sem)}`;
