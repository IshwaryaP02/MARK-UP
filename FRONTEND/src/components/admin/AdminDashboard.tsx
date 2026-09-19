import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import {
  GraduationCap,
  Users,
  Building2,
  BookOpen,
  CheckCircle,
  TrendingUp,
  Plus,
  Calendar,
  Database,
  ShieldAlert,
  FileSpreadsheet,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { students, facultyList, departments, subjects, attendanceRecords, setActiveScreen } = useApp();

  const presentStatuses = new Set(['present', 'late', 'od']);
  const attendanceEntries = attendanceRecords.flatMap((record) => record.entries);
  const attendancePct = attendanceEntries.length
    ? Math.round((attendanceEntries.filter((entry) => presentStatuses.has(entry.status)).length / attendanceEntries.length) * 100)
    : 0;
  const today = new Date().toISOString().slice(0, 10);
  const todayEntries = attendanceRecords.filter((record) => record.date === today).flatMap((record) => record.entries);
  const todayAttendancePct = todayEntries.length
    ? Math.round((todayEntries.filter((entry) => presentStatuses.has(entry.status)).length / todayEntries.length) * 100)
    : 0;
  const trendData = Array.from(new Set(attendanceRecords.map((record) => record.date))).sort().slice(-6).map((date) => {
    const entries = attendanceRecords.filter((record) => record.date === date).flatMap((record) => record.entries);
    return {
      day: new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
      attendancePct: entries.length ? Math.round((entries.filter((entry) => presentStatuses.has(entry.status)).length / entries.length) * 100) : 0,
      target: 85,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-zinc-100 tracking-tight">
            Institutional Admin Command Center
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveScreen('students')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
          <button
            onClick={() => setActiveScreen('reports_hub')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F7F9FC] dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[#0F172A] dark:text-zinc-200 text-xs font-semibold rounded-xl transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
            Reports Hub
          </button>
        </div>
      </div>

      {/* Metric Cards Grid - Clickable Navigation to Directory Views */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Students"
          value={students.length}
          icon={GraduationCap}
          change={`${students.length} loaded`}
          trend="neutral"
          subtitle="Click to view directory"
          color="periwinkle"
          onClick={() => setActiveScreen('students')}
        />
        <StatCard
          title="Faculty Staff"
          value={facultyList.length}
          icon={Users}
          change={`${facultyList.filter((faculty) => faculty.active).length} active`}
          trend="neutral"
          color="periwinkle"
          subtitle="Click to view directory"
          onClick={() => setActiveScreen('faculty')}
        />
        <StatCard
          title="Departments"
          value={departments.length}
          icon={Building2}
          subtitle="Click to view departments"
          color="periwinkle"
          onClick={() => setActiveScreen('departments')}
        />
        <StatCard
          title="Active Courses"
          value={subjects.length}
          icon={BookOpen}
          subtitle="Click to view subjects"
          color="periwinkle"
          onClick={() => setActiveScreen('subjects')}
        />
        <StatCard
          title="Today's Attendance"
          value={`${todayAttendancePct}%`}
          icon={CheckCircle}
          change={todayEntries.length ? `${todayEntries.length} entries` : 'No entries'}
          trend="neutral"
          color="periwinkle"
        />
        <StatCard
          title="Avg Attendance"
          value={`${attendancePct}%`}
          icon={TrendingUp}
          change={attendanceEntries.length ? 'Database average' : 'No entries'}
          trend="neutral"
          color="periwinkle"
        />
      </div>

      {/* Charts & Department Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/90 dark:border-zinc-800 rounded-[28px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-zinc-100">Weekly Attendance Trend</h3>
              <p className="text-xs text-[#000000] dark:text-[#64748B] dark:text-zinc-400">Campus-wide daily present percentage vs 85% target</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full">
              Avg {attendancePct}%
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#37415120" />
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} domain={[60, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#080C14', borderColor: '#2563EB', borderRadius: '16px', fontSize: '12px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="attendancePct" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#primaryGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Attendance Performance */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/90 dark:border-zinc-800 rounded-[28px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#0F172A] dark:text-zinc-100">Department Performance</h3>
              <button
                onClick={() => setActiveScreen('departments')}
                className="text-xs font-bold text-[#2563EB] dark:text-[#3B82F6] hover:underline flex items-center gap-1"
              >
                Manage <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  onClick={() => setActiveScreen('departments')}
                  className="cursor-pointer group p-1.5 rounded-xl hover:bg-[#F7F9FC] dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-[#1E293B] dark:text-zinc-200 group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] transition-colors">
                      {dept.name}
                    </span>
                    <span className="font-bold text-[#2563EB] dark:text-[#3B82F6]">{dept.avgAttendancePct}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#F7F9FC] dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        dept.avgAttendancePct >= 85
                          ? 'bg-emerald-500'
                          : dept.avgAttendancePct >= 75
                          ? 'bg-[#2563EB] dark:bg-[#2563EB]'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${dept.avgAttendancePct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#000000] dark:text-[#64748B] mt-0.5">{dept.studentCount} students · HOD: {dept.hodName}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-[#F7F9FC] dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-800 rounded-2xl text-xs text-[#2563EB] dark:text-[#3B82F6] font-semibold">
            <strong>System Health:</strong> All departments meeting academic compliance limits.
          </div>
        </div>
      </div>

      {/* Admin Quick Modules Grid */}
      <div>
        <h3 className="text-xs font-bold text-[#000000] dark:text-[#64748B] uppercase tracking-wider mb-3">Admin Quick Management</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { id: 'students', label: 'Students Roster', icon: GraduationCap, desc: 'Roster & Records' },
            { id: 'faculty', label: 'Faculty Roster', icon: Users, desc: 'Assign Courses' },
            { id: 'timetable_builder', label: 'Timetable Builder', icon: Calendar, desc: 'Schedule Matrix' },
            { id: 'academic_calendar', label: 'Academic Calendar', icon: Calendar, desc: 'Holidays & Exams' },
            { id: 'db_backup', label: 'DB Backups', icon: Database, desc: 'Snapshot & Restore' },
            { id: 'audit_logs', label: 'Audit Logs', icon: ShieldAlert, desc: 'Security Trail' }
          ].map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveScreen(mod.id)}
                className="p-3.5 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0]/80 dark:border-zinc-800 rounded-2xl hover:border-[#2563EB] dark:hover:border-[#3B82F6] hover:shadow-md transition-all text-left group"
              >
                <div className="p-2 bg-[#FFFFFF] dark:bg-[#0A0A0A] text-[#2563EB] dark:text-[#3B82F6] rounded-xl w-fit mb-2 group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[#0F172A] dark:text-zinc-100">{mod.label}</h4>
                <p className="text-[10px] text-[#000000] dark:text-[#64748B] mt-0.5">{mod.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
