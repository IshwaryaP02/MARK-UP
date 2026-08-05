import React from 'react';
import { useApp } from '../../context/AppContext';
import { Download, FileText } from 'lucide-react';

export const HODReports: React.FC = () => {
  const { addToast } = useApp();

  const handleDownload = () => {
    addToast('HOD Report Generated', 'Department performance analytics exported as PDF', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Departmental Attendance & Compliance Analytics
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Institutional analytics for CSE department performance</p>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export Executive Report
        </button>
      </div>

      <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Monthly Executive Department Summary</h3>
        <p className="text-xs text-zinc-500">Computer Science & Engineering · August 2026</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold pt-2">
          <div className="p-3 bg-zinc-50 dark:bg-[#161B33]/60 rounded-xl">Overall Attendance: 89.4%</div>
          <div className="p-3 bg-zinc-50 dark:bg-[#161B33]/60 rounded-xl text-emerald-600">On-Time Marking: 98.2%</div>
          <div className="p-3 bg-zinc-50 dark:bg-[#161B33]/60 rounded-xl text-rose-600">Students &lt;75%: 4</div>
          <div className="p-3 bg-zinc-50 dark:bg-[#161B33]/60 rounded-xl text-[#313866] dark:text-[#8A92D0]">Substitutions Handled: 2</div>
        </div>
      </div>
    </div>
  );
};
