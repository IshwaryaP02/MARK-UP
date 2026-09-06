import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CorrectionRequest } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { BackButton } from '../common/BackButton';
import { Edit3, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const ApproveCorrections: React.FC = () => {
  const { correctionRequests, reviewCorrectionRequest, currentUser } = useApp();

  const pending = correctionRequests.filter((c) => c.status === 'pending');

  const handleApprove = (id: string) => {
    reviewCorrectionRequest(id, 'approved', currentUser.id, currentUser.name, 'Correction verified and applied to database.');
  };

  const handleReject = (id: string) => {
    reviewCorrectionRequest(id, 'rejected', currentUser.id, currentUser.name, 'Correction request rejected by HOD.');
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Attendance Correction Approvals Queue (HOD Authority)
        </h2>

      </div>

      {pending.length === 0 ? (
        <div className="p-8 text-center bg-zinc-50 dark:bg-[#0A0A0A] border border-dashed border-zinc-200 dark:border-[#232326] rounded-2xl">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Zero Pending Corrections</h3>
          <p className="text-xs text-zinc-400 mt-1">All faculty attendance adjustment requests have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((req) => (
            <div
              key={req.id}
              className="p-5 bg-white dark:bg-[#0A0A0A] border border-amber-200 dark:border-amber-800/60 rounded-2xl shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Faculty: {req.facultyName}
                  </h3>
                  <span className="text-xs font-mono font-bold text-[#1E40AF] dark:text-[#3B82F6]">
                    {req.subjectCode} - {req.subjectName} · {req.date} Period {req.periodNumber}
                  </span>
                </div>
                <StatusBadge status={req.status} size="sm" />
              </div>

              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span>Target Student: <strong className="text-zinc-900 dark:text-zinc-100">{req.studentName} ({req.studentRegNo})</strong></span>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-600 line-through">Original: {req.originalStatus.toUpperCase()}</span>
                    <span className="text-emerald-600">→ Proposed: {req.proposedStatus.toUpperCase()}</span>
                  </div>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 italic">"Reason: {req.reason}"</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => handleReject(req.id)}
                  className="px-3.5 py-2 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject Request
                </button>
                <button
                  onClick={() => handleApprove(req.id)}
                  className="px-4 py-2 bg-[#1E40AF] hover:bg-[#FFFFFF] text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Update Roster
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
