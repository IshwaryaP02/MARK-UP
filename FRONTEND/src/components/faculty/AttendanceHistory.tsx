import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceRecord, AttendanceEntry } from '../../types';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { Clock, Eye, Edit3, Send, Calendar, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';

export const AttendanceHistory: React.FC = () => {
  const { attendanceRecords, markAttendance, addToast } = useApp();

  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedEntries, setEditedEntries] = useState<AttendanceEntry[]>([]);

  const handleOpenEdit = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setEditedEntries([...record.entries]);
    setEditModalOpen(true);
  };

  const handleStatusToggle = (studentId: string, newStatus: 'present' | 'absent') => {
    setEditedEntries((prev) =>
      prev.map((e) => (e.studentId === studentId ? { ...e, status: newStatus } : e))
    );
  };

  const handleResubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const presentCount = editedEntries.filter((e) => e.status === 'present').length;
    const absentCount = editedEntries.filter((e) => e.status === 'absent').length;

    const updatedRecord: AttendanceRecord = {
      ...selectedRecord,
      entries: editedEntries,
      presentCount,
      absentCount,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    markAttendance(updatedRecord);
    setEditModalOpen(false);
    addToast('Attendance Resubmitted', 'Updated student status saved directly', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Submitted Attendance Records History
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Review past attendance records or directly edit and resubmit if a student arrived after initial submission.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3.5 pl-4">Date & Period</th>
              <th className="p-3.5">Subject Course</th>
              <th className="p-3.5">Attendance Breakdown</th>
              <th className="p-3.5">Submitted Time</th>
              <th className="p-3.5 text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {attendanceRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-400 text-xs">
                  No attendance records submitted yet.
                </td>
              </tr>
            ) : (
              attendanceRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-3.5 pl-4">
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 block">{rec.date}</span>
                    <span className="text-[10px] text-[#313866] dark:text-[#8A92D0] font-semibold">
                      Period {rec.periodNumber} ({rec.roomNo || 'Room LH-1'})
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                    <span className="font-mono text-[#313866] dark:text-[#8A92D0] mr-2">{rec.subjectCode}</span>
                    {rec.subjectName}
                  </td>
                  <td className="p-3.5">
                    <div className="flex gap-2 font-semibold text-[11px]">
                      <span className="text-emerald-600 font-bold">{rec.presentCount} Present</span>
                      <span className="text-rose-600 font-bold">{rec.absentCount} Absent</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-zinc-500 font-mono text-[11px]">{rec.submittedAt}</td>
                  <td className="p-3.5 text-right pr-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedRecord(rec);
                          setDetailModalOpen(true);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-[#313866] hover:bg-[#313866]/10 rounded-lg transition-colors font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={() => handleOpenEdit(rec)}
                        className="p-1.5 text-[#313866] dark:text-[#8A92D0] hover:bg-[#313866]/10 rounded-lg transition-colors font-semibold flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit & Resubmit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Roster Detail Modal */}
      {selectedRecord && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Submitted Roster: ${selectedRecord.subjectCode} (${selectedRecord.date})`}
          subtitle={`Period ${selectedRecord.periodNumber} · Room ${selectedRecord.roomNo}`}
        >
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {selectedRecord.entries.map((e) => (
              <div
                key={e.studentId}
                className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{e.studentName}</span>
                  <span className="text-[10px] font-mono text-[#313866] dark:text-[#8A92D0] font-bold">{e.studentRegNo}</span>
                </div>
                <span
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase ${
                    e.status === 'present'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  {e.status}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Edit & Resubmit Modal */}
      {selectedRecord && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit & Resubmit Attendance Record"
          subtitle={`Course: ${selectedRecord.subjectCode} · ${selectedRecord.date} Period ${selectedRecord.periodNumber}`}
          maxWidth="xl"
        >
          <form onSubmit={handleResubmit} className="space-y-4">
            <p className="text-xs text-zinc-500">
              Update student attendance below (e.g. mark absent student as present if they arrived late) and click Resubmit.
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2">
              {editedEntries.map((e) => (
                <div
                  key={e.studentId}
                  className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{e.studentName}</span>
                    <span className="text-[10px] font-mono text-[#313866] dark:text-[#8A92D0] font-bold">{e.studentRegNo}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(e.studentId, 'present')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        e.status === 'present'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(e.studentId, 'absent')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        e.status === 'absent'
                          ? 'bg-rose-600 text-white'
                          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <RefreshCw className="w-4 h-4" /> Resubmit Updated Attendance
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};
