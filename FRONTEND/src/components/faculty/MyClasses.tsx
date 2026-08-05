import React from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, Users, Award, ShieldCheck, CheckSquare } from 'lucide-react';

export const MyClasses: React.FC = () => {
  const { subjects, students, setActiveScreen } = useApp();

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          My Assigned Courses & Curriculum Roster
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Overview of courses you lead, syllabus progression, and overall class attendance averages
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.slice(0, 3).map((sub) => (
          <div
            key={sub.id}
            className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#313866] dark:text-[#8A92D0] block">
                  {sub.code} · Sem {sub.semester}
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{sub.name}</h3>
              </div>
              <span className="px-2.5 py-1 bg-[#313866]/10 text-[#313866] dark:bg-[#313866]/50 dark:text-[#8A92D0] text-xs font-bold rounded-lg">
                {sub.credits} Credits
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-zinc-100 dark:border-[#2D376A] text-xs">
              <div className="p-2.5 bg-zinc-50 dark:bg-[#161B33]/60 rounded-xl">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">60</span>
                <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                  <Users className="w-3 h-3" /> Students
                </span>
              </div>
              <div className="p-2.5 bg-zinc-50 dark:bg-[#161B33]/60 rounded-xl">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{sub.totalClassesHeld}</span>
                <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                  <BookOpen className="w-3 h-3" /> Lectures Held
                </span>
              </div>
              <div className="p-2.5 bg-zinc-50 dark:bg-[#161B33]/60 rounded-xl">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block">86.2%</span>
                <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" /> Avg Attendance
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveScreen('mark_attendance')}
              className="w-full py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <CheckSquare className="w-4 h-4" /> Mark Class Attendance
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
