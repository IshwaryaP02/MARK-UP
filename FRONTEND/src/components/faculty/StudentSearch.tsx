import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import { academicYearLabel } from '../../services/academicStructure';
import { StudentDetailModal } from '../common/StudentDetailModal';
import { BackButton } from '../common/BackButton';
import { Search, UserCheck, Phone, Mail, GraduationCap, ShieldCheck } from 'lucide-react';

export const StudentSearch: React.FC = () => {
  const { students } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Student Directory & Attendance Inspector
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSearchTerm((e.target as HTMLInputElement).value);
            }}
            placeholder="Filter students by Name, Reg No (e.g. 2024CS01), or Roll No..."
            className="w-full pl-10 pr-3 py-2 text-xs bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none"
          />
        </div>
        <button
          onClick={() => setSearchTerm(searchTerm)}
          className="px-4 py-2 text-xs font-bold text-white bg-[#1E40AF] dark:bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#2563EB] rounded-xl transition-colors shrink-0"
        >
          Enter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((s) => (
          <div
            key={s.id}
            onClick={() => setSelectedStudent(s)}
            className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-3"
          >
            <div className="flex items-center gap-3">
              <img
                src={s.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'}
                alt={s.name}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#1E40AF]/20 dark:ring-[#3B82F6]/30"
              />
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#1E40AF] dark:group-hover:text-[#3B82F6] transition-colors">
                  {s.name}
                </h3>
                <span className="text-[11px] font-mono font-bold text-[#1E40AF] dark:text-[#3B82F6] block">
                  Reg: {s.regNo}
                </span>
                <span className="text-[10px] font-mono font-semibold text-zinc-600 dark:text-zinc-300 block">
                  🐱 Mobile: {s.phone || '+91 98765 43210'} · Roll: {s.rollNo}
                </span>
                <span className="text-[10px] text-zinc-400">
                  Sem {s.semester} - {academicYearLabel(s.semester)} · {s.departmentName || 'Computer Science'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#FFFFFF] dark:bg-[#0A0A0A] rounded-xl flex items-center justify-between border border-zinc-200/60 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Attendance Percentage:</span>
              <span
                className={`text-sm font-bold ${
                  s.overallAttendancePct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {s.overallAttendancePct}%
              </span>
            </div>

            <div className="text-xs text-zinc-500 space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <div>Email: <strong className="text-zinc-800 dark:text-zinc-200">{s.email}</strong></div>
              <div>Parents Number: <strong className="text-zinc-800 dark:text-zinc-200">{s.guardianPhone || 'N/A'}</strong></div>
            </div>
          </div>
        ))}
      </div>

      <StudentDetailModal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
      />
    </div>
  );
};
