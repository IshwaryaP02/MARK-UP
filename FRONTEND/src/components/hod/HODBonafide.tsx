import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BonafideStatus, BonafideRequest } from '../../types';
import { BackButton } from '../common/BackButton';
import { BonafideStatusBadge, bonafidePurposeLabel } from '../common/BonafideStatusBadge';
import { BonafideCertificatePrint } from '../common/BonafideCertificatePrint';
import { ClipboardCheck, CheckCircle2, Send, RotateCcw, Printer, Landmark } from 'lucide-react';

const PRINCIPAL_NAME = 'Dr. A. Ramachandran';

export const HODBonafide: React.FC = () => {
  const { currentUser, bonafideRequests, reviewBonafideRequest } = useApp();
  const [comment, setComment] = useState<Record<string, string>>({});

  const handleComment = (id: string, value: string) => setComment((prev) => ({ ...prev, [id]: value }));

  const getTab = (status: BonafideStatus): string => {
    if (status === 'faculty_recommended') return 'hod_review';
    if (status === 'hod_recommended' || status === 'principal_approval') return 'principal';
    if (status === 'returned_to_hod') return 'issue';
    if (status === 'approved') return 'approved';
    return 'other';
  };

  const cards = (statusList: BonafideStatus[]) =>
    bonafideRequests.filter((r) => statusList.includes(r.status));

  const renderActions = (request: BonafideRequest) => {
    if (request.status === 'faculty_recommended') {
      return (
        <div className="pt-1 space-y-2">
          <div className="flex items-start gap-2">
            <Printer className="w-4 h-4 text-zinc-400 mt-2 shrink-0" />
            <textarea
              rows={2}
              value={comment[request.id] || ''}
              onChange={(e) => handleComment(request.id, e.target.value)}
              placeholder="Add remark (optional)"
              className="w-full p-2.5 bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => reviewBonafideRequest(request.id, 'hod', 'recommend', currentUser.id, currentUser.name, comment[request.id])}
              className="flex-1 py-2.5 bg-[#1E40AF] dark:bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Recommend to Principal
            </button>
            <button
              type="button"
              onClick={() => reviewBonafideRequest(request.id, 'hod', 'reject', currentUser.id, currentUser.name, comment[request.id])}
              className="flex-1 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/60 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Return to Faculty
            </button>
          </div>
        </div>
      );
    }

    if (request.status === 'hod_recommended' || request.status === 'principal_approval') {
      return (
        <div className="pt-1 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => reviewBonafideRequest(request.id, 'principal', 'approve', currentUser.id, PRINCIPAL_NAME)}
            className="flex-1 py-2.5 bg-fuchsia-600 dark:bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Landmark className="w-4 h-4" /> Principal Approval
          </button>
          <button
            type="button"
            onClick={() => reviewBonafideRequest(request.id, 'principal', 'reject', currentUser.id, PRINCIPAL_NAME)}
            className="flex-1 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/60 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Return to HOD
          </button>
        </div>
      );
    }

    if (request.status === 'returned_to_hod') {
      return (
        <div className="pt-1 space-y-2">
          <div className="flex items-start gap-2">
            <Printer className="w-4 h-4 text-zinc-400 mt-2 shrink-0" />
            <textarea
              rows={2}
              value={comment[request.id] || ''}
              onChange={(e) => handleComment(request.id, e.target.value)}
              placeholder="Final remark (optional)"
              className="w-full p-2.5 bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => reviewBonafideRequest(request.id, 'hod', 'approve', currentUser.id, currentUser.name, comment[request.id])}
              className="flex-1 py-2.5 bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Issue Certificate (Approve)
            </button>
            <button
              type="button"
              onClick={() => reviewBonafideRequest(request.id, 'hod', 'reject', currentUser.id, currentUser.name, comment[request.id])}
              className="flex-1 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/60 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Return to Faculty
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderCard = (request: BonafideRequest) => {
    const approvable = request.status === 'faculty_recommended' || request.status === 'hod_recommended' || request.status === 'principal_approval' || request.status === 'returned_to_hod';
    return (
      <div key={request.id} className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E40AF]/10 text-[#1E40AF] dark:text-[#3B82F6] flex items-center justify-center font-bold text-sm shrink-0">
              {request.studentName.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{request.studentName}</p>
              <p className="text-[11px] text-zinc-500">
                {request.studentRegNo} • Sem {request.semester} ({request.section}) • {request.departmentName}
              </p>
            </div>
          </div>
          <BonafideStatusBadge status={request.status} size="sm" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-zinc-50 dark:bg-[#0A0A0A]/60 border border-zinc-200/60 dark:border-zinc-800 rounded-xl">
            <span className="text-zinc-500">Purpose: </span>
            <span className="font-bold text-zinc-700 dark:text-zinc-200">{bonafidePurposeLabel(request.purpose)}</span>
          </div>
          <div className="p-2.5 bg-zinc-50 dark:bg-[#0A0A0A]/60 border border-zinc-200/60 dark:border-zinc-800 rounded-xl">
            <span className="text-zinc-500">Copies: </span>
            <span className="font-bold text-zinc-700 dark:text-zinc-200">{request.requiredCopies || 1}</span>
          </div>
        </div>

        {request.purposeDescription && (
          <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 rounded-xl p-2.5">
            <span className="font-semibold">Details:</span> {request.purposeDescription}
          </p>
        )}

        {(request.facultyRecommendedAt || request.hodRecommendedAt || request.principalApprovedAt) && (
          <div className="text-[11px] text-zinc-500 space-y-0.5">
            {request.facultyRecommendedAt && <p>Faculty: {request.facultyName} — {new Date(request.facultyRecommendedAt).toLocaleDateString()}</p>}
            {request.hodRecommendedAt && <p>HOD: {request.hodName} — {new Date(request.hodRecommendedAt).toLocaleDateString()}</p>}
            {request.principalApprovedAt && <p>Principal: {request.principalName} — {new Date(request.principalApprovedAt).toLocaleDateString()}</p>}
          </div>
        )}

        {approvable && renderActions(request)}

        {request.status === 'approved' && <BonafideCertificatePrint request={request} principalName={PRINCIPAL_NAME} />}
      </div>
    );
  };

  const sections: { label: string; list: BonafideRequest[] }[] = [
    { label: 'Awaiting HOD Review', list: cards(['faculty_recommended']) },
    { label: 'Awaiting Principal Approval', list: cards(['hod_recommended', 'principal_approval']) },
    { label: 'Ready to Issue', list: cards(['returned_to_hod']) },
    { label: 'Approved', list: cards(['approved']) }
  ];

  return (
    <div className="space-y-6">
      <BackButton label="Back to Dashboard" targetScreen="dashboard" />

      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-[#1E40AF] dark:text-[#3B82F6]" />
          Bonafide Certificate — HOD Approvals
        </h2>
      </div>

      {sections.map((section) => (
        <div key={section.label} className="space-y-3">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{section.label} ({section.list.length})</h3>
          {section.list.length === 0 ? (
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 text-center text-zinc-400 text-xs">
              No requests in this stage.
            </div>
          ) : (
            section.list.map(renderCard)
          )}
        </div>
      ))}
    </div>
  );
};
