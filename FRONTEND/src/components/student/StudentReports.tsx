import React from 'react';
import { useApp } from '../../context/AppContext';
import { Download, FileText } from 'lucide-react';
import { BackButton } from '../common/BackButton';

export const StudentReports: React.FC = () => {
  const { addToast, setActiveScreen } = useApp();

  const handleDownload = () => {
    addToast('Report Downloaded', 'Student monthly attendance certificate generated as PDF', 'success');
  };

  return (
    <div className="space-y-6">
      <BackButton label="Back to Dashboard" />

      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Personal Attendance Reports & Certificates
          </h2>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] dark:hover:bg-white text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Download PDF Report
        </button>
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Semester 4 Cumulative Attendance Transcript</h3>
            <p className="text-xs text-zinc-500">Issued by Department of Computer Science</p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold text-xs rounded-full">
            Status: Exam Clearance Approved (88.3%)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">Total Lectures: 120</div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-emerald-600">Present: 106</div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-rose-600">Absent: 10</div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-sky-600">OD / Leave: 4</div>
        </div>
      </div>
    </div>
  );
};
