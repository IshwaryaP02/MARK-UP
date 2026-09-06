import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TimetableSlot, PeriodTiming } from '../../types';
import { departmentProgrammes, Programme } from '../../services/academicStructure';
import { slotForDayOrder, filteredSlotsForDayOrder, availableDayOrders, todayIsDayOrder, slotAppliesToOrder } from '../../services/timetableDayOrder';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';
import { academicYearLabel } from '../../services/academicStructure';
import {
  Calendar,
  Plus,
  AlertTriangle,
  Trash2,
  Users,
  Building2,
  BookOpen,
  UserCheck,
  Image,
  Clock,
  GraduationCap,
  Layers
} from 'lucide-react';

const SHIFTS = ['First Shift', 'Second Shift'];

const UG_YEAR_SEMESTERS: Record<string, number[]> = {
  'First Year': [1, 2],
  'Second Year': [3, 4],
  'Third Year': [5, 6]
};

const MSC_YEAR_SEMESTERS: Record<string, number[]> = {
  'First Year': [1, 2],
  'Second Year': [3, 4]
};

const getYearSemesters = (programme: Programme): Record<string, number[]> =>
  programme === 'MSc' ? MSC_YEAR_SEMESTERS : UG_YEAR_SEMESTERS;

const programmeRequiresShift = (programme: Programme): boolean => programme !== 'MSc';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const romanNumeral = (n: number): string => ROMAN[n] || String(n);

