import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { academicYearLabel } from '../../services/academicStructure';
import { filteredSlotsForDayOrder } from '../../services/timetableDayOrder';
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
  const { currentUser, timetable, leaveRequests, substitutionRequests, students, subjects, facultyList, setActiveScreen, getPeriodTime, getCurrentDayOrder } = useApp();

  const todayDayName = getTodayDayName();
  const isWeekday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(todayDayName);
  const todayDayOrder = getCurrentDayOrder();

  const todaySlots = useMemo(
    () =>
      filteredSlotsForDayOrder(
        timetable.filter((s) => s.day === todayDayName && s.facultyId === currentUser.id),
        todayDayOrder
      ),
    [timetable, todayDayName, currentUser.id, todayDayOrder]
  );

  const myFaculty = useMemo(
    () => facultyList.find((f) => f.id === currentUser.id),
    [facultyList, currentUser.id]
  );

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending_faculty').length;
  const pendingSubs = substitutionRequests.filter((s) => s.substituteFacultyId === currentUser.id && s.status === 'pending').length;

  const [viewStudentsSlot, setViewStudentsSlot] = useState<{ subjectId: string; subjectCode: string; section: string } | null>(null);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  const viewSlotSubject = viewStudentsSlot
    ? subjects.find((s) => s.id === viewStudentsSlot.subjectId)
    : undefined;

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
      <div className="bg-[#2563EB] dark:bg-[#0A0A0A] border border-[#E2E8F0]/20 dark:border-zinc-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-[#2563EB] dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-full mb-2 inline-block border border-white/10">
            Faculty Portal
          </span>
          <h2 className="text-xl font-bold tracking-tight">Faculty Dashboard</h2>
          <p className="text-xs text-zinc-300 dark:text-zinc-400 mt-1 max-w-md">
            {currentUser.departmentName}
          </p>
        </div>

        <button
          onClick={() => setActiveScreen('my_classes')}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#2563EB] hover:bg-[#F7F9FC] text-xs font-bold rounded-2xl transition-all shadow-lg shrink-0"
        >
          <BookOpen className="w-4 h-4 text-[#2563EB]" />
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
          onClick={() => setActiveScreen('faculty_timetable')}
        />
        <StatCard
          title="Assigned Courses"
          value={`${myFaculty?.assignedSubjectIds.length || 0} Subjects`}
          icon={BookOpen}
          subtitle="Teaching Load"
          color="periwinkle"
          onClick={() => setActiveScreen('my_classes')}
        />
        <StatCard title="Pending Leave Requests" value={pendingLeaves} icon={FileText} subtitle="Awaiting Advisor Review" color="periwinkle" onClick={() => setActiveScreen('leave_queue')} />
        <StatCard title="Substitutions Requested" value={pendingSubs} icon={Repeat} subtitle="Covering for Colleagues" color="periwinkle" onClick={() => setActiveScreen('substitution')} />
      </div>

      {/* Today's Schedule */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] dark:text-zinc-100">
              Today's Class Schedule {isWeekday ? `(${ROMAN_DAYS[todayDayName]})` : '(No Classes - Weekend)'}
            </h3>
            <p className="text-xs text-[#000000] dark:text-[#64748B] dark:text-zinc-400">Active lecture period highlighted</p>
          </div>
          <button
            onClick={() => setActiveScreen('faculty_timetable')}
            className="text-xs font-bold text-[#2563EB] dark:text-[#3B82F6] hover:underline"
          >
            Full Timetable →
          </button>
        </div>

        {!isWeekday || todaySlots.length === 0 ? (
          <div className="p-8 text-center text-[#000000] dark:text-[#64748B] text-xs">
            No classes scheduled for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaySlots.map((slot, idx) => {
              const isActive = idx === 0;
              const enrolledStudents = getEnrolledStudents(slot.subjectId, slot.section);
              const pt = getPeriodTime(slot.periodNumber);
              return (
                <div
                  key={slot.id}
                  className={`p-5 rounded-[24px] border transition-all ${
                    isActive
                      ? 'bg-[#FFFFFF] dark:bg-[#0A0A0A] border-[#2563EB] dark:border-[#3B82F6] shadow-md'
                      : 'bg-[#F7F9FC]/80 dark:bg-zinc-800/40 border-[#E2E8F0]/80 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#3B82F6]">
                      Period {slot.periodNumber} ({pt ? `${pt.start} - ${pt.end}` : `${slot.startTime} - ${slot.endTime}`})
                    </span>
                    {isActive ? (
                      <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[9px] font-bold uppercase rounded-full animate-pulse">
                        Active Now
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#000000] dark:text-[#64748B] font-semibold">Upcoming</span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100">{slot.subjectCode} - {slot.subjectName}</h4>
                  <p className="text-xs text-[#000000] dark:text-[#64748B] dark:text-zinc-400 mt-1">
                    {academicYearLabel(slot.semester)}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#E2E8F0]/80 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-[11px] text-[#000000] dark:text-[#64748B] font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" /> {enrolledStudents.length} Enrolled Students
                    </span>
                    <button
                      onClick={() => setViewStudentsSlot({ subjectId: slot.subjectId, subjectCode: slot.subjectCode, section: slot.section })}
                      className="text-[10px] font-bold text-[#2563EB] dark:text-[#3B82F6] hover:underline flex items-center gap-1"
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
          className="p-4 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-800 rounded-2xl hover:border-[#2563EB] dark:hover:border-[#3B82F6] transition-all text-left flex items-center justify-between group"
        >
          <div>
            <h4 className="text-xs font-bold text-[#0F172A] dark:text-zinc-100">Leave Approvals Queue</h4>
            <p className="text-[10px] text-[#000000] dark:text-[#64748B] mt-0.5">{pendingLeaves} Pending student applications</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6] group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => setActiveScreen('substitution')}
          className="p-4 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-800 rounded-2xl hover:border-[#2563EB] dark:hover:border-[#3B82F6] transition-all text-left flex items-center justify-between group"
        >
          <div>
            <h4 className="text-xs font-bold text-[#0F172A] dark:text-zinc-100">Substitution Requests</h4>
            <p className="text-[10px] text-[#000000] dark:text-[#64748B] mt-0.5">{pendingSubs} Pending colleague requests</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6] group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => setActiveScreen('student_search')}
          className="p-4 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-800 rounded-2xl hover:border-[#2563EB] dark:hover:border-[#3B82F6] transition-all text-left flex items-center justify-between group"
        >
          <div>
            <h4 className="text-xs font-bold text-[#0F172A] dark:text-zinc-100">Student Attendance Search</h4>
            <p className="text-[10px] text-[#000000] dark:text-[#64748B] mt-0.5">Quick search by Reg No or Roll No</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Enrolled Students Modal */}
      <Modal
        isOpen={!!viewStudentsSlot}
        onClose={() => setViewStudentsSlot(null)}
        title={`Enrolled Students: ${viewStudentsSlot?.subjectCode || ''}`}
        subtitle={viewSlotSubject ? academicYearLabel(viewSlotSubject.semester) : ''}
        maxWidth="xl"
      >
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {viewStudentsSlot && getEnrolledStudents(viewStudentsSlot.subjectId, viewStudentsSlot.section).length === 0 ? (
            <p className="text-xs text-[#000000] dark:text-[#64748B] text-center py-4">No students enrolled.</p>
          ) : (
            viewStudentsSlot && getEnrolledStudents(viewStudentsSlot.subjectId, viewStudentsSlot.section).map((s) => (
              <div
                key={s.id}
                className="p-2.5 bg-[#F7F9FC] dark:bg-zinc-800/50 border border-[#E2E8F0]/60 dark:border-zinc-800 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:bg-[#F7F9FC] dark:hover:bg-zinc-700/50 transition-colors"
                onClick={() => setSelectedStudentForModal(s)}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={s.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'}
                    alt={s.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <div>
                    <span className="font-bold text-[#0F172A] dark:text-zinc-100 block">{s.name}</span>
                    <span className="text-[10px] font-mono text-[#2563EB] dark:text-[#3B82F6] font-bold">{s.regNo}</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#000000] dark:text-[#64748B]">Roll: {s.rollNo}</span>
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
