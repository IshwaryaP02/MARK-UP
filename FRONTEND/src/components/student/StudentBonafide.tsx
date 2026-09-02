import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BonafideRequest, BonafideStatus } from '../../types';
import { BackButton } from '../common/BackButton';
import { BonafideStatusBadge, bonafidePurposeLabel } from '../common/BonafideStatusBadge';
import { BonafideCertificatePrint } from '../common/BonafideCertificatePrint';
import { FileBadge, Send, Copy, User } from 'lucide-react';

const STATUS_STEP_LABELS: { status: BonafideStatus; label: string }[] = [
  { status: 'submitted', label: 'Submitted' },
  { status: 'faculty_review', label: 'Faculty Review' },
  { status: 'faculty_recommended', label: 'Faculty Recommended' },
  { status: 'hod_review', label: 'HOD Review' },
  { status: 'hod_recommended', label: 'HOD Recommended' },
  { status: 'principal_approval', label: 'Principal Approval' },
  { status: 'returned_to_hod', label: 'Returned to HOD' },
  { status: 'approved', label: 'Approved' }
];

const order: BonafideStatus[] = [
  'submitted',
  'faculty_review',
  'faculty_recommended',
  'hod_review',
  'hod_recommended',
  'principal_approval',
  'returned_to_hod',
  'approved'
];

export const StudentBonafide: React.FC = () => {
  const { currentUser, bonafideRequests, submitBonafideRequest } = useApp();

  const [purpose, setPurpose] = useState('education');
  const [purposeDescription, setPurposeDescription] = useState('');
  const [requiredCopies, setRequiredCopies] = useState(1);

  const myRequests = bonafideRequests.filter(
    (r) => r.studentId === currentUser.id || r.studentName === currentUser.name
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitBonafideRequest({
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentRegNo: currentUser.regNo || '2024CS01',
      departmentId: currentUser.departmentId || 'dept-cs',
      departmentName: currentUser.departmentName || 'Computer Science',
      semester: currentUser.semester || 4,
      section: currentUser.section || 'A',
      batch: currentUser.batch || '2022-2026',
      rollNo: currentUser.rollNo || '-',
      purpose: purpose as BonafideRequest['purpose'],
      purposeDescription,
      requiredCopies: requiredCopies || 1
    });
    setPurposeDescription('');
    setRequiredCopies(1);
  };

  const stepIndex = (status: BonafideStatus) => order.indexOf(status);

  return (
    <div className="space-y-6">
      <BackButton label="Back to Dashboard" />

      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <FileBadge className="w-5 h-5 text-[#1E40AF] dark:text-[#3B82F6]" />
          Bonafide Certificate
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Form */}
        <div className="lg:col-span-1 bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-5 shadow-sm space-y-4 h-fit">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Request Bonafide</h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-[#0A0A0A]/60 border border-zinc-200/60 dark:border-zinc-800 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-[#1E40AF]/10 text-[#1E40AF] dark:text-[#3B82F6] flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate">{currentUser.name}</p>
                <p className="text-zinc-500 truncate">{currentUser.regNo || '2024CS01'}</p>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Purpose of Certificate</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full p-2.5 bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-[#1E40AF] dark:text-[#3B82F6]"
              >
                <option value="education">Education / Higher Studies</option>
                <option value="admission">Admission in Educational Institution</option>
                <option value="bank">Bank Loan</option>
                <option value="scholarship">Scholarship / Fellowship</option>
                <option value="passport">Passport Application</option>
                <option value="visa">Visa Application</option>
                <option value="government">Government / Competitive Exam</option>
                <option value="other">Other Purpose</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Details / Description
              </label>
              <textarea
                rows={3}
                value={purposeDescription}
                onChange={(e) => setPurposeDescription(e.target.value)}
                placeholder="Example: Admission for M.Sc Computer Science at Anna University"
                className="w-full p-2.5 bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Number of Copies</label>
              <input
                type="number"
                min={1}
                max={10}
                value={requiredCopies}
                onChange={(e) => setRequiredCopies(Number(e.target.value))}
                className="w-full p-2.5 bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#1E40AF] hover:bg-white dark:bg-[#2563EB] dark:text-[#FFFFFF] dark:hover:bg-white text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Submit Request
            </button>
          </form>
        </div>

        {/* My Requests */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">My Requests</h3>

          {myRequests.length === 0 ? (
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-8 text-center text-zinc-400 text-xs">
              <Copy className="w-8 h-8 mx-auto mb-2 opacity-40" />
              You haven't requested any bonafide certificates yet.
            </div>
          ) : (
            myRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                        {bonafidePurposeLabel(request.purpose)}
                      </span>
                      <BonafideStatusBadge status={request.status} size="sm" />
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      {request.requiredCopies || 1} copy(ies) • Requested {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {request.purposeDescription && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 sm:max-w-[40%]">{request.purposeDescription}</p>
                  )}
                </div>

                {/* Progress tracker */}
                <div className="pt-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    {STATUS_STEP_LABELS.map((step, i) => {
                      const idx = stepIndex(request.status);
                      const reached = i <= idx;
                      return (
                        <div key={step.status} className="flex items-center gap-1">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                reached ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
                              }`}
                            />
                            <span className={`text-[8px] mt-0.5 ${reached ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                              {step.label}
                            </span>
                          </div>
                          {i < STATUS_STEP_LABELS.length - 1 && (
                            <div className={`w-4 h-px mb-3 ${i < idx ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Print certificate when approved */}
                {request.status === 'approved' && (
                  <BonafideCertificatePrint request={request} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
