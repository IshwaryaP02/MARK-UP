import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ListOrdered, CalendarDays } from 'lucide-react';
import { slotForDayOrder, availableDayOrders, todayIsDayOrder } from '../../services/timetableDayOrder';
import { academicYearLabel } from '../../services/academicStructure';
import { BackButton } from '../common/BackButton';

export const StudentTimetable: React.FC = () => {
  const { timetable, setActiveScreen, periodTimes, currentUser, staffDayOrders, getCurrentDayOrder } = useApp();

  const currentDayOrder = getCurrentDayOrder();
  const [viewOrder, setViewOrder] = useState<number | 'all'>(currentDayOrder ?? 'all');

  const rowLabels: { label: string; day: string }[] = [
    { label: 'Mon', day: 'Monday' },
    { label: 'Tue', day: 'Tuesday' },
    { label: 'Wed', day: 'Wednesday' },
    { label: 'Thu', day: 'Thursday' },
    { label: 'Fri', day: 'Friday' },
    { label: 'Sat', day: 'Saturday' }
  ];

  const resolvedOrder = viewOrder === 'all' ? null : viewOrder;

  const mySlots = useMemo(
    () =>
      timetable.filter(
        (s) =>
          s.semester === currentUser.semester &&
          s.section === currentUser.section &&
          (!currentUser.departmentId || s.departmentId === currentUser.departmentId)
      ),
    [timetable, currentUser.semester, currentUser.section, currentUser.departmentId]
  );

  const dayOrderOptions = availableDayOrders(
    staffDayOrders.flatMap((s) => s.entries.map((e) => ({ dayOrder: e.dayOrder })))
  );

  const periods = periodTimes
    .filter((t) => t.periodNumber !== null)
    .map((t) => ({ num: t.periodNumber as number, start: t.start, end: t.end }))
    .sort((a, b) => a.num - b.num);

  return (
    <div className="space-y-6">
      <BackButton label="Back to Dashboard" />

      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Weekly Class Lecture Timetable
        </h2>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg bg-[#1E40AF]/10 dark:bg-[#2563EB]/40 text-[#1E40AF] dark:text-[#3B82F6]">
            {academicYearLabel(currentUser.semester || 4)}
          </span>
          <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            Section {currentUser.section || 'A'}
          </span>
        </div>

        {/* Day Order selector */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <ListOrdered className="w-3.5 h-3.5 text-[#1E40AF] dark:text-[#3B82F6]" /> Day Order
          </span>
          <button
            onClick={() => setViewOrder('all')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors border ${
              viewOrder === 'all'
                ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB] border-[#1E40AF]'
                : 'bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-[#232326] hover:border-[#3B82F6]'
            }`}
          >
            All Days
          </button>
          {dayOrderOptions.map((doNum) => (
            <button
              key={doNum}
              onClick={() => setViewOrder(doNum)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors border ${
                viewOrder === doNum
                  ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB] border-[#1E40AF]'
                  : 'bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-[#232326] hover:border-[#3B82F6]'
              }`}
            >
              Day Order {doNum}
              {todayIsDayOrder(currentDayOrder, doNum) && (
                <span className="ml-1 text-[9px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">(Today)</span>
              )}
            </button>
          ))}
        </div>

        {currentDayOrder !== null && (
          <p className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <CalendarDays className="w-3.5 h-3.5" />
            Today's Day Order is {currentDayOrder} — showing the timetable for that Day Order automatically.
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-[#0A0A0A] border-b border-zinc-200 dark:border-[#232326] text-zinc-500 font-semibold uppercase tracking-wider">
                <th className="p-3 w-24 text-left pl-4">Slot</th>
                {periods.map((p) => (
                  <th key={p.num} className="p-3 border-l border-zinc-200 dark:border-[#232326]">
                    <span className="block text-zinc-900 dark:text-zinc-100">P{p.num}</span>
                    <span className="block text-zinc-400 dark:text-zinc-500 font-medium normal-case mt-1">
                      {p.start} – {p.end}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-[#232326]">
              {rowLabels.map(({ label, day }) => (
                <tr key={label}>
                  <td className="p-3 font-bold text-left pl-4 bg-zinc-50/50 dark:bg-[#0A0A0A]/60 text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-[#232326]">
                    {label}
                  </td>
                  {periods.map((p) => {
                    const slot = slotForDayOrder(mySlots, day, p.num, resolvedOrder);
                    return (
                      <td key={p.num} className="p-2 border-l border-zinc-200 dark:border-[#232326] h-16 align-top">
                        {slot ? (
                          <div className="p-2 bg-[#1E40AF]/10 dark:bg-[#2563EB]/50 border border-[#1E40AF]/30 dark:border-[#3B82F6]/40 rounded-xl text-left h-full flex flex-col justify-between">
                            <span className="font-bold text-[#1E40AF] dark:text-[#3B82F6] text-xs block truncate">
                              {slot.subjectCode}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 truncate">
                              {slot.subjectName}
                            </span>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 text-[10px]">
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};