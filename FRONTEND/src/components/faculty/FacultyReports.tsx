import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../common/BackButton';
import { MasterFilter } from '../common/MasterFilter';
import { semestersForSelection, masterSelectionLabel, MasterSelection } from '../../services/programmeStructure';
import { Download, FileText, BookOpen, Building2, Users, GraduationCap } from 'lucide-react';

export const FacultyReports: React.FC = () => {
  const { students, attendanceRecords, currentUser, addToast } = useApp();
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [appliedMaster, setAppliedMaster] = useState<MasterSelection | null>(null);

  // Applied filters — only updated when the user clicks Search / presses Enter.
  const [appliedCourse, setAppliedCourse] = useState('all');
  const [appliedStudentId, setAppliedStudentId] = useState('all');

  const applyFilters = () => {
    setAppliedCourse(selectedCourse);
    setAppliedStudentId(selectedStudentId);
  };

  const clearFilters = () => {
    setSelectedCourse('all');
    setSelectedStudentId('all');
    setAppliedCourse('all');
    setAppliedStudentId('all');
    setAppliedMaster(null);
  };

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

  const filteredRecords = useMemo(() => {
    const targetSems = appliedMaster ? semestersForSelection({ ...appliedMaster, shift: undefined }) : null;
    return myRecords.filter((r) => {
      if (appliedCourse !== 'all' && r.subjectId !== appliedCourse) return false;
      if (targetSems && !targetSems.includes(r.semester)) return false;
      if (appliedStudentId !== 'all') return false;
      return true;
    });
  }, [myRecords, appliedCourse, appliedMaster, appliedStudentId]);

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

  const displayedStudent = appliedStudentId !== 'all'
    ? students.find((st) => st.id === appliedStudentId)
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

    const prefix = appliedCourse === 'all' ? 'All_Courses' : courses.find((c) => c.id === appliedCourse)?.code || 'Course';
    const yearLabel = appliedMaster?.year ? String(appliedMaster.year).replace(/\s/g, '') : 'AllYears';
    const fileLabel = `Report_${prefix}_${yearLabel}`;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-zinc-100 tracking-tight">
            Faculty Report Hub
          </h2>
          {appliedMaster && (
            <span className="mt-1 inline-block px-2.5 py-1 bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/40 dark:text-[#3B82F6] text-xs font-extrabold rounded-xl">
              {masterSelectionLabel(appliedMaster)}
            </span>
          )}
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] dark:hover:bg-white text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export Report (CSV)
        </button>
      </div>

      {/* Selectors */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Course */}
          <div>
            <label className="block text-xs font-bold text-[#1E293B] dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" /> Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => { setSelectedCourse(e.target.value); setSelectedStudentId('all'); }}
              className="w-full p-2.5 text-xs font-semibold bg-[#F7F9FC] dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>

          {/* Master Programme → Department → Year → Shift */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#1E293B] dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" /> Programme → Department → Year → Shift
            </label>
            <MasterFilter
              lockedDepartmentId={currentUser.departmentId}
              showProgramme={true}
              showClear={false}
              compact={true}
              onSearch={(sel) => setAppliedMaster(sel)}
              onClear={() => setAppliedMaster(null)}
            />
          </div>

          {/* Students */}
          <div>
            <label className="block text-xs font-bold text-[#1E293B] dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" /> Students
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full p-2.5 text-xs font-semibold bg-[#F7F9FC] dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl"
            >
              <option value="all">All Students ({enrolledStudents.length})</option>
              {enrolledStudents.map((st) => (
                <option key={st.id} value={st.id}>{st.regNo} — {st.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 border-t border-[#E2E8F0] dark:border-zinc-800 pt-3">
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#000000] dark:text-[#64748B] bg-[#F7F9FC] dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
          >
            Clear
          </button>
          <button
            onClick={applyFilters}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#2563EB] dark:bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#2563EB] rounded-xl transition-colors"
          >
            Search
          </button>
        </div>

        {/* Summary */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[#E2E8F0] dark:border-zinc-800 pt-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
            <div>
              <div className="text-lg font-extrabold text-[#0F172A] dark:text-zinc-100">{filteredRecords.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#000000] dark:text-[#64748B]">Records</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{totalPresent}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#000000] dark:text-[#64748B]">Present</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <div>
              <div className="text-lg font-extrabold text-rose-600 dark:text-rose-400">{totalAbsent}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#000000] dark:text-[#64748B]">Absent</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
            <div>
              <div className="text-lg font-extrabold text-[#0F172A] dark:text-zinc-100">{overallPct}%</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#000000] dark:text-[#64748B]">Attendance</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100 mb-3">
          Attendance Report
          <span className="text-xs font-semibold text-[#000000] dark:text-[#64748B] ml-2">
            {reportRows.length} {reportRows.length === 1 ? 'student' : 'students'} · {filteredRecords.length} records
          </span>
        </h3>
        <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F7F9FC] dark:bg-[#0A0A0A]/80 border-b border-[#E2E8F0] dark:border-[#232326] text-[#000000] dark:text-[#64748B] font-semibold uppercase tracking-wider">
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
                <td colSpan={6} className="p-6 text-center text-[#000000] dark:text-[#64748B] text-xs">
                  No records found for the selected filters.
                </td>
              </tr>
            ) : (
              reportRows.map((s) => {
                const { attended, absent, total, pct } = getStats(s.id);
                return (
                  <tr key={s.id}>
                    <td className="p-3 font-bold text-[#0F172A] dark:text-zinc-100">{s.name}</td>
                    <td className="p-3 font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">{s.regNo}</td>
                    <td className="p-3 font-mono">{total}</td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">{attended}</td>
                    <td className="p-3 font-bold text-rose-600 dark:text-rose-400">{absent}</td>
                    <td className="p-3 text-right font-extrabold text-[#0F172A] dark:text-zinc-100">{pct}%</td>
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
