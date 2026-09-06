import React from 'react';
import { Student } from '../../types';
import { Modal } from './Modal';
import { academicYearLabel } from '../../services/academicStructure';
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
      subtitle={`Reg No: ${student.regNo} Ãƒâ€šÃ‚Â· Mobile: ${student.phone || '+91 98765 43210'}`}
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {/* Student Avatar Header */}
        <div className="flex items-center gap-4 p-4 bg-[#FFFFFF] dark:bg-[#0A0A0A] rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
          <img
            src={student.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'}
            alt={student.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#1E40AF]/30 dark:ring-[#3B82F6]/30"
          />
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{student.name}</h3>
            <p className="text-xs font-mono font-bold text-[#1E40AF] dark:text-[#3B82F6]">Reg: {student.regNo}</p>
            <p className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-300">Mobile: {student.phone || '+91 98765 43210'} Ãƒâ€šÃ‚Â· Roll: {student.rollNo}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{student.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2.5 py-0.5 bg-[#1E40AF] text-white dark:bg-[#2563EB] dark:text-[#FFFFFF] font-bold text-[10px] rounded-md">
                {student.departmentName || 'Computer Science'}
              </span>
              <span className="px-2.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] rounded-md">
                {academicYearLabel(student.semester)}
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Metric */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Overall Attendance</span>
            <span className={`text-2xl font-extrabold ${isLowAttendance ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {student.overallAttendancePct}%
            </span>
          </div>

          <div className="p-3.5 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800 rounded-xl">
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

        {/* Contact & Parent Details */}
        <div className="p-4 bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs pb-1 border-b border-zinc-100 dark:border-zinc-800">
            Contact & Parent Information
          </h4>
          <div className="grid grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-300">
            <div>
              <span className="text-[10px] text-zinc-400 block font-semibold">Parents Number</span>
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
