import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BonafideRequest } from '../../types';
import { BackButton } from '../common/BackButton';
import { BonafideStatusBadge, bonafidePurposeLabel } from '../common/BonafideStatusBadge';
import { BonafideCertificatePrint } from '../common/BonafideCertificatePrint';
import { Stethoscope, CheckCircle2, XCircle, MessageSquare, Eye } from 'lucide-react';

export const FacultyBonafide: React.FC = () => {
  const { currentUser, bonafideRequests, reviewBonafideRequest } = useApp();

  const [comment, setComment] = useState<Record<string, string>>({});

  // Only show requests from students assigned to this faculty (tutor class),
  // falling back to the faculty's department when no tutor class is defined.
  const isAssigned = (r: BonafideRequest): boolean => {
    const tutor = (currentUser as any).tutorFor as { semester: number; section: string } | undefined;
    if (tutor) {
      return r.semester === tutor.semester && r.section === tutor.section;
    }
    return r.departmentId === currentUser.departmentId;
  };

  const assignedRequests = bonafideRequests.filter(isAssigned);

  // "Pending Faculty Review" — student can still delete; only a Review/View action is shown.
  const pendingReview = assignedRequests.filter((r) => r.status === 'submitted');
  // "Faculty Reviewed" — faculty has opened the request; they can now approve or reject.
  const underReview = assignedRequests.filter(
    (r) => r.status === 'faculty_reviewed' || r.status === 'faculty_review'
  );
  // Everything else (recommended, HOD/Principal stages, approved, rejected) — read-only history.
  const processed = assignedRequests.filter(
    (r) => !['submitted', 'faculty_reviewed', 'faculty_review'].includes(r.status)
  );

  const handleComment = (id: string, value: string) => setComment((prev) => ({ ...prev, [id]: value }));

  const renderRequestCard = (request: BonafideRequest, mode: 'pending' | 'review' | 'view') => {
    const isApproved = request.status === 'approved';
    return (
      <div
        key={request.id}
        className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 text-[#2563EB] dark:text-[#3B82F6] flex items-center justify-center font-bold text-sm shrink-0">
              {request.studentName.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-[#0F172A] dark:text-zinc-200 text-sm">{request.studentName}</p>
              <p className="text-[11px] text-[#000000] dark:text-[#64748B]">
                {request.studentRegNo} • Sem {request.semester} ({request.section}) • {request.departmentName}
              </p>
              <p className="text-[11px] text-[#000000] dark:text-[#64748B]">
                Submitted {new Date(request.createdAt).toLocaleDateString()} • {request.requiredCopies || 1} copy(ies)
              </p>
            </div>
          </div>
          <BonafideStatusBadge status={request.status} size="sm" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-[#F7F9FC] dark:bg-[#0A0A0A]/60 border border-[#E2E8F0]/60 dark:border-zinc-800 rounded-xl">
            <span className="text-[#000000] dark:text-[#64748B]">Certificate Type / Reason: </span>
            <span className="font-bold text-[#1E293B] dark:text-zinc-200">{bonafidePurposeLabel(request.purpose)}</span>
          </div>
          <div className="p-2.5 bg-[#F7F9FC] dark:bg-[#0A0A0A]/60 border border-[#E2E8F0]/60 dark:border-zinc-800 rounded-xl">
            <span className="text-[#000000] dark:text-[#64748B]">Status: </span>
            <span className="font-bold text-[#1E293B] dark:text-zinc-200">
              {request.status === 'submitted'
                ? 'Pending Faculty Review'
                : request.status === 'faculty_reviewed'
                ? 'Faculty Reviewed'
                : request.status}
            </span>
          </div>
        </div>

        {request.purposeDescription && (
          <p className="text-xs text-[#1E293B] dark:text-zinc-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 rounded-xl p-2.5">
            <span className="font-semibold">Details:</span> {request.purposeDescription}
          </p>
        )}

        {request.facultyRecommendedAt && (
          <p className="text-[11px] text-[#000000] dark:text-[#64748B]">
            Recommended by {request.facultyName} on {new Date(request.facultyRecommendedAt).toLocaleDateString()}
          </p>
        )}

        {mode === 'pending' && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() =>
                reviewBonafideRequest(request.id, 'faculty', 'open', currentUser.id, currentUser.name)
              }
              className="w-full py-2.5 bg-[#2563EB] dark:bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#1E3A8A] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" /> Review / View Request
            </button>
            <p className="text-[11px] text-[#000000] dark:text-[#64748B] mt-2 text-center">
              Opening this request disables the student's ability to cancel it.
            </p>
          </div>
        )}

        {mode === 'review' && (
          <div className="pt-1 space-y-2">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-[#000000] dark:text-[#64748B] mt-2 shrink-0" />
              <textarea
                rows={2}
                value={comment[request.id] || ''}
                onChange={(e) => handleComment(request.id, e.target.value)}
                placeholder="Add remark / comment (optional)"
                className="w-full p-2.5 bg-[#F7F9FC] dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() =>
                  reviewBonafideRequest(request.id, 'faculty', 'recommend', currentUser.id, currentUser.name, comment[request.id])
                }
                className="flex-1 py-2.5 bg-[#2563EB] dark:bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
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
                <XCircle className="w-4 h-4" /> Reject
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

      <div className="pb-2 border-b border-[#E2E8F0] dark:border-zinc-800">
        <h2 className="text-lg font-bold text-[#0F172A] dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-[#2563EB] dark:text-[#3B82F6]" />
          Bonafide Certificate Requests
        </h2>
      </div>

      {/* Pending faculty review */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100 flex items-center justify-between">
          <span>Pending Faculty Review ({pendingReview.length})</span>
        </h3>
        {pendingReview.length === 0 ? (
          <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-2xl p-6 text-center text-[#000000] dark:text-[#64748B] text-xs">
            No bonafide requests awaiting your review.
          </div>
        ) : (
          pendingReview.map((r) => renderRequestCard(r, 'pending'))
        )}
      </div>

      {/* Currently reviewing (opened by faculty) */}
      {underReview.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100 flex items-center justify-between">
            <span>Under Review ({underReview.length})</span>
          </h3>
          {underReview.map((r) => renderRequestCard(r, 'review'))}
        </div>
      )}

      {/* Processed / all requests */}
      {processed.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-zinc-100">All Requests</h3>
          {processed.map((r) => renderRequestCard(r, 'view'))}
        </div>
      )}
    </div>
  );
};
