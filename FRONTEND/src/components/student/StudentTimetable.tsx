import React from 'react';
import { useApp } from '../../context/AppContext';
import { MapPin, ArrowLeft } from 'lucide-react';

export const StudentTimetable: React.FC = () => {
  const { timetable, setActiveScreen } = useApp();

  const rowLabels: { label: string; day: string }[] = [
    { label: 'I', day: 'Monday' },
    { label: 'II', day: 'Tuesday' },
    { label: 'III', day: 'Wednesday' },
    { label: 'IV', day: 'Thursday' },
    { label: 'V', day: 'Friday' },
    { label: 'VI', day: 'Saturday' }
  ];
  const periods = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-6">
      <button
        onClick={() => setActiveScreen('dashboard')}
        className="flex items-center gap-2 text-xs font-bold text-[#313866] dark:text-[#8A92D0] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Weekly Class Lecture Timetable
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Semester 4 - Section A Schedule Grid</p>
      </div>

      <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-[#161B33] border-b border-zinc-200 dark:border-[#2D376A] text-zinc-500 font-semibold uppercase tracking-wider">
                <th className="p-3 w-24 text-left pl-4">Slot</th>
                {periods.map((p) => (
                  <th key={p} className="p-3 border-l border-zinc-200 dark:border-[#2D376A]">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-[#2D376A]">
              {rowLabels.map(({ label, day }) => (
                <tr key={label}>
                  <td className="p-3 font-bold text-left pl-4 bg-zinc-50/50 dark:bg-[#161B33]/60 text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-[#2D376A]">
                    {label}
                  </td>
                  {periods.map((p) => {
                    const slot = timetable.find((s) => s.day === day && s.periodNumber === p);
                    return (
                      <td key={p} className="p-2 border-l border-zinc-200 dark:border-[#2D376A] h-16 align-top">
                        {slot ? (
                          <div className="p-2 bg-[#313866]/10 dark:bg-[#313866]/50 border border-[#313866]/30 dark:border-[#8A92D0]/40 rounded-xl text-left h-full flex flex-col justify-between">
                            <span className="font-bold text-[#313866] dark:text-[#8A92D0] text-xs block truncate">
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
