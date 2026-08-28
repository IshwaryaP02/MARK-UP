import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export const FacultyMonitoring: React.FC = () => {
  const { facultyList, attendanceRecords, timetable } = useApp();

  const getCompliance = (facId: string) => {
    const scheduledSlots = timetable.filter((t) => t.facultyId === facId).length;
    const marked = attendanceRecords.filter((r) => r.facultyId === facId).length;
    const target = Math.max(scheduledSlots, 1);
    const pct = Math.min(100, Math.round((marked / target) * 100));
    return { scheduledSlots, marked, pct };
  };

  const getLastLogged = (facId: string) => {
    const facRecords = attendanceRecords.filter((r) => r.facultyId === facId);
    if (facRecords.length === 0) return null;
    const sorted = [...facRecords].sort((a, b) => (a.submittedAt > b.submittedAt ? -1 : 1));
    return sorted[0].submittedAt;
  };

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
            {facultyList.map((fac) => {
              const { scheduledSlots, marked, pct } = getCompliance(fac.id);
              const assigned = fac.assignedSubjectIds?.length || 0;
              const hasLoad = scheduledSlots > 0 || assigned > 0;
              const lastLogged = getLastLogged(fac.id);
              const statusColor =
                !hasLoad || pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';

              return (
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
                    {assigned} Course(s)
                  </td>
                  <td className={`p-3.5 font-bold ${statusColor}`}>
                    {!hasLoad ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> No Load Assigned
                      </span>
                    ) : pct >= 75 ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {pct}% Marked ({marked}/{scheduledSlots || 1} slots)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {pct}% Marked ({marked}/{scheduledSlots || 1} slots)
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right pr-4 font-mono text-zinc-500 text-[11px]">
                    {lastLogged || 'No entries yet'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};