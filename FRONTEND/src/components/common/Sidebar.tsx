import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Building2,
  BookOpen,
  Calendar,
  CalendarDays,
  UserCheck,
  FileSpreadsheet,
  Database,
  ShieldAlert,
  Clock,
  FileText,
  Repeat,
  Search,
  Eye,
  Bell,
  PieChart,
  Send,
  CheckSquare
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentUser, activeScreen, setActiveScreen, leaveRequests, correctionRequests, substitutionRequests, facultyList } = useApp();

  const role = currentUser.role;

  const myFaculty = facultyList.find((f) => f.id === currentUser.id);
  const isTutor = !!myFaculty?.tutorFor;

  // Pending counts for badges
  const pendingLeaves = leaveRequests.filter((l) =>
    role === 'faculty' ? l.status === 'pending_faculty' : role === 'hod' ? l.status === 'pending_hod' : false
  ).length;

  const pendingCorrections = correctionRequests.filter((c) => c.status === 'pending').length;
  const pendingSubs = substitutionRequests.filter((s) => s.status === 'pending').length;

  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { group: 'Core', items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'students', label: 'Students Directory', icon: GraduationCap },
            { id: 'faculty', label: 'Faculty Directory', icon: Users },
            { id: 'departments', label: 'Departments', icon: Building2 },
            { id: 'subjects', label: 'Subjects & Curriculum', icon: BookOpen }
          ]},
          { group: 'Academic Engine', items: [
            { id: 'timetable_builder', label: 'Timetable Builder', icon: Calendar },
            { id: 'academic_calendar', label: 'Academic Calendar', icon: CalendarDays },
            { id: 'user_accounts', label: 'User Accounts', icon: UserCheck }
          ]},
          { group: 'Governance & Systems', items: [
            { id: 'reports_hub', label: 'Reports Hub', icon: FileSpreadsheet },
            { id: 'db_backup', label: 'Database Backup', icon: Database },
            { id: 'audit_logs', label: 'Audit Logs', icon: ShieldAlert }
          ]}
        ];

      case 'faculty':
        return [
          { group: '', items: [
            { id: 'dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
            { id: 'my_classes', label: 'My Classes', icon: BookOpen },
            { id: 'faculty_timetable', label: 'Today\'s Timetable', icon: Calendar },
            ...(isTutor ? [{ id: 'tutor_class_students', label: 'Tutor Class Students', icon: Eye }, { id: 'tutor_circular', label: 'Tutor Circular', icon: Send }] : [])
          ]},
          { group: 'Approvals & Tracking', items: [
            { id: 'leave_queue', label: 'Leave Requests', icon: FileText, badgeCount: pendingLeaves },
            { id: 'substitution', label: 'Substitution Queue', icon: Repeat, badgeCount: pendingSubs },
            { id: 'student_search', label: 'Student Search', icon: Search }
          ]}
        ];

      case 'student':
        return [
          { group: 'My Portal', items: [
            { id: 'dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
            { id: 'student_attendance', label: 'My Attendance & Heatmap', icon: PieChart },
            { id: 'student_apply_leave', label: 'Apply Leave', icon: FileText },
            { id: 'student_timetable', label: 'Timetable', icon: Calendar },
            { id: 'student_circulars', label: 'Circulars', icon: FileText }
          ]}
        ];

      case 'hod':
        return [
          { group: 'Department Overview', items: [
            { id: 'dashboard', label: 'HOD Dashboard', icon: LayoutDashboard },
            { id: 'hod_all_classes', label: 'All Classes View', icon: Eye },
            { id: 'hod_circulars', label: 'Circulars', icon: FileText }
          ]},
          { group: 'Department Approvals', items: [
            { id: 'hod_leaves', label: 'Approve Leaves', icon: FileText, badgeCount: pendingLeaves },
            { id: 'hod_substitutions', label: 'Approve Substitutions', icon: Repeat, badgeCount: pendingSubs },
            { id: 'hod_corrections', label: 'Approve Corrections', icon: CheckSquare, badgeCount: pendingCorrections }
          ]},
          { group: 'Analytics & Compliance', items: [
            { id: 'faculty_monitoring', label: 'Faculty Monitoring', icon: Clock },
            { id: 'reports_hub', label: 'Reports Hub (Flagged)', icon: FileSpreadsheet }
          ]}
        ];

      default:
        return [];
    }
  };

  const navGroups = getNavItems();

  return (
    <aside className="w-64 bg-white/95 dark:bg-[#161B33]/95 backdrop-blur-md border-r border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between shrink-0 hidden md:flex h-full overflow-hidden">
      <div className="p-4 space-y-5 overflow-y-auto">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            {group.group && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-3 mb-2">
                {group.group}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveScreen(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#313866] text-white dark:bg-[#8A92D0] dark:text-[#0D1127] shadow-md'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white dark:text-[#0D1127]' : 'text-zinc-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        isActive ? 'bg-white text-[#313866]' : 'bg-[#F3F4F9] dark:bg-[#0D1127] text-[#313866] dark:text-[#8A92D0]'
                      }`}>
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer preferences */}
      <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-1">
        <button
          onClick={() => setActiveScreen('notifications')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeScreen === 'notifications'
              ? 'bg-[#313866] text-white dark:bg-[#8A92D0] dark:text-[#0D1127]'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>
      </div>
    </aside>
  );
};
