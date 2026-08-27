import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, Users, Award, ShieldCheck, CheckSquare, Calendar, GraduationCap } from 'lucide-react';

export const MyClasses: React.FC = () => {
  const { subjects, students, facultyList, currentUser, timetable, attendanceRecords, setActiveScreen, setAttendanceSubjectId } = useApp();

  const myFaculty = useMemo(
    () => facultyList.find((f) => f.id === currentUser.id),
    [facultyList, currentUser.id]
  );

  const assignedSubjectIds = myFaculty?.assignedSubjectIds || [];
  const tutorFor = myFaculty?.tutorFor;

  const assignedSubjects = useMemo(
    () => subjects.filter((s) => assignedSubjectIds.includes(s.id)),
    [subjects, assignedSubjectIds]
  );

  const todayDay = (() => {
    const dayIndex = new Date().getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[dayIndex];
  })();

  const todaySlots = useMemo(
    () => timetable.filter((s) => s.day === todayDay),
    [timetable, todayDay]
  );

  const getStudentCountForSubject = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return 0;
    return students.filter(
      (s) => s.departmentId === subject.departmentId && s.semester === subject.semester
    ).length;
  };

  const getAttendanceStats = (subjectId: string) => {
    const records = attendanceRecords.filter(
      (r) => r.subjectId === subjectId && r.facultyId === currentUser.id
    );
    if (records.length === 0) return { held: 0, avgPct: 0 };
    const totalPresent = records.reduce((sum, r) => sum + r.presentCount, 0);
    const totalStudents = records.reduce((sum, r) => sum + r.totalStudents, 0);
    const avgPct = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;
    return { held: records.length, avgPct };
  };

  const handleMarkAttendance = (subjectId: string) => {
    setAttendanceSubjectId(subjectId);
    setActiveScreen('mark_attendance');
  };

  const tutorClassStudents = useMemo(() => {
    if (!tutorFor) return [];
    return students.filter(
      (s) => s.active && s.semester === tutorFor.semester && s.section === tutorFor.section
    );
  }, [students, tutorFor]);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          My Assigned Classes
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Classes and subjects assigned to you by Admin. Mark attendance only for your assigned classes.
        </p>
      </div>

      {/* Tutor Class Section */}
      {tutorFor && (
        <div className="bg-white dark:bg-[#21284C] border-2 border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-amber-100 dark:border-amber-900/30">
            <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Tutor Class</h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Class you are assigned as Tutor for</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
            <div>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Semester {tutorFor.semester} · Section {tutorFor.section}
              </span>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {tutorClassStudents.length} students in this class
              </p>
            </div>
            <button
              onClick={() => setActiveScreen('tutor_circular')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" /> Send Circular
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2.5 bg-zinc-50 dark:bg-[#161B33]/60 rounded-xl">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{tutorClassStudents.length}</span>
              <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                <Users className="w-3 h-3" /> Students
              </span>
            </div>
            <div className="p-2.5 bg-zinc-50 dark:bg-[#161B33]/60 rounded-xl">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Sem {tutorFor.semester} · Sec {tutorFor.section}</span>
              <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                <Award className="w-3 h-3" /> Class
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Teaching Classes */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
          Teaching Classes ({assignedSubjects.length})
        </h3>
      </div>

      {assignedSubjects.length === 0 ? (
        <div className="p-8 bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl text-center">
          <BookOpen className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">No subjects assigned to you yet.</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Contact your administrator to get subjects assigned.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedSubjects.map((sub) => {
            const studentCount = getStudentCountForSubject(sub.id);
            const stats = getAttendanceStats(sub.id);
            const hasTodaySlot = todaySlots.some((s) => s.subjectId === sub.id);

            return (
              <div
                key={sub.id}
                className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#313866] dark:text-[#8A92D0] block">
                      {sub.code} · Sem {sub.semester}
                    </span>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{sub.name}</h3>
                  </div>
                  <span className="px-2.5 py-1 bg-[#313866]/10 text-[#313866] dark:bg-[#313866]/50 dark:text-[#8A92D0] text-xs font-bold rounded-lg">
                    {sub.credits} Credits
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-zinc-100 dark:border-[#2D376A] text-xs">
                  <div className="p-2.5 bg-zinc-50 dark:bg-[#161B33]/60 rounded-xl">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{studentCount}</span>
                    <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                      <Users className="w-3 h-3" /> Students
                    </span>
                  </div>
                  <div className="p-2.5 bg-zinc-50 dark:bg-[#161B33]/60 rounded-xl">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{sub.totalClassesHeld}</span>
                    <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                      <BookOpen className="w-3 h-3" /> Lectures Held
                    </span>
                  </div>
                  <div className="p-2.5 bg-zinc-50 dark:bg-[#161B33]/60 rounded-xl">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">{stats.avgPct > 0 ? `${stats.avgPct}%` : '--'}</span>
                    <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3" /> Avg Attendance
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkAttendance(sub.id)}
                    className="flex-1 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckSquare className="w-4 h-4" /> Mark Attendance
                  </button>
                  {hasTodaySlot && (
                    <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-lg flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Today
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
