import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../common/BackButton';
import { Modal } from '../common/Modal';
import { StudentDetails as StudentDetailsType, PreviousSchoolRecord, StudentScholarship } from '../../types';
import { mockStudentDetails } from '../../mock/studentDetails';
import {
  Search,
  X,
  FileUp,
  Upload,
  AlertTriangle,
  CheckCircle2,
  IdCard,
  GraduationCap,
  Phone,
  MapPin,
  Users,
  Landmark,
  School,
  Award,
  Accessibility,
  Eye
} from 'lucide-react';

// ---- Small presentational helpers (light, readable typography) ----

const Field: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">{label}</p>
    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 break-words">{value || '—'}</p>
  </div>
);

const SectionCard: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, children, right }) => (
  <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        <span className="p-2 bg-[#1E40AF]/10 dark:bg-[#2563EB]/40 rounded-xl shrink-0">
          <Icon className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
    {children}
  </div>
);

const ValueGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">{children}</div>
);

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const active = status.toLowerCase() === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
        active
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
      }`}
    >
      {active ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />}
      {status}
    </span>
  );
};

// ---- CSV parsing (frontend-only) ----

const HEADER_SYNONYMS: Record<string, string> = {
  name: 'name',
  studentname: 'name',
  studentnameenglish: 'name',
  'student name': 'name',
  regno: 'regNo',
  reg: 'regNo',
  registrationno: 'regNo',
  'registration number': 'regNo',
  'reg no': 'regNo',
  rollno: 'rollNo',
  roll: 'rollNo',
  'roll no': 'rollNo',
  'roll number': 'rollNo',
  mobilenumber: 'mobileNumber',
  phone: 'mobileNumber',
  mobile: 'mobileNumber',
  contact: 'mobileNumber',
  email: 'emailId',
  emailid: 'emailId',
  semester: 'semester',
  course: 'course',
  program: 'course',
  coursetype: 'courseType',
  type: 'courseType',
  department: 'department',
  dept: 'department',
  shift: 'shift',
  yearofstudy: 'yearOfStudy',
  year: 'yearOfStudy'
};

interface ParseResult {
  rows: Array<Partial<StudentDetailsType> & { name: string; regNo: string }>;
  errors: string[];
  importedCount: number;
  skippedCount: number;
}

const cleanCell = (v: string | undefined): string => (v ?? '').trim();

const parseStudentCSV = (text: string): ParseResult => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], errors: ['The file is empty.'], importedCount: 0, skippedCount: 0 };

  const cells = (line: string): string[] => {
    // Simple CSV split (handles quoted fields).
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQ = false;
          }
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQ = true;
      } else if (ch === ',') {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  };

  const isHeader = (row: string[]): boolean =>
    row.some((c) => HEADER_SYNONYMS[c.trim().toLowerCase().replace(/\s+/g, '')] !== undefined);

  const headerNames = cells(lines[0]).map((c) => c.trim().toLowerCase().replace(/\s+/g, ''));
  const hasHeader = isHeader(cells(lines[0]));
  const body = hasHeader ? lines.slice(1) : lines;

  const colIndex = (key: string): number => {
    if (!hasHeader) return -1;
    return headerNames.findIndex((h) => HEADER_SYNONYMS[h] === key);
  };

  const rows: ParseResult['rows'] = [];
  const errors: string[] = [];
  const seenRegNos = new Set<string>();

  body.forEach((line, idx) => {
    const row = cells(line);
    const rowNo = idx + (hasHeader ? 2 : 1);

    let name = '';
    let regNo = '';
    if (hasHeader) {
      const gi = (k: string) => {
        const i = colIndex(k);
        return i >= 0 ? cleanCell(row[i]) : '';
      };
      name = gi('name');
      regNo = gi('regNo');
      const rollNo = gi('rollNo');
      const semester = gi('semester');
      const semesterNum = semester === '' ? 4 : Number(semester);

      if (!name || !regNo) {
        errors.push(`Row ${rowNo}: missing Student Name or Registration Number — skipped.`);
        return;
      }
      if (seenRegNos.has(regNo.toLowerCase())) {
        errors.push(`Row ${rowNo}: duplicate Registration Number "${regNo}" — skipped.`);
        return;
      }
      if (semester !== '' && Number.isNaN(semesterNum)) {
        errors.push(`Row ${rowNo}: Semester "${semester}" is not a number — skipped.`);
        return;
      }
      seenRegNos.add(regNo.toLowerCase());
      rows.push({
        name,
        studentNameEnglish: name,
        regNo,
        rollNo,
        semester: semesterNum,
        mobileNumber: gi('mobileNumber'),
        emailId: gi('emailId'),
        course: gi('course'),
        courseType: (gi('courseType') || 'UG').toUpperCase(),
        department: gi('department'),
        shift: gi('shift'),
        yearOfStudy: gi('yearOfStudy')
      });
    } else {
      // Positional: Name, RegNo, RollNo, Phone, Email, Semester
      name = cleanCell(row[0]);
      regNo = cleanCell(row[1]);
      const rollNo = cleanCell(row[2]);
      const mobileNumber = cleanCell(row[3]);
      const emailId = cleanCell(row[4]);
      const semester = cleanCell(row[5]);
      const semesterNum = semester === '' ? 4 : Number(semester);

      if (!name || !regNo) {
        errors.push(`Row ${rowNo}: missing Student Name or Registration Number — skipped.`);
        return;
      }
      if (seenRegNos.has(regNo.toLowerCase())) {
        errors.push(`Row ${rowNo}: duplicate Registration Number "${regNo}" — skipped.`);
        return;
      }
      if (semester !== '' && Number.isNaN(semesterNum)) {
        errors.push(`Row ${rowNo}: Semester "${semester}" is not a number — skipped.`);
        return;
      }
      seenRegNos.add(regNo.toLowerCase());
      rows.push({
        name,
        studentNameEnglish: name,
        regNo,
        rollNo,
        semester: semesterNum,
        mobileNumber,
        emailId
      });
    }
  });

  return { rows, errors, importedCount: rows.length, skippedCount: errors.length };
};

const IMPORT_FALLBACKS: Partial<StudentDetailsType> = {
  collegeName: 'Sri Venkateswara College of Engineering & Technology, Tirunelveli',
  collegeCode: 'SVCE-TN-4217',
  collegeDistrict: 'Tirunelveli',
  collegeRegion: 'South Zone',
  streamType: 'Regular',
  mediumOfInstruction: 'English',
  modeOfStudy: 'Full Time',
  nationality: 'Indian',
  contactState: 'Tamil Nadu',
  commState: 'Tamil Nadu',
  contactCountry: 'India',
  commCountry: 'India',
  courseType: 'UG',
  course: 'B.Sc Computer Science',
  department: 'Computer Science',
  branch: 'Computer Science',
  departmentId: 'dept-cs',
  shift: 'Morning',
  currentStudentStatus: 'Active',
  differentlyAbled: 'No',
  salutation: 'Mr.',
  accountType: 'Savings',
  aadhaarSeedingStatus: 'Seeded',
  accountActiveStatus: 'Active',
  active: true,
  previousSchools: [],
  scholarships: []
};

// ---- Module ----

export const StudentDetails: React.FC = () => {
  const { addToast } = useApp();

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [imported, setImported] = useState<StudentDetailsType[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const allRecords = useMemo(() => [...mockStudentDetails, ...imported], [imported]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const digits = q.replace(/[^0-9]/g, '');
    return allRecords.filter((s) => {
      const hay = [s.name, s.studentNameEnglish, s.regNo, s.rollNo, s.mobileNumber, s.parentMobileNumber, s.emailId]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (hay.includes(q)) return true;
      if (digits && [s.mobileNumber, s.parentMobileNumber, s.regNo, s.rollNo].filter(Boolean).join(' ').replace(/[^0-9]/g, '').includes(digits)) {
        return true;
      }
      return false;
    });
  }, [query, allRecords]);

  // Auto-open the details when exactly one student matches.
  useEffect(() => {
    if (query.trim()) {
      if (matches.length === 1) {
        setSelectedId(matches[0].id);
      } else if (selectedId && !matches.some((m) => m.id === selectedId)) {
        setSelectedId(undefined);
      }
    } else {
      setSelectedId(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, matches]);

  useEffect(() => {
    if (selectedId && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedId]);

  const selected = selectedId ? allRecords.find((r) => r.id === selectedId) : undefined;

  const handleFile = (file: File) => {
    setFileName(file.name);
    setImportErrors([]);
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseStudentCSV(String(reader.result || ''));
      setImportErrors(result.errors);
      if (result.rows.length === 0) {
        addToast('Import Failed', 'No valid student rows found in the CSV.', 'danger');
        return;
      }
      const finalized: StudentDetailsType[] = result.rows.map((row, i) => ({
        ...(IMPORT_FALLBACKS as StudentDetailsType),
        ...row,
        id: row.regNo || `imported-${Date.now()}-${i}`,
        name: row.name,
        email: row.emailId,
        studentNameEnglish: row.name
      }));
      const existing = new Set(imported.map((r) => r.regNo.toLowerCase()));
      const fresh = finalized.filter((r) => !existing.has(r.regNo.toLowerCase()));
      const dupMsgs = finalized
        .filter((r) => existing.has(r.regNo.toLowerCase()))
        .map((r) => `Duplicate Registration Number "${r.regNo}" already imported.`);
      setImportErrors((prevErr) => (dupMsgs.length ? [...prevErr, ...dupMsgs] : prevErr));
      setImported((prev) => {
        const prevSet = new Set(prev.map((r) => r.regNo.toLowerCase()));
        return [...prev, ...fresh.filter((r) => !prevSet.has(r.regNo.toLowerCase()))];
      });
      addToast('CSV Import Complete', `Imported ${fresh.length} student details record(s).`, 'success');
    };
    reader.onerror = () => addToast('Read Failed', 'Could not read the selected CSV file.', 'danger');
    reader.readAsText(file);
  };

  const handleImportFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const hasSearch = query.trim().length > 0;
  const showList = hasSearch ? matches : allRecords;

  return (
    <div className="space-y-6 text-xs">
      <BackButton />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <IdCard className="w-5 h-5 text-[#1E40AF] dark:text-[#3B82F6]" /> Student Details
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            View-only UMIS record · {allRecords.length} student(s) on record
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-[#1E40AF]/10 dark:bg-[#2563EB]/40 text-[#1E40AF] dark:text-[#3B82F6] text-[10px] font-bold uppercase tracking-wider rounded-full border border-[#1E40AF]/20 dark:border-[#3B82F6]/40 inline-flex items-center gap-1">
            <Eye className="w-3 h-3" /> View Only
          </span>
          <button
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-[#161B33] dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <FileUp className="w-4 h-4" />
            Import CSV
          </button>
        </div>
      </div>

      {/* Unified Search */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setQuery((e.target as HTMLInputElement).value);
              }}
              placeholder="Search by Name, Registration No, Roll No or Phone Number"
              className="w-full pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-[#232326] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E40AF] placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setQuery(query)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-[#1E40AF] dark:bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#2563EB] rounded-xl transition-colors shrink-0"
          >
            Enter
          </button>
        </div>
        {hasSearch && matches.length > 0 && (
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            {matches.length} matching record(s)
            {matches.length > 1 ? ' — select a student below.' : ' — details shown below.'}
          </p>
        )}
        {hasSearch && matches.length === 0 && (
          <p className="text-[11px] font-medium text-rose-500 dark:text-rose-400 inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> No student matches the search value.
          </p>
        )}
      </div>

      {/* Student list / results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {showList.map((s) => {
          const isActive = selectedId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`text-left bg-white dark:bg-[#0A0A0A] border rounded-2xl p-3.5 shadow-sm transition-all ${
                isActive
                  ? 'border-[#1E40AF] dark:border-[#3B82F6] ring-2 ring-[#1E40AF]/20'
                  : 'border-zinc-200/80 dark:border-[#232326] hover:border-[#1E40AF]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {s.avatar ? (
                  <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-700" />
                ) : (
                  <span className="w-10 h-10 rounded-xl bg-[#1E40AF]/10 dark:bg-[#2563EB]/40 flex items-center justify-center text-[#1E40AF] dark:text-[#3B82F6] text-sm font-bold">
                    {s.name.charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{s.name}</p>
                  <p className="text-[11px] font-mono text-[#1E40AF] dark:text-[#3B82F6] font-semibold">{s.regNo}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                <span>Roll: {s.rollNo || '—'}</span>
                <span>{s.department}</span>
                <span>Sem {s.semester}</span>
                <span>{s.shift}</span>
              </div>
            </button>
          );
        })}
        {showList.length === 0 && !hasSearch && (
          <p className="col-span-full text-center text-xs text-zinc-400 dark:text-zinc-500 py-6">
            No student records to show.
          </p>
        )}
      </div>

      {/* Complete Student Record */}
      {selected && (
        <div ref={detailsRef} className="space-y-4 scroll-mt-24">
          {/* Profile header */}
          <div className="bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#1E40AF]/40 dark:border-[#3B82F6]/40 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
            {selected.avatar ? (
              <img src={selected.avatar} alt={selected.name} className="w-16 h-16 rounded-2xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-700" />
            ) : (
              <span className="w-16 h-16 rounded-2xl bg-[#1E40AF]/10 dark:bg-[#2563EB]/40 flex items-center justify-center text-[#1E40AF] dark:text-[#3B82F6] text-2xl font-bold">
                {selected.name.charAt(0)}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">{selected.name}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                <span className="font-mono text-[#1E40AF] dark:text-[#3B82F6] font-semibold">{selected.regNo}</span>
                <span>Roll {selected.rollNo || '—'}</span>
                {selected.studentNameTamil && <span className="font-medium">{selected.studentNameTamil}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1E40AF]/10 dark:bg-[#2563EB]/40 text-[#1E40AF] dark:text-[#3B82F6] border border-[#1E40AF]/20 dark:border-[#3B82F6]/40">
                  {selected.courseType} · {selected.course}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  Sem {selected.semester} · {selected.shift}
                </span>
                <StatusPill status={selected.currentStudentStatus || 'Active'} />
              </div>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium sm:text-right">
              <p>{selected.collegeName}</p>
              <p className="font-mono text-[10px] mt-0.5">{selected.collegeCode}</p>
            </div>
          </div>

          {/* 1. General / Identity */}
          <SectionCard icon={IdCard} title="General / Identity" subtitle="Authentication and demographic profile">
            <ValueGrid>
              <Field label="Student Name (Tamil)" value={selected.studentNameTamil} />
              <Field label="Student Name (English)" value={selected.studentNameEnglish} />
              <Field label="Name as per Certificate" value={selected.nameAsPerCertificate} />
              <Field label="Name as per Aadhaar" value={selected.nameAsPerAadhaar} />
              <Field label="Salutation" value={selected.salutation} />
              <Field label="Date of Birth" value={selected.dateOfBirth} />
              <Field label="Gender" value={selected.gender} />
              <Field label="Blood Group" value={selected.bloodGroup} />
              <Field label="Nationality" value={selected.nationality} />
              <Field label="Religion" value={selected.religion} />
              <Field label="Community" value={selected.community} />
              <Field label="Caste" value={selected.caste} />
              <Field label="Community Certificate Number" value={selected.communityCertificateNumber} />
              <Field label="Aadhaar Number" value={selected.aadhaarNumber} />
              <Field label="EMIS ID" value={selected.emisId} />
              <Field label="First Graduate in Family" value={selected.firstGraduateInFamily} />
              <Field label="First Graduate Certificate Number" value={selected.firstGraduateCertificateNumber} />
              <Field label="Special Admission / Quota" value={selected.specialAdmission} />
              <Field label="Differently Abled" value={selected.differentlyAbled} />
              <Field label="UDID Number" value={selected.differentlyAbled === 'Yes' ? selected.udidNumber : undefined} />
              <Field label="Disability Type" value={selected.differentlyAbled === 'Yes' ? selected.disabilityType : undefined} />
              <Field label="Disability Percentage" value={selected.differentlyAbled === 'Yes' ? selected.disabilityPercentage : undefined} />
            </ValueGrid>
          </SectionCard>

          {/* 2. College / Academic */}
          <SectionCard icon={GraduationCap} title="College / Academic" subtitle="Enrolment and academic cohort">
            <ValueGrid>
              <Field label="College Name" value={selected.collegeName} />
              <Field label="College Code / UMIS Code" value={selected.collegeCode} />
              <Field label="College District" value={selected.collegeDistrict} />
              <Field label="College Region" value={selected.collegeRegion} />
              <Field label="Academic Year of Joining" value={selected.academicYearOfJoining} />
              <Field label="Stream Type" value={selected.streamType} />
              <Field label="Course Type (UG/PG)" value={selected.courseType} />
              <Field label="Course" value={selected.course} />
              <Field label="Department" value={selected.department} />
              <Field label="Branch / Specialization" value={selected.branch} />
              <Field label="Medium of Instruction" value={selected.mediumOfInstruction} />
              <Field label="Mode of Study" value={selected.modeOfStudy} />
              <Field label="Date of Admission" value={selected.dateOfAdmission} />
              <Field label="Type of Admission" value={selected.typeOfAdmission} />
              <Field label="Counselling / Admission Number" value={selected.counsellingNumber} />
              <Field label="Registration Number" value={selected.regNo} />
              <Field label="Roll Number" value={selected.rollNo} />
              <Field label="Lateral Entry" value={selected.lateralEntry} />
              <Field label="Hostel Status" value={selected.hostelStatus} />
              <Field label="Current Student Status" value={selected.currentStudentStatus} />
              <Field label="Year of Study" value={selected.yearOfStudy} />
              <Field label="Semester" value={String(selected.semester)} />
              <Field label="Shift" value={selected.shift} />
            </ValueGrid>
            <p className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
              Academic limits: UG = Semester 1–6 · PG/MCA = Semester 1–4 (no extra semesters).
            </p>
          </SectionCard>

          {/* 3. Contact Information */}
          <SectionCard icon={Phone} title="Contact Information" subtitle="Reachable mobile and correspondence basics">
            <ValueGrid>
              <Field label="Mobile Number" value={selected.mobileNumber} />
              <Field label="Email ID" value={selected.emailId} />
              <Field label="Country" value={selected.contactCountry} />
              <Field label="State / Union Territory" value={selected.contactState} />
              <Field label="Location Type" value={selected.contactLocationType} />
              <Field label="District" value={selected.contactDistrict} />
              <Field label="Taluk" value={selected.contactTaluk} />
              <Field label="Village" value={selected.contactVillage} />
              <Field label="Block" value={selected.contactBlock} />
              <Field label="Village Panchayat" value={selected.contactPanchayat} />
              <Field label="Pincode" value={selected.contactPincode} />
              <Field label="Postal Address" value={selected.contactPostalAddress} />
            </ValueGrid>
          </SectionCard>

          {/* 4. Communication Address */}
          <SectionCard icon={MapPin} title="Communication Address" subtitle="Address used for official correspondence">
            <ValueGrid>
              <Field label="Country" value={selected.commCountry} />
              <Field label="State / Union Territory" value={selected.commState} />
              <Field label="Location Type" value={selected.commLocationType} />
              <Field label="District" value={selected.commDistrict} />
              <Field label="Taluk" value={selected.commTaluk} />
              <Field label="Village" value={selected.commVillage} />
              <Field label="Block" value={selected.commBlock} />
              <Field label="Village Panchayat" value={selected.commPanchayat} />
              <Field label="Pincode" value={selected.commPincode} />
              <Field label="Postal Address" value={selected.commPostalAddress} />
            </ValueGrid>
          </SectionCard>

          {/* 5. Family Information */}
          <SectionCard icon={Users} title="Family Information" subtitle="Family background and guardian details">
            <ValueGrid>
              <Field label="Orphan Category" value={selected.orphanCategory} />
              <Field label="Father's Name" value={selected.fatherName} />
              <Field label="Father's Occupation / Sector" value={selected.fatherOccupation} />
              <Field label="Mother's Name" value={selected.motherName} />
              <Field label="Mother's Occupation / Sector" value={selected.motherOccupation} />
              <Field label="Guardian / Spouse Name" value={selected.guardianSpouseName} />
              <Field label="Annual Family Income" value={selected.annualFamilyIncome} />
              <Field label="Income Certificate Number" value={selected.incomeCertificateNumber} />
              <Field label="Parent / Spouse / Guardian Mobile" value={selected.parentMobileNumber} />
            </ValueGrid>
          </SectionCard>

          {/* 6. Bank Information */}
          <SectionCard icon={Landmark} title="Bank Information" subtitle="Scholarship disbursement account">
            <ValueGrid>
              <Field label="Account Number" value={selected.bankAccountNumber} />
              <Field label="Bank Mobile Number" value={selected.bankMobileNumber} />
              <Field label="Bank Name" value={selected.bankName} />
              <Field label="Aadhaar Seeding Status" value={selected.aadhaarSeedingStatus} />
              <Field label="Account Active Status" value={selected.accountActiveStatus} />
              <Field label="IFSC Code" value={selected.ifscCode} />
              <Field label="Bank Branch" value={selected.bankBranch} />
              <Field label="City" value={selected.bankCity} />
              <Field label="Account Type" value={selected.accountType} />
            </ValueGrid>
          </SectionCard>

          {/* 7. Previous School Details */}
          <SectionCard icon={School} title="Previous School Details" subtitle="Schooling history for Classes 6–12">
            {(selected.previousSchools?.length ?? 0) > 0 ? (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5 pl-1">Class</th>
                      <th className="p-2.5">District</th>
                      <th className="p-2.5">School Name</th>
                      <th className="p-2.5 pr-1">School Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {selected.previousSchools!.map((p: PreviousSchoolRecord, i: number) => (
                      <tr key={i} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="p-2.5 pl-1 font-mono font-semibold text-zinc-700 dark:text-zinc-300">Class {p.className}</td>
                        <td className="p-2.5 font-medium text-zinc-700 dark:text-zinc-300">{p.district}</td>
                        <td className="p-2.5 font-medium text-zinc-700 dark:text-zinc-300">{p.schoolName}</td>
                        <td className="p-2.5 pr-1">{p.schoolType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">No previous school records available.</p>
            )}
          </SectionCard>

          {/* 8. Disability Information (only when differently abled) */}
          {selected.differentlyAbled === 'Yes' && (
            <SectionCard icon={Accessibility} title="Disability Information" subtitle="Differently-abled support details">
              <ValueGrid>
                <Field label="UDID Number" value={selected.udidNumber} />
                <Field label="Disability Type" value={selected.disabilityType} />
                <Field label="Disability Percentage" value={selected.disabilityPercentage} />
              </ValueGrid>
            </SectionCard>
          )}

          {/* 9. Scholarship Information */}
          <SectionCard icon={Award} title="Scholarship Information" subtitle="Awards and support (view only)">
            {(selected.scholarships?.length ?? 0) > 0 ? (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-2.5 pl-1">Scholarship Name</th>
                      <th className="p-2.5">Scholarship Availability</th>
                      <th className="p-2.5 pr-1">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {(selected.scholarships as StudentScholarship[]).map((sch, i) => (
                      <tr key={i} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="p-2.5 pl-1 font-semibold text-zinc-700 dark:text-zinc-300">{sch.name}</td>
                        <td className="p-2.5 font-medium text-zinc-700 dark:text-zinc-300">{sch.availability}</td>
                        <td className="p-2.5 pr-1">
                          <StatusPill status={sch.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">No scholarship records available.</p>
            )}
          </SectionCard>
        </div>
      )}
      {hasSearch && matches.length === 1 && !selected && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Select a student from the list above to view the full record.</p>
      )}

      {/* CSV Import Modal */}
      <Modal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Student Details CSV"
        subtitle="Frontend-only import — records become searchable immediately."
        maxWidth="xl"
      >
        <div className="space-y-4">
          <label
            htmlFor="student-csv-input"
            className="flex flex-col items-center justify-center gap-2 p-6 text-center border border-dashed border-zinc-300 dark:border-[#232326] rounded-2xl cursor-pointer hover:border-[#1E40AF] dark:hover:border-[#3B82F6] transition-colors"
          >
            <Upload className="w-7 h-7 text-[#1E40AF] dark:text-[#3B82F6]" />
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Choose a CSV file</span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-xs leading-relaxed">
              Supported columns: Name, RegNo, RollNo, MobileNumber, Email, Semester, CourseType, Course, Department, Shift, YearOfStudy
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {fileName || 'Prefer a header row; positional "Name, RegNo, RollNo, Phone, Email, Semester" is also accepted.'}
            </span>
          </label>
          <input
            ref={fileInputRef}
            id="student-csv-input"
            type="file"
            accept=".csv,text/csv,.txt"
            className="hidden"
            onChange={handleImportFiles}
          />

          {(importErrors.length > 0 || imported.length > 0) && (
            <div className="space-y-2">
              {importErrors.length > 0 && (
                <div className="p-3 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Validation issues
                  </p>
                  <ul className="text-[11px] text-rose-600 dark:text-rose-300 space-y-0.5">
                    {importErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {imported.length > 0 && (
                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl">
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {imported.length} imported student(s) are now searchable.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setImportOpen(false)}
              className="px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-[#161B33] dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              <FileUp className="w-4 h-4" />
              Select CSV File
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};