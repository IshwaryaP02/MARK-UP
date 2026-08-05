import React from 'react';
import { Student } from '../../types';
import { Modal } from './Modal';
import { User, Mail, Phone, GraduationCap, Building2, ShieldCheck, AlertTriangle } from 'lucide-react';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ isOpen, onClose, student }) => {
  if (!student) return null;

  const isLowAttendance = student.overallAttendancePct < 75;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Student Profile & Academic Record`}
      subtitle={`Reg No: ${student.regNo} · Mobile: ${student.phone || '+91 98765 43210'}`}
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Student Avatar Header */}
        <div className="flex items-center gap-4 p-4 bg-[#F3F4F9] dark:bg-[#0D1127] rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
          <img
            src={student.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'}
            alt={student.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#313866]/30 dark:ring-[#8A92D0]/30"
          />
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{student.name}</h3>
            <p className="text-xs font-mono font-bold text-[#313866] dark:text-[#8A92D0]">Reg: {student.regNo}</p>
            <p className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-300">Mobile: {student.phone || '+91 98765 43210'} · Roll: {student.rollNo}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{student.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2.5 py-0.5 bg-[#313866] text-white dark:bg-[#8A92D0] dark:text-[#0D1127] font-bold text-[10px] rounded-md">
                {student.departmentName || 'Computer Science'}
              </span>
              <span className="px-2.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] rounded-md">
                Sem {student.semester} - Sec {student.section}
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Metric */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Overall Attendance</span>
            <span className={`text-2xl font-extrabold ${isLowAttendance ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {student.overallAttendancePct}%
            </span>
          </div>

          <div className="p-3.5 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Exam Eligibility</span>
            <div className="flex items-center gap-1.5 mt-1">
              {isLowAttendance ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Ineligible (&lt;75%)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Eligible (&ge;75%)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contact & Guardian Details */}
        <div className="p-4 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs pb-1 border-b border-zinc-100 dark:border-zinc-800">
            Contact & Parent / Guardian Information
          </h4>
          <div className="grid grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-300">
            <div>
              <span className="text-[10px] text-zinc-400 block font-semibold">Guardian Name</span>
              <span className="font-bold">{student.guardianName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-semibold">Guardian Phone</span>
              <span className="font-bold font-mono">{student.guardianPhone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-semibold">Student Phone</span>
              <span className="font-bold font-mono">{student.phone || '9876543210'}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-semibold">Batch Year</span>
              <span className="font-bold font-mono">{student.batch || '2022-2026'}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