const TimetableMatrix: React.FC<{
  slots: TimetableSlot[];
  days: readonly string[];
  periods: Array<{ num: number; start: string; end: string }>;
  showFaculty: boolean;
  romanDayLabels?: Record<string, string>;
}> = ({ slots, days, periods, showFaculty, romanDayLabels }) => {
  const slotFor = (day: string, period: number) => slots.find((s) => s.day === day && s.periodNumber === period);
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-[#232326]">
      <table className="w-full text-xs text-center border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-zinc-50 dark:bg-[#0A0A0A]/80 border-b border-zinc-200 dark:border-[#232326] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
            <th className="p-3 w-24">Day / Period</th>
            {periods.map((p) => (
              <React.Fragment key={p.num}>
                <th className="p-3 border-l border-zinc-200 dark:border-[#232326]">
                  <div>P{p.num}</div>
                  <div className="text-[9px] text-zinc-400 normal-case font-normal mt-0.5">{p.start} – {p.end}</div>
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-[#232326]">
          {days.map((d) => (
            <tr key={d}>
              <td className="p-2 font-bold bg-zinc-50/50 dark:bg-[#0A0A0A]/60 text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-[#232326] text-[13px]">
                {romanDayLabels?.[d] || d}
              </td>
              {periods.map((p) => (
                <React.Fragment key={p.num}>
                  <td className="p-1 border-l border-zinc-200 dark:border-[#232326] align-top h-16">
                    {(() => {
                      const slot = slotFor(d, p.num);
                      return slot ? (
                        <div className="p-1.5 bg-[#1E40AF]/10 dark:bg-[#2563EB]/30 border border-[#1E40AF]/30 dark:border-[#3B82F6]/40 rounded-lg text-left h-full">
                          <div className="font-bold text-[#1E40AF] dark:text-[#3B82F6] text-[10px] truncate">{slot.subjectCode}</div>
                          <div className="text-[9px] font-medium text-zinc-600 dark:text-zinc-300 leading-tight mt-0.5 line-clamp-2">{slot.subjectName}</div>
                          <div className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                            {showFaculty ? (slot.facultyName || '—') : `${academicYearLabel(slot.semester)}${slot.shift && slot.shift !== 'N/A' ? ' · ' + slot.shift : ''}${slot.dayOrder ? ' · DO' + slot.dayOrder : ''}`}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[9px] text-zinc-300 dark:text-zinc-700">—</div>
                      );
                    })()}
                  </td>
                </React.Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const TimetableBuilder: React.FC = () => {
  const {
    timetable,
    subjects,
    facultyList,
    students,
    departments,
    saveTimetableSlot,
    deleteTimetableSlot,
    currentUser,
    addToast,
    periodTimes,
    savePeriodTimes,
    getPeriodTime,
    staffDayOrders,
    getCurrentDayOrder
  } = useApp();

  const allowedDeptIds = ['dept-cs', 'dept-it'];
  const builderDepartments = departments.filter((d) => allowedDeptIds.includes(d.id));

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const romanDayLabels: Record<string, string> = {
    Monday: 'I',
    Tuesday: 'II',
    Wednesday: 'III',
    Thursday: 'IV',
    Friday: 'V',
    Saturday: 'VI'
  };
  const periods = periodTimes
    .filter((t) => t.periodNumber !== null)
    .map((t) => ({ num: t.periodNumber as number, start: t.start, end: t.end }));
  const interval = periodTimes.find((t) => t.id === 'interval') || null;

  const userDeptId = currentUser.departmentId && allowedDeptIds.includes(currentUser.departmentId)
    ? currentUser.departmentId
    : builderDepartments[0]?.id || 'dept-cs';
  const isDepartmentLocked = currentUser.role === 'hod' || currentUser.role === 'faculty';

  const [selectedDeptId, setSelectedDeptId] = useState<string>(userDeptId);
  const [selectedProgramme, setSelectedProgramme] = useState<Programme>('UG');
  const [selectedYear, setSelectedYear] = useState<string>('Second Year');
  const [selectedSemester, setSelectedSemester] = useState<number>(4);
  const [selectedShift, setSelectedShift] = useState<string>('First Shift');
  const [selectedSection, setSelectedSection] = useState<string>('A');

  const [viewMode, setViewMode] = useState<'build' | 'faculty' | 'students'>('build');
  const [viewFacultyId, setViewFacultyId] = useState<string>('');
  const [selectedDayOrder, setSelectedDayOrder] = useState<number | null>(null);

  // Day order variants available from the saved monthly schedules.
  const currentDayOrder = getCurrentDayOrder();
  const dayOrderOptions = availableDayOrders(
    staffDayOrders.flatMap((s) => s.entries.map((e) => ({ dayOrder: e.dayOrder })))
  );
  const resolvedDayOrder = selectedDayOrder !== null ? selectedDayOrder : null;

  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Partial<TimetableSlot>>({});
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [periodDraft, setPeriodDraft] = useState<PeriodTiming[]>([]);
  const [periodError, setPeriodError] = useState<string | null>(null);

  const openPeriodModal = () => {
    setPeriodDraft(periodTimes.map((t) => ({ ...t })));
    setPeriodError(null);
    setPeriodModalOpen(true);
  };

  const toMinutes = (time: string): number | null => {
    const m = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ap = m[3].toUpperCase();
    if (h < 1 || h > 12 || min < 0 || min > 59) return null;
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return h * 60 + min;
  };

  const handlePeriodFormChange = (id: string, field: 'start' | 'end', value: string) => {
    setPeriodDraft((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    setPeriodError(null);
  };

  const handleSavePeriodTimes = () => {
    setPeriodError(null);
    for (const t of periodDraft) {
      if (!t.start.trim() || !t.end.trim()) { setPeriodError('All period times are required.'); return; }
      if (!toMinutes(t.start) || !toMinutes(t.end)) { setPeriodError(`Invalid time format for ${t.label}.`); return; }
      if (toMinutes(t.start)! >= toMinutes(t.end)!) { setPeriodError(`${t.label} start must be earlier than its end.`); return; }
    }
    const byPeriod: Array<{ label: string; start: number; end: number }> = [];
    const iv = periodDraft.find((t) => t.id === 'interval')!;
    if (toMinutes(iv.start)! >= toMinutes(iv.end)!) { setPeriodError('Interval start must be earlier than end.'); return; }
    for (const t of periodDraft) {
      if (t.periodNumber !== null) byPeriod.push({ label: t.label, start: toMinutes(t.start)!, end: toMinutes(t.end)! });
    }
    byPeriod.sort((a, b) => a.start - b.start);
    const all = [...byPeriod, { label: 'Interval', start: toMinutes(iv.start)!, end: toMinutes(iv.end)! }].sort((a, b) => a.start - b.start);
    for (let i = 1; i < all.length; i++) {
      if (all[i].start < all[i - 1].end) { setPeriodError(`Overlapping timings: ${all[i - 1].label} and ${all[i].label}.`); return; }
    }
    savePeriodTimes(periodDraft);
    setPeriodModalOpen(false);
    addToast('Period timings updated.', 'All timetable views now reflect the new timings.', 'success');
  };

  const selectedStudents = students.filter(
    (st) => st.departmentId === selectedDeptId && st.semester === selectedSemester
  );

  // Timetable slots for the selected shift (and optional section), effective for the selected day order.
  const selectedSlots = filteredSlotsForDayOrder(
    timetable.filter((slot) => {
      if (slot.departmentId !== selectedDeptId || slot.semester !== selectedSemester) return false;
      if (programmeRequiresShift(selectedProgramme)) {
        if ((slot.shift || 'First Shift') !== selectedShift) return false;
      }
      return true;
    }),
    resolvedDayOrder
  );

  const currentDept = builderDepartments.find((d) => d.id === selectedDeptId) || builderDepartments[0];
  const currentYearSemesters = getYearSemesters(selectedProgramme);

  const handleCellClick = (day: typeof days[number], periodNum: number) => {
    const existing = slotForDayOrder(selectedSlots, day, periodNum, resolvedDayOrder);
    const pInfo = periods.find((p) => p.num === periodNum);
    const filteredSubjects = subjects.filter((sub) => sub.departmentId === selectedDeptId && sub.semester === selectedSemester);
    const defaultSubject = filteredSubjects[0] || subjects[0];
    const deptFaculty = facultyList.filter((f) => f.departmentId === selectedDeptId);
    const defaultFaculty = deptFaculty[0] || facultyList[0];

    if (existing) {
      if (resolvedDayOrder !== null && existing.dayOrder == null) {
        // Selected variant is a specific Day Order and the cell currently uses the base
        // slot — create a day-order-specific override instead of mutating the base.
        setEditingSlot({
          ...existing,
          id: `tt-${selectedDeptId}-s${selectedSemester}-do${resolvedDayOrder}-${day.toLowerCase()}-p${periodNum}-${Date.now()}`,
          dayOrder: resolvedDayOrder
        });
      } else {
        setEditingSlot({ ...existing });
      }
    } else {
      const shiftLabel = programmeRequiresShift(selectedProgramme) ? selectedShift : 'N/A';
      setEditingSlot({
        id: `tt-${selectedDeptId}-s${selectedSemester}-y${selectedYear}-${selectedProgramme}-${day.toLowerCase()}-p${periodNum}-${Date.now()}`,
        day,
        periodNumber: periodNum,
        startTime: pInfo?.start || '09:00 AM',
        endTime: pInfo?.end || '09:50 AM',
        subjectId: defaultSubject?.id || '',
        subjectCode: defaultSubject?.code || '',
        subjectName: defaultSubject?.name || '',
        facultyId: defaultFaculty?.id || '',
        facultyName: defaultFaculty?.name || '',
        departmentId: selectedDeptId,
        semester: selectedSemester,
        section: selectedSection,
        shift: shiftLabel,
        dayOrder: resolvedDayOrder !== null ? resolvedDayOrder : undefined
      });
    }
    setConflictWarning(null);
    setSlotModalOpen(true);
  };

  const checkFacultyConflict = (testSlot: Partial<TimetableSlot>) => {
    const conflict = timetable.find(
      (s) =>
        s.id !== testSlot.id &&
        s.day === testSlot.day &&
        s.periodNumber === testSlot.periodNumber &&
        (s.shift || 'First Shift') === (testSlot.shift || 'First Shift') &&
        s.facultyId === testSlot.facultyId &&
        slotAppliesToOrder(s, testSlot.dayOrder)
    );
    if (conflict) {
      return `Faculty Conflict: ${conflict.facultyName} is already assigned on ${conflict.day} Period ${conflict.periodNumber} (${conflict.subjectCode})${conflict.dayOrder ? ' for Day Order ' + conflict.dayOrder : ''}.`;
    }
    return null;
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const conflict = checkFacultyConflict(editingSlot);
    if (conflict) { setConflictWarning(conflict); return; }
    if (!editingSlot.subjectId || !editingSlot.facultyId) return;

    const pt = editingSlot.periodNumber ? getPeriodTime(editingSlot.periodNumber) : undefined;
    const shiftValue = programmeRequiresShift(selectedProgramme) ? (editingSlot.shift || selectedShift) : 'N/A';
    saveTimetableSlot({
      ...editingSlot,
      departmentId: selectedDeptId,
      semester: selectedSemester,
      section: selectedSection,
      shift: shiftValue,
      startTime: pt ? pt.start : editingSlot.startTime,
      endTime: pt ? pt.end : editingSlot.endTime,
      id: editingSlot.id || `tt-${Date.now()}`
    } as TimetableSlot);
    setSlotModalOpen(false);
    addToast('Timetable Updated', `Assigned ${editingSlot.subjectCode} (${selectedProgramme}${programmeRequiresShift(selectedProgramme) ? ' · ' + (editingSlot.shift || selectedShift) : ''})`, 'success');
  };

  const handleDeleteSlot = () => {
    if (editingSlot.id) {
      deleteTimetableSlot(editingSlot.id);
      setSlotModalOpen(false);
      addToast('Slot Cleared', 'Removed class slot from timetable', 'info');
    }
  };

  const selectedHeader = `${selectedProgramme} · ${currentDept?.code || 'Class'} · ${academicYearLabel(selectedSemester)}${programmeRequiresShift(selectedProgramme) ? ' · ' + selectedShift : ''}`;

  // ------- View Timetable For (Faculty / Students) derived data -------
  const selectedFaculty = facultyList.find((f) => f.id === viewFacultyId) || null;

  const dayIndex = (d: string) => days.findIndex((x) => x === d);

  const facultySlots = viewFacultyId
    ? filteredSlotsForDayOrder(
        timetable
          .filter((s) => s.facultyId === viewFacultyId)
          .sort((a, b) => dayIndex(a.day) - dayIndex(b.day) || a.periodNumber - b.periodNumber),
        resolvedDayOrder
      )
    : [];

  const studentSlots = filteredSlotsForDayOrder(
    timetable
      .filter((s) => {
        if (s.departmentId !== selectedDeptId || s.semester !== selectedSemester) return false;
        if (programmeRequiresShift(selectedProgramme) && (s.shift || 'First Shift') !== selectedShift) return false;
        return true;
      })
      .sort((a, b) => dayIndex(a.day) - dayIndex(b.day) || a.periodNumber - b.periodNumber),
    resolvedDayOrder
  );

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#1E40AF]/10 text-[#1E40AF] dark:bg-[#2563EB]/50 dark:text-[#3B82F6] text-[10px] font-bold uppercase rounded-md">
              Academic Timetable
            </span>
            <span className="text-xs text-zinc-400 font-semibold">• Class, Faculty & Shift Allocation</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
            Class Timetable Builder
          </h2>

        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role === 'admin' && (
            <button onClick={openPeriodModal} className="flex items-center gap-2 px-3.5 py-2 bg-[#1E40AF]/10 hover:bg-[#1E40AF]/20 dark:bg-[#2563EB]/40 text-[#1E40AF] dark:text-[#3B82F6] border border-[#1E40AF]/20 dark:border-[#3B82F6]/30 rounded-xl text-xs font-bold transition-all">
              <Clock className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
              Edit Period Timings
            </button>
          )}
          <span className="text-xs font-semibold text-[#1E40AF] dark:text-[#3B82F6] bg-[#1E40AF]/10 dark:bg-[#2563EB]/50 px-3 py-1 rounded-full border border-[#1E40AF]/20 dark:border-[#3B82F6]/40">
            {selectedSlots.length} Scheduled Classes
          </span>
        </div>
      </div>

      {/* View Timetable For — segmented control */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm">
        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2.5 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#1E40AF] dark:text-[#3B82F6]" /> View Timetable For
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setViewMode('build')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              viewMode === 'build'
                ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB] dark:text-[#FFFFFF] border-[#1E40AF] dark:border-[#2563EB] shadow-md'
                : 'bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-[#232326] hover:border-[#3B82F6]'
            }`}
          >
            <Layers className="w-4 h-4" /> Build Timetable
          </button>
          <button
            type="button"
            onClick={() => setViewMode('faculty')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              viewMode === 'faculty'
                ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB] dark:text-[#FFFFFF] border-[#1E40AF] dark:border-[#2563EB] shadow-md'
                : 'bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-[#232326] hover:border-[#3B82F6]'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Faculty
          </button>
          <button
            type="button"
            onClick={() => setViewMode('students')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              viewMode === 'students'
                ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB] dark:text-[#FFFFFF] border-[#1E40AF] dark:border-[#2563EB] shadow-md'
                : 'bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-[#232326] hover:border-[#3B82F6]'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Students
          </button>
        </div>

        {/* Day Order variant selector */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-[#232326] flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#1E40AF] dark:text-[#3B82F6]" />
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Timetable Variant</label>
            <span className="text-[10px] text-zinc-400 font-semibold">Applies to Build, Faculty & Students views</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedDayOrder(null)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors border ${
                resolvedDayOrder === null
                  ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB] border-[#1E40AF]'
                  : 'bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-[#232326] hover:border-[#3B82F6]'
              }`}
            >
              All Days (Base)
            </button>
            {dayOrderOptions.map((doNum) => (
              <button
                key={doNum}
                type="button"
                onClick={() => setSelectedDayOrder(doNum)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors border ${
                  resolvedDayOrder === doNum
                    ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB] border-[#1E40AF]'
                    : 'bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-[#232326] hover:border-[#3B82F6]'
                }`}
              >
                Day Order {doNum}
                {todayIsDayOrder(currentDayOrder, doNum) && (
                  <span className="ml-1 text-[9px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">• Today</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Faculty Timetable View */}
      {viewMode === 'faculty' && (
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" /> Faculty Timetable View
              </h3>
            </div>
            {selectedFaculty && (
              <div className="flex items-center gap-3">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">{selectedFaculty.name}</span>
                <span className="text-xs font-semibold text-[#1E40AF] dark:text-[#3B82F6] bg-[#1E40AF]/10 dark:bg-[#2563EB]/50 px-3 py-1 rounded-full border border-[#1E40AF]/20 dark:border-[#3B82F6]/40">
                  {facultySlots.length} Scheduled Classes
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Select Faculty</label>
            <select
              value={viewFacultyId}
              onChange={(e) => setViewFacultyId(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              <option value="">-- Select Faculty --</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {viewFacultyId ? (
            facultySlots.length > 0 ? (
              <TimetableMatrix slots={facultySlots} days={days} periods={periods} showFaculty={false} romanDayLabels={romanDayLabels} />
            ) : (
              <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-[#0A0A0A]/60 border border-dashed border-zinc-300 dark:border-[#232326] rounded-2xl">
                No timetable assigned to this faculty member yet.
              </div>
            )
          ) : (
            <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-[#0A0A0A]/60 border border-dashed border-zinc-300 dark:border-[#232326] rounded-2xl">
              Please select a faculty member to view their timetable.
            </div>
          )}
        </div>
      )}

      {viewMode !== 'faculty' && (
        <>
          {/* Selection Controls */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm space-y-4">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${programmeRequiresShift(selectedProgramme) ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#1E40AF] dark:text-[#3B82F6]" /> Department {isDepartmentLocked && '(Assigned)'}
            </label>
            <select
              value={selectedDeptId}
              disabled={isDepartmentLocked}
              onChange={(e) => {
                const newDept = e.target.value;
                setSelectedDeptId(newDept);
                const deptProgrammes = departmentProgrammes(newDept);
                if (deptProgrammes.length > 0 && !deptProgrammes.includes(selectedProgramme)) {
                  const prog = deptProgrammes[deptProgrammes.length - 1] as Programme;
                  setSelectedProgramme(prog);
                  const yrSem = getYearSemesters(prog);
                  const firstYear = Object.keys(yrSem)[0];
                  setSelectedYear(firstYear);
                  setSelectedSemester(yrSem[firstYear][0]);
                }
              }}
              className={`w-full p-2.5 text-xs font-semibold border rounded-xl ${isDepartmentLocked ? 'bg-zinc-100 dark:bg-[#0A0A0A]/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 cursor-not-allowed' : 'bg-zinc-50 dark:bg-[#0A0A0A] border-zinc-200 dark:border-zinc-700'}`}
            >
              {builderDepartments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#1E40AF] dark:text-[#3B82F6]" /> Programme
            </label>
            <select
              value={selectedProgramme}
              onChange={(e) => {
                const prog = e.target.value as Programme;
                setSelectedProgramme(prog);
                const yrSem = getYearSemesters(prog);
                const firstYear = Object.keys(yrSem)[0];
                setSelectedYear(firstYear);
                setSelectedSemester(yrSem[firstYear][0]);
              }}
              className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              {departmentProgrammes(selectedDeptId).map((prog) => (
                <option key={prog} value={prog}>{prog === 'UG' ? 'UG (Undergraduate)' : 'MSc (Postgraduate)'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#1E40AF] dark:text-[#3B82F6]" /> Academic Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                const year = e.target.value;
                setSelectedYear(year);
                setSelectedSemester(currentYearSemesters[year][0]);
              }}
              className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              {Object.keys(currentYearSemesters).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {programmeRequiresShift(selectedProgramme) && (
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#1E40AF] dark:text-[#3B82F6]" /> Shift
              </label>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl"
              >
                {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#1E40AF] dark:text-[#3B82F6]" /> Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              {currentYearSemesters[selectedYear].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Enrolled Students: {selectedStudents.length}
            </span>
          </div>
          <span className="text-xs font-semibold text-[#1E40AF] dark:text-[#3B82F6]">{selectedHeader}</span>
        </div>
      </div>

      {/* Students Timetable View */}
      {viewMode === 'students' && (
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" /> Students Timetable
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#1E40AF] dark:text-[#3B82F6] bg-[#1E40AF]/10 dark:bg-[#2563EB]/50 px-3 py-1 rounded-full border border-[#1E40AF]/20 dark:border-[#3B82F6]/40">
                {studentSlots.length} Scheduled Classes
              </span>
            </div>
          </div>

          {studentSlots.length > 0 ? (
            <TimetableMatrix slots={studentSlots} days={days} periods={periods} showFaculty={true} romanDayLabels={romanDayLabels} />
          ) : (
            <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-[#0A0A0A]/60 border border-dashed border-zinc-300 dark:border-[#232326] rounded-2xl">
              No timetable found for the selected class group.
            </div>
          )}
        </div>
      )}

      {/* Timetable Grid */}
      {viewMode === 'build' && (
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 dark:border-[#232326]">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
            Weekly Timetable Grid — {selectedHeader}
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${resolvedDayOrder !== null ? (todayIsDayOrder(currentDayOrder, resolvedDayOrder) ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-[#1E40AF]/10 dark:bg-[#2563EB]/40 text-[#1E40AF] dark:text-[#3B82F6]') : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
              {resolvedDayOrder !== null ? `Day Order ${resolvedDayOrder}${todayIsDayOrder(currentDayOrder, resolvedDayOrder) ? ' (Today)' : ''}` : 'All Days (Base)'}
            </span>
          </h3>
          <p className="text-xs text-zinc-500">Click any period box to add or edit a class. Slots created for a specific Day Order override the base timetable for that Day Order only.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-[#0A0A0A]/80 border-b border-zinc-200 dark:border-[#232326] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="p-3 w-28 text-left pl-4">Day / Period</th>
                {periods.map((p) => (
                  <React.Fragment key={p.num}>
                    <th className="p-3 border-l border-zinc-200 dark:border-[#232326]">
                      <div>{romanNumeral(p.num)}</div>
                      <div className="text-[9px] text-zinc-400 normal-case font-normal mt-0.5">{p.start} – {p.end}</div>
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-[#232326]">
              {days.map((day) => (
                <tr key={day} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20">
                  <td className="p-3 font-bold text-left pl-4 bg-zinc-50/50 dark:bg-[#0A0A0A]/60 text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-[#232326]">
                    {romanDayLabels[day] || day}
                  </td>
                  {periods.map((p) => {
                    const slot = slotForDayOrder(selectedSlots, day, p.num, resolvedDayOrder);
                    return (
                      <React.Fragment key={p.num}>
                        <td
                          key={p.num}
                          onClick={() => handleCellClick(day, p.num)}
                          className={`p-2 border-l border-zinc-200 dark:border-[#232326] cursor-pointer hover:bg-[#1E40AF]/10 dark:hover:bg-[#2563EB]/30 transition-colors h-22 align-top ${resolvedDayOrder !== null && slot && slot.dayOrder == null ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}`}
                        >
                          {slot ? (
                            <div className="p-2 bg-[#1E40AF]/10 dark:bg-[#2563EB]/50 border border-[#1E40AF]/30 dark:border-[#3B82F6]/40 rounded-xl text-left h-full flex flex-col justify-between group shadow-2xs">
                              <span className="font-bold text-[#1E40AF] dark:text-[#3B82F6] text-xs truncate">{slot.subjectCode}</span>
                              <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300 truncate block mt-0.5">
                                Inst: {slot.facultyName}
                              </span>
                              <div className="flex items-center justify-between text-[9px] font-mono text-[#1E40AF] dark:text-[#3B82F6] mt-1 pt-1 border-t border-[#1E40AF]/20 dark:border-[#3B82F6]/30">
                                <span>{romanNumeral(p.num)}{slot.dayOrder ? ` · DO${slot.dayOrder}` : ' · ALL'}</span>
                                <span className="opacity-60 group-hover:opacity-100 underline">Edit</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 hover:text-[#1E40AF] dark:hover:text-[#3B82F6] text-[10px] font-semibold border border-dashed border-zinc-200 dark:border-[#232326] rounded-xl transition-colors">
                              + Add Class
                            </div>
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Add / Edit Slot Modal — outside click closes, cancel closes */}
      {viewMode === 'build' && (
      <Modal
        isOpen={slotModalOpen}
        onClose={() => { setSlotModalOpen(false); }}
        title={editingSlot.id && timetable.some((s) => s.id === editingSlot.id) ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
        subtitle={`${editingSlot.day || ''} — Period ${editingSlot.periodNumber ? romanNumeral(editingSlot.periodNumber) : ''} (${editingSlot.startTime || ''} - ${editingSlot.endTime || ''})`}
      >
        <form onSubmit={handleSaveSlot} className="space-y-4">
          {conflictWarning && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div><strong>Conflict Alert!</strong><p className="mt-0.5">{conflictWarning}</p></div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Time / Period
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" readOnly value={editingSlot.startTime || ''} className="w-full p-2.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl" />
              <input type="text" readOnly value={editingSlot.endTime || ''} className="w-full p-2.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Subject / Course
            </label>
            <select
              value={editingSlot.subjectId || ''}
              onChange={(e) => {
                const sub = subjects.find((s) => s.id === e.target.value);
                setEditingSlot({ ...editingSlot, subjectId: e.target.value, subjectCode: sub?.code || '', subjectName: sub?.name || '' });
                setConflictWarning(null);
              }}
              className="w-full p-2.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              {subjects.filter((sub) => sub.departmentId === selectedDeptId && sub.semester === selectedSemester).map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.code} — {sub.name} ({sub.credits} Credits)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Programme</label>
              <input type="text" readOnly value={selectedProgramme} className="w-full p-2.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Year</label>
              <input type="text" readOnly value={academicYearLabel(selectedSemester)} className="w-full p-2.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl" />
            </div>
          </div>

          {programmeRequiresShift(selectedProgramme) && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Shift</label>
              <select
                value={editingSlot.shift || selectedShift}
                onChange={(e) => setEditingSlot({ ...editingSlot, shift: e.target.value })}
                className="w-full p-2.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              >
                {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Day Order Variant
            </label>
            <select
              value={editingSlot.dayOrder ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setEditingSlot({ ...editingSlot, dayOrder: val === '' ? undefined : Number(val) });
                setConflictWarning(null);
              }}
              className="w-full p-2.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              <option value="">All Days (Base)</option>
              {dayOrderOptions.map((doNum) => (
                <option key={doNum} value={doNum}>
                  Day Order {doNum}
                  {todayIsDayOrder(currentDayOrder, doNum) ? ' (Today)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Assign Faculty — separate section */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" /> Assign Faculty
            </p>
            <select
              value={editingSlot.facultyId || ''}
              onChange={(e) => {
                const fac = facultyList.find((f) => f.id === e.target.value);
                setEditingSlot({ ...editingSlot, facultyId: e.target.value, facultyName: fac?.name || '' });
                setConflictWarning(null);
              }}
              className="w-full p-2.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              <option value="">-- Select Faculty --</option>
              {facultyList.filter((f) => f.departmentId === selectedDeptId).map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Assign Student / Class — separate section */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" /> Assign Student / Class
            </p>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl">
              Class: {currentDept?.code} · {selectedProgramme} · {academicYearLabel(selectedSemester)}{programmeRequiresShift(selectedProgramme) ? ' · ' + (editingSlot.shift || selectedShift) : ''}
              <span className="block mt-1">{selectedStudents.length} students enrolled in this class.</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3">
            {editingSlot.id && timetable.some((s) => s.id === editingSlot.id) && (
              <button
                type="button"
                onClick={handleDeleteSlot}
                className="px-3.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Class
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setSlotModalOpen(false)}
                className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1E40AF] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-colors shadow-md"
              >
                {editingSlot.id && timetable.some((s) => s.id === editingSlot.id) ? 'Update Entry' : 'Add Entry'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
      )}

        </>
      )}

      {/* Edit Period Timings Modal */}
      {currentUser.role === 'admin' && (
        <Modal isOpen={periodModalOpen} onClose={() => setPeriodModalOpen(false)} title="Edit Period Timings">
          <div className="space-y-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Set start/end time for each period. Changes apply across all timetable views.</p>
            <div className="space-y-3">
              {periodDraft.map((t) => (
                <div key={t.id} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
                  <div className="w-20 shrink-0">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{t.label}</div>
                    {t.id === 'interval' && <div className="text-[10px] text-zinc-400 font-semibold uppercase">Break</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-[10px] text-zinc-400 font-semibold">Start</label>
                    <input type="text" value={t.start} onChange={(e) => handlePeriodFormChange(t.id, 'start', e.target.value)} placeholder="09:00 AM" className="w-full p-2 text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl" />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-[10px] text-zinc-400 font-semibold">End</label>
                    <input type="text" value={t.end} onChange={(e) => handlePeriodFormChange(t.id, 'end', e.target.value)} placeholder="09:50 AM" className="w-full p-2 text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
            {periodError && (
              <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {periodError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button type="button" onClick={() => setPeriodModalOpen(false)} className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 rounded-xl text-xs font-bold">Cancel</button>
              <button type="button" onClick={handleSavePeriodTimes} className="px-5 py-2.5 bg-[#1E40AF] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-colors shadow-md">Save Changes</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
