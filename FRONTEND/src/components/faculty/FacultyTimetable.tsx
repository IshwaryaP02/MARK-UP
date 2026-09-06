import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BackButton } from '../common/BackButton';
import { Calendar, Building2, ListOrdered } from 'lucide-react';
import { slotForDayOrder, availableDayOrders, todayIsDayOrder } from '../../services/timetableDayOrder';

const academicYear = (sem: number): string => (sem <= 2 ? 'First Year' : sem <= 4 ? 'Second Year' : 'Third Year');

export const FacultyTimetable: React.FC = () => {
  const { timetable, currentUser, periodTimes, staffDayOrders, getCurrentDayOrder } = useApp();
  const [shiftFilter, setShiftFilter] = useState('all');
  const currentDayOrder = getCurrentDayOrder();
  const [viewOrder, setViewOrder] = useState<number | 'all'>(currentDayOrder ?? 'all');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const romanDayMap: Record<string, string> = {
    Monday: 'I',
    Tuesday: 'II',
    Wednesday: 'III',
    Thursday: 'IV',
    Friday: 'V',
    Saturday: 'VI'
  };

  const resolvedOrder = viewOrder === 'all' ? null : viewOrder;

  const dayOrderOptions = availableDayOrders(
    staffDayOrders.flatMap((s) => s.entries.map((e) => ({ dayOrder: e.dayOrder })))
  );

  const periods = periodTimes
    .filter((t) => t.periodNumber !== null)
    .map((t) => ({ num: t.periodNumber as number, start: t.start, end: t.end }))
    .sort((a, b) => a.num - b.num);

  const myFacId = currentUser.id;

  const mySlots = useMemo(
    () =>
      timetable.filter(
        (s) =>
          s.facultyId === myFacId &&
          (shiftFilter === 'all' || (s.shift || 'First Shift') === shiftFilter)
      ),
    [timetable, myFacId, shiftFilter]
  );

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Personal Lecture Timetable
        </h2>

        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#1E40AF] dark:text-[#3B82F6]" /> Shift
          </span>
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="p-2 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
          >
            <option value="all">All Shifts</option>
            <option value="First Shift">First Shift</option>
            <option value="Second Shift">Second Shift</option>
          </select>

          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1 ml-2">
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
            <Calendar className="w-3.5 h-3.5" />
            Today's Day Order is {currentDayOrder} — showing the timetable for that Day Order automatically.
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="p-3 w-28 text-left pl-4">Day</th>
                {periods.map((p) => (
                  <th key={p.num} className="p-3 border-l border-zinc-200 dark:border-zinc-800">
                    <div>P{p.num}</div>
                    <div className="text-[9px] text-zinc-400 normal-case font-normal">{p.start} – {p.end}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {days.map((day) => (
                <tr key={day}>
                  <td className="p-3 font-bold text-left pl-4 bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800">
                    {romanDayMap[day]}
                  </td>
                  {periods.map((p) => {
                    const slot = slotForDayOrder(mySlots, day, p.num, resolvedOrder);
                    return (
                      <td key={p.num} className="p-2 border-l border-zinc-200 dark:border-zinc-800 h-16 align-top">
                        {slot ? (
                          <div className="p-2 bg-[#1E40AF]/10 dark:bg-[#2563EB]/50 border border-[#1E40AF]/20 dark:border-[#3B82F6]/30 rounded-xl text-left h-full flex flex-col justify-between">
                            <span className="font-bold text-[#1E40AF] dark:text-[#3B82F6] text-xs truncate">
                              {slot.subjectCode}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">
                              {academicYear(slot.semester)} · {slot.shift || 'First Shift'}
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