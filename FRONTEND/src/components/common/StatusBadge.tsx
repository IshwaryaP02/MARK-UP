import React from 'react';
import { AttendanceStatus, LeaveStatus } from '../../types';

interface StatusBadgeProps {
  status: AttendanceStatus | LeaveStatus | 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'success' | 'failed' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status.toLowerCase();

  let style = 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 border-gray-200 dark:border-zinc-700';
  let label = status;

  switch (norm) {
    case 'present':
      style = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';
      label = 'Present';
      break;
    case 'absent':
      style = 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800/60';
      label = 'Absent';
      break;
    case 'late':
      style = 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/60';
      label = 'Late';
      break;
    case 'od':
    case 'on_duty':
    case 'duty_leave':
      style = 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400 border-sky-200 dark:border-sky-800/60';
      label = 'On Duty (OD)';
      break;
    case 'leave':
    case 'casual':
    case 'medical':
      style = 'bg-[#F3F4F9] text-[#313866] dark:bg-[#313866]/40 dark:text-[#8A92D0] border-[#313866]/30 dark:border-[#8A92D0]/40';
      label = 'On Leave';
      break;
    case 'pending':
    case 'pending_faculty':
    case 'pending_hod':
      style = 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/60';
      label = norm === 'pending_faculty' ? 'Pending Faculty' : norm === 'pending_hod' ? 'Pending HOD' : 'Pending';
      break;
    case 'approved':
    case 'active':
    case 'success':
    case 'accepted':
    case 'approved_by_hod':
      style = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';
      label = norm === 'active' ? 'Active' : norm === 'success' ? 'Success' : norm === 'accepted' ? 'Accepted' : norm === 'approved_by_hod' ? 'HOD Approved' : 'Approved';
      break;
    case 'rejected':
    case 'inactive':
    case 'failed':
    case 'rejected_by_sub':
      style = 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800/60';
      label = norm === 'inactive' ? 'Inactive' : norm === 'failed' ? 'Failed' : norm === 'rejected_by_sub' ? 'Declined' : 'Rejected';
      break;
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs font-medium' : size === 'lg' ? 'px-3.5 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center rounded-full border ${style} ${sizeClass} tracking-wide whitespace-nowrap transition-colors`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {label}
    </span>
  );
};
