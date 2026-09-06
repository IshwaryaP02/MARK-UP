import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { LeaveType, LeaveRequest } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { BackButton } from '../common/BackButton';
import { FileText, Send, Paperclip, Calendar, CheckCircle2, Clock, Trash2, X, FileImage, File } from 'lucide-react';

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

  // OD / Leave attachment (file upload via Pin icon)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const openAttachmentPicker = () => {
    attachmentInputRef.current?.click();
  };

  const processFile = (file: File) => {
    setAttachmentFile(file);
    const reader = new FileReader();
    reader.onload = () => setAttachmentPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemoveAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview('');
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

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
      attachmentUrl: attachmentPreview || attachmentUrl || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600',
      status: 'pending_faculty',
      createdAt: new Date().toLocaleDateString()
    };

    submitLeaveRequest(newLeave);
    setReason('');
    setAttachmentUrl('');
    handleRemoveAttachment();
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <BackButton label="Back to Dashboard" />

      {/* Header */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Apply for Leave & On Duty (OD) Approval
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Form */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Leave / OD Request Form</h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Leave Category</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full p-2.5 bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-[#1E40AF] dark:text-[#3B82F6]"
              >
                <option value="medical">Medical Leave (Doctor Certificate Required)</option>
                <option value="casual">Casual Leave</option>
                <option value="od">On Duty (OD) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Sports / Academic Symposium</option>
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
                  className="w-full p-2.5 bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">To Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
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
                className="w-full p-2.5 bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Upload Attachment (Medical Certificate / OD Pass)</label>
              <div
                onClick={openAttachmentPicker}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-4 text-center space-y-2 transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-[#1E40AF] bg-[#1E40AF]/5 dark:border-[#3B82F6] dark:bg-[#2563EB]/10'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-[#0A0A0A]/50'
                }`}
              >
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleAttachmentChange}
                />

                {attachmentPreview ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {attachmentFile?.type?.startsWith('image/') ? (
                      <img
                        src={attachmentPreview}
                        alt={attachmentFile?.name || 'attachment'}
                        className="w-16 h-16 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[#1E40AF]/10 text-[#1E40AF] dark:text-[#3B82F6] flex items-center justify-center shrink-0">
                        <FileImage className="w-7 h-7" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                        {attachmentFile?.name || 'Selected file'}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {(attachmentFile ? (attachmentFile.size / 1024).toFixed(1) : '0')} KB • attached
                      </p>
                      <p className="text-[10px] text-zinc-400">Click to change, or drag & drop a new file</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openAttachmentPicker(); }}
                        title="Change attachment"
                        className="p-2 text-[#1E40AF] dark:text-[#3B82F6] hover:bg-[#1E40AF]/10 dark:hover:bg-[#2563EB]/20 rounded-lg transition-colors"
                      >
                        <File className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveAttachment(); }}
                        title="Remove attachment"
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Paperclip className="w-5 h-5 text-[#1E40AF] dark:text-[#3B82F6] mx-auto" />
                    <span className="text-zinc-500 block">{isDragging ? 'Drop the file here' : 'Drag & drop certificate image or click to select'}</span>
                  </>
                )}

                <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800">
                  <input
                    type="text"
                    placeholder={attachmentPreview ? 'File attached — or paste a document image URL...' : 'Or paste document image URL...'}
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full p-2 text-[11px] bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#1E40AF] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] dark:hover:bg-white text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Submit Application
            </button>
          </form>
        </div>

        {/* My Applications History */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">My Leave Applications</h3>

          <div className="space-y-3">
            {myLeaves.map((l) => (
              <div
                key={l.id}
                className="p-3.5 bg-zinc-50 dark:bg-[#0A0A0A]/60 border border-zinc-200/60 dark:border-zinc-800 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#1E40AF] dark:text-[#3B82F6] uppercase">{l.leaveType}</span>
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
