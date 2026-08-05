import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import {
  CheckSquare,
  Clock,
  BookOpen,
  FileText,
  Repeat,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Calendar
} from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const { currentUser, timetable, leaveRequests, substitutionRequests, setActiveScreen } = useApp();

  const myFacId = currentUser.id;

  // Filter today's timetable slots for this faculty
  const todaySlots = timetable.filter((s) => s.day === 'Monday'); // Demo day: Monday

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending_faculty').length;
  const pendingSubs = substitutionRequests.filter((s) => s.substituteFacultyId === myFacId && s.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#313866] dark:bg-[#161B33] border border-zinc-200/20 dark:border-zinc-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-[#8A92D0] dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-full mb-2 inline-block border border-white/10">
            Faculty Portal
          </span>
          <h2 className="text-xl font-bold tracking-tight">Welcome, {currentUser.name}</h2>
          <p className="text-xs text-zinc-300 dark:text-zinc-400 mt-1 max-w-md">
            {currentUser.departmentName} · Assistant Professor
          </p>
        </div>

        <button
          onClick={() => setActiveScreen('mark_attendance')}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#313866] hover:bg-zinc-100 text-xs font-bold rounded-2xl transition-all shadow-lg shrink-0"
        >
          <CheckSquare className="w-4 h-4 text-[#313866]" />
          Mark Attendance Now
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Lectures" value={todaySlots.length} icon={Calendar} subtitle="Monday Schedule" color="periwinkle" />
        <StatCard title="Assigned Courses" value="2 Subjects" icon={BookOpen} subtitle="CS401 & CS404" color="periwinkle" />
        <StatCard title="Pending Leave Requests" value={pendingLeaves} icon={FileText} subtitle="Awaiting Advisor Review" color="periwinkle" />
        <StatCard title="Substitutions Requested" value={pendingSubs} icon={Repeat} subtitle="Covering for Colleagues" color="periwinkle" />
      </div>

      {/* Today's Schedule - Currently Active Highlight */}
      <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Today's Class Schedule (Monday)</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-400">Time-gated active lecture period highlighted</p>
          </div>
          <button
            onClick={() => setActiveScreen('faculty_timetable')}
            className="text-xs font-bold text-[#313866] dark:text-[#8A92D0] hover:underline"
          >
            Full Timetable →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {todaySlots.map((slot, idx) => {
            const isActive = idx === 0; // Highlight period 1 as current active period
            return (
              <div
                key={slot.id}
                className={`p-5 rounded-[24px] border transition-all ${
                  isActive
                    ? 'bg-[#F3F4F9] dark:bg-[#0D1127] border-[#313866] dark:border-[#8A92D0] shadow-md'
                    : 'bg-zinc-50/80 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#313866] dark:text-[#8A92D0]">
                    Period {slot.periodNumber} ({slot.startTime} - {slot.endTime})
                  </span>
                  {isActive ? (
                    <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[9px] font-bold uppercase rounded-full animate-pulse">
                      Active Now
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 font-semibold">Upcoming</span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{slot.subjectCode} - {slot.subjectName}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Room: <strong className="text-zinc-800 dark:text-zinc-200">{slot.roomNo}</strong> · Sec: {slot.section}
                </p>

                <div className="mt-4 pt-3 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 font-medium">60 Enrolled Students</span>
                  <button
                    onClick={() => setActiveScreen('mark_attendance')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#313866] hover:bg-[#161B33] text-white shadow-md'
                        : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100'
                    }`}
                  >
                    Mark Attendance
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveScreen('leave_queue')}
          className="p-4 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-[#313866] dark:hover:border-[#8A92D0] transition-all text-left flex items-center justify-between group"
        >
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Leave Approvals Queue</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">{pendingLeaves} Pending student applications</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#313866] dark:text-[#8A92D0] group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => setActiveScreen('substitution')}
          className="p-4 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-[#313866] dark:hover:border-[#8A92D0] transition-all text-left flex items-center justify-between group"
        >
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Substitution Requests</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">{pendingSubs} Pending colleague requests</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#313866] dark:text-[#8A92D0] group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => setActiveScreen('student_search')}
          className="p-4 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-[#313866] dark:hover:border-[#8A92D0] transition-all text-left flex items-center justify-between group"
        >
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Student Attendance Search</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">Quick search by Reg No or Roll No</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#313866] dark:text-[#8A92D0] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
