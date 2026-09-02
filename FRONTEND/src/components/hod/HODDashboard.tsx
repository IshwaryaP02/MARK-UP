import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { DepartmentDailyAttendanceTrend } from './DepartmentDailyAttendanceTrend';
import {
  Users,
  CheckCircle2,
  FileText,
  Repeat,
  ShieldCheck,
  Eye,
  UserCheck,
  AlertTriangle,
  LogIn,
  LogOut
} from 'lucide-react';

export const HODDashboard: React.FC = () => {
  const { currentUser, leaveRequests, substitutionRequests, setActiveScreen, facultyList } = useApp();

  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending_hod');
  const pendingSubs = substitutionRequests.filter((s) => s.status === 'pending');

  const deptFaculty = facultyList.filter(
    (f) => f.departmentId === (currentUser.departmentId || 'dept-cs')
  );

  const isSubstituteAssigned = (facId: string) =>
    substitutionRequests.some(
      (s) =>
        s.requestingFacultyId === facId &&
        (s.status === 'accepted' || s.status === 'approved_by_hod')
    );

  const getFacultyAttendance = () => {
    return deptFaculty.map((fac, idx) => {
      const isPresent = idx % 3 !== 2;
      const loginTime = isPresent
        ? `09:${String(50 + idx * 3).padStart(2, '0')} AM`
        : '--';
      const logoutTime = isPresent
        ? `04:${String(10 + idx * 5).padStart(2, '0')} PM`
        : '--';
      return {
        ...fac,
        isPresent,
        loginTime,
        logoutTime
      };
    });
  };

  const facultyAttendance = getFacultyAttendance();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#1E40AF] rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-[#1E40AF] text-white text-[10px] font-bold uppercase tracking-wider rounded-full mb-2 inline-block">
            Department Leadership Portal (HOD)
          </span>
          <h2 className="text-xl font-bold tracking-tight">HOD Dashboard</h2>
          <p className="text-xs opacity-90 mt-1">
            Head of Department · {currentUser.departmentName || 'Computer Science'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveScreen('hod_all_classes')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#1E40AF] text-[#111827] hover:bg-white text-xs font-bold rounded-2xl transition-all shadow-lg"
          >
            <Eye className="w-4 h-4 text-[#111827]" />
            Inspect All Classes
          </button>
          <button
            onClick={() => setActiveScreen('hod_substitutions')}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#1E40AF] text-white hover:bg-[#FFFFFF] text-xs font-bold rounded-2xl transition-all shadow-lg"
          >
            <Repeat className="w-4 h-4 text-[#1E40AF]" />
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

      {/* Department Daily Attendance Trend (weekly) */}
      <DepartmentDailyAttendanceTrend />

      {/* Faculty Attendance Table */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm space-y-0">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" /> Faculty Attendance
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Today's login status and substitution assignment</p>
          </div>
          <button
            onClick={() => setActiveScreen('hod_substitutions')}
            className="text-xs font-bold text-[#1E40AF] dark:text-[#3B82F6] hover:underline"
          >
            View All Substitutions
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-4">Faculty Name</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Login Time</th>
                <th className="p-3.5">Logout Time</th>
                <th className="p-3.5 text-right pr-4">Substitution Faculty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {facultyAttendance.map((fac) => (
                <tr key={fac.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-3.5 pl-4 font-bold text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-2">
                      <img
                        src={fac.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                        alt={fac.name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                      <div>
                        <span>{fac.name}</span>
                        <span className="block text-[10px] font-mono text-[#1E40AF] dark:text-[#3B82F6]">{fac.employeeId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      fac.isPresent
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                    }`}>
                      {fac.isPresent ? (
                        <><CheckCircle2 className="w-3 h-3" /> Present</>
                      ) : (
                        <><AlertTriangle className="w-3 h-3" /> Absent</>
                      )}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-zinc-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <LogIn className="w-3 h-3 text-emerald-500" />
                      {fac.loginTime}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-zinc-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <LogOut className="w-3 h-3 text-rose-500" />
                      {fac.logoutTime}
                    </span>
                  </td>
                  <td className="p-3.5 text-right pr-4">
                    {fac.isPresent ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl text-[11px] font-bold text-[#1E40AF] dark:text-[#3B82F6]">
                        <CheckCircle2 className="w-3 h-3" /> Assigned · {fac.name}
                      </span>
                    ) : isSubstituteAssigned(fac.id) ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Assigned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                        <AlertTriangle className="w-3 h-3" /> Not Assigned
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
