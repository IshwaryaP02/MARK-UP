import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../common/BackButton';
import { CheckCircle2, AlertTriangle, Clock, ChevronDown, BookOpen } from 'lucide-react';
import { Avatar } from '../common/Avatar';

export const FacultyMonitoring: React.FC = () => {
  const { facultyList, subjects, attendanceRecords, timetable } = useApp();

  const [openForFacId, setOpenForFacId] = useState<string | null>(null);

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

  // Resolve the actual courses assigned to a faculty member from the assignment
  // data (no hard-coded or limited list).
  const assignedCoursesOf = (facId: string, assignedIds: string[] = []) => {
    const resolved = (assignedIds.length ? assignedIds : [])
      .map((id) => subjects.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => !!s);
    if (resolved.length > 0) return resolved;
    // Fallback: derive from timetable slots assigned to this faculty.
    const fromSlots = timetable
      .filter((t) => t.facultyId === facId)
      .map((t) => subjects.find((s) => s.id === t.subjectId))
      .filter((s): s is NonNullable<typeof s> => !!s);
    const unique = Array.from(new Map(fromSlots.map((s) => [s.id, s])).values());
    return unique;
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="pb-2 border-b border-[#E2E8F0] dark:border-zinc-800">
        <h2 className="text-lg font-bold text-[#0F172A] dark:text-zinc-100 tracking-tight">
          Department Faculty Marking Compliance & Audit
        </h2>

      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-[#232326] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F7F9FC] dark:bg-zinc-800/60 border-b border-[#E2E8F0] dark:border-zinc-800 text-[#000000] dark:text-[#64748B] font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3.5 pl-4">Faculty Member</th>
              <th className="p-3.5">Assigned Courses</th>
              <th className="p-3.5">Marking Compliance Rate</th>
              <th className="p-3.5 text-right pr-4">Last Period Logged</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {facultyList.map((fac) => {
              const { scheduledSlots, marked, pct } = getCompliance(fac.id);
              const assigned = assignedCoursesOf(fac.id, fac.assignedSubjectIds);
              const hasLoad = scheduledSlots > 0 || assigned.length > 0;
              const lastLogged = getLastLogged(fac.id);
              const statusColor =
                !hasLoad || pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
              const isOpen = openForFacId === fac.id;

              return (
                <tr key={fac.id} className="hover:bg-[#F7F9FC]/80 dark:hover:bg-zinc-800/40 transition-colors align-top">
                  <td className="p-3.5 pl-4 font-bold text-[#0F172A] dark:text-zinc-100">
                    <div className="flex items-center gap-2">
                      <Avatar name={fac.name} src={fac.avatar} size="md" />
                      <div>
                        <span>{fac.name}</span>
                        <span className="block text-[10px] font-mono text-[#2563EB] dark:text-[#3B82F6]">{fac.employeeId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 min-w-[220px]">
                    {assigned.length === 0 ? (
                      <span className="font-bold text-[#64748B] dark:text-zinc-500">No Courses Assigned</span>
                    ) : (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenForFacId(isOpen ? null : fac.id)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#F7F9FC] dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-700 rounded-xl text-xs font-bold text-[#2563EB] dark:text-[#3B82F6] hover:border-[#3B82F6] transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 shrink-0" />
                            {assigned.length} Course{assigned.length !== 1 ? 's' : ''}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isOpen && (
                          <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white dark:bg-[#0F0F0F] border border-[#E2E8F0] dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden">
                            <ul className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                              {assigned.map((s) => (
                                <li key={s.id} className="px-3 py-2.5">
                                  <span className="font-bold text-[#0F172A] dark:text-zinc-100 block">{s.code}</span>
                                  <span className="text-[11px] text-[#000000] dark:text-[#64748B] dark:text-zinc-400 block">{s.name}</span>
                                  <span className="text-[10px] font-semibold text-[#2563EB] dark:text-[#3B82F6]">Semester {s.semester}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
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
                  <td className="p-3.5 text-right pr-4 font-mono text-[#000000] dark:text-[#64748B] text-[11px]">
                    {lastLogged || 'No entries yet'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {openForFacId && (
        <div className="fixed inset-0 z-30" onClick={() => setOpenForFacId(null)} />
      )}
    </div>
  );
};