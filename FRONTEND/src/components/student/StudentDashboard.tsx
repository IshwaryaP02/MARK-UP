import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { StudentDailyAttendanceTrend } from './StudentDailyAttendanceTrend';
import { academicYearLabel } from '../../services/academicStructure';
import { filteredSlotsForDayOrder } from '../../services/timetableDayOrder';
import {
  ShieldCheck,
  AlertTriangle,
  Calendar,
  BookOpen,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { currentUser, subjects, attendanceRecords, leaveRequests, timetable, setActiveScreen, getPeriodTime, getCurrentDayOrder } = useApp();

  // Compute student stats from real attendance records
  const myRecords = attendanceRecords.filter((r) => r.entries.some((e) => e.studentId === currentUser.id));
  const isPresent = (status: string) => status === 'present' || status === 'late' || status === 'od';
  const attendedClasses = myRecords.filter((r) => {
    const e = r.entries.find((x) => x.studentId === currentUser.id);
    return e ? isPresent(e.status) : false;
  }).length;
  const totalClasses = myRecords.length;
  const overallPct = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

  // Safe miss calculator logic
  // Required: attended / (total + x) >= 0.75 => attended >= 0.75 * total + 0.75 * x => x <= (attended - 0.75*total)/0.75
  const maxSafeMisses =
    totalClasses > 0 ? Math.max(0, Math.floor((attendedClasses - 0.75 * totalClasses) / 0.75)) : 0;

  const enrolledSubjects = subjects.filter(
    (s) => s.departmentId === currentUser.departmentId && s.semester === currentUser.semester
  );

  const myLeaves = leaveRequests.filter((l) => l.studentId === currentUser.id || l.studentName === currentUser.name);
  const leaveApproved = myLeaves.filter((l) => l.status === 'approved').length;
  const leavePending = myLeaves.filter((l) => l.status === 'pending_faculty' || l.status === 'pending_hod').length;

  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySlots = filteredSlotsForDayOrder(
    timetable.filter(
      (t) => t.day === dayName && t.semester === currentUser.semester && t.section === currentUser.section
    ),
    getCurrentDayOrder()
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#2563EB] dark:bg-[#0A0A0A] border border-[#E2E8F0]/20 dark:border-zinc-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-[#2563EB] dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-full mb-2 inline-block border border-white/10">
            Student Portal
          </span>
          <h2 className="text-xl font-bold tracking-tight">Student Dashboard</h2>
          <p className="text-xs text-zinc-200 dark:text-zinc-300 mt-1">
            Reg No: <strong className="font-mono text-[#2563EB] dark:text-amber-300">{currentUser.regNo || '—'}</strong>
            <span className="block text-[11px] text-zinc-300 dark:text-zinc-400 mt-0.5">
              Mobile: <strong className="font-mono">{currentUser.phone || '—'}</strong> · Roll No: {currentUser.rollNo || '—'} · {currentUser.semester ? academicYearLabel(currentUser.semester) : '—'}
            </span>
          </p>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance Rate"
          value={`${overallPct}%`}
          icon={ShieldCheck}
          subtitle={
            totalClasses === 0
              ? 'No attendance recorded yet'
              : overallPct >= 75
              ? 'Eligible for End-Sem Exams'
              : 'DANGER: Below 75% Threshold'
          }
          color="periwinkle"
          onClick={() => setActiveScreen('student_attendance')}
        />

        {/* Safe Miss Calculator Box */}
        <div className="bg-[#2563EB]/20 dark:bg-[#0A0A0A] border border-[#2563EB]/40 dark:border-[#232326] rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#3B82F6] block mb-1">
              Attendance Buffer
            </span>
            <div className="text-2xl font-extrabold text-[#0F172A] dark:text-zinc-100">{maxSafeMisses} Classes</div>
            <p className="text-[11px] text-[#1E293B] dark:text-zinc-300 mt-1">
              Classes you can safely miss without dropping below 75%
            </p>
          </div>
          <div className="mt-2 text-[10px] font-bold text-[#2563EB] dark:text-[#3B82F6] bg-[#2563EB]/15 dark:bg-[#2563EB]/20 p-1.5 rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> High Attendance Buffer
          </div>
        </div>

        <StatCard title="Total Lectures Attended" value={`${attendedClasses} / ${totalClasses}`} icon={BookOpen} subtitle="Across All Subjects" color="periwinkle" onClick={() => setActiveScreen('student_attendance')} />
        <StatCard title="Active Leave Applications" value={myLeaves.length} icon={Clock} subtitle={`${leaveApproved} Approved · ${leavePending} Pending`} color="periwinkle" onClick={() => setActiveScreen('student_apply_leave')} />
      </div>

      {/* Daily Attendance Trend (weekly) */}
      <StudentDailyAttendanceTrend />

      {/* Subject-Wise Progress Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-zinc-100">Subject-Wise Attendance Progress</h3>
              <p className="text-xs text-[#000000] dark:text-[#64748B] dark:text-zinc-400">75% minimum threshold mandatory per course</p>
            </div>
            <button
              onClick={() => setActiveScreen('student_attendance')}
              className="text-xs font-bold text-[#2563EB] dark:text-[#3B82F6] hover:underline flex items-center gap-1"
            >
              Detailed Breakdown <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {enrolledSubjects.map((sub) => {
              const subRecords = myRecords.filter((r) => r.subjectId === sub.id);
              const attended = subRecords.filter((r) => {
                const e = r.entries.find((x) => x.studentId === currentUser.id);
                return e ? isPresent(e.status) : false;
              }).length;
              const pct = subRecords.length > 0 ? Math.round((attended / subRecords.length) * 100) : 0;
              const noRecords = subRecords.length === 0;
              const isLow = pct < 75;

              return (
                <div
                  key={sub.id}
                  onClick={() => setActiveScreen('student_attendance')}
                  className="p-3.5 bg-[#F7F9FC]/80 dark:bg-[#0A0A0A] border border-[#E2E8F0]/60 dark:border-zinc-800 rounded-2xl space-y-2 cursor-pointer hover:border-[#2563EB] dark:hover:border-[#3B82F6] transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0F172A] dark:text-zinc-100">
                      <span className="font-mono text-[#2563EB] dark:text-[#3B82F6] mr-2">{sub.code}</span>
                      {sub.name}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        noRecords
                          ? 'text-[#000000] dark:text-[#64748B] dark:text-zinc-500'
                          : isLow
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {noRecords ? '—' : `${pct}%`} {!noRecords && isLow && '(Below 75%)'}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        noRecords ? 'bg-zinc-300 dark:bg-zinc-600' : isLow ? 'bg-rose-500' : 'bg-[#2563EB] dark:bg-[#2563EB]'
                      }`}
                      style={{ width: `${noRecords ? 0 : pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Circular Percentage Overview - Bento Tile */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm flex flex-col items-center justify-between">
          <div className="w-full flex justify-between items-center mb-2">
            <h3 className="font-bold text-[#0F172A] dark:text-zinc-100 text-sm">Attendance Overview</h3>
            <span className="text-xs text-[#000000] dark:text-[#64748B] font-semibold">Semester {currentUser.semester}</span>
          </div>

          <div className="relative w-40 h-40 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
              <circle
                cx="80"
                cy="80"
                r="68"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray="427"
                strokeDashoffset={427 - (427 * overallPct) / 100}
                fill="transparent"
                className="text-[#2563EB] dark:text-[#3B82F6] transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-[#0F172A] dark:text-zinc-100">{overallPct}%</span>
              <span className="text-[10px] text-[#000000] dark:text-[#64748B] font-bold uppercase tracking-widest">Overall</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-3 mt-2">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl">
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Regular</div>
              <div className="text-lg font-bold text-[#0F172A] dark:text-zinc-100">{attendedClasses}</div>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl">
              <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Absent</div>
              <div className="text-lg font-bold text-[#0F172A] dark:text-zinc-100">{totalClasses - attendedClasses}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule Card */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" /> Today's Scheduled Lectures ({dayName})
        </h3>

        {todaySlots.length === 0 ? (
          <p className="text-xs text-[#000000] dark:text-[#64748B] dark:text-zinc-500">No classes scheduled for today.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {todaySlots.map((slot) => {
              const pt = getPeriodTime(slot.periodNumber);
              return (
              <div
                key={slot.id}
                className="p-3 bg-[#2563EB]/10 dark:bg-[#2563EB]/40 border border-[#2563EB]/30 dark:border-[#3B82F6]/40 rounded-xl text-xs space-y-1"
              >
                <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6] block">
                  Period {slot.periodNumber} ({pt ? pt.start : slot.startTime})
                </span>
                <span className="font-bold text-[#0F172A] dark:text-zinc-100 block">
                  {slot.subjectCode} - {slot.subjectName}
                </span>
                <span className="text-[10px] text-[#000000] dark:text-[#64748B]">{slot.facultyName}</span>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
