import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../lib/apiClient';
import { BackButton } from '../common/BackButton';
import {
  Calendar, BookOpen, GraduationCap, Layers, Loader2,
  UserCheck, ChevronLeft, ChevronRight, Clock
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
  id: string; day: string; period: number;
  subjectCode: string; subjectName: string; facultyName: string;
  section: string; shift: string; semester: number;
}

const getMonthDays = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  return { days, startPad: first.getDay() };
};

const dayOfWeek = (d: Date) =>
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];

export const StudentTimetable: React.FC = () => {
  const { currentUser, addToast } = useApp();

  const [slots, setSlots] = useState<TSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

  const now = new Date();
  const [monthYear, setMonthYear] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.studentMyTimetable();
      setSlots(data.map((s: any) => ({
        id: s.id, day: s.day, period: s.period,
        subjectCode: s.subjectCode || '', subjectName: s.subjectName || '',
        facultyName: s.facultyName || '', section: s.section,
        shift: s.shift || 'First Shift', semester: s.semester || currentUser.semester || 1,
      })));
    } catch {
      // Graceful: API might not have data yet, show empty state
      setSlots([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const slotFor = (day: string, period: number) =>
    slots.filter(s => s.day === day && s.period === period);

  const shift = slots[0]?.shift || 'First Shift';
  const periodLabels = shift.includes('2') || shift.toLowerCase().includes('second')
    ? SHIFT2_TIMES : SHIFT1_TIMES;

  const { days: calDays, startPad } = getMonthDays(monthYear.year, monthYear.month);
  const slotsForDate = (d: Date) => slots.filter(s => s.day === dayOfWeek(d));
  const monthName = new Date(monthYear.year, monthYear.month, 1)
    .toLocaleString('default', { month: 'long', year: 'numeric' });
  const prevMonth = () => setMonthYear(prev => ({ year: prev.month === 0 ? prev.year - 1 : prev.year, month: prev.month === 0 ? 11 : prev.month - 1 }));
  const nextMonth = () => setMonthYear(prev => ({ year: prev.month === 11 ? prev.year + 1 : prev.year, month: prev.month === 11 ? 0 : prev.month + 1 }));

  return (
    <div className="space-y-6">
      <BackButton label="Back to Dashboard" />

      <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#1E40AF] dark:text-[#3B82F6]" />
          Weekly Class Lecture Timetable
        </h2>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg bg-[#1E40AF]/10 dark:bg-[#2563EB]/40 text-[#1E40AF] dark:text-[#3B82F6]">
            Semester {currentUser.semester || '?'}
          </span>
          <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            Section {currentUser.section || 'A'}
          </span>
          <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            {shift}
          </span>
        </div>

        {/* View toggle */}
        <div className="flex mt-3 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 w-fit">
          {(['weekly', 'monthly'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 text-[11px] font-bold transition-colors ${viewMode === mode
                ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB]'
                : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {mode === 'weekly' ? 'Weekly' : 'Monthly Calendar'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading your timetable…
        </div>
      ) : slots.length === 0 ? (
        <div className="p-10 text-center text-sm text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl">
          No timetable published for your class yet. Please contact your HOD or Admin.
        </div>
      ) : (
        <>
          {viewMode === 'weekly' && (
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse min-w-[540px]">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-[#0A0A0A] border-b border-zinc-200 dark:border-[#232326] text-zinc-500 font-semibold uppercase tracking-wider">
                      <th className="p-3 w-24 text-left pl-4">Slot</th>
                      {PERIODS.map(p => (
                        <th key={p} className="p-3 border-l border-zinc-200 dark:border-[#232326]">
                          <span className="block text-zinc-900 dark:text-zinc-100 font-bold">P{p}</span>
                          <span className="block text-zinc-400 dark:text-zinc-500 font-medium normal-case mt-0.5 text-[9px]">
                            {periodLabels[p]}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-[#232326]">
                    {DAYS.map(day => (
                      <tr key={day} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10">
                        <td className="p-3 font-bold text-left pl-4 bg-zinc-50/50 dark:bg-[#0A0A0A]/60 text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-[#232326]">
                          {DAY_SHORT[day]}
                        </td>
                        {PERIODS.map(p => {
                          const daySlots = slotFor(day, p);
                          return (
                            <td key={p} className="p-2 border-l border-zinc-200 dark:border-[#232326] h-16 align-top">
                              {daySlots.length > 0 ? (
                                daySlots.map((sl, i) => (
                                  <div key={i} className="p-2 bg-[#1E40AF]/10 dark:bg-[#2563EB]/50 border border-[#1E40AF]/30 dark:border-[#3B82F6]/40 rounded-xl text-left h-full flex flex-col justify-between">
                                    <span className="font-bold text-[#1E40AF] dark:text-[#3B82F6] text-xs block truncate">{sl.subjectCode}</span>
                                    <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 truncate">{sl.subjectName}</span>
                                    {sl.facultyName && <span className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate">{sl.facultyName}</span>}
                                  </div>
                                ))
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

          {viewMode === 'monthly' && (
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-[#232326]">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{monthName}</h3>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-[#232326]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="p-2 text-center text-[10px] font-bold text-zinc-400 uppercase">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: startPad }).map((_, i) => (
                  <div key={`pad-${i}`} className="min-h-[72px] border-b border-r border-zinc-100 dark:border-[#232326]" />
                ))}
                {calDays.map(d => {
                  const daySlots = slotsForDate(d);
                  const isToday = d.toDateString() === new Date().toDateString();
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div key={d.getDate()} className={`min-h-[72px] p-1.5 border-b border-r border-zinc-100 dark:border-[#232326] ${isWeekend ? 'bg-zinc-50/50 dark:bg-zinc-800/10' : ''}`}>
                      <div className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold mb-1 ${isToday ? 'bg-[#1E40AF] text-white dark:bg-[#2563EB]' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {d.getDate()}
                      </div>
                      {daySlots.slice(0, 3).map((sl, i) => (
                        <div key={i} className="px-1 py-0.5 bg-[#1E40AF]/10 dark:bg-[#2563EB]/30 rounded text-[8px] font-bold text-[#1E40AF] dark:text-[#3B82F6] truncate mb-0.5">
                          P{sl.period} {sl.subjectCode}
                        </div>
                      ))}
                      {daySlots.length > 3 && (
                        <div className="text-[8px] text-zinc-400">+{daySlots.length - 3}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};