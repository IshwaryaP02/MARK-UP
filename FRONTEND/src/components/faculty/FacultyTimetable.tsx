import React from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Clock, MapPin } from 'lucide-react';

export const FacultyTimetable: React.FC = () => {
  const { timetable, currentUser } = useApp();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const romanDayMap: Record<string, string> = {
    Monday: 'I',
    Tuesday: 'II',
    Wednesday: 'III',
    Thursday: 'IV',
    Friday: 'V',
    Saturday: 'VI'
  };
  const periods = [
    { num: 1, start: '09:00 AM', end: '09:50 AM' },
    { num: 2, start: '10:00 AM', end: '10:50 AM' },
    { num: 3, start: '11:00 AM', end: '11:50 AM' },
    { num: 4, start: '01:30 PM', end: '02:20 PM' },
    { num: 5, start: '02:30 PM', end: '03:20 PM' },
    { num: 6, start: '03:30 PM', end: '04:20 PM' }
  ];

  const myFacId = currentUser.id;

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Personal Lecture Timetable
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Weekly schedule view of assigned lectures, classroom halls, and periods
        </p>
      </div>

      <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="p-3 w-28 text-left pl-4">Day</th>
                {periods.map((p) => (
                  <th key={p.num} className="p-3 border-l border-zinc-200 dark:border-zinc-800">
                    <div>P{p.num}</div>
                    <div className="text-[9px] text-zinc-400 normal-case font-normal">{p.start}</div>
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
                    const slot = timetable.find((s) => s.day === day && s.periodNumber === p.num && s.facultyId === myFacId);
                    return (
                      <td key={p.num} className="p-2 border-l border-zinc-200 dark:border-zinc-800 h-16 align-top">
                        {slot ? (
                          <div className="p-2 bg-[#313866]/10 dark:bg-[#313866]/50 border border-[#313866]/20 dark:border-[#8A92D0]/30 rounded-xl text-left h-full flex flex-col justify-between">
                            <span className="font-bold text-[#313866] dark:text-[#8A92D0] text-xs truncate">
                              {slot.subjectCode}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1"><MapPin className="w-3 h-3 text-[#313866] dark:text-[#8A92D0]" /> {slot.roomNo}</span>
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
