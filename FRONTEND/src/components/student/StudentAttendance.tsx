import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, AlertTriangle, BookOpen, ChevronRight, ArrowLeft, Calendar, CheckCircle2, XCircle, LayoutGrid } from 'lucide-react';
import { Subject, AttendanceStatus } from '../../types';

interface SessionLog {
  id: number;
  date: string;
  sessionNumber: number;
  status: 'present' | 'absent';
}

export const StudentAttendance: React.FC = () => {
  const { subjects, attendanceRecords, currentUser, setActiveScreen } = useApp();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'attendance'>('attendance');

  const myRecords = useMemo(
    () => attendanceRecords.filter((r) => r.entries.some((e) => e.studentId === currentUser.id)),
    [attendanceRecords, currentUser.id]
  );

  const enrolledSubjects = useMemo(
    () =>
      subjects.filter(
        (s) => s.departmentId === currentUser.departmentId && s.semester === currentUser.semester
      ),
    [subjects, currentUser.departmentId, currentUser.semester]
  );

  const isPresentStatus = (status: AttendanceStatus): boolean =>
    status === 'present' || status === 'late' || status === 'od';

  // Real day-wise session logs derived from attendance records
  const getSubjectSessions = (subjectCode: string): SessionLog[] =>
    myRecords
      .filter((r) => r.subjectCode === subjectCode)
      .map((r, idx) => {
        const entry = r.entries.find((e) => e.studentId === currentUser.id);
        return {
          id: idx + 1,
          date: r.date,
          sessionNumber: r.periodNumber,
          status: entry && isPresentStatus(entry.status) ? ('present' as const) : ('absent' as const)
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

  const subjectStats = (code: string) => {
    const recs = myRecords.filter((r) => r.subjectCode === code);
    const attended = recs.filter((r) => {
      const entry = r.entries.find((e) => e.studentId === currentUser.id);
      return entry ? isPresentStatus(entry.status) : false;
    }).length;
    return { total: recs.length, attended, pct: recs.length ? Math.round((attended / recs.length) * 100) : 0 };
  };

  // Calculate total metrics across ALL enrolled subjects
  let totalClassesHeldAll = 0;
  let totalAttendedAll = 0;

  enrolledSubjects.forEach((sub) => {
    const s = subjectStats(sub.code);
    totalClassesHeldAll += s.total;
    totalAttendedAll += s.attended;
  });

  const overallAttendancePct = totalClassesHeldAll > 0 ? Math.round((totalAttendedAll / totalClassesHeldAll) * 100) : 0;
  const isOverallEligible = overallAttendancePct >= 75;

  // Selected Subject Detail View matching user's screenshot
  if (selectedSubject) {
    const sessionLogs = getSubjectSessions(selectedSubject.code);
    const presentCount = sessionLogs.filter((s) => s.status === 'present').length;
    const absentCount = sessionLogs.filter((s) => s.status === 'absent').length;
    const totalSessions = sessionLogs.length;
    const subjectPct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    return (
      <div className="space-y-6">
        {/* Navigation back */}
        <button
          onClick={() => setSelectedSubject(null)}
          className="flex items-center gap-2 text-xs font-bold text-[#313866] dark:text-[#8A92D0] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Subjects
        </button>

        {/* Subject Detail Container matching screenshot design */}
        <div className="bg-[#161B33] border border-zinc-800 rounded-3xl p-6 text-white shadow-xl space-y-6">
          {/* Header Title & Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {selectedSubject.code} – {selectedSubject.name.toUpperCase()}
                </h2>
                <span className="p-1.5 bg-[#313866] rounded-lg text-[#8A92D0]">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Semester {selectedSubject.semester} · {selectedSubject.facultyName || 'Faculty'}
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#0D1127] rounded-xl border border-zinc-800 self-start">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'overview' ? 'bg-[#313866] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('topics')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'topics' ? 'bg-[#313866] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Topics
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === 'attendance' ? 'bg-amber-400 text-[#0D1127]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Attendance
              </button>
            </div>
          </div>

          {activeTab === 'attendance' ? (
            <>
              {/* Metric Cards Row (Plain backgrounds, matching palette) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-[#0D1127] border border-zinc-800 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    TOTAL SESSIONS
                  </span>
                  <span className="text-2xl font-black text-white">{totalSessions}</span>
                </div>

                <div className="p-4 bg-[#0D1127] border border-zinc-800 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    PRESENT
                  </span>
                  <span className="text-2xl font-black text-emerald-400">{presentCount}</span>
                </div>

                <div className="p-4 bg-[#0D1127] border border-zinc-800 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    ABSENT
                  </span>
                  <span className="text-2xl font-black text-rose-400">{absentCount}</span>
                </div>

                <div className="p-4 bg-[#0D1127] border border-zinc-800 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    ATTENDANCE %
                  </span>
                  <span className="text-2xl font-black text-white">{subjectPct}.00%</span>
                </div>
              </div>

              {/* Session-Wise Attendance Table */}
              {sessionLogs.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 bg-[#0D1127] border border-zinc-800 rounded-2xl">
                  <p className="text-sm font-bold text-zinc-200">No Attendance Sessions Yet</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Sessions for {selectedSubject.code} will appear here once faculty mark attendance.
                  </p>
                </div>
              ) : (
              <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-[#0D1127]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#161B33] border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5 pl-5">S.NO</th>
                      <th className="p-3.5">DATE</th>
                      <th className="p-3.5">SESSION</th>
                      <th className="p-3.5 text-right pr-5">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 font-semibold text-zinc-200">
                    {sessionLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#161B33]/80 transition-colors">
                        <td className="p-3.5 pl-5 font-mono text-zinc-400">{log.id}</td>
                        <td className="p-3.5 font-bold">{log.date}</td>
                        <td className="p-3.5 font-mono text-zinc-300">{log.sessionNumber}</td>
                        <td className="p-3.5 text-right pr-5">
                          {log.status === 'present' ? (
                            <span className="inline-flex items-center px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold text-[11px] rounded-lg">
                              Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 bg-rose-950/80 text-rose-400 border border-rose-800/60 font-bold text-[11px] rounded-lg">
                              Absent
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-zinc-400 bg-[#0D1127] border border-zinc-800 rounded-2xl">
              <p className="text-sm font-bold text-zinc-200">Course Syllabus & Topic Breakdown</p>
              <p className="text-xs text-zinc-400 mt-1">12 Modules Completed · 4 Modules Upcoming in Semester 4</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Primary Subjects Overview View
  return (
    <div className="space-y-6">
      <button
        onClick={() => setActiveScreen('dashboard')}
        className="flex items-center gap-2 text-xs font-bold text-[#313866] dark:text-[#8A92D0] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Subject-Wise Attendance Breakdown
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Click any course subject to view session-by-session day-wise present/absent logs
        </p>
      </div>

      {/* Main Table listing enrolled subjects */}
      <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-[#0D1127] border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3.5 pl-4">S.NO</th>
              <th className="p-3.5">Subject Code & Name</th>
              <th className="p-3.5">Lead Instructor</th>
              <th className="p-3.5">Attended / Total</th>
              <th className="p-3.5">Attendance %</th>
              <th className="p-3.5 text-right pr-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {enrolledSubjects.map((sub, idx) => {
              const stats = subjectStats(sub.code);
              const pct = stats.pct;
              const attendedCount = stats.attended;
              const noRecords = stats.total === 0;

              return (
                <tr
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub)}
                  className="hover:bg-zinc-50/80 dark:hover:bg-[#0D1127]/60 transition-colors cursor-pointer group"
                >
                  <td className="p-3.5 pl-4 font-mono font-bold text-zinc-400">{idx + 1}</td>
                  <td className="p-3.5 font-bold">
                    <span className="font-mono text-[#313866] dark:text-[#8A92D0] mr-2">{sub.code}</span>
                    <span className="text-zinc-900 dark:text-zinc-100 group-hover:text-[#313866] dark:group-hover:text-[#8A92D0] transition-colors">
                      {sub.name}
                    </span>
                  </td>
                  <td className="p-3.5 text-zinc-600 dark:text-zinc-300 font-medium">{sub.facultyName || 'Faculty'}</td>
                  <td className="p-3.5 font-mono font-bold text-zinc-800 dark:text-zinc-200">
                    {noRecords ? '—' : `${attendedCount} / ${stats.total}`}
                  </td>
                  <td className="p-3.5 font-extrabold text-sm">
                    <span className={noRecords ? 'text-zinc-400 dark:text-zinc-500' : pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {noRecords ? '—' : `${pct}%`}
                    </span>
                  </td>
                  <td className="p-3.5 text-right pr-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubject(sub);
                      }}
                      className="px-3 py-1.5 bg-[#F3F4F9] dark:bg-[#0D1127] text-[#313866] dark:text-[#8A92D0] hover:bg-[#313866] hover:text-white dark:hover:bg-[#8A92D0] dark:hover:text-[#0D1127] text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1 border border-zinc-200 dark:border-zinc-700"
                    >
                      View Sessions <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* OVERALL EXAM ELIGIBILITY SUMMARY CARD AT END */}
      <div className="p-5 bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
            Overall University Exam Eligibility Status
          </span>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              {overallAttendancePct}% Cumulative Attendance
            </span>
            <span className="text-xs font-mono text-zinc-500">
              ({totalAttendedAll} / {totalClassesHeldAll} Total Sessions Attended Across All Courses)
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Official university regulation mandates a minimum overall threshold of 75% for hall ticket issuance.
          </p>
        </div>

        <div>
          {totalClassesHeldAll === 0 ? (
            <div className="px-4 py-2.5 bg-zinc-50 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-bold text-xs rounded-xl flex items-center gap-2 shrink-0">
              <BookOpen className="w-4 h-4 text-zinc-400" />
              No Attendance Data Recorded Yet
            </div>
          ) : isOverallEligible ? (
            <div className="px-4 py-2.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 font-bold text-xs rounded-xl flex items-center gap-2 shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Eligible for End-Sem Examinations (≥ 75%)
            </div>
          ) : (
            <div className="px-4 py-2.5 bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 font-bold text-xs rounded-xl flex items-center gap-2 shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Ineligible / Condonation Required (&lt; 75%)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
