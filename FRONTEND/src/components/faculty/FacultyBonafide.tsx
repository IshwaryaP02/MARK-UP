import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BonafideRequest } from '../../types';
import { BackButton } from '../common/BackButton';
import { BonafideStatusBadge, bonafidePurposeLabel } from '../common/BonafideStatusBadge';
import { BonafideCertificatePrint } from '../common/BonafideCertificatePrint';
import { Stethoscope, CheckCircle2, RotateCcw, MessageSquare } from 'lucide-react';

export const FacultyBonafide: React.FC = () => {
  const { currentUser, bonafideRequests, reviewBonafideRequest } = useApp();

  const [comment, setComment] = useState<Record<string, string>>({});

  const needsReview = bonafideRequests.filter(
    (r) => r.status === 'submitted' || r.status === 'faculty_review'
  );
  const processed = bonafideRequests.filter(
    (r) => r.status !== 'submitted' && r.status !== 'faculty_review'
  );

  const handleComment = (id: string, value: string) => setComment((prev) => ({ ...prev, [id]: value }));

  const renderRequestCard = (request: BonafideRequest, actionable: boolean) => {
    const isApproved = request.status === 'approved';
    return (
      <div
        key={request.id}
        className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3"
      >
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

        {request.facultyRecommendedAt && (
          <p className="text-[11px] text-zinc-500">
            Recommended by {request.facultyName} on {new Date(request.facultyRecommendedAt).toLocaleDateString()}
          </p>
        )}

        {actionable && (
          <div className="pt-1 space-y-2">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-zinc-400 mt-2 shrink-0" />
              <textarea
                rows={2}
                value={comment[request.id] || ''}
                onChange={(e) => handleComment(request.id, e.target.value)}
                placeholder="Add remark / comment (optional)"
                className="w-full p-2.5 bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() =>
                  reviewBonafideRequest(request.id, 'faculty', 'recommend', currentUser.id, currentUser.name, comment[request.id])
                }
                className="flex-1 py-2.5 bg-[#1E40AF] dark:bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Recommend to HOD
              </button>
              <button
                type="button"
                onClick={() =>
                  reviewBonafideRequest(request.id, 'faculty', 'reject', currentUser.id, currentUser.name, comment[request.id])
                }
                className="flex-1 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-800/60 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Return to Student
              </button>
            </div>
          </div>
        )}

        {isApproved && <BonafideCertificatePrint request={request} />}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <BackButton label="Back to Dashboard" targetScreen="dashboard" />

      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-[#1E40AF] dark:text-[#3B82F6]" />
          Bonafide Certificate — Faculty Review
        </h2>
      </div>

      {/* Awaiting faculty review */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
          <span>Pending Review ({needsReview.length})</span>
        </h3>
        {needsReview.length === 0 ? (
          <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 text-center text-zinc-400 text-xs">
            No bonafide requests awaiting your review.
          </div>
        ) : (
          needsReview.map((r) => renderRequestCard(r, true))
        )}
      </div>

      {/* Processed / all requests */}
      {processed.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">All Requests</h3>
          {processed.map((r) => renderRequestCard(r, false))}
        </div>
      )}
    </div>
  );
};
