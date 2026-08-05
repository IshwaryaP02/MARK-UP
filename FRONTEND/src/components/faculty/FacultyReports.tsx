import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Download, FileText, Filter } from 'lucide-react';

export const FacultyReports: React.FC = () => {
  const { students, addToast } = useApp();
  const [selectedRange, setSelectedRange] = useState('monthly');

  const handleExport = () => {
    addToast('Report Exported', 'Faculty course attendance report downloaded as PDF', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Course Attendance Performance Reports
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Generate student participation analytics and identify low attendance students
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export Course Report
        </button>
      </div>

      <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">Enrolled Student Attendance Breakdown</h3>
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-[#161B33]/80 border-b border-zinc-200 dark:border-[#2D376A] text-zinc-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3">Reg No</th>
              <th className="p-3">Student Name</th>
              <th className="p-3">Attended / Total</th>
              <th className="p-3">Attendance %</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {students.map((s) => (
              <tr key={s.id}>
                <td className="p-3">
                  <span className="font-mono font-bold text-[#313866] dark:text-[#8A92D0] block">{s.regNo}</span>
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 block font-semibold">📱 {s.phone || '+91 98765 43210'}</span>
                </td>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{s.name}</td>
                <td className="p-3 font-mono">38 / 42</td>
                <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{s.overallAttendancePct}%</td>
                <td className="p-3 text-right">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      s.overallAttendancePct >= 75
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                    }`}
                  >
                    {s.overallAttendancePct >= 75 ? 'Eligible' : 'Warning (<75%)'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
