import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Student } from '../../types';
import { StudentDetailModal } from '../common/StudentDetailModal';
import { BackButton } from '../common/BackButton';
import {
  Layers,
  Users,
  Download,
  FileSpreadsheet,
  ArrowRight,
  Search,
  Clock
} from 'lucide-react';

export const AllClassesView: React.FC = () => {
  const { students, subjects, departments, attendanceRecords, addToast, currentUser, timetable, getPeriodTime } = useApp();

  // Department → Programme → Year structure
  const DEPARTMENT_OPTIONS: { id: string; label: string }[] = [
    { id: 'dept-cs', label: 'Computer Science' },
    { id: 'dept-it', label: 'Information and Technology (IT)' }
  ];
  const PROGRAMME_OPTIONS: Record<string, string[]> = {
    'dept-cs': ['UG', 'MSc'],
    'dept-it': ['MSc']
  };
  // Academic structure preserved from the app (ReportsHub / StudentManagement / TimetableBuilder):
  // UG -> 3 years (First [1,2], Second [3,4], Third [5,6]); MSc -> 2 years (First [7,8], Second [9,10]).
  const YEAR_SEMESTERS: Record<string, Record<string, [number, number]>> = {
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
  const YEAR_OPTIONS: Record<string, string[]> = {
    UG: ['First Year', 'Second Year', 'Third Year'],
    MSc: ['First Year', 'Second Year']
  };

  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    DEPARTMENT_OPTIONS.some((d) => d.id === currentUser.departmentId)
      ? currentUser.departmentId!
      : 'dept-cs'
  );
  const [selectedProgramme, setSelectedProgramme] = useState<'' | 'UG' | 'MSc'>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'overall'>('weekly');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  const selectedDeptLabel =
    DEPARTMENT_OPTIONS.find((d) => d.id === selectedDeptId)?.label || '';
  const programmeOptions = PROGRAMME_OPTIONS[selectedDeptId] || [];

  const yearRange =
    selectedProgramme && selectedYear
      ? YEAR_SEMESTERS[selectedProgramme][selectedYear]
      : null;
  const selectedSemester = yearRange ? yearRange[0] : 4;

  const academicYear = (sem: number): string => {
    if (sem <= 2) return 'First Year';
    if (sem <= 4) return 'Second Year';
    if (sem <= 6) return 'Third Year';
    return sem <= 8 ? 'First Year' : 'Second Year';
  };

  const deptStudents = students.filter(
    (s) =>
      s.departmentId === selectedDeptId &&
      (yearRange ? s.semester >= yearRange[0] && s.semester <= yearRange[1] : false)
  );
  const shifts = ['First Shift', 'Second Shift'];

  const getClassStudents = () => deptStudents;

  const todayRef = new Date();
  const withinDays = (dateStr: string, days: number) => {
    const d = new Date(dateStr + 'T00:00:00');
    const diff = (todayRef.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= days;
  };

  const isPresentStatus = (status: string) => status === 'present' || status === 'late' || status === 'od';

  const getEnrichedStudentStats = (studentList: typeof students) => {
    return studentList.map((st) => {
      const classRecords = attendanceRecords.filter(
        (r) => r.departmentId === st.departmentId && r.semester === st.semester
      );
      const countFor = (recs: typeof classRecords) =>
        recs.filter((r) => {
          const e = r.entries.find((x) => x.studentId === st.id);
          return e ? isPresentStatus(e.status) : false;
        }).length;

      const weeklyRecs = classRecords.filter((r) => withinDays(r.date, 7));
      const monthlyRecs = classRecords.filter((r) => withinDays(r.date, 30));
      const weeklyTotal = weeklyRecs.length;
      const monthlyTotal = monthlyRecs.length;

      return {
        ...st,
        presentDays: countFor(classRecords),
        absentDays: classRecords.length - countFor(classRecords),
        weeklyPct: weeklyTotal > 0 ? Math.round((countFor(weeklyRecs) / weeklyTotal) * 100) : 0,
        monthlyPct: monthlyTotal > 0 ? Math.round((countFor(monthlyRecs) / monthlyTotal) * 100) : 0,
        overallPct:
          classRecords.length > 0 ? Math.round((countFor(classRecords) / classRecords.length) * 100) : 0
      };
    });
  };

  const currentStudentsRaw = selectedShift ? getClassStudents() : [];
  const classStudentsEnriched = getEnrichedStudentStats(currentStudentsRaw);

  const filteredClassStudents = classStudentsEnriched.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    if (!selectedShift) return;

    const headers = ['Reg No', 'Roll No', 'Student Name', 'Present Days', 'Absent Days', 'Weekly %', 'Monthly %', 'Overall %'];
    const rows = filteredClassStudents.map((s) => [
      s.regNo,
      s.rollNo,
      `"${s.name}"`,
      s.presentDays,
      s.absentDays,
      `${s.weeklyPct}%`,
      `${s.monthlyPct}%`,
      `${s.overallAttendancePct}%`
    ]);

    const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedShift}_${academicYear(selectedSemester).replace(/\s/g, '')}_Attendance_${timeframe.toUpperCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Report Exported', `Downloaded CSV attendance report for ${selectedShift}`, 'success');
  };

  const getClassSchedule = () => {
    const dayName = todayRef.toLocaleDateString('en-US', { weekday: 'long' });
    return timetable
      .filter(
        (t) =>
          t.day === dayName &&
          t.departmentId === selectedDeptId &&
          t.semester === selectedSemester &&
          (t.shift || 'First Shift') === selectedShift
      )
      .map((t, i) => {
        const pt = getPeriodTime(t.periodNumber);
        return {
          id: t.id || `t-${i}`,
          period: t.periodNumber,
          time: pt ? `${pt.start} - ${pt.end}` : `${t.startTime} - ${t.endTime}`,
          subject: `${t.subjectCode} - ${t.subjectName}`,
          faculty: t.facultyName
        };
      });
  };

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#1E40AF] dark:text-[#3B82F6]" /> All Classes Inspector & Roster
          </h2>

        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Department:</label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedProgramme('');
                setSelectedYear('');
                setSelectedShift(null);
                setSearchQuery('');
              }}
              className="px-3 py-1.5 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-[#1E40AF] dark:text-[#3B82F6]"
            >
              <option value="">Select Department</option>
              {DEPARTMENT_OPTIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {selectedDeptId && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Programme:</label>
              <select
                value={selectedProgramme}
                onChange={(e) => {
                  setSelectedProgramme(e.target.value as '' | 'UG' | 'MSc');
                  setSelectedYear('');
                  setSelectedShift(null);
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-[#1E40AF] dark:text-[#3B82F6]"
              >
                <option value="">Select Programme</option>
                {programmeOptions.map((pg) => (
                  <option key={pg} value={pg}>
                    {pg}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedProgramme && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedShift(null);
                  setSearchQuery('');
                }}
                className="px-3 py-1.5 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-[#1E40AF] dark:text-[#3B82F6]"
              >
                <option value="">Select {selectedProgramme} Year</option>
                {YEAR_OPTIONS[selectedProgramme].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {yearRange && (
            <span className="px-2.5 py-1.5 bg-[#1E40AF]/10 text-[#1E40AF] dark:bg-[#2563EB]/40 dark:text-[#3B82F6] text-xs font-extrabold rounded-xl">
              {selectedDeptLabel} · {selectedProgramme} · {selectedYear} (Sem {yearRange[0]}-{yearRange[1]})
            </span>
          )}
        </div>
      </div>

      {/* Selection prompt */}
      {!yearRange ? (
        <div className="p-10 bg-white dark:bg-[#0A0A0A] border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl text-center">
          <Layers className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
            Select a Department, Programme, and Year above
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            Classes and students for the chosen department, programme, and year will appear here.
          </p>
        </div>
      ) : (
      /* Shift Class Cards Grid */
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {shifts.map((shift) => {
          const secStudents = getClassStudents();
          const secStats = getEnrichedStudentStats(secStudents);
          const avgPct = secStats.length
            ? Math.round(secStats.reduce((acc, s) => acc + s.overallPct, 0) / secStats.length)
            : 0;
          const shiftSlots = timetable.filter(
            (t) =>
              t.departmentId === selectedDeptId &&
              t.semester === selectedSemester &&
              (t.shift || 'First Shift') === shift
          );

          return (
            <div
              key={shift}
              onClick={() => setSelectedShift(shift)}
              className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#1E40AF] dark:hover:border-[#3B82F6] transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-[#FFFFFF] dark:bg-[#2563EB]/50 text-[#1E40AF] dark:text-[#3B82F6] text-xs font-extrabold rounded-xl">
                  {shift}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{selectedYear}</span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 group-hover:text-[#1E40AF] dark:group-hover:text-[#3B82F6] transition-colors">
                  {(shift === 'Second Shift' ? 'Second' : 'First')} Shift Class
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Constant Students: {secStudents.length} Enrolled</p>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold block">Avg Attendance</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{avgPct}%</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-[#1E40AF] dark:text-[#3B82F6] group-hover:translate-x-1 transition-transform">
                  <span>{shiftSlots.length} Slots</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Class Details & Attendance Inspector Modal */}
      {selectedShift && (
        <Modal
          isOpen={!!selectedShift}
          onClose={() => {
            setSelectedShift(null);
            setSearchQuery('');
          }}
          title={`Class Roster & Schedule: ${selectedShift}`}
          subtitle={`${selectedDeptLabel} · ${selectedProgramme || ''} · ${selectedYear} (Sem ${yearRange?.[0] || ''}-${yearRange?.[1] || ''})`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Daily Period Schedule */}
            <div className="p-3.5 bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
              <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" /> Today's Period Schedule ({todayRef.toLocaleDateString('en-US', { weekday: 'long' })})
              </h4>
              {getClassSchedule().length === 0 ? (
                <p className="text-xs text-zinc-400">No classes scheduled for this {selectedShift} today.</p>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {getClassSchedule().map((p) => (
                  <div key={p.id} className="p-2 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800 rounded-xl">
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400">
                      <span>Period {p.period} ({p.time})</span>
                    </div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs mt-0.5">{p.subject}</div>
                    <div className="text-[11px] text-[#1E40AF] dark:text-[#3B82F6] font-semibold mt-0.5">Faculty: {p.faculty}</div>
                  </div>
                ))}
              </div>
              )}
            </div>

            {/* Search + Timeframe + Export */}
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

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white dark:bg-[#0A0A0A] p-1 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setTimeframe('weekly')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      timeframe === 'weekly' ? 'bg-[#1E40AF] text-white' : 'text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setTimeframe('monthly')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      timeframe === 'monthly' ? 'bg-[#1E40AF] text-white' : 'text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    Monthly
                  </button>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>

            {/* Student Roster Table */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-3 bg-zinc-50 dark:bg-[#0A0A0A] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <span>Roster Students ({filteredClassStudents.length} Enrolled)</span>
                <span className="text-[#1E40AF] dark:text-[#3B82F6]">{selectedDeptLabel} · {selectedProgramme} · {selectedYear}</span>
              </div>

              <div className="max-h-64 overflow-y-auto">
                <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-100 dark:bg-[#0A0A0A] text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5 pl-3">Reg No & Name</th>
                      <th className="p-2.5">Roll No</th>
                      <th className="p-2.5">Present Days</th>
                      <th className="p-2.5">Absent Days</th>
                      <th className="p-2.5">Weekly %</th>
                      <th className="p-2.5 text-right pr-3">Overall %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-semibold">
                    {filteredClassStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-zinc-400 text-xs">
                          No students found in this {selectedShift.toLowerCase()} class.
                        </td>
                      </tr>
                    ) : (
                      filteredClassStudents.map((st) => (
                        <tr key={st.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="p-2.5 pl-3">
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForModal(st)}
                              className="font-bold text-zinc-900 dark:text-zinc-100 block hover:text-[#1E40AF] dark:hover:text-[#3B82F6] hover:underline text-left"
                            >
                              {st.name}
                            </button>
                            <span className="text-[10px] font-mono font-bold text-[#1E40AF] dark:text-[#3B82F6] block">{st.regNo}</span>
                            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 block">{'🐱 '}{st.phone || st.guardianPhone || '—'}</span>
                          </td>
                          <td className="p-2.5 font-mono text-zinc-500">{st.rollNo}</td>
                          <td className="p-2.5 text-emerald-600 font-bold">{st.presentDays} Days</td>
                          <td className="p-2.5 text-rose-600 font-bold">{st.absentDays} Days</td>
                          <td className="p-2.5 font-mono">{st.weeklyPct}%</td>
                          <td className="p-2.5 text-right pr-3 font-mono font-extrabold text-[#1E40AF] dark:text-[#3B82F6]">
                            {st.overallPct}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <StudentDetailModal
        isOpen={!!selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
        student={selectedStudentForModal}
      />
    </div>
  );
};
