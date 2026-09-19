import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { rankedSearch } from '../../utils/searchRank';
import { academicYearLabel } from '../../services/academicStructure';
import { Student } from '../../types';
import { Modal } from '../common/Modal';
import { StudentDetailModal } from '../common/StudentDetailModal';
import { BackButton } from '../common/BackButton';
import { MasterFilter } from '../common/MasterFilter';
import { semestersForSelection, masterSelectionLabel, MasterSelection } from '../../services/programmeStructure';
import {
  GraduationCap,
  Users,
  Search,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Filter,
  X
} from 'lucide-react';

const LOW_ATTENDANCE_THRESHOLD = 75;

export const TutorClassStudents: React.FC = () => {
  const { students, facultyList, currentUser, attendanceRecords, addToast } = useApp();

  const myFaculty = useMemo(
    () => facultyList.find((f) => f.id === currentUser.id),
    [facultyList, currentUser.id]
  );

  const tutorFor = myFaculty?.tutorFor;

  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'low'>('all');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'date' | 'range' | 'monthly'>('all');
  const [singleDate, setSingleDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));

  // Master selection filter (draft — applied only on MasterFilter Search).
  const [appliedMaster, setAppliedMaster] = useState<MasterSelection | null>(null);

  // Subject filter (draft — applied only on Search / Enter).
  const [filterSubject, setFilterSubject] = useState('All');

  // Applied filters — only updated when the user clicks Search / presses Enter.
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [appliedAttendanceFilter, setAppliedAttendanceFilter] = useState<'all' | 'low'>('all');
  const [appliedDateMode, setAppliedDateMode] = useState<'all' | 'date' | 'range' | 'monthly'>('all');
  const [appliedSingleDate, setAppliedSingleDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [appliedMonthFilter, setAppliedMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [appliedFilterSubject, setAppliedFilterSubject] = useState('All');

  const [isLoading, setIsLoading] = useState(false);

  const applyFilters = () => {
    setIsLoading(true);
    setAppliedSearchQuery(searchQuery);
    setAppliedAttendanceFilter(attendanceFilter);
    setAppliedDateMode(dateFilterMode);
    setAppliedSingleDate(singleDate);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setAppliedMonthFilter(monthFilter);
    setAppliedFilterSubject(filterSubject);
    setTimeout(() => setIsLoading(false), 450);
  };

  const clearDateFilter = () => {
    setDateFilterMode('all');
    setSingleDate('');
    setFromDate('');
    setToDate('');
    setMonthFilter(new Date().toISOString().slice(0, 7));
    setAppliedDateMode('all');
    setAppliedSingleDate('');
    setAppliedFromDate('');
    setAppliedToDate('');
    setAppliedMonthFilter(new Date().toISOString().slice(0, 7));
  };

  const clearFilters = () => {
    clearDateFilter();
    setSearchQuery('');
    setAttendanceFilter('all');
    setAppliedSearchQuery('');
    setAppliedAttendanceFilter('all');
    setFilterSubject('All');
    setAppliedFilterSubject('All');
    setIsLoading(false);
  };

  const dateInWindow = (date: string) => {
    if (appliedDateMode === 'all') return true;
    if (appliedDateMode === 'date') return appliedSingleDate ? date === appliedSingleDate : true;
    if (appliedDateMode === 'range') {
      if (!appliedFromDate && !appliedToDate) return true;
      if (appliedFromDate && appliedToDate) return date >= appliedFromDate && date <= appliedToDate;
      if (appliedFromDate) return date >= appliedFromDate;
      return date <= appliedToDate;
    }
    if (appliedDateMode === 'monthly') return appliedMonthFilter ? date.startsWith(appliedMonthFilter) : true;
    return true;
  };

  const filterActive =
    appliedDateMode !== 'all' ||
    appliedFilterSubject !== 'All';

  const tutorClassStudents = useMemo(() => {
    if (!tutorFor) return [];
    const targetSems = appliedMaster ? semestersForSelection({ ...appliedMaster, shift: undefined }) : null;
    return students.filter(
      (s) =>
        s.active &&
        s.semester === tutorFor.semester &&
        s.section === tutorFor.section &&
        (!targetSems || targetSems.includes(s.semester))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, tutorFor, appliedMaster]);

  const tutorSubjectOptions = useMemo(() => {
    const seen = new Map<string, string>();
    const tutorIds = new Set(tutorClassStudents.map((s) => s.id));
    attendanceRecords.forEach((r) => {
      if (r.semester !== tutorFor?.semester) return;
      if (!r.entries.some((e) => tutorIds.has(e.studentId))) return;
      if (!r.subjectCode) return;
      seen.set(r.subjectCode, r.subjectName || r.subjectCode);
    });
    return Array.from(seen, ([code, name]) => ({ code, name }));
  }, [attendanceRecords, tutorClassStudents, tutorFor]);

  // Attendance records filtered by the APPLIED date + subject filters only.
  const appliedRecords = useMemo(
    () =>
      attendanceRecords.filter((rec) => {
        if (!dateInWindow(rec.date)) return false;
        if (appliedFilterSubject !== 'All' && rec.subjectCode !== appliedFilterSubject) return false;
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attendanceRecords, appliedDateMode, appliedSingleDate, appliedFromDate, appliedToDate, appliedMonthFilter, appliedFilterSubject]
  );

  const enrichedStudents = useMemo(() => {
    if (filterActive) {
      return tutorClassStudents.map((st) => {
        const entries = appliedRecords.flatMap((r) =>
          r.entries.filter((e) => e.studentId === st.id)
        );
        const presentDays = entries.filter((e) => e.status === 'present').length;
        const absentDays = entries.filter((e) => e.status === 'absent').length;
        const totalDays = presentDays + absentDays;
        const pct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        return { ...st, presentDays, absentDays, totalDays, pct, hasRecords: totalDays > 0 };
      });
    }
    return tutorClassStudents.map((st, idx) => {
      const basePct = st.overallAttendancePct;
      const presentDays = Math.round((basePct / 100) * 20);
      const absentDays = 20 - presentDays;
      const totalDays = presentDays + absentDays;
      const weeklyPct = Math.min(100, Math.max(50, basePct + (idx % 2 === 0 ? 5 : -5)));
      const monthlyPct = Math.min(100, Math.max(45, basePct + (idx % 3 === 0 ? 3 : -8)));
      return {
        ...st,
        presentDays,
        absentDays,
        totalDays,
        weeklyPct,
        monthlyPct,
        pct: basePct,
        hasRecords: true
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorClassStudents, filterActive, appliedRecords]);

  const filteredStudents = useMemo(() => {
    const q = appliedSearchQuery.toLowerCase();
    return enrichedStudents
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.regNo.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q)
      )
      .filter((s) => appliedAttendanceFilter === 'all' || s.pct < LOW_ATTENDANCE_THRESHOLD);
  }, [enrichedStudents, appliedSearchQuery, appliedAttendanceFilter]);

  const avgAttendance = useMemo(() => {
    const withRecords = enrichedStudents.filter((s) => s.hasRecords);
    if (withRecords.length === 0) return 0;
    if (filterActive) {
      return Math.round(
        withRecords.reduce((acc, s) => acc + s.pct, 0) / withRecords.length
      );
    }
    return Math.round(
      enrichedStudents.reduce((acc, s) => acc + s.overallAttendancePct, 0) /
        enrichedStudents.length
    );
  }, [enrichedStudents, filterActive]);

  const lowAttendanceCount = useMemo(
    () => enrichedStudents.filter((s) => s.hasRecords && s.pct < LOW_ATTENDANCE_THRESHOLD).length,
    [enrichedStudents]
  );

  const handleExportCSV = () => {
    const headers = [
      'Reg No',
      'Roll No',
      'Student Name',
      'Present Days',
      'Absent Days',
      'Weekly %',
      'Monthly %',
      'Overall %'
    ];
    const rows = filteredStudents.map((s) => [
      s.regNo,
      s.rollNo,
      `"${s.name}"`,
      s.presentDays,
      s.absentDays,
      filterActive ? `${s.hasRecords ? `${s.pct}%` : '--'}` : `${s.weeklyPct}%`,
      filterActive ? (s.hasRecords ? `${s.pct}%` : '--') : `${s.monthlyPct}%`,
      `${s.hasRecords ? `${s.pct}%` : '--'}`
    ]);

    const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `TutorClass_Sem${tutorFor?.semester}_${(tutorFor?.section || 'FirstShift').replace(/\s/g, '')}_${appliedAttendanceFilter === 'low' ? 'LowAttendance_' : ''}Attendance.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(
      'Report Exported',
      `Downloaded CSV for Semester ${tutorFor?.semester} ${tutorFor ? academicYearLabel(tutorFor.semester) : ''}${
        appliedAttendanceFilter === 'low' ? ' (Low Attendance Only)' : ''
      }`,
      'success'
    );
  };

  if (!tutorFor) {
    return (
      <div className="space-y-6">
        <div className="pb-2 border-b border-[#E2E8F0] dark:border-zinc-800">
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Tutor Class Students
          </h2>
        </div>
        <div className="p-8 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-2xl text-center">
          <ShieldCheck className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-[#000000] dark:text-[#64748B] dark:text-zinc-400">
            No Tutor Assignment Found
          </p>
          <p className="text-xs text-[#000000] dark:text-[#64748B] dark:text-zinc-500 mt-1">
            You have not been assigned as a Tutor for any class. Contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Tutor Class Students
          </h2>
          <p className="text-xs text-[#000000] dark:text-[#64748B] dark:text-zinc-400">
            Students in your assigned Tutor class — Semester {tutorFor.semester},{' '}
            {academicYearLabel(tutorFor.semester)} ({tutorFor.section === 'Second Shift' ? 'Second' : 'First'} Shift)
          </p>
          {appliedMaster && (
            <span className="mt-1 inline-block px-2.5 py-1 bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/40 dark:text-[#3B82F6] text-xs font-extrabold rounded-xl">
              {masterSelectionLabel(appliedMaster)}
            </span>
          )}
        </div>
      </div>

      {/* Attendance Date Filter */}
      <div className="p-4 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#000000] dark:text-[#64748B] flex items-center gap-1">
            <Filter className="w-3 h-3" /> Attendance Filter
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {([
              ['all', 'All Dates'],
              ['date', 'Specific Date'],
              ['range', 'From Date → To Date'],
              ['monthly', 'Monthly']
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setDateFilterMode(mode)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                  dateFilterMode === mode
                    ? 'bg-[#2563EB] dark:bg-[#2563EB] text-white'
                    : 'bg-[#F7F9FC] dark:bg-zinc-800 text-[#1E293B] dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={clearFilters}
            className="ml-auto px-2.5 py-1.5 text-[11px] font-bold text-[#000000] dark:text-[#64748B] hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        </div>

        {/* Master Selection + Subject filter */}
        <div className="flex flex-wrap items-center gap-2">
          <MasterFilter
            lockedDepartmentId={currentUser.departmentId}
            showProgramme={true}
            showClear={false}
            compact={true}
            onSearch={(sel) => setAppliedMaster(sel)}
            onClear={() => setAppliedMaster(null)}
          />
          <span className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" /> Subject
          </span>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="p-2 text-xs font-semibold bg-[#F7F9FC] dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
          >
            <option value="All">All Subjects</option>
            {tutorSubjectOptions.map((sub) => (
              <option key={sub.code} value={sub.code}>{sub.name}</option>
            ))}
          </select>
        </div>

        {dateFilterMode === 'date' && (
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
            <input
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              className="p-2 text-xs font-semibold bg-[#F7F9FC] dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
            />
          </div>
        )}

        {dateFilterMode === 'range' && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#000000] dark:text-[#64748B]">
            From
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="p-2 text-xs font-semibold bg-[#F7F9FC] dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
            />
            To
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="p-2 text-xs font-semibold bg-[#F7F9FC] dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
            />
          </div>
        )}

        {dateFilterMode === 'monthly' && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#000000] dark:text-[#64748B]">
            <Calendar className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
            Month
            <select
              value={(monthFilter).split('-')[1]}
              onChange={(e) => setMonthFilter(`${monthFilter.split('-')[0]}-${e.target.value}`)}
              className="p-2 text-xs font-semibold bg-[#F7F9FC] dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
            >
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                <option key={m} value={m}>{new Date(2000, parseInt(m, 10) - 1, 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            Year
            <select
              value={(monthFilter).split('-')[0]}
              onChange={(e) => setMonthFilter(`${e.target.value}-${monthFilter.split('-')[1]}`)}
              className="p-2 text-xs font-semibold bg-[#F7F9FC] dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
            >
              {Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - 2 + i)).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Search + Filter + Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#F7F9FC] dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-800 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#000000] dark:text-[#64748B]" />
          <input
            type="text"
            placeholder="Search by Student Name, Register No, or Roll No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyFilters();
            }}
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>
        <button
          onClick={applyFilters}
          className="px-3 py-1.5 text-xs font-bold text-white bg-[#2563EB] dark:bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#2563EB] rounded-xl transition-colors shrink-0"
        >
          Search
        </button>
        <button
          onClick={clearFilters}
          className="px-3 py-1.5 text-xs font-bold text-[#000000] dark:text-[#64748B] bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
        >
          Clear
        </button>
        <select
          value={attendanceFilter}
          onChange={(e) => setAttendanceFilter(e.target.value as 'all' | 'low')}
          className="px-3 py-1.5 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB] shrink-0"
          title="Filter students by attendance"
        >
          <option value="all">All Students</option>
          <option value="low">Low Attendance (&lt;{LOW_ATTENDANCE_THRESHOLD}%)</option>
        </select>
        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-[#232326] rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold uppercase text-[#000000] dark:text-[#64748B] block mb-1">
            Total Students
          </span>
          <span className="text-2xl font-extrabold text-[#0F172A] dark:text-zinc-100">
            {enrichedStudents.length}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-[#232326] rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold uppercase text-[#000000] dark:text-[#64748B] block mb-1">
            Avg Attendance
          </span>
          <span
            className={`text-2xl font-extrabold ${
              !filterActive || enrichedStudents.some((s) => s.hasRecords)
                ? avgAttendance < LOW_ATTENDANCE_THRESHOLD
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
                : 'text-[#000000] dark:text-[#64748B] dark:text-zinc-500'
            }`}
          >
            {filterActive && !enrichedStudents.some((s) => s.hasRecords)
              ? '--'
              : `${avgAttendance}%`}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-[#232326] rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold uppercase text-[#000000] dark:text-[#64748B] block mb-1">
            Class
          </span>
          <span className="text-2xl font-extrabold text-[#2563EB] dark:text-[#3B82F6]">
            Sem {tutorFor.semester} · {academicYearLabel(tutorFor.semester)}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-[#232326] rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold uppercase text-[#000000] dark:text-[#64748B] block mb-1">
            Low Attendance
          </span>
          <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            {lowAttendanceCount > 0 && <AlertTriangle className="w-5 h-5" />}
            {lowAttendanceCount}
          </span>
        </div>
      </div>

      {/* Student Roster Table */}
      <div className="border border-[#E2E8F0] dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-3 bg-[#F7F9FC] dark:bg-[#0A0A0A] border-b border-[#E2E8F0] dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-[#1E293B] dark:text-zinc-300">
          <span>Class Roster ({filteredStudents.length} Students)</span>
          <span className="text-[#2563EB] dark:text-[#3B82F6]">
            Semester {tutorFor.semester} · {academicYearLabel(tutorFor.semester)}
          </span>
        </div>

        <div className="max-h-[32rem] overflow-y-auto">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F7F9FC] dark:bg-[#0A0A0A] text-[#000000] dark:text-[#64748B] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-2.5 pl-3">Reg No & Name</th>
                <th className="p-2.5">Roll No</th>
                <th className="p-2.5">Total Days</th>
                <th className="p-2.5">Present Days</th>
                <th className="p-2.5">Absent Days</th>
                <th className="p-2.5">Weekly %</th>
                <th className="p-2.5 text-right pr-3">Overall %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-semibold">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[#000000] dark:text-[#64748B] text-xs">
                    {appliedSearchQuery || appliedAttendanceFilter === 'low' || filterActive
                      ? 'No records found for the selected filters.'
                      : 'No students found in this tutor class.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-[#F7F9FC] dark:hover:bg-zinc-800/50">
                    <td className="p-2.5 pl-3">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForModal(st)}
                        className="font-bold text-[#0F172A] dark:text-zinc-100 block hover:text-[#2563EB] dark:hover:text-[#3B82F6] hover:underline text-left"
                      >
                        {st.name}
                      </button>
                      <span className="text-[10px] font-mono font-bold text-[#2563EB] dark:text-[#3B82F6] block">
                        {st.regNo}
                      </span>
                      <span className="text-[10px] font-mono text-[#000000] dark:text-[#64748B] dark:text-zinc-400 block">
                        {'🐱 '}
                        {st.phone || '+91 98765 43210'}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-[#000000] dark:text-[#64748B]">{st.rollNo}</td>
                    <td className="p-2.5 font-mono text-[#1E293B] dark:text-zinc-300">{st.totalDays} Days</td>
                    <td className="p-2.5 text-emerald-600 font-bold">{st.presentDays} Days</td>
                    <td className="p-2.5 text-rose-600 font-bold">{st.absentDays} Days</td>
                    <td className="p-2.5 font-mono">{st.hasRecords ? (filterActive ? `${st.pct}%` : `${st.weeklyPct}%`) : '--'}</td>
                    <td className="p-2.5 text-right pr-3 font-mono font-extrabold text-[#2563EB] dark:text-[#3B82F6]">
                      {st.hasRecords ? `${st.pct}%` : '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <StudentDetailModal
        isOpen={!!selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
        student={selectedStudentForModal}
      />
    </div>
  );
};
