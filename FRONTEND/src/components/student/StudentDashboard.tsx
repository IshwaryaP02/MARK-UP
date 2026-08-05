import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
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
  const { currentUser, subjects, attendanceRecords, leaveRequests, setActiveScreen } = useApp();

  // Compute student stats
  const totalClasses = 120;
  const attendedClasses = 106;
  const overallPct = Math.round((attendedClasses / totalClasses) * 100); // 88%

  // Safe miss calculator logic
  // Required: attended / (total + x) >= 0.75 => attended >= 0.75 * total + 0.75 * x => x <= (attended - 0.75*total)/0.75
  const maxSafeMisses = Math.max(0, Math.floor((attendedClasses - 0.75 * totalClasses) / 0.75));

  const myLeaves = leaveRequests.filter((l) => l.studentId === currentUser.id || l.studentName === currentUser.name);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#313866] dark:bg-[#161B33] border border-zinc-200/20 dark:border-zinc-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-[#8A92D0] dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-full mb-2 inline-block border border-white/10">
            Student Portal
          </span>
          <h2 className="text-xl font-bold tracking-tight">Welcome back, {currentUser.name}</h2>
          <p className="text-xs text-zinc-200 dark:text-zinc-300 mt-1">
            Reg No: <strong className="font-mono text-[#8A92D0] dark:text-amber-300">{currentUser.regNo || '2024CS01'}</strong>
            <span className="block text-[11px] text-zinc-300 dark:text-zinc-400 mt-0.5">
              Mobile: <strong className="font-mono">{currentUser.phone || '+91 98765 43210'}</strong> · Roll No: {currentUser.rollNo || '101'} · Sem {currentUser.semester || 4} - Sec {currentUser.section || 'A'}
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
          subtitle={overallPct >= 75 ? 'Eligible for End-Sem Exams' : 'DANGER: Below 75% Threshold'}
          color="periwinkle"
        />

        {/* Safe Miss Calculator Box */}
        <div className="bg-[#8A92D0]/20 dark:bg-[#2B325C] border border-[#8A92D0]/40 dark:border-[#424B80] rounded-[24px] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#313866] dark:text-[#8A92D0] block mb-1">
              Attendance Buffer
            </span>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">{maxSafeMisses} Classes</div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1">
              Classes you can safely miss without dropping below 75%
            </p>
          </div>
          <div className="mt-2 text-[10px] font-bold text-[#313866] dark:text-[#8A92D0] bg-[#313866]/15 dark:bg-[#8A92D0]/20 p-1.5 rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> High Attendance Buffer
          </div>
        </div>

        <StatCard title="Total Lectures Attended" value={`${attendedClasses} / ${totalClasses}`} icon={BookOpen} subtitle="Semester 4 Total" color="periwinkle" />
        <StatCard title="Active Leave Applications" value={myLeaves.length} icon={Clock} subtitle="1 Approved · 1 Pending" color="periwinkle" />
      </div>

      {/* Subject-Wise Progress Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100">Subject-Wise Attendance Progress</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-400">75% minimum threshold mandatory per course</p>
            </div>
            <button
              onClick={() => setActiveScreen('student_attendance')}
              className="text-xs font-bold text-[#313866] dark:text-[#8A92D0] hover:underline flex items-center gap-1"
            >
              Detailed Breakdown <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {subjects.map((sub) => {
              const pct = sub.code === 'CS401' ? 92 : sub.code === 'CS402' ? 88 : sub.code === 'CS403' ? 70 : 85;
              const isLow = pct < 75;

              return (
                <div
                  key={sub.id}
                  onClick={() => setActiveScreen('student_attendance')}
                  className="p-3.5 bg-zinc-50/80 dark:bg-[#0D1127] border border-zinc-200/60 dark:border-zinc-800 rounded-2xl space-y-2 cursor-pointer hover:border-[#313866] dark:hover:border-[#8A92D0] transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-800 dark:text-zinc-100">
                      <span className="font-mono text-[#313866] dark:text-[#8A92D0] mr-2">{sub.code}</span>
                      {sub.name}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        isLow ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {pct}% {isLow && '(Below 75%)'}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isLow ? 'bg-rose-500' : 'bg-[#313866] dark:bg-[#8A92D0]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Circular Percentage Overview - Bento Tile */}
        <div className="lg:col-span-4 bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm flex flex-col items-center justify-between">
          <div className="w-full flex justify-between items-center mb-2">
            <h3 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">Attendance Overview</h3>
            <span className="text-xs text-zinc-400 font-semibold">Semester 4</span>
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
                className="text-[#313866] dark:text-[#8A92D0] transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-zinc-800 dark:text-zinc-100">{overallPct}%</span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Overall</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-3 mt-2">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl">
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Regular</div>
              <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100">106</div>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl">
              <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Absent</div>
              <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100">14</div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule Card */}
      <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#313866] dark:text-[#8A92D0]" /> Today's Scheduled Lectures (Monday)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-[#313866]/10 dark:bg-[#313866]/40 border border-[#313866]/30 dark:border-[#8A92D0]/40 rounded-xl text-xs space-y-1">
            <span className="font-mono font-bold text-[#313866] dark:text-[#8A92D0] block">Period 1 (09:00 AM)</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 block">CS401 - Data Structures</span>
            <span className="text-[10px] text-zinc-500">Hall: Lab-302 · Prof. Sarah Jenkins</span>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs space-y-1">
            <span className="font-mono font-bold text-zinc-500 block">Period 2 (10:00 AM)</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 block">CS402 - Database Systems</span>
            <span className="text-[10px] text-zinc-500">Hall: LH-101 · Dr. Robert Chen</span>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs space-y-1">
            <span className="font-mono font-bold text-zinc-500 block">Period 3 (11:00 AM)</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 block">CS403 - Computer Networks</span>
            <span className="text-[10px] text-zinc-500">Hall: LH-102 · Dr. Amanda Miller</span>
          </div>
        </div>
      </div>
    </div>
  );
};
