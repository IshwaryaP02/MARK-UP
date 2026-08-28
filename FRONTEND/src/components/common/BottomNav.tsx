import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  CheckSquare,
  GraduationCap,
  Users,
  Calendar,
  FileText,
  Settings,
  Eye,
  Palette,
  BookOpen
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentUser, activeScreen, setActiveScreen } = useApp();

  const role = currentUser.role;

  const getMobileItems = () => {
    if (role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'students', label: 'Students', icon: GraduationCap },
        { id: 'faculty', label: 'Faculty', icon: Users },
        { id: 'timetable_builder', label: 'Schedule', icon: Calendar },
        { id: 'settings', label: 'Themes', icon: Palette }
      ];
    }
    if (role === 'faculty') {
      return [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'my_classes', label: 'My Classes', icon: BookOpen },
        { id: 'faculty_timetable', label: 'Schedule', icon: Calendar },
        { id: 'leave_queue', label: 'Leaves', icon: FileText },
        { id: 'settings', label: 'Themes', icon: Palette }
      ];
    }
    if (role === 'student') {
      return [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'student_attendance', label: 'Attendance', icon: CheckSquare },
        { id: 'student_apply_leave', label: 'Apply Leave', icon: FileText },
        { id: 'student_timetable', label: 'Timetable', icon: Calendar },
        { id: 'student_circulars', label: 'Circulars', icon: FileText },
        { id: 'settings', label: 'Themes', icon: Palette }
      ];
    }
    // HOD
    return [
      { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
      { id: 'hod_all_classes', label: 'All Classes', icon: Eye },
      { id: 'hod_circulars', label: 'Circulars', icon: FileText },
      { id: 'hod_leaves', label: 'Leaves', icon: FileText }
    ];
  };

  const items = getMobileItems();

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#161B33]/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 md:hidden px-2 py-1 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeScreen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveScreen(item.id)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
              isActive
                ? 'text-[#313866] dark:text-[#8A92D0]'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
