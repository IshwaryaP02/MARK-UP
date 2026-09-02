import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../common/BackButton';
import { Download, FileText, BookOpen, Building2, Users, GraduationCap } from 'lucide-react';

const academicYear = (sem: number): string => {
  if (sem <= 2) return 'First Year';
  if (sem <= 4) return 'Second Year';
  return 'Third Year';
};

const SHIFTS = ['First Shift', 'Second Shift'];
const YEARS = ['First Year', 'Second Year', 'Third Year'];

export const FacultyReports: React.FC = () => {
  const { students, attendanceRecords, currentUser, addToast } = useApp();
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedShift, setSelectedShift] = useState('First Shift');
  const [selectedStudentId, setSelectedStudentId] = useState('all');

  const myRecords = attendanceRecords.filter((r) => r.facultyId === currentUser.id);

  const courses = useMemo(
    () =>
      Array.from(
        new Map(
          myRecords.map((r) => [r.subjectId, { id: r.subjectId, code: r.subjectCode, name: r.subjectName, semester: r.semester }])
        ).values()
      ),
    [myRecords]
  );

  const filteredRecords = myRecords.filter((r) => {
    if (selectedCourse !== 'all' && r.subjectId !== selectedCourse) return false;
    if (selectedYear !== 'all' && academicYear(r.semester) !== selectedYear) return false;
    if (selectedStudentId !== 'all') return false;
    return true;
  });

  // Students represented in the filtered course records
  const enrolledStudents = students.filter((st) =>
    filteredRecords.some((r) => r.entries.some((e) => e.studentId === st.id))
  );

  const isPresent = (status: string) => status === 'present' || status === 'late' || status === 'od';

  const getStats = (stId: string) => {
    const recs = filteredRecords.filter((r) => r.entries.some((e) => e.studentId === stId));
    const attended = recs.filter((r) => {
      const e = r.entries.find((x) => x.studentId === stId);
      return e ? isPresent(e.status) : false;
    }).length;
    const absent = recs.length - attended;
    const total = recs.length;
    return { attended, absent, total, pct: total > 0 ? Math.round((attended / total) * 100) : 0 };
  };

  const displayedStudent = selectedStudentId !== 'all'
    ? students.find((st) => st.id === selectedStudentId)
    : null;

  const reportRows = displayedStudent
    ? [displayedStudent]
    : enrolledStudents;

  const totalPresent = filteredRecords.reduce((s, r) => s + r.presentCount, 0);
  const totalAbsent = filteredRecords.reduce((s, r) => s + r.absentCount, 0);
  const totalCount = totalPresent + totalAbsent;
  const overallPct = totalCount > 0 ? Math.round((totalPresent / totalCount) * 100) : 0;

  const handleExport = () => {
    if (reportRows.length === 0 || filteredRecords.length === 0) {
      addToast('Nothing to Export', 'No attendance records match the current selection', 'warning');
      return;
    }

    const headers = ['Register Number', 'Student Name', 'Total Periods', 'Present', 'Absent', 'Attendance Percentage'];
    const rows = reportRows.map((st) => {
      const { attended, absent, total, pct } = getStats(st.id);
      return [
        st.regNo,
        `"${st.name}"`,
        total,
        attended,
        absent,
        `${pct}%`
      ];
    });

    const prefix = selectedCourse === 'all' ? 'All_Courses' : courses.find((c) => c.id === selectedCourse)?.code || 'Course';
    const fileLabel = `Report_${prefix}_${(selectedYear === 'all' ? 'AllYears' : selectedYear).replace(/\s/g, '')}`;
    const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Report Exported', `Downloaded CSV attendance report`, 'success');
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Faculty Report Hub
          </h2>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] dark:hover:bg-white text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export Report (CSV)
        </button>
      </div>

      {/* Selectors */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Course */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#1E40AF] dark:text-[#3B82F6]" /> Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => { setSelectedCourse(e.target.value); setSelectedStudentId('all'); }}
              className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#1E40AF] dark:text-[#3B82F6]" /> Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setSelectedStudentId('all'); }}
              className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              <option value="all">All Years</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Shift */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#1E40AF] dark:text-[#3B82F6]" /> Shift
            </label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Students */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#1E40AF] dark:text-[#3B82F6]" /> Students
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              <option value="all">All Students ({enrolledStudents.length})</option>
              {enrolledStudents.map((st) => (
                <option key={st.id} value={st.id}>{st.regNo} — {st.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
            <div>
              <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">{filteredRecords.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Records</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{totalPresent}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Present</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div>
              <div className="text-lg font-extrabold text-rose-600 dark:text-rose-400">{totalAbsent}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Absent</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
            <div>
              <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">{overallPct}%</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Attendance</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">
          Attendance Report
          <span className="text-xs font-semibold text-zinc-400 ml-2">
            {reportRows.length} {reportRows.length === 1 ? 'student' : 'students'} · {filteredRecords.length} records
          </span>
        </h3>
        <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-[#0A0A0A]/80 border-b border-zinc-200 dark:border-[#232326] text-zinc-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3">Student Name</th>
              <th className="p-3">Register Number</th>
              <th className="p-3">Total Periods</th>
              <th className="p-3">Present</th>
              <th className="p-3">Absent</th>
              <th className="p-3 text-right">Attendance %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {reportRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-zinc-400 text-xs">
                  No attendance records match the current selection.
                </td>
              </tr>
            ) : (
              reportRows.map((s) => {
                const { attended, absent, total, pct } = getStats(s.id);
                return (
                  <tr key={s.id}>
                    <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{s.name}</td>
                    <td className="p-3 font-mono font-bold text-[#1E40AF] dark:text-[#3B82F6]">{s.regNo}</td>
                    <td className="p-3 font-mono">{total}</td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">{attended}</td>
                    <td className="p-3 font-bold text-rose-600 dark:text-rose-400">{absent}</td>
                    <td className="p-3 text-right font-extrabold text-zinc-900 dark:text-zinc-100">{pct}%</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
