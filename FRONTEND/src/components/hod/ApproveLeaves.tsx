import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LeaveRequest } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { FileText, CheckCircle2, XCircle, Calendar, Paperclip } from 'lucide-react';

export const ApproveLeaves: React.FC = () => {
  const { leaveRequests, reviewLeaveRequest, currentUser } = useApp();

  const pendingHodLeaves = leaveRequests.filter((l) => l.status === 'pending_hod');

  const handleApprove = (id: string) => {
    reviewLeaveRequest(id, 'hod', 'approved', currentUser.id, currentUser.name, 'Final leave approval granted by HOD.');
  };

  const handleReject = (id: string) => {
    reviewLeaveRequest(id, 'hod', 'rejected', currentUser.id, currentUser.name, 'Rejected by HOD.');
  };

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Final Level Student Leave Approvals (HOD Authority)
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Review leave applications forwarded by faculty advisors and grant institutional sanction
        </p>
      </div>

      {pendingHodLeaves.length === 0 ? (
        <div className="p-8 text-center bg-zinc-50 dark:bg-[#21284C] border border-dashed border-zinc-200 dark:border-[#2D376A] rounded-2xl">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Zero Pending HOD Approvals</h3>
          <p className="text-xs text-zinc-400 mt-1">All student leave requests forwarded by advisors have been sanctioned.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingHodLeaves.map((lv) => (
            <div
              key={lv.id}
              className="p-5 bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{lv.studentName}</h3>
                  <span className="text-xs font-mono font-bold text-[#313866] dark:text-[#8A92D0]">{lv.studentRegNo}</span>
                  <span className="text-xs text-zinc-400 ml-2">Sem {lv.semester} - Sec {lv.section}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-bold uppercase bg-[#313866]/10 text-[#313866] dark:bg-[#313866]/40 dark:text-[#8A92D0] rounded-md">
                    {lv.leaveType}
                  </span>
                  <StatusBadge status={lv.status} size="sm" />
                </div>
              </div>

              <div className="text-xs space-y-2">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 font-semibold">
                  <Calendar className="w-4 h-4 text-[#313866] dark:text-[#8A92D0]" />
                  <span>Duration: {lv.startDate} to {lv.endDate} ({lv.totalDays} day(s))</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl leading-relaxed">
                  <strong>Reason:</strong> {lv.reason}
                </p>
                {lv.facultyNote && (
                  <p className="text-[#313866] dark:text-[#8A92D0] bg-[#313866]/10 dark:bg-[#313866]/40 p-2.5 rounded-xl font-semibold">
                    Advisor Recommendation: "{lv.facultyNote}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => handleReject(lv.id)}
                  className="px-3.5 py-2 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button
                  onClick={() => handleApprove(lv.id)}
                  className="px-4 py-2 bg-[#313866] hover:bg-[#161B33] text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Grant HOD Sanction
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
