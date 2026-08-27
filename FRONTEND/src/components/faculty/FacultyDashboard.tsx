import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { Modal } from '../common/Modal';
import { StudentDetailModal } from '../common/StudentDetailModal';
import { Student } from '../../types';
import {
  BookOpen,
  FileText,
  Repeat,
  ArrowRight,
  Calendar,
  Eye,
  Users
} from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const ROMAN_DAYS: Record<string, string> = {
  Monday: 'I',
  Tuesday: 'II',
  Wednesday: 'III',
  Thursday: 'IV',
  Friday: 'V',
  Saturday: 'VI'
};

function getTodayDayName(): string {
  const dayIndex = new Date().getDay();
  return DAY_NAMES[dayIndex];
}

export const FacultyDashboard: React.FC = () => {
  const { currentUser, timetable, leaveRequests, substitutionRequests, students, subjects, facultyList, setActiveScreen } = useApp();

  const todayDayName = getTodayDayName();
  const isWeekday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(todayDayName);

  const todaySlots = useMemo(
    () => timetable.filter((s) => s.day === todayDayName && s.facultyId === currentUser.id),
    [timetable, todayDayName, currentUser.id]
  );

  const myFaculty = useMemo(
    () => facultyList.find((f) => f.id === currentUser.id),
    [facultyList, currentUser.id]
  );

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending_faculty').length;
  const pendingSubs = substitutionRequests.filter((s) => s.substituteFacultyId === currentUser.id && s.status === 'pending').length;

  const [viewStudentsSlot, setViewStudentsSlot] = useState<{ subjectId: string; subjectCode: string; section: string } | null>(null);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  const getEnrolledStudents = (subjectId: string, section?: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return [];
    return students.filter(
      (s) => s.active && s.departmentId === subject.departmentId && s.semester === subject.semester && (!section || s.section === section)
    );
  };

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
            {currentUser.departmentName} · {myFaculty?.designation || 'Faculty'}
          </p>
        </div>

        <button
          onClick={() => setActiveScreen('my_classes')}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#313866] hover:bg-zinc-100 text-xs font-bold rounded-2xl transition-all shadow-lg shrink-0"
        >
          <BookOpen className="w-4 h-4 text-[#313866]" />
          Go to My Classes
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Lectures"
          value={todaySlots.length}
          icon={Calendar}
          subtitle={isWeekday ? `Schedule (${ROMAN_DAYS[todayDayName]})` : 'Weekend'}
          color="periwinkle"
        />
        <StatCard
          title="Assigned Courses"
          value={`${myFaculty?.assignedSubjectIds.length || 0} Subjects`}
          icon={BookOpen}
          subtitle="Teaching Load"
          color="periwinkle"
        />
        <StatCard title="Pending Leave Requests" value={pendingLeaves} icon={FileText} subtitle="Awaiting Advisor Review" color="periwinkle" />
        <StatCard title="Substitutions Requested" value={pendingSubs} icon={Repeat} subtitle="Covering for Colleagues" color="periwinkle" />
      </div>

      {/* Today's Schedule */}
      <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Today's Class Schedule {isWeekday ? `(${ROMAN_DAYS[todayDayName]})` : '(No Classes - Weekend)'}
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-400">Active lecture period highlighted</p>
          </div>
          <button
            onClick={() => setActiveScreen('faculty_timetable')}
            className="text-xs font-bold text-[#313866] dark:text-[#8A92D0] hover:underline"
          >
            Full Timetable →
          </button>
        </div>

        {!isWeekday || todaySlots.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs">
            No classes scheduled for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaySlots.map((slot, idx) => {
              const isActive = idx === 0;
              const enrolledStudents = getEnrolledStudents(slot.subjectId, slot.section);
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
                    <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" /> {enrolledStudents.length} Enrolled Students
                    </span>
                    <button
                      onClick={() => setViewStudentsSlot({ subjectId: slot.subjectId, subjectCode: slot.subjectCode, section: slot.section })}
                      className="text-[10px] font-bold text-[#313866] dark:text-[#8A92D0] hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

      {/* Enrolled Students Modal */}
      <Modal
        isOpen={!!viewStudentsSlot}
        onClose={() => setViewStudentsSlot(null)}
        title={`Enrolled Students: ${viewStudentsSlot?.subjectCode || ''}`}
        subtitle={`Section ${viewStudentsSlot?.section || ''}`}
        maxWidth="xl"
      >
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {viewStudentsSlot && getEnrolledStudents(viewStudentsSlot.subjectId, viewStudentsSlot.section).length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">No students enrolled.</p>
          ) : (
            viewStudentsSlot && getEnrolledStudents(viewStudentsSlot.subjectId, viewStudentsSlot.section).map((s) => (
              <div
                key={s.id}
                className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
                onClick={() => setSelectedStudentForModal(s)}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={s.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'}
                    alt={s.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{s.name}</span>
                    <span className="text-[10px] font-mono text-[#313866] dark:text-[#8A92D0] font-bold">{s.regNo}</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-zinc-500">Roll: {s.rollNo}</span>
              </div>
            ))
          )}
        </div>
      </Modal>

      <StudentDetailModal
        isOpen={!!selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
        student={selectedStudentForModal}
      />
    </div>
  );
};
