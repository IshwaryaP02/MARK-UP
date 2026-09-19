import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../lib/apiClient';
import { Download, FileText } from 'lucide-react';

export const HODReports: React.FC = () => {
  const { addToast, currentUser, substitutionRequests } = useApp();
  const [dashboard, setDashboard] = useState<any | null>(null);

  useEffect(() => {
    apiClient.hodDashboard().then(setDashboard).catch(() => setDashboard(null));
  }, [currentUser.id]);

  const handleDownload = () => {
    addToast('HOD Report Generated', 'Department performance analytics exported as PDF', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-zinc-100 tracking-tight">
            Departmental Attendance & Compliance Analytics
          </h2>

        </div>

        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] dark:hover:bg-white text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export Executive Report
        </button>
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-[#232326] rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#0F172A] dark:text-zinc-100">Monthly Executive Department Summary</h3>
        <p className="text-xs text-[#000000] dark:text-[#64748B]">{currentUser.departmentName || '—'}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold pt-2">
          <div className="p-3 bg-[#F7F9FC] dark:bg-[#0A0A0A]/60 rounded-xl">Overall Attendance: {dashboard ? `${dashboard.departmentStats?.avgAttendancePct ?? 0}%` : '—'}</div>
          <div className="p-3 bg-[#F7F9FC] dark:bg-[#0A0A0A]/60 rounded-xl text-emerald-600">Faculty Count: {dashboard?.departmentStats?.totalFaculty ?? '—'}</div>
          <div className="p-3 bg-[#F7F9FC] dark:bg-[#0A0A0A]/60 rounded-xl text-rose-600">Students &lt;75%: {dashboard?.flaggedStudents?.length ?? '—'}</div>
          <div className="p-3 bg-[#F7F9FC] dark:bg-[#0A0A0A]/60 rounded-xl text-[#2563EB] dark:text-[#3B82F6]">Substitutions Pending: {dashboard?.pendingSubstitutions?.length ?? substitutionRequests.length}</div>
        </div>
      </div>
    </div>
  );
};
