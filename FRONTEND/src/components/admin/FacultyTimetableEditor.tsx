import React, { useMemo, useState } from 'react';
import {
  TimetableSlot,
  PeriodTiming,
  Subject,
  Faculty
} from '../../types';
import {
  Programme,
  Shift,
  departmentsForProgramme,
  yearsForProgramme,
  shiftsForProgramme,
  validateMasterSelection,
  yearForSemester,
  shiftForSemester,
  programmeForSemester,
  departmentNameOf,
  semestersForSelection
} from '../../services/programmeStructure';
import { Calendar, Plus, Trash2, AlertTriangle } from 'lucide-react';

const DAYS: TimetableSlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const genKey = (): string => 'k-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 8);

interface DraftEntry {
  key: string;               // stable client-side identity ('' handled)
  id: string;                // existing slot id ('' for new)
  day: TimetableSlot['day'];
  periodNumber: number;
  programme: Programme;
  departmentId: string;
  departmentName: string;
  year: string;
  shift: Shift;
  section: string;
  semester: number;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  classroom: string;
  // mutated / created flags
  isNew?: boolean;
  isDeleted?: boolean;
}

interface FacultyTimetableEditorProps {
  faculty: Faculty;
  slots: TimetableSlot[];
  subjects: Subject[];
  periodTimes: PeriodTiming[];
  getPeriodTime: (periodNumber: number) => { start: string; end: string } | undefined;
  // Full classroom timetable (all faculty) so that classroom conflicts are
  // validated across the entire institution, not just within this faculty.
  allSlots?: TimetableSlot[];
  onSave: (changed: { saved: TimetableSlot[]; deleted: string[] }) => void;
  onCancel: () => void;
}

// Section options are derived from the selected Year's semester range and programme.
function sectionOptions(programme: Programme, year: string): string[] {
  // Each year group may have section A and B across its semesters.
  return ['A', 'B'];
}

