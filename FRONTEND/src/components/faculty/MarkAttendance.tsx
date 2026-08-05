import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceStatus, AttendanceRecord, AttendanceEntry, Student } from '../../types';
import { Modal } from '../common/Modal';
import { StudentDetailModal } from '../common/StudentDetailModal';
import {
  CheckSquare,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Edit3,
  RefreshCw,
  Search,
  Lock,
  Eye
} from 'lucide-react';

export const MarkAttendance: React.FC = () => {
  const { students, subjects, attendanceRecords, markAttendance, currentUser, addToast } = useApp();

  // Faculty can ONLY mark attendance for TODAY and DEFAULT active period
  const todayStr = '2026-08-04'; // Default simulation date or current ISO date
  const defaultPeriod = 2; // Active scheduled period

  const [date] = useState(todayStr);
  const [periodNum] = useState(defaultPeriod);
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || 'sub-cs401');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);

  // Check if an attendance record already exists for today's active period
  const existingRecord = attendanceRecords.find(
    (r) => r.date === date && r.periodNumber === periodNum && r.subjectId === selectedSubjectId
  );

  const [isEditMode, setIsEditMode] = useState(false);

  // Roster entries state initialized with students or existing record
  const [entries, setEntries] = useState<AttendanceEntry[]>(() => {
    if (existingRecord && existingRecord.entries.length > 0) {
      return existingRecord.entries;
    }
    return students.map((s) => ({
      studentId: s.id,
      studentRegNo: s.regNo,
      studentName: s.name,
      status: 'present' as AttendanceStatus,
      remarks: ''
    }));
  });

  const [summaryModalOpen, setSummaryModalOpen] = useState(false);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const handleStatusChange = (studentId: string, status: 'present' | 'absent') => {
    setEntries((prev) =>
      prev.map((e) => (e.studentId === studentId ? { ...e, status } : e))
    );
  };

  const handleBulkMarkPresent = () => {
    setEntries((prev) => prev.map((e) => ({ ...e, status: 'present' })));
  };

  const handleClearAll = () => {
    setEntries((prev) => prev.map((e) => ({ ...e, status: 'absent' })));
  };

  const counts = {
    present: entries.filter((e) => e.status === 'present').length,
    absent: entries.filter((e) => e.status === 'absent').length
  };

  const handleConfirmSubmit = () => {
    const record: AttendanceRecord = {
      id: existingRecord?.id || `att-rec-${date.replace(/-/g, '')}-p${periodNum}`,
      date,
      periodNumber: periodNum,
      subjectId: currentSubject.id,
      subjectCode: currentSubject.code,
      subjectName: currentSubject.name,
      facultyId: currentUser.id,
      facultyName: currentUser.name,
      departmentId: currentSubject.departmentId,
      semester: currentSubject.semester,
      section: 'A',
      roomNo: 'Lab-302',
      entries,
      totalStudents: entries.length,
      presentCount: counts.present,
      absentCount: counts.absent,
      lateCount: 0,
      odCount: 0,
      leaveCount: 0,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    markAttendance(record);
    setSummaryModalOpen(false);
    setIsEditMode(false);
    addToast(
      isEditMode ? 'Attendance Resubmitted' : 'Attendance Submitted',
      `Successfully saved attendance for Period ${periodNum}`,
      'success'
    );
  };

  const filteredEntries = entries.filter(
    (e) =>
      e.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.studentRegNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#313866] dark:text-[#8A92D0]" /> Mark & Resubmit Class Attendance
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Attendance is locked for today's active period. You can mark or edit present/absent statuses on this page for today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkMarkPresent}
            className="px-3.5 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors"
          >
            Mark All Present
          </button>
          <button
            onClick={handleClearAll}
            className="px-3.5 py-2 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold rounded-xl hover:bg-rose-100 transition-colors"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {/* Existing Submission Banner */}
      {existingRecord && !isEditMode && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Attendance Submitted for Today's Period {periodNum} ({date})
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                {existingRecord.presentCount} Present, {existingRecord.absentCount} Absent. You can resubmit status changes for today's class.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditMode(true)}
            className="px-4 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Present / Absent
          </button>
        </div>
      )}

      {/* Default Selector Controls (Fixed / Read-only for active period) */}
      <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
            <Lock className="w-3 h-3 text-zinc-400" /> Today's Date (Default)
          </label>
          <div className="p-2.5 bg-zinc-100 dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-zinc-700 dark:text-zinc-300 text-xs">
            {date} (Locked to Today)
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
            <Lock className="w-3 h-3 text-zinc-400" /> Active Period Slot
          </label>
          <div className="p-2.5 bg-[#F3F4F9] dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-[#313866] dark:text-[#8A92D0] text-xs">
            Period {periodNum} (10:00 AM - 10:50 AM)
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            Assigned Course Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full p-2.5 text-xs font-bold bg-zinc-50 dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-700 rounded-xl"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code} - {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Counts */}
      <div className="grid grid-cols-2 gap-3 text-center text-xs font-bold">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-700 dark:text-emerald-300">
          Present Students: <span className="text-sm font-extrabold">{counts.present}</span>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300">
          Absent Students: <span className="text-sm font-extrabold">{counts.absent}</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter students by name or registration number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-800 rounded-xl"
        />
      </div>

      {/* Roster Cards List */}
      <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Class Roster ({filteredEntries.length} Students)
          </h3>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">
            Click name to view student profile
          </span>
        </div>

        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const studentObj = students.find((s) => s.id === entry.studentId);
            const attPct = studentObj?.overallAttendancePct || 85;

            return (
              <div
                key={entry.studentId}
                className="p-3 bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={studentObj?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'}
                    alt={entry.studentName}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-700 cursor-pointer"
                    onClick={() => studentObj && setSelectedStudentForModal(studentObj)}
                  />
                  <div>
                    <button
                      type="button"
                      onClick={() => studentObj && setSelectedStudentForModal(studentObj)}
                      className="font-bold text-zinc-900 dark:text-zinc-100 text-xs block hover:text-[#313866] dark:hover:text-[#8A92D0] hover:underline text-left"
                    >
                      {entry.studentName}
                    </button>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono text-zinc-500 font-bold">
                        Reg: {entry.studentRegNo} | Roll: {studentObj?.rollNo}
                      </span>
                      {/* Display Attendance Percentage */}
                      <span
                        className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${
                          attPct >= 75
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                        }`}
                      >
                        {attPct}% Att.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Only Present and Absent status buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(entry.studentId, 'present')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                      entry.status === 'present'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Present
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(entry.studentId, 'absent')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                      entry.status === 'absent'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-rose-50 hover:text-rose-600'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Absent
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit / Resubmit Bar */}
      <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-[#161B33]/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
            {isEditMode ? 'Resubmit Attendance Record' : 'Submit Class Attendance Record'}
          </span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {counts.present} Present, {counts.absent} Absent (Total: {entries.length})
          </span>
        </div>

        <button
          onClick={() => setSummaryModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:hover:bg-[#a3a8e0] text-white dark:text-[#0D1127] text-xs font-bold rounded-xl transition-all shadow-md"
        >
          {isEditMode ? <RefreshCw className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {isEditMode ? 'Resubmit Attendance' : 'Submit Attendance'}
        </button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        title={isEditMode ? 'Resubmit Attendance Record' : 'Confirm Attendance Submission'}
        subtitle={`Course: ${currentSubject.code} · Period ${periodNum} (${date})`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-zinc-50 dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
            <div className="flex justify-between font-bold text-sm">
              <span>Present Students:</span>
              <span className="text-emerald-600 dark:text-emerald-400">{counts.present}</span>
            </div>
            <div className="flex justify-between font-bold text-sm">
              <span>Absent Students:</span>
              <span className="text-rose-600 dark:text-rose-400">{counts.absent}</span>
            </div>
          </div>

          <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Saving this record updates student attendance percentages directly.
          </p>

          <button
            onClick={handleConfirmSubmit}
            className="w-full py-3 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] text-white font-bold rounded-xl transition-all shadow-md"
          >
            {isEditMode ? 'Resubmit Attendance' : 'Finalize & Save Record'}
          </button>
        </div>
      </Modal>

      {/* Student Profile Inspector Modal */}
      <StudentDetailModal
        isOpen={!!selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
        student={selectedStudentForModal}
      />
    </div>
  );
};
