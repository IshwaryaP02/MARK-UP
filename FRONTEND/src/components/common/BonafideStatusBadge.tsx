import React from 'react';
import { BonafideStatus } from '../../types';

const STATUS_CONFIG: Record<BonafideStatus, { label: string; className: string }> = {
  submitted: {
    label: 'Submitted',
    className: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400 border-sky-200 dark:border-sky-800/60'
  },
  faculty_review: {
    label: 'Faculty Review',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
  },
  faculty_recommended: {
    label: 'Faculty Recommended',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
  },
  hod_review: {
    label: 'HOD Review',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
  },
  hod_recommended: {
    label: 'HOD Recommended',
    className: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400 border-violet-200 dark:border-violet-800/60'
  },
  principal_approval: {
    label: 'Principal Approval',
    className: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800/60'
  },
  returned_to_hod: {
    label: 'Returned to HOD',
    className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60'
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
  }
};

interface BonafideStatusBadgeProps {
  status: BonafideStatus;
  size?: 'sm' | 'md';
}

export const BonafideStatusBadge: React.FC<BonafideStatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs font-medium' : 'px-2.5 py-1 text-xs font-semibold';
  return (
    <span className={`inline-flex items-center rounded-full border ${config.className} ${sizeClass} tracking-wide whitespace-nowrap transition-colors`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {config.label}
    </span>
  );
};

export const bonafidePurposeLabel = (purpose: string): string => {
  const map: Record<string, string> = {
    education: 'Education / Higher Studies',
    admission: 'Admission in Educational Institution',
    bank: 'Bank Loan',
    scholarship: 'Scholarship / Fellowship',
    passport: 'Passport Application',
    visa: 'Visa Application',
    government: 'Government / Competitive Exam',
    other: 'Other Purpose'
  };
  return map[purpose] || purpose;
};