export const FacultyTimetableEditor: React.FC<FacultyTimetableEditorProps> = ({
  faculty,
  slots,
  subjects,
  periodTimes,
  getPeriodTime,
  allSlots,
  onSave,
  onCancel
}) => {
  const [entries, setEntries] = useState<DraftEntry[]>(() =>
    slots.map((s) => {
      const programme = s.programme || programmeForSemester(s.semester);
      return {
        key: s.id,
        id: s.id,
        day: s.day,
        periodNumber: s.periodNumber,
        programme,
        departmentId: s.departmentId,
        departmentName: s.departmentName || departmentNameOf(s.departmentId),
        year: s.year || yearForSemester(programme, s.semester),
        shift: (s.shift as Shift) || shiftForSemester(programme, s.semester),
        section: s.section || 'A',
        semester: s.semester,
        subjectId: s.subjectId,
        subjectCode: s.subjectCode,
        subjectName: s.subjectName,
        classroom: s.classroom || '',
        isNew: false,
        isDeleted: false
      };
    })
  );
  const [errors, setErrors] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New entry form (master cascade).
  const [newForm, setNewForm] = useState<DraftEntry>({
    key: '',
    id: '',
    day: 'Monday',
    periodNumber: 1,
    programme: 'UG',
    departmentId: 'dept-cs',
    departmentName: 'COMPUTER SCIENCE (CS)',
    year: 'I YEAR',
    shift: 'First Shift',
    section: 'A',
    semester: 1,
    subjectId: '',
    subjectCode: '',
    subjectName: '',
    classroom: '',
    isNew: true,
    isDeleted: false
  });

  const deptOptions = useMemo(() => departmentsForProgramme(newForm.programme), [newForm.programme]);
  const yearOptions = useMemo(() => yearsForProgramme(newForm.programme), [newForm.programme]);
  const shiftOptions = useMemo(() => shiftsForProgramme(newForm.programme), [newForm.programme]);
  const subjectsForDept = useMemo(
    () => subjects.filter((s) => s.departmentId === newForm.departmentId),
    [subjects, newForm.departmentId]
  );

  const updateNewForm = (patch: Partial<DraftEntry>) => {
    setNewForm((prev) => {
      const next = { ...prev, ...patch };
      // Recompute semester from programme+year when those change.
      if (patch.programme || patch.year) {
        const sems = semestersForSelection({
          programme: next.programme,
          departmentId: next.departmentId,
          year: next.year,
          shift: next.shift
        });
        if (sems.length > 0) next.semester = sems[0];
      }
      return next;
    });
  };

  const periods = periodTimes
    .filter((t) => t.periodNumber !== null)
    .map((t) => ({ num: t.periodNumber as number, start: t.start, end: t.end }));

  const startTimeOf = (period: number) => getPeriodTime(period)?.start || '';

  const validateEntry = (e: DraftEntry): string | null => {
    const comboErr = validateMasterSelection({
      programme: e.programme,
      departmentId: e.departmentId,
      year: e.year,
      shift: e.shift
    });
    if (comboErr) return comboErr;
    if (!e.subjectId) return 'Please choose a subject.';
    if (!e.classroom.trim()) return 'Please provide a classroom for this entry.';
    // Same faculty cannot have two classes at the same Day + Period.
    const sameFac = entries.filter(
      (x) => x.key !== e.key && !x.isDeleted && x.day === e.day && x.periodNumber === e.periodNumber
    );
    if (sameFac.length > 0) {
      return `Duplicate: this faculty already has a class on ${e.day} Period ${e.periodNumber}.`;
    }
    // Same classroom cannot be assigned to two classes at same Day + Period (across all entries in this edit scope).
    const sameRoom = entries.filter(
      (x) =>
        x.key !== e.key &&
        !x.isDeleted &&
        x.classroom.trim().toLowerCase() === e.classroom.trim().toLowerCase() &&
        x.day === e.day &&
        x.periodNumber === e.periodNumber
    );
    if (sameRoom.length > 0) {
      return `Classroom "${e.classroom}" is already booked on ${e.day} Period ${e.periodNumber}.`;
    }
    // Check classroom conflict against the rest of the institution (other faculty slots).
    if (e.classroom.trim()) {
      const externalRoom = (allSlots || []).find(
        (s) =>
          s.day === e.day &&
          s.periodNumber === e.periodNumber &&
          s.classroom &&
          s.classroom.trim().toLowerCase() === e.classroom.trim().toLowerCase()
      );
      if (externalRoom) {
        return `Classroom "${e.classroom}" is already reserved on ${e.day} Period ${e.periodNumber} (${externalRoom.facultyName || 'another class'}).`;
      }
    }
    return null;
  };

  const handleAdd = () => {
    const err = validateEntry(newForm);
    if (err) {
      setErrors(err);
      return;
    }
    setEntries((prev) => [...prev, { ...newForm, key: genKey(), isNew: true }]);
    setErrors(null);
    setShowAdd(false);
    setNewForm({
      key: '',
      id: '',
      day: 'Monday',
      periodNumber: 1,
      programme: newForm.programme,
      departmentId: newForm.departmentId,
      departmentName: newForm.departmentName,
      year: newForm.year,
      shift: newForm.shift,
      section: 'A',
      semester: newForm.semester,
      subjectId: '',
      subjectCode: '',
      subjectName: '',
      classroom: '',
      isNew: true,
      isDeleted: false
    });
  };

  const handleDelete = (entryKey: string) => {
    if (entryKey === '' || entryKey === null) return;
    setEntries((prev) => prev.filter((e) => e.key !== entryKey));
    if (editingId === entryKey) setEditingId(null);
  };

  const patchEntry = (entryKey: string, patch: Partial<DraftEntry>) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.key !== entryKey) return e;
        const next = { ...e, ...patch };
        if (patch.programme || patch.year) {
          const sems = semestersForSelection({
            programme: next.programme,
            departmentId: next.departmentId,
            year: next.year,
            shift: next.shift
          });
          if (sems.length > 0) next.semester = sems[0];
        }
        return next;
      })
    );
  };

  const handleSave = () => {
    // Final validation pass over all entries.
    setErrors(null);
    const deleted: string[] = [];
    const saved: TimetableSlot[] = [];
    for (const e of entries) {
      if (e.isNew) {
        const err = validateEntry(e);
        if (err) {
          setErrors(`Entry (${e.day} P${e.periodNumber}): ${err}`);
          return;
        }
        saved.push({
          id: 'tt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          day: e.day,
          periodNumber: e.periodNumber,
          startTime: startTimeOf(e.periodNumber) || '09:00 AM',
          endTime: getPeriodTime(e.periodNumber)?.end || '09:50 AM',
          subjectId: e.subjectId,
          subjectCode: e.subjectCode,
          subjectName: e.subjectName,
          facultyId: faculty.id,
          facultyName: faculty.name,
          departmentId: e.departmentId,
          semester: e.semester,
          section: e.section,
          programme: e.programme,
          year: e.year,
          shift: e.shift,
          classroom: e.classroom.trim()
        });
      } else {
        const err = validateEntry(e);
        if (err) {
          setErrors(`Entry (${e.day} P${e.periodNumber}): ${err}`);
          return;
        }
        saved.push({
          id: e.id,
          day: e.day,
          periodNumber: e.periodNumber,
          startTime: startTimeOf(e.periodNumber) || '09:00 AM',
          endTime: getPeriodTime(e.periodNumber)?.end || '09:50 AM',
          subjectId: e.subjectId,
          subjectCode: e.subjectCode,
          subjectName: e.subjectName,
          facultyId: faculty.id,
          facultyName: faculty.name,
          departmentId: e.departmentId,
          semester: e.semester,
          section: e.section,
          programme: e.programme,
          year: e.year,
          shift: e.shift,
          classroom: e.classroom.trim()
        });
      }
    }
    // Deleted = original slots not present in current entries.
    const currentIds = new Set(entries.map((e) => e.id).filter((id) => id !== ''));
    for (const orig of slots) {
      if (!currentIds.has(orig.id)) deleted.push(orig.id);
    }
    onSave({ saved, deleted });
  };

  const sortEntries = (arr: DraftEntry[]) =>
    [...arr].sort(
      (a, b) =>
        DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.periodNumber - b.periodNumber
    );

  const renderEntryRow = (e: DraftEntry) => (
    <div
      key={e.key}
      className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto] gap-2 items-center p-2.5 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-700 rounded-xl text-xs"
    >
      <div className="flex flex-col">
        <span className="font-bold text-[#0F172A] dark:text-zinc-100">{e.day}</span>
        <span className="text-[10px] text-[#000000] dark:text-[#64748B]">Period {e.periodNumber} ({startTimeOf(e.periodNumber)})</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-[#2563EB] dark:text-[#3B82F6]">{e.subjectCode}</span>
        <span className="text-[10px] text-[#000000] dark:text-[#64748B] truncate">{e.subjectName}</span>
      </div>
      <div className="text-[#000000] dark:text-[#64748B]">{e.programme} · {e.year}</div>
      <div className="text-[#000000] dark:text-[#64748B]">{departmentNameOf(e.departmentId)}</div>
      <div className="text-[#000000] dark:text-[#64748B]">{e.shift} · Section {e.section}</div>
      <div className="font-bold text-[#000000] dark:text-zinc-300">{e.classroom || '—'}</div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setEditingId(e.key)}
          className="px-2 py-1 bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/40 dark:text-[#3B82F6] rounded-lg text-[10px] font-bold"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => handleDelete(e.key)}
          className="px-2 py-1 bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 rounded-lg text-[10px] font-bold"
        >
          <Trash2 className="w-3 h-3 inline mr-1" />Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/50 dark:text-[#3B82F6] text-[10px] font-bold uppercase rounded-md">
              Edit Timetable
            </span>
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100">
              {faculty.name}
            </h3>
          </div>
          <p className="text-xs text-[#000000] dark:text-[#64748B] mt-1">
            {entries.length} timetable entr{entries.length === 1 ? 'y' : 'ies'} · Programme → Department → Year → Shift → Section
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Entry
          </button>
        </div>
      </div>

      {/* Add Entry form */}
      {showAdd && (
        <div className="p-3.5 bg-[#F7F9FC] dark:bg-[#0A0A0A]/60 border border-[#E2E8F0] dark:border-zinc-800 rounded-2xl space-y-3">
          <p className="text-xs font-bold text-[#1E293B] dark:text-zinc-300 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" /> New Timetable Entry
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Programme</label>
              <select
                value={newForm.programme}
                onChange={(e) => {
                  const prog = e.target.value as Programme;
                  updateNewForm({
                    programme: prog,
                    departmentId: departmentsForProgramme(prog)[0]?.id || 'dept-cs',
                    departmentName: departmentsForProgramme(prog)[0]?.name || '',
                    year: yearsForProgramme(prog)[0],
                    shift: shiftsForProgramme(prog)[0]
                  });
                }}
                className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
              >
                <option value="UG">UG</option>
                <option value="PG">PG</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Department</label>
              <select
                value={newForm.departmentId}
                onChange={(e) => {
                  const id = e.target.value;
                  const d = deptOptions.find((x) => x.id === id);
                  updateNewForm({ departmentId: id, departmentName: d?.name || '' });
                }}
                className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
              >
                {deptOptions.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Year</label>
              <select
                value={newForm.year}
                onChange={(e) => updateNewForm({ year: e.target.value })}
                className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Shift</label>
              <select
                value={newForm.shift}
                onChange={(e) => updateNewForm({ shift: e.target.value as Shift })}
                className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
              >
                {shiftOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Section</label>
              <select
                value={newForm.section}
                onChange={(e) => updateNewForm({ section: e.target.value })}
                className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
              >
                {sectionOptions(newForm.programme, newForm.year).map((s) => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Day</label>
              <select
                value={newForm.day}
                onChange={(e) => updateNewForm({ day: e.target.value as TimetableSlot['day'] })}
                className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
              >
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Period</label>
              <select
                value={newForm.periodNumber}
                onChange={(e) => updateNewForm({ periodNumber: Number(e.target.value) })}
                className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
              >
                {periods.map((p) => (
                  <option key={p.num} value={p.num}>P{p.num} ({p.start} – {p.end})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Subject</label>
              <select
                value={newForm.subjectId}
                onChange={(e) => {
                  const sub = subjectsForDept.find((s) => s.id === e.target.value);
                  updateNewForm({
                    subjectId: e.target.value,
                    subjectCode: sub?.code || '',
                    subjectName: sub?.name || ''
                  });
                }}
                className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
              >
                <option value="">Select Subject</option>
                {subjectsForDept.map((s) => (
                  <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Classroom</label>
              <input
                type="text"
                value={newForm.classroom}
                onChange={(e) => updateNewForm({ classroom: e.target.value })}
                placeholder="e.g. Room 204"
                className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl"
            >
              Add Entry
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 bg-[#F7F9FC] dark:bg-zinc-800 text-[#1E293B] dark:text-zinc-200 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Errors */}
      {errors && (
        <div className="flex items-start gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{errors}</span>
        </div>
      )}

      {/* Entries list */}
      <div className="space-y-2">
        {sortEntries(entries).length === 0 ? (
          <div className="p-6 text-center text-xs text-[#000000] dark:text-[#64748B] bg-[#F7F9FC] dark:bg-[#0A0A0A]/60 border border-dashed border-zinc-300 dark:border-[#232326] rounded-2xl">
            No timetable entries for this faculty yet. Click "Add Entry" to create one.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto_auto] gap-2 px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#000000] dark:text-[#64748B]">
              <span>Day / Period</span>
              <span>Subject</span>
              <span>Programme / Year</span>
              <span>Department</span>
              <span>Shift / Section</span>
              <span>Classroom</span>
              <span>Actions</span>
            </div>
            {sortEntries(entries).map((e) => renderEntryRow(e))}
          </div>
        )}
      </div>

      {/* Inline edit form for chosen entry */}
      {editingId !== null && (() => {
        const target = entries.find((e) => e.key === editingId);
        if (!target) return null;
        const eDeptOptions = departmentsForProgramme(target.programme);
        const eYearOptions = yearsForProgramme(target.programme);
        const eShiftOptions = shiftsForProgramme(target.programme);
        const eSubjects = subjects.filter((s) => s.departmentId === target.departmentId);
        return (
          <div className="p-3.5 bg-[#F7F9FC] dark:bg-[#0A0A0A]/60 border border-[#E2E8F0] dark:border-zinc-800 rounded-2xl space-y-3">
            <p className="text-xs font-bold text-[#1E293B] dark:text-zinc-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />
              Edit Entry — {target.day} P{target.periodNumber}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Programme</label>
                <select
                  value={target.programme}
                  onChange={(e) => {
                    const prog = e.target.value as Programme;
                    patchEntry(target.key, {
                      programme: prog,
                      departmentId: departmentsForProgramme(prog)[0]?.id || target.departmentId,
                      departmentName: departmentsForProgramme(prog)[0]?.name || target.departmentName,
                      year: yearsForProgramme(prog)[0],
                      shift: shiftsForProgramme(prog)[0]
                    });
                  }}
                  className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
                >
                  <option value="UG">UG</option>
                  <option value="PG">PG</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Department</label>
                <select
                  value={target.departmentId}
                  onChange={(e) => {
                    const d = eDeptOptions.find((x) => x.id === e.target.value);
                    patchEntry(target.key, { departmentId: e.target.value, departmentName: d?.name || '' });
                  }}
                  className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
                >
                  {eDeptOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Year</label>
                <select
                  value={target.year}
                  onChange={(e) => patchEntry(target.key, { year: e.target.value })}
                  className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
                >
                  {eYearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Shift</label>
                <select
                  value={target.shift}
                  onChange={(e) => patchEntry(target.key, { shift: e.target.value as Shift })}
                  className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
                >
                  {eShiftOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Section</label>
                <select
                  value={target.section}
                  onChange={(e) => patchEntry(target.key, { section: e.target.value })}
                  className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
                >
                  {sectionOptions(target.programme, target.year).map((s) => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Day</label>
                <select
                  value={target.day}
                  onChange={(e) => patchEntry(target.key, { day: e.target.value as TimetableSlot['day'] })}
                  className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
                >
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Period</label>
                <select
                  value={target.periodNumber}
                  onChange={(e) => patchEntry(target.key, { periodNumber: Number(e.target.value) })}
                  className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
                >
                  {periods.map((p) => <option key={p.num} value={p.num}>P{p.num} ({p.start} – {p.end})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Subject</label>
                <select
                  value={target.subjectId}
                  onChange={(e) => {
                    const sub = eSubjects.find((s) => s.id === e.target.value);
                    patchEntry(target.key, { subjectId: e.target.value, subjectCode: sub?.code || '', subjectName: sub?.name || '' });
                  }}
                  className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
                >
                  <option value="">Select Subject</option>
                  {eSubjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#1E293B] dark:text-zinc-300 mb-1">Classroom</label>
                <input
                  type="text"
                  value={target.classroom}
                  onChange={(e) => patchEntry(target.key, { classroom: e.target.value })}
                  placeholder="e.g. Room 204"
                  className="w-full p-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setEditingId(null); setErrors(null); }}
                className="px-4 py-2 bg-[#2563EB] text-white text-xs font-bold rounded-xl"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => { setEditingId(null); }}
                className="px-4 py-2 bg-[#F7F9FC] dark:bg-zinc-800 text-[#1E293B] dark:text-zinc-200 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        );
      })()}

      {/* Save / Cancel */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0] dark:border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 bg-[#F7F9FC] dark:bg-zinc-800 text-[#1E293B] dark:text-zinc-200 hover:bg-zinc-200 rounded-xl text-xs font-bold"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-colors shadow-md"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
