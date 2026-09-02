import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceRecord, AttendanceEntry } from '../../types';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { BackButton } from '../common/BackButton';
import { Clock, Eye, Edit3, Send, Calendar, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';

export const AttendanceHistory: React.FC = () => {
  const { attendanceRecords, markAttendance, addToast } = useApp();

  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedEntries, setEditedEntries] = useState<AttendanceEntry[]>([]);

  // Filters
  const [filterMode, setFilterMode] = useState<'date' | 'range' | 'monthly'>('date');
  const [singleDate, setSingleDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));

  const inRange = (date: string, from: string, to: string) => {
    if (!from && !to) return true;
    const d = date;
    if (from && to) return d >= from && d <= to;
    if (from) return d >= from;
    return d <= to;
  };

  const filteredRecords = attendanceRecords.filter((rec) => {
    if (filterMode === 'date' && singleDate) return rec.date === singleDate;
    if (filterMode === 'range') return inRange(rec.date, fromDate, toDate);
    if (filterMode === 'monthly' && monthFilter) return rec.date.startsWith(monthFilter);
    return true;
  });

  const totalPresent = filteredRecords.reduce((s, r) => s + r.presentCount, 0);
  const totalAbsent = filteredRecords.reduce((s, r) => s + r.absentCount, 0);
  const totalRecords = filteredRecords.length;
  const totalCount = totalPresent + totalAbsent;
  const attendancePct = totalCount > 0 ? ((totalPresent / totalCount) * 100).toFixed(1) : '0';

  const clearFilters = () => {
    setSingleDate('');
    setFromDate('');
    setToDate('');
    setMonthFilter(new Date().toISOString().slice(0, 7));
  };

  const filterBadge =
    filterMode === 'date'
      ? singleDate || 'Specific Date'
      : filterMode === 'range'
      ? `${fromDate || 'From'} → ${toDate || 'To'}`
      : `${monthFilter}`;

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
      <BackButton />
      {/* Header */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Submitted Attendance Records History
        </h2>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {([
            ['date', 'Specific Date'],
            ['range', 'Date Range'],
            ['monthly', 'Monthly']
          ] as const).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                filterMode === mode
                  ? 'bg-[#1E40AF] dark:bg-[#2563EB] dark:text-[#FFFFFF] text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{filterBadge}</span>
            <button
              onClick={clearFilters}
              className="px-2.5 py-1.5 text-[11px] font-bold text-zinc-500 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {filterMode === 'date' && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
            <input
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              className="p-2 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>
        )}

        {filterMode === 'range' && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
            From
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="p-2 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
            To
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="p-2 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>
        )}

        {filterMode === 'monthly' && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
            <Calendar className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
            Month
            <select
              value={(monthFilter || new Date().toISOString().slice(0, 7)).split('-')[1]}
              onChange={(e) => {
                const y = (monthFilter || new Date().toISOString().slice(0, 7)).split('-')[0];
                setMonthFilter(`${y}-${e.target.value}`);
              }}
              className="p-2 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            Year
            <select
              value={(monthFilter || new Date().toISOString().slice(0, 7)).split('-')[0]}
              onChange={(e) => {
                const m = (monthFilter || new Date().toISOString().slice(0, 7)).split('-')[1];
                setMonthFilter(`${e.target.value}-${m}`);
              }}
              className="p-2 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              {Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - 2 + i)).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-sm">
          <div className="text-xl font-extrabold text-[#1E40AF] dark:text-[#3B82F6]">{totalRecords}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">Records</div>
        </div>
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-sm">
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalPresent}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">Present</div>
        </div>
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-sm">
          <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{totalAbsent}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">Absent</div>
        </div>
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-sm">
          <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">{attendancePct}%</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">Attendance</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
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
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-400 text-xs">
                  No attendance records match the selected filter.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-3.5 pl-4">
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 block">{rec.date}</span>
                    <span className="text-[10px] text-[#1E40AF] dark:text-[#3B82F6] font-semibold">
                      Period {rec.periodNumber}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                    <span className="font-mono text-[#1E40AF] dark:text-[#3B82F6] mr-2">{rec.subjectCode}</span>
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
                        className="p-1.5 text-zinc-500 hover:text-[#1E40AF] hover:bg-[#1E40AF]/10 rounded-lg transition-colors font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={() => handleOpenEdit(rec)}
                        className="p-1.5 text-[#1E40AF] dark:text-[#3B82F6] hover:bg-[#1E40AF]/10 rounded-lg transition-colors font-semibold flex items-center gap-1"
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
      </div>

      {/* Roster Detail Modal */}
      {selectedRecord && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Submitted Roster: ${selectedRecord.subjectCode} (${selectedRecord.date})`}
          subtitle={`Period ${selectedRecord.periodNumber}`}
        >
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {selectedRecord.entries.map((e) => (
              <div
                key={e.studentId}
                className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{e.studentName}</span>
                  <span className="text-[10px] font-mono text-[#1E40AF] dark:text-[#3B82F6] font-bold">{e.studentRegNo}</span>
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
                    <span className="text-[10px] font-mono text-[#1E40AF] dark:text-[#3B82F6] font-bold">{e.studentRegNo}</span>
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
              className="w-full py-2.5 bg-[#1E40AF] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <RefreshCw className="w-4 h-4" /> Resubmit Updated Attendance
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};
