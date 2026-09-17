import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../lib/apiClient';
import { BackButton } from '../common/BackButton';
import {
  Calendar, Building2, ListOrdered, CalendarDays, Clock,
  ChevronLeft, ChevronRight, Loader2, UserCheck, Layers
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const PERIODS = [1, 2, 3, 4, 5];

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
};

const SHIFT1_TIMES: Record<number, string> = {
  1: '8:00 – 8:50 AM', 2: '9:00 – 9:50 AM', 3: '10:10 – 11:00 AM',
  4: '11:10 AM – 12:00', 5: '12:10 – 1:00 PM',
};
const SHIFT2_TIMES: Record<number, string> = {
  1: '1:30 – 2:20 PM', 2: '2:30 – 3:20 PM', 3: '3:30 – 4:20 PM',
  4: '4:30 – 5:20 PM', 5: '5:30 – 6:20 PM',
};

interface TSlot {
  id: string; day: string; period: number; startTime: string; endTime: string;
  subjectCode: string; subjectName: string; facultyName: string;
  section: string; shift: string; semester: number;
}

const getMonthDays = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  const startPad = first.getDay(); // 0=Sun
  return { days, startPad };
};

const dayOfWeek = (d: Date): string => {
  const map = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return map[d.getDay()];
};

export const FacultyTimetable: React.FC = () => {
  const { currentUser, addToast } = useApp();

  const [slots, setSlots] = useState<TSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [shiftFilter, setShiftFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

  // Monthly view state
  const now = new Date();
  const [monthYear, setMonthYear] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.myTimetable();
      setSlots(data.map((s: any) => ({
        id: s.id, day: s.day, period: s.period,
        startTime: s.startTime || '', endTime: s.endTime || '',
        subjectCode: s.subjectCode || '', subjectName: s.subjectName || '',
        facultyName: s.facultyName || currentUser.name,
        section: s.section, shift: s.shift || 'First Shift', semester: s.semester || 1,
      })));
    } catch (e: any) {
      addToast('Load Error', e.message, 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTimetable(); }, []);

  const filtered = useMemo(() =>
    slots.filter(s => shiftFilter === 'all' || s.shift === shiftFilter),
    [slots, shiftFilter]
  );

  const slotFor = (day: string, period: number) =>
    filtered.filter(s => s.day === day && s.period === period);

  const shift = slots[0]?.shift || 'First Shift';
  const periodLabels = shift.includes('2') || shift.toLowerCase().includes('second')
    ? SHIFT2_TIMES : SHIFT1_TIMES;

  // ── Monthly calendar computation ───────────────────────────────────────────
  const { days: calDays, startPad } = getMonthDays(monthYear.year, monthYear.month);

  const slotsForDate = (d: Date) => {
    const dayName = dayOfWeek(d);
    return filtered.filter(s => s.day === dayName);
  };

  const monthName = new Date(monthYear.year, monthYear.month, 1)
    .toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => setMonthYear(prev => {
    const m = prev.month === 0 ? 11 : prev.month - 1;
    const y = prev.month === 0 ? prev.year - 1 : prev.year;
    return { year: y, month: m };
  });
  const nextMonth = () => setMonthYear(prev => {
    const m = prev.month === 11 ? 0 : prev.month + 1;
    const y = prev.month === 11 ? prev.year + 1 : prev.year;
    return { year: y, month: m };
  });

  return (
    <div className="space-y-6">
      <BackButton />

      <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#1E40AF] dark:text-[#3B82F6]" />
          Personal Lecture Timetable
        </h2>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mt-3">
          {/* Shift filter */}
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#1E40AF] dark:text-[#3B82F6]" />
            <select
              value={shiftFilter}
              onChange={e => setShiftFilter(e.target.value)}
              className="p-2 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              <option value="all">All Shifts</option>
              <option value="First Shift">First Shift</option>
              <option value="Second Shift">Second Shift</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
            {(['weekly', 'monthly'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-[11px] font-bold transition-colors ${viewMode === mode
                  ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB]'
                  : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700'
                }`}
              >
                {mode === 'weekly' ? <><ListOrdered className="w-3 h-3 inline mr-1" />Weekly</> : <><CalendarDays className="w-3 h-3 inline mr-1" />Monthly</>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading your timetable…
        </div>
      ) : (
        <>
          {/* ── Weekly View ─────────────────────────────────────────────────── */}
          {viewMode === 'weekly' && (
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse min-w-[580px]">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                      <th className="p-3 w-28 text-left pl-4">Day</th>
                      {PERIODS.map(p => (
                        <th key={p} className="p-3 border-l border-zinc-200 dark:border-zinc-800">
                          <div className="font-bold text-zinc-700 dark:text-zinc-200">P{p}</div>
                          <div className="text-[9px] text-zinc-400 normal-case font-normal mt-0.5">
                            {periodLabels[p]}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {DAYS.map(day => (
                      <tr key={day} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10">
                        <td className="p-3 font-bold text-left pl-4 bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800">
                          {DAY_SHORT[day]}
                        </td>
                        {PERIODS.map(p => {
                          const daySlots = slotFor(day, p);
                          return (
                            <td key={p} className="p-2 border-l border-zinc-200 dark:border-zinc-800 h-16 align-top">
                              {daySlots.length > 0 ? (
                                <div className="space-y-1">
                                  {daySlots.map((sl, i) => (
                                    <div key={i} className="p-2 bg-[#1E40AF]/10 dark:bg-[#2563EB]/50 border border-[#1E40AF]/20 dark:border-[#3B82F6]/30 rounded-xl text-left flex flex-col gap-0.5">
                                      <span className="font-bold text-[#1E40AF] dark:text-[#3B82F6] text-xs truncate">{sl.subjectCode}</span>
                                      <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 truncate">{sl.subjectName}</span>
                                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">§{sl.section}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 text-[10px]">—</div>
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
          )}

          {/* ── Monthly Calendar View ────────────────────────────────────────── */}
          {viewMode === 'monthly' && (
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl shadow-sm overflow-hidden">
              {/* Month navigation */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-[#232326]">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{monthName}</h3>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-[#232326]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="p-2 text-center text-[10px] font-bold text-zinc-400 uppercase">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {/* Empty cells before first day */}
                {Array.from({ length: startPad }).map((_, i) => (
                  <div key={`pad-${i}`} className="min-h-[80px] p-1.5 border-b border-r border-zinc-100 dark:border-[#232326]" />
                ))}
                {calDays.map(d => {
                  const daySlots = slotsForDate(d);
                  const isToday = d.toDateString() === new Date().toDateString();
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div
                      key={d.getDate()}
                      className={`min-h-[80px] p-1.5 border-b border-r border-zinc-100 dark:border-[#232326] ${isWeekend ? 'bg-zinc-50/50 dark:bg-zinc-800/20' : ''}`}
                    >
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold mb-1 ${isToday ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB]' : 'text-zinc-600 dark:text-zinc-400'}`}>
                        {d.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {daySlots.slice(0, 3).map((sl, i) => (
                          <div key={i} className="px-1.5 py-0.5 bg-[#1E40AF]/10 dark:bg-[#2563EB]/30 rounded text-[8px] font-bold text-[#1E40AF] dark:text-[#3B82F6] truncate">
                            P{sl.period} {sl.subjectCode}
                          </div>
                        ))}
                        {daySlots.length > 3 && (
                          <div className="text-[8px] text-zinc-400 pl-1">+{daySlots.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="px-4 py-3 border-t border-zinc-100 dark:border-[#232326] flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#1E40AF]/10 dark:bg-[#2563EB]/30 border border-[#1E40AF]/20" />
                  <span className="text-[10px] text-zinc-500">Your class</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-[#1E40AF] dark:bg-[#2563EB] flex items-center justify-center text-[8px] text-white font-bold">T</div>
                  <span className="text-[10px] text-zinc-500">Today</span>
                </div>
                <span className="text-[10px] text-zinc-400 ml-auto">{filtered.length} slots/week × ~4 weeks</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};