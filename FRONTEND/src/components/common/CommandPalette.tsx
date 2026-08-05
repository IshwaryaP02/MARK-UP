import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  FileSpreadsheet,
  CheckSquare,
  FileText,
  ShieldAlert,
  Database,
  Moon,
  Sun,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../../types';

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveScreen,
    switchRole,
    currentUser,
    toggleDarkMode,
    isDarkMode,
    addToast
  } = useApp();

  const [query, setQuery] = useState('');

  // Handle hotkey Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      } else if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const navActions = [
    { label: 'Dashboard', screen: 'dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { label: 'Mark Attendance', screen: 'mark_attendance', icon: CheckSquare, category: 'Quick Action', roles: ['faculty'] },
    { label: 'Students Roster', screen: 'students', icon: GraduationCap, category: 'Management', roles: ['admin', 'hod'] },
    { label: 'Faculty Directory', screen: 'faculty', icon: Users, category: 'Management', roles: ['admin', 'hod'] },
    { label: 'Timetable Builder / Schedule', screen: 'timetable', icon: Calendar, category: 'Navigation' },
    { label: 'Attendance Reports & Analytics', screen: 'reports', icon: FileSpreadsheet, category: 'Reports' },
    { label: 'Leave Applications', screen: 'leaves', icon: FileText, category: 'Navigation' },
    { label: 'Audit Logs Viewer', screen: 'audit_logs', icon: ShieldAlert, category: 'Admin', roles: ['admin'] },
    { label: 'Database Backup & Restore', screen: 'db_backup', icon: Database, category: 'Admin', roles: ['admin'] }
  ];

  const roleActions: { label: string; role: UserRole }[] = [
    { label: 'Switch to Admin Role', role: 'admin' },
    { label: 'Switch to Faculty Role', role: 'faculty' },
    { label: 'Switch to HOD Role', role: 'hod' },
    { label: 'Switch to Student Role', role: 'student' }
  ];

  const filteredNav = navActions.filter((item) => {
    if (item.roles && !item.roles.includes(currentUser.role)) return false;
    return item.label.toLowerCase().includes(query.toLowerCase());
  });

  const filteredRoles = roleActions.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelectNav = (screen: string) => {
    setActiveScreen(screen);
    setCommandPaletteOpen(false);
    setQuery('');
  };

  const handleSelectRole = (role: UserRole) => {
    switchRole(role);
    setCommandPaletteOpen(false);
    setQuery('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setCommandPaletteOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="relative w-full max-w-xl bg-white dark:bg-[#21284C] border border-zinc-200 dark:border-[#2D376A] rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Input field */}
          <div className="flex items-center px-4 py-3.5 border-b border-zinc-200 dark:border-[#2D376A]">
            <Search className="w-5 h-5 text-[#313866] dark:text-[#8A92D0] mr-3 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command, screen name, or role..."
              className="w-full bg-transparent text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold text-zinc-500 bg-zinc-100 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-md">
              ESC
            </kbd>
          </div>

          {/* List items */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-3">
            {/* Quick Toggle Theme */}
            <div className="px-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Theme Toggle</p>
              <button
                onClick={() => {
                  toggleDarkMode();
                  setCommandPaletteOpen(false);
                  addToast('Theme Toggled', `Switched to ${!isDarkMode ? 'Dark' : 'Light'} mode`, 'info');
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-[#F3F4F9] dark:hover:bg-[#313866]/40 hover:text-[#313866] dark:hover:text-[#8A92D0] rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                  <span>Switch to {isDarkMode ? 'Light' : 'Dark'} Mode</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>

            {/* Screens & Actions */}
            {filteredNav.length > 0 && (
              <div className="px-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Screens & Tools</p>
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.screen}
                      onClick={() => handleSelectNav(item.screen)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-[#F3F4F9] dark:hover:bg-[#313866]/40 hover:text-[#313866] dark:hover:text-[#8A92D0] rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0 text-zinc-500" />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-[#161B33] px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Roles switch */}
            {filteredRoles.length > 0 && (
              <div className="px-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Switch Role Demo</p>
                {filteredRoles.map((item) => (
                  <button
                    key={item.role}
                    onClick={() => handleSelectRole(item.role)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-[#F3F4F9] dark:hover:bg-[#313866]/40 hover:text-[#313866] dark:hover:text-[#8A92D0] rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="w-4 h-4 text-[#313866] dark:text-[#8A92D0] shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {currentUser.role === item.role && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
