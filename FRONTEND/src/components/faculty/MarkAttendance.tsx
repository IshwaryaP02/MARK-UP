import React, { useState, useMemo } from 'react';
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
  Eye,
  BookOpen,
  ArrowLeft
} from 'lucide-react';

const PERIOD_TIMES = [
  { period: 1, start: '09:00', end: '09:55' },
  { period: 2, start: '09:55', end: '10:40' },
  { period: 3, start: '10:40', end: '11:30' },
  { period: 4, start: '11:45', end: '12:45' },
  { period: 5, start: '12:45', end: '13:20' },
];

function getCurrentPeriod(): number {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const mins = h * 60 + m;

  for (const p of PERIOD_TIMES) {
    const [sh, sm] = p.start.split(':').map(Number);
    const [eh, em] = p.end.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    if (mins >= startMins && mins <= endMins) {
      return p.period;
    }
  }

  return 1;
}

function getTodayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

function getPeriodTimeLabel(p: number): string {
  const slot = PERIOD_TIMES.find((t) => t.period === p);
  if (!slot) return '';
  const fmt = (t: string) => {
    const [hh, mm] = t.split(':').map(Number);
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
  };
  return `${fmt(slot.start)} - ${fmt(slot.end)}`;
}

export const MarkAttendance: React.FC = () => {
  const {
    students,
    subjects,
    facultyList,
    attendanceRecords,
    timetable,
    leaveRequests,
    markAttendance,
    currentUser,
    attendanceSubjectId,
    setActiveScreen,
    addToast
  } = useApp();

  const todayStr = getTodayDateStr();
  const currentPeriod = getCurrentPeriod();

  const myFaculty = useMemo(
    () => facultyList.find((f) => f.id === currentUser.id),
    [facultyList, currentUser.id]
  );

  const assignedSubjectIds = myFaculty?.assignedSubjectIds || [];

  const selectedSubject = useMemo(() => {
    if (!attendanceSubjectId) return null;
    if (!assignedSubjectIds.includes(attendanceSubjectId)) return null;
    return subjects.find((s) => s.id === attendanceSubjectId) || null;
  }, [attendanceSubjectId, assignedSubjectIds, subjects]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const existingRecord = useMemo(() => {
    if (!selectedSubject) return null;
    return attendanceRecords.find(
      (r) => r.date === todayStr && r.periodNumber === currentPeriod && r.subjectId === selectedSubject.id
    );
  }, [attendanceRecords, todayStr, currentPeriod, selectedSubject]);

  const subjectSlot = useMemo(() => {
    if (!selectedSubject) return undefined;
    return (
      timetable.find((t) => t.subjectId === selectedSubject.id && t.periodNumber === currentPeriod) ||
      timetable.find((t) => t.subjectId === selectedSubject.id)
    );
  }, [timetable, selectedSubject, currentPeriod]);

  const classSection = subjectSlot?.section || 'A';
  const classRoom = subjectSlot?.roomNo || 'Lab-302';

  const odStudentIds = useMemo(() => {
    if (!selectedSubject) return new Set<string>();
    const approvedLeaves = leaveRequests.filter(
      (l) => l.status === 'approved' && l.departmentId === selectedSubject.departmentId && l.semester === selectedSubject.semester
    );
    const ids = new Set<string>();
    for (const leave of approvedLeaves) {
      if (todayStr >= leave.startDate && todayStr <= leave.endDate) {
        ids.add(leave.studentId);
      }
    }
    return ids;
  }, [leaveRequests, selectedSubject, todayStr]);

  const classStudents = useMemo(() => {
    if (!selectedSubject) return [];
    return students.filter(
      (s) =>
        s.active &&
        s.departmentId === selectedSubject.departmentId &&
        s.semester === selectedSubject.semester
    );
  }, [students, selectedSubject]);

  const [entries, setEntries] = useState<AttendanceEntry[]>(() => {
    if (existingRecord && existingRecord.entries.length > 0) {
      return existingRecord.entries;
    }
    if (classStudents.length > 0) {
      return classStudents.map((s) => ({
        studentId: s.id,
        studentRegNo: s.regNo,
        studentName: s.name,
        status: (odStudentIds.has(s.id) ? 'od' : 'present') as AttendanceStatus,
        remarks: odStudentIds.has(s.id) ? 'HOD-Approved Leave' : ''
      }));
    }
    return [];
  });

  React.useEffect(() => {
    if (!existingRecord && classStudents.length > 0) {
      setEntries(
        classStudents.map((s) => ({
          studentId: s.id,
          studentRegNo: s.regNo,
          studentName: s.name,
          status: (odStudentIds.has(s.id) ? 'od' : 'present') as AttendanceStatus,
          remarks: odStudentIds.has(s.id) ? 'HOD-Approved Leave' : ''
        }))
      );
    } else if (existingRecord && existingRecord.entries.length > 0) {
      setEntries(existingRecord.entries);
    }
  }, [existingRecord, classStudents, odStudentIds]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent') => {
    setEntries((prev) => prev.map((e) => (e.studentId === studentId ? { ...e, status } : e)));
  };

  const handleBulkMarkPresent = () => {
    setEntries((prev) => prev.map((e) => e.status === 'od' ? e : { ...e, status: 'present' as AttendanceStatus }));
  };

  const handleClearAll = () => {
    setEntries((prev) => prev.map((e) => e.status === 'od' ? e : { ...e, status: 'absent' as AttendanceStatus }));
  };

  const counts = {
    present: entries.filter((e) => e.status === 'present').length,
    absent: entries.filter((e) => e.status === 'absent').length,
    od: entries.filter((e) => e.status === 'od').length
  };

  const handleConfirmSubmit = () => {
    if (!selectedSubject) return;

    const record: AttendanceRecord = {
      id: existingRecord?.id || `att-rec-${todayStr.replace(/-/g, '')}-p${currentPeriod}-${selectedSubject.id}`,
      date: todayStr,
      periodNumber: currentPeriod,
      subjectId: selectedSubject.id,
      subjectCode: selectedSubject.code,
      subjectName: selectedSubject.name,
      facultyId: currentUser.id,
      facultyName: currentUser.name,
      departmentId: selectedSubject.departmentId,
      semester: selectedSubject.semester,
      section: classSection,
      roomNo: classRoom,
      entries,
      totalStudents: entries.length,
      presentCount: counts.present,
      absentCount: counts.absent,
      lateCount: 0,
      odCount: counts.od,
      leaveCount: 0,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    markAttendance(record);
    setSummaryModalOpen(false);
    setIsEditMode(false);
    addToast(
      isEditMode ? 'Attendance Resubmitted' : 'Attendance Submitted',
      `Successfully saved attendance for ${selectedSubject.code} (Period ${currentPeriod})`,
      'success'
    );
  };

  const filteredEntries = entries.filter(
    (e) =>
      e.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.studentRegNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!attendanceSubjectId || !selectedSubject) {
    return (
      <div className="space-y-6">
        <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#313866] dark:text-[#8A92D0]" /> Mark Attendance
          </h2>
        </div>
        <div className="p-8 bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No class selected</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Please select a class from <strong>My Classes</strong> to mark attendance.
            </p>
          </div>
          <button
            onClick={() => setActiveScreen('my_classes')}
            className="px-5 py-2.5 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Go to My Classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#313866] dark:text-[#8A92D0]" /> Mark Attendance
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Marking attendance for <strong>{selectedSubject.code}</strong> — Period {currentPeriod} ({getPeriodTimeLabel(currentPeriod)})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveScreen('my_classes')}
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
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
                Attendance Already Submitted for Today's Period {currentPeriod}
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                {existingRecord.presentCount} Present, {existingRecord.absentCount} Absent, {existingRecord.odCount} OD. You can resubmit changes.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditMode(true)}
            className="px-4 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Attendance
          </button>
        </div>
      )}

      {/* Read-only Info Controls */}
      <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
            <Lock className="w-3 h-3 text-zinc-400" /> Today's Date
          </label>
          <div className="p-2.5 bg-zinc-100 dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-zinc-700 dark:text-zinc-300 text-xs">
            {todayStr}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-400" /> Active Period
          </label>
          <div className="p-2.5 bg-[#F3F4F9] dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-[#313866] dark:text-[#8A92D0] text-xs">
            Period {currentPeriod} ({getPeriodTimeLabel(currentPeriod)})
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-zinc-400" /> Assigned Subject
          </label>
          <div className="p-2.5 bg-[#F3F4F9] dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-[#313866] dark:text-[#8A92D0] text-xs">
            {selectedSubject.code} — {selectedSubject.name}
          </div>
        </div>
      </div>

      {/* Summary Counts */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs font-bold">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-700 dark:text-emerald-300">
          Present: <span className="text-sm font-extrabold">{counts.present}</span>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300">
          Absent: <span className="text-sm font-extrabold">{counts.absent}</span>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-700 dark:text-amber-300">
          OD: <span className="text-sm font-extrabold">{counts.od}</span>
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
            const studentObj = classStudents.find((s) => s.id === entry.studentId);
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

                {/* Present and Absent buttons only */}
                <div className="flex items-center gap-2">
                  {entry.status === 'od' ? (
                    <span className="px-3 py-2 text-xs font-bold rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1.5 border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" /> OD (HOD Approved)
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(entry.studentId, 'present')}
                        className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
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
                        className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                          entry.status === 'absent'
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Absent
                      </button>
                    </>
                  )}
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
            {counts.present} Present, {counts.absent} Absent, {counts.od} OD (Total: {entries.length})
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
        subtitle={`${selectedSubject.code} · Period ${currentPeriod} · ${todayStr}`}
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
            <div className="flex justify-between font-bold text-sm">
              <span>OD Students:</span>
              <span className="text-amber-600 dark:text-amber-400">{counts.od}</span>
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
