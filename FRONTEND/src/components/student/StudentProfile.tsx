import React from 'react';
import { useApp } from '../../context/AppContext';
import { academicYearLabel } from '../../services/academicStructure';
import { Lock } from 'lucide-react';
import { BackButton } from '../common/BackButton';
import { Avatar } from '../common/Avatar';

export const StudentProfile: React.FC = () => {
  const { currentUser } = useApp();

  return (
    <div className="space-y-6">
      <BackButton label="Back to Dashboard" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-zinc-100 tracking-tight">
            Student Profile & Academic Record
          </h2>
        </div>

        <span className="px-3.5 py-2 bg-[#F7F9FC] dark:bg-[#0A0A0A] text-[#000000] dark:text-[#64748B] dark:text-zinc-400 text-xs font-bold rounded-xl flex items-center gap-2 shrink-0 border border-[#E2E8F0] dark:border-zinc-800">
          <Lock className="w-4 h-4" /> View Only · Profile Managed by Admin
        </span>
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <Avatar
            name={currentUser.name}
            src={currentUser.avatar}
            size="xl"
            className="rounded-2xl ring-4 ring-[#2563EB]/30 dark:ring-[#3B82F6]/30"
          />
          <div>
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-zinc-100">{currentUser.name}</h3>
            <p className="text-xs font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">
              Registration No: {currentUser.regNo || '—'}
            </p>
            <p className="text-xs font-mono text-[#1E293B] dark:text-zinc-300 font-semibold mt-0.5">
              Mobile No: {currentUser.phone || '—'} · Roll No: {currentUser.rollNo || '—'}
            </p>
            <p className="text-xs text-[#000000] dark:text-[#64748B] dark:text-zinc-400 mt-1">
              Semester {currentUser.semester || '—'} - {currentUser.semester ? academicYearLabel(currentUser.semester) : '—'} · {currentUser.departmentName || '—'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E2E8F0] dark:border-zinc-800 text-xs">
          <div className="p-3 bg-[#F7F9FC] dark:bg-[#0A0A0A] rounded-xl space-y-1 border border-[#E2E8F0] dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase text-[#000000] dark:text-[#64748B]">Institutional Email</span>
            <span className="font-bold text-[#0F172A] dark:text-zinc-100 block">{currentUser.email}</span>
          </div>

          <div className="p-3 bg-[#F7F9FC] dark:bg-[#0A0A0A] rounded-xl space-y-1 border border-[#E2E8F0] dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase text-[#000000] dark:text-[#64748B]">Registered Phone</span>
            <span className="font-bold text-[#0F172A] dark:text-zinc-100 block">+91 98765 43210</span>
          </div>

          <div className="p-3 bg-[#F7F9FC] dark:bg-[#0A0A0A] rounded-xl space-y-1 border border-[#E2E8F0] dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase text-[#000000] dark:text-[#64748B]">Guardian Name & Emergency Contact</span>
            <span className="font-bold text-[#0F172A] dark:text-zinc-100 block">Robert Smith (+91 98765 00001)</span>
          </div>

          <div className="p-3 bg-[#F7F9FC] dark:bg-[#0A0A0A] rounded-xl space-y-1 border border-[#E2E8F0] dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase text-[#000000] dark:text-[#64748B]">Enrollment Batch</span>
            <span className="font-bold text-[#2563EB] dark:text-[#3B82F6] block">2024 - 2028 B.Tech CSE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
