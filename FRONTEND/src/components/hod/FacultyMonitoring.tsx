import React from 'react';
import { useApp } from '../../context/AppContext';
import { Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const FacultyMonitoring: React.FC = () => {
  const { facultyList, subjects } = useApp();

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Department Faculty Marking Compliance & Audit
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Monitor on-time attendance entry rates, total lectures conducted, and pending period entries
        </p>
      </div>

      <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3.5 pl-4">Faculty Member</th>
              <th className="p-3.5">Designation</th>
              <th className="p-3.5">Assigned Courses</th>
              <th className="p-3.5">Marking Compliance Rate</th>
              <th className="p-3.5 text-right pr-4">Last Period Logged</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {facultyList.map((fac) => (
              <tr key={fac.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                <td className="p-3.5 pl-4 font-bold text-zinc-900 dark:text-zinc-100">
                  <div className="flex items-center gap-2">
                    <img
                      src={fac.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                      alt={fac.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div>
                      <span>{fac.name}</span>
                      <span className="block text-[10px] font-mono text-[#313866] dark:text-[#8A92D0]">{fac.employeeId}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-300">{fac.designation}</td>
                <td className="p-3.5 font-bold text-[#313866] dark:text-[#8A92D0]">
                  {fac.assignedSubjectIds?.length || 2} Course(s)
                </td>
                <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 98.5% On-Time
                  </span>
                </td>
                <td className="p-3.5 text-right pr-4 font-mono text-zinc-500 text-[11px]">Today at 09:55 AM</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
