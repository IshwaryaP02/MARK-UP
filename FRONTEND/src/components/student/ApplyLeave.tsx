import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LeaveType, LeaveRequest } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { FileText, Send, Paperclip, Calendar, CheckCircle2, Clock, ArrowLeft, Trash2 } from 'lucide-react';

export const ApplyLeave: React.FC = () => {
  const { currentUser, leaveRequests, submitLeaveRequest, deleteLeaveRequest, setActiveScreen, addToast } = useApp();

  const today = new Date();
  const fmtDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [leaveType, setLeaveType] = useState<LeaveType>('medical');
  const [startDate, setStartDate] = useState(fmtDate(today));
  const [endDate, setEndDate] = useState(fmtDate(tomorrow));
  const [reason, setReason] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const myLeaves = leaveRequests.filter((l) => l.studentId === currentUser.id || l.studentName === currentUser.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
    const totalDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);

    const newLeave: LeaveRequest = {
      id: `leave-${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentRegNo: currentUser.regNo || '2024CS01',
      departmentId: currentUser.departmentId || 'dept-cs',
      semester: currentUser.semester || 4,
      section: currentUser.section || 'A',
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      attachmentUrl: attachmentUrl || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600',
      status: 'pending_faculty',
      createdAt: new Date().toLocaleDateString()
    };

    submitLeaveRequest(newLeave);
    setReason('');
    setAttachmentUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <button
        onClick={() => setActiveScreen('dashboard')}
        className="flex items-center gap-2 text-xs font-bold text-[#313866] dark:text-[#8A92D0] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Apply for Leave & On Duty (OD) Approval
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Submit leave applications with supporting medical or symposium documents for faculty advisor approval
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Form */}
        <div className="lg:col-span-2 bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Leave / OD Request Form</h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Leave Category</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full p-2.5 bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-[#313866] dark:text-[#8A92D0]"
              >
                <option value="medical">Medical Leave (Doctor Certificate Required)</option>
                <option value="casual">Casual Leave</option>
                <option value="od">On Duty (OD) — Sports / Academic Symposium</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">From Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">To Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Detailed Reason</label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe reason for leave application..."
                className="w-full p-2.5 bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#313866]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Upload Attachment (Medical Certificate / OD Pass)</label>
              <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 text-center space-y-2 bg-zinc-50/50 dark:bg-[#161B33]/50">
                <Paperclip className="w-5 h-5 text-[#313866] dark:text-[#8A92D0] mx-auto" />
                <span className="text-zinc-500 block">Drag & drop certificate image or click to select</span>
                <input
                  type="text"
                  placeholder="Or paste document image URL..."
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full p-2 text-[11px] bg-white dark:bg-[#21284C] border border-zinc-200 dark:border-zinc-700 rounded-xl"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Submit Application
            </button>
          </form>
        </div>

        {/* My Applications History */}
        <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">My Leave Applications</h3>

          <div className="space-y-3">
            {myLeaves.map((l) => (
              <div
                key={l.id}
                className="p-3.5 bg-zinc-50 dark:bg-[#161B33]/60 border border-zinc-200/60 dark:border-zinc-800 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#313866] dark:text-[#8A92D0] uppercase">{l.leaveType}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {(l.status === 'pending_faculty' || l.status === 'pending_hod') && (
                      <button
                        onClick={() => deleteLeaveRequest(l.id)}
                        title="Delete Application"
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <StatusBadge status={l.status} size="sm" />
                  </div>
                </div>
                <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {l.startDate} to {l.endDate}
                </div>
                <p className="text-zinc-500 truncate">{l.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
