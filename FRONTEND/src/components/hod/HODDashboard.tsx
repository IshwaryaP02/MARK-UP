import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import {
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Repeat,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Eye,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const HODDashboard: React.FC = () => {
  const { currentUser, leaveRequests, substitutionRequests, setActiveScreen } = useApp();

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending_hod');
  const pendingSubs = substitutionRequests.filter((s) => s.status === 'pending');

  const chartData = [
    { day: 'Mon', attendance: 91 },
    { day: 'Tue', attendance: 88 },
    { day: 'Wed', attendance: 94 },
    { day: 'Thu', attendance: 89 },
    { day: 'Fri', attendance: 92 },
    { day: 'Sat', attendance: 85 }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#161B33] dark:bg-[#0D1127] border border-[#313866] rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-[#313866] text-white text-[10px] font-bold uppercase tracking-wider rounded-full mb-2 inline-block">
            Department Leadership Portal (HOD)
          </span>
          <h2 className="text-xl font-bold tracking-tight">Welcome, {currentUser.name}</h2>
          <p className="text-xs opacity-90 mt-1">
            Head of Department · {currentUser.departmentName || 'Computer Science & Engineering'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveScreen('hod_all_classes')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#8A92D0] text-[#0D1127] hover:bg-white text-xs font-bold rounded-2xl transition-all shadow-lg"
          >
            <Eye className="w-4 h-4 text-[#0D1127]" />
            Inspect All Classes
          </button>
          <button
            onClick={() => setActiveScreen('hod_substitutions')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#313866] text-white hover:bg-[#161B33] text-xs font-bold rounded-2xl transition-all shadow-lg"
          >
            <Repeat className="w-4 h-4 text-[#8A92D0]" />
            {pendingSubs.length} Substitutions Pending
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Dept Attendance Rate" value="89.4%" icon={ShieldCheck} subtitle="Target: 85% Minimum" color="periwinkle" />
        <StatCard title="Faculty Compliance" value="98.2%" icon={CheckCircle2} subtitle="On-time Period Marking" color="periwinkle" />
        <StatCard title="Pending Substitutions" value={pendingSubs.length} icon={Repeat} subtitle="HOD Approval Queue" color="periwinkle" />
        <StatCard title="Pending Leave Approvals" value={pendingLeaves.length} icon={FileText} subtitle="Final Approval Queue" color="periwinkle" />
      </div>

      {/* Department Attendance Trend */}
      <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#313866] dark:text-[#8A92D0]" /> Department Daily Attendance Trend
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Weekly average student attendance percentages</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="hodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#313866" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#313866" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
              <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} />
              <YAxis domain={[70, 100]} stroke="#9CA3AF" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#161B33',
                  borderColor: '#313866',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#FFFFFF'
                }}
              />
              <Area type="monotone" dataKey="attendance" stroke="#8A92D0" strokeWidth={3} fillOpacity={1} fill="url(#hodGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
