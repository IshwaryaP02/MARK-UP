import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LeaveRequest } from '../../types';
import { academicYearLabel } from '../../services/academicStructure';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { BackButton } from '../common/BackButton';
import { FileText, CheckCircle2, XCircle, Paperclip, Clock, Calendar } from 'lucide-react';

export const LeaveQueue: React.FC = () => {
  const { leaveRequests, reviewLeaveRequest, currentUser, addToast } = useApp();

  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState('');

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending_faculty');

  const handleApprove = (id: string) => {
    reviewLeaveRequest(id, 'faculty', 'approved', currentUser.id, currentUser.name, feedbackNote || 'Recommended for HOD approval.');
    setSelectedLeave(null);
    setFeedbackNote('');
  };

  const handleReject = (id: string) => {
    reviewLeaveRequest(id, 'faculty', 'rejected', currentUser.id, currentUser.name, feedbackNote || 'Rejected due to insufficient documentation.');
    setSelectedLeave(null);
    setFeedbackNote('');
  };

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Header */}
      <div className="pb-2 border-b border-[#E2E8F0] dark:border-zinc-800">
        <h2 className="text-lg font-bold text-[#0F172A] dark:text-zinc-100 tracking-tight">
          Student Leave Applications Queue (Faculty Advisor Review)
        </h2>
      </div>

      {pendingLeaves.length === 0 ? (
        <div className="p-8 text-center bg-[#F7F9FC] dark:bg-[#0A0A0A] border border-dashed border-zinc-300 dark:border-[#232326] rounded-2xl">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100">All Student Leaves Reviewed</h3>
          <p className="text-xs text-[#000000] dark:text-[#64748B] mt-1">There are currently no pending leave applications awaiting your approval.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingLeaves.map((lv) => (
            <div
              key={lv.id}
              className="p-5 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-[#232326] rounded-2xl shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0] dark:border-[#232326]">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100">{lv.studentName}</h3>
                  <span className="text-xs font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">{lv.studentRegNo}</span>
                  <span className="text-xs text-[#000000] dark:text-[#64748B] ml-2">Sem {lv.semester} - {academicYearLabel(lv.semester)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-bold uppercase bg-[#2563EB]/10 text-[#2563EB] dark:bg-[#2563EB]/50 dark:text-[#3B82F6] rounded-md">
                    {lv.leaveType}
                  </span>
                  <StatusBadge status={lv.status} size="sm" />
                </div>
              </div>

              <div className="text-xs space-y-2">
                <div className="flex items-center gap-2 text-[#1E293B] dark:text-zinc-300 font-semibold">
                  <Calendar className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
                  <span>Duration: {lv.startDate} to {lv.endDate} ({lv.totalDays} day(s))</span>
                </div>
                <p className="text-[#1E293B] dark:text-zinc-300 bg-[#F7F9FC] dark:bg-[#0A0A0A]/60 p-3 rounded-xl leading-relaxed">
                  <strong>Reason:</strong> {lv.reason}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                {lv.attachmentUrl ? (
                  <button
                    onClick={() => {
                      setSelectedLeave(lv);
                      setCertModalOpen(true);
                    }}
                    className="text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6] hover:underline flex items-center gap-1.5"
                  >
                    <Paperclip className="w-3.5 h-3.5" /> View Medical Certificate / Attachment
                  </button>
                ) : (
                  <span className="text-[11px] text-[#000000] dark:text-[#64748B]">No Attachment Uploaded</span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(lv.id)}
                    className="px-3.5 py-2 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(lv.id)}
                    className="px-4 py-2 bg-[#2563EB] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Recommend to HOD
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attachment Viewer Modal */}
      {selectedLeave && (
        <Modal
          isOpen={certModalOpen}
          onClose={() => setCertModalOpen(false)}
          title={`Attachment Document: ${selectedLeave.studentName}`}
          subtitle={`Leave Type: ${selectedLeave.leaveType.toUpperCase()}`}
        >
          <div className="space-y-3">
            {selectedLeave.attachmentUrl && (
              <a
                href={selectedLeave.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-3 bg-[#2563EB] hover:bg-[#161B33] text-white text-sm font-bold rounded-xl transition-colors"
              >
                Open {selectedLeave.attachmentName || 'Attachment'}
              </a>
            )}
            <img
              src={selectedLeave.attachmentUrl || ''}
              alt="Leave Attachment"
              className="w-full h-64 object-cover rounded-2xl border border-[#E2E8F0] dark:border-zinc-800"
            />
            <p className="text-xs text-[#000000] dark:text-[#64748B]">Verified doctor rest certificate attached for dates {selectedLeave.startDate} to {selectedLeave.endDate}.</p>
          </div>
        </Modal>
      )}
    </div>
  );
};
