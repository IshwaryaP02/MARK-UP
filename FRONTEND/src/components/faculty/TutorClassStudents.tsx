import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { academicYearLabel } from '../../services/academicStructure';
import { Student } from '../../types';
import { Modal } from '../common/Modal';
import { StudentDetailModal } from '../common/StudentDetailModal';
import { BackButton } from '../common/BackButton';
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

  const dateInWindow = (date: string) => {
    if (dateFilterMode === 'all') return true;
    if (dateFilterMode === 'date') return singleDate ? date === singleDate : true;
    if (dateFilterMode === 'range') {
      if (!fromDate && !toDate) return true;
      if (fromDate && toDate) return date >= fromDate && date <= toDate;
      if (fromDate) return date >= fromDate;
      return date <= toDate;
    }
    if (dateFilterMode === 'monthly') return monthFilter ? date.startsWith(monthFilter) : true;
    return true;
  };

  const clearDateFilter = () => {
    setSingleDate('');
    setFromDate('');
    setToDate('');
    setMonthFilter(new Date().toISOString().slice(0, 7));
  };

  const filterActive = dateFilterMode !== 'all';

  const windowedRecords = useMemo(
    () => attendanceRecords.filter((rec) => dateInWindow(rec.date)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attendanceRecords, dateFilterMode, singleDate, fromDate, toDate, monthFilter]
  );

  const tutorClassStudents = useMemo(() => {
    if (!tutorFor) return [];
    return students.filter(
      (s) => s.active && s.semester === tutorFor.semester && s.section === tutorFor.section
    );
  }, [students, tutorFor]);

  const enrichedStudents = useMemo(() => {
    if (filterActive) {
      return tutorClassStudents.map((st) => {
        const entries = windowedRecords.flatMap((r) =>
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
  }, [tutorClassStudents, filterActive, windowedRecords]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return enrichedStudents
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.regNo.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q)
      )
      .filter((s) => attendanceFilter === 'all' || s.pct < LOW_ATTENDANCE_THRESHOLD);
  }, [enrichedStudents, searchQuery, attendanceFilter]);

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
      `TutorClass_Sem${tutorFor?.semester}_${(tutorFor?.section || 'FirstShift').replace(/\s/g, '')}_${attendanceFilter === 'low' ? 'LowAttendance_' : ''}Attendance.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(
      'Report Exported',
      `Downloaded CSV for Semester ${tutorFor?.semester} ${tutorFor ? academicYearLabel(tutorFor.semester) : ''}${
        attendanceFilter === 'low' ? ' (Low Attendance Only)' : ''
      }`,
      'success'
    );
  };

  if (!tutorFor) {
    return (
      <div className="space-y-6">
        <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Tutor Class Students
          </h2>
        </div>
        <div className="p-8 bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl text-center">
          <ShieldCheck className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
            No Tutor Assignment Found
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Tutor Class Students
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Students in your assigned Tutor class — Semester {tutorFor.semester},{' '}
            {academicYearLabel(tutorFor.semester)} ({tutorFor.section === 'Second Shift' ? 'Second' : 'First'} Shift)
          </p>
        </div>
      </div>

      {/* Attendance Date Filter */}
      <div className="p-4 bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
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
                    ? 'bg-[#1E40AF] dark:bg-[#2563EB] text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {filterActive && (
            <button
              onClick={clearDateFilter}
              className="ml-auto px-2.5 py-1.5 text-[11px] font-bold text-zinc-500 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {dateFilterMode === 'date' && (
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
            <input
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              className="p-2 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>
        )}

        {dateFilterMode === 'range' && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
            From
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="p-2 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
            To
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="p-2 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>
        )}

        {dateFilterMode === 'monthly' && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
            <Calendar className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
            Month
            <select
              value={(monthFilter).split('-')[1]}
              onChange={(e) => setMonthFilter(`${monthFilter.split('-')[0]}-${e.target.value}`)}
              className="p-2 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                <option key={m} value={m}>{new Date(2000, parseInt(m, 10) - 1, 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            Year
            <select
              value={(monthFilter).split('-')[0]}
              onChange={(e) => setMonthFilter(`${e.target.value}-${monthFilter.split('-')[1]}`)}
              className="p-2 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              {Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - 2 + i)).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
            Total Students
          </span>
          <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {enrichedStudents.length}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
            Avg Attendance
          </span>
          <span
            className={`text-2xl font-extrabold ${
              !filterActive || enrichedStudents.some((s) => s.hasRecords)
                ? avgAttendance < LOW_ATTENDANCE_THRESHOLD
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
                : 'text-zinc-400 dark:text-zinc-500'
            }`}
          >
            {filterActive && !enrichedStudents.some((s) => s.hasRecords)
              ? '--'
              : `${avgAttendance}%`}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
            Class
          </span>
          <span className="text-2xl font-extrabold text-[#1E40AF] dark:text-[#3B82F6]">
            Sem {tutorFor.semester} · {academicYearLabel(tutorFor.semester)}
          </span>
        </div>
        <div className="p-4 bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
            Low Attendance
          </span>
          <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            {lowAttendanceCount > 0 && <AlertTriangle className="w-5 h-5" />}
            {lowAttendanceCount}
          </span>
        </div>
      </div>

      {/* Search + Filter + Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by Student Name, Register No, or Roll No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSearchQuery((e.target as HTMLInputElement).value);
            }}
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
          />
        </div>
        <button
          onClick={() => setSearchQuery(searchQuery)}
          className="px-3 py-1.5 text-xs font-bold text-white bg-[#1E40AF] dark:bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#2563EB] rounded-xl transition-colors shrink-0"
        >
          Enter
        </button>
        <select
          value={attendanceFilter}
          onChange={(e) => setAttendanceFilter(e.target.value as 'all' | 'low')}
          className="px-3 py-1.5 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E40AF] shrink-0"
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

      {/* Student Roster Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-3 bg-zinc-50 dark:bg-[#0A0A0A] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
          <span>Class Roster ({filteredStudents.length} Students)</span>
          <span className="text-[#1E40AF] dark:text-[#3B82F6]">
            Semester {tutorFor.semester} · {academicYearLabel(tutorFor.semester)}
          </span>
        </div>

        <div className="max-h-[32rem] overflow-y-auto">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-100 dark:bg-[#0A0A0A] text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
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
                  <td colSpan={7} className="p-6 text-center text-zinc-400 text-xs">
                    {searchQuery || attendanceFilter === 'low' || filterActive
                      ? 'No students match the current search or attendance filter.'
                      : 'No students found in this tutor class.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="p-2.5 pl-3">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForModal(st)}
                        className="font-bold text-zinc-900 dark:text-zinc-100 block hover:text-[#1E40AF] dark:hover:text-[#3B82F6] hover:underline text-left"
                      >
                        {st.name}
                      </button>
                      <span className="text-[10px] font-mono font-bold text-[#1E40AF] dark:text-[#3B82F6] block">
                        {st.regNo}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 block">
                        {'🐱 '}
                        {st.phone || '+91 98765 43210'}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-zinc-500">{st.rollNo}</td>
                    <td className="p-2.5 font-mono text-zinc-600 dark:text-zinc-300">{st.totalDays} Days</td>
                    <td className="p-2.5 text-emerald-600 font-bold">{st.presentDays} Days</td>
                    <td className="p-2.5 text-rose-600 font-bold">{st.absentDays} Days</td>
                    <td className="p-2.5 font-mono">{st.hasRecords ? (filterActive ? `${st.pct}%` : `${st.weeklyPct}%`) : '--'}</td>
                    <td className="p-2.5 text-right pr-3 font-mono font-extrabold text-[#1E40AF] dark:text-[#3B82F6]">
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
