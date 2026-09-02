import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { BackButton } from '../common/BackButton';
import { Search, Shield, UserCheck, KeyRound, Power, Clock, Users, GraduationCap } from 'lucide-react';
import { academicYearLabel } from '../../services/academicStructure';

export const UserAccounts: React.FC = () => {
  const { users, students, addToast } = useApp();
  const [userList, setUserList] = useState<User[]>(users);
  const [searchTerm, setSearchTerm] = useState('');

  // Student Search (quick lookup of a student account)
  const [studentQuery, setStudentQuery] = useState('');
  const filteredStudents = students.filter(
    (s) => {
      const q = studentQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.regNo.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
      );
    }
  );

  const lookupStudentAccount = (regNo: string) => {
    const account = userList.find((u) => u.role === 'student' && (u.regNo === regNo || u.email?.includes(regNo)));
    if (account) {
      setSearchTerm(account.name);
      addToast('Student Account Found', `${account.name} (${regNo}) located in the accounts table below`, 'success');
    } else {
      addToast('No Linked Login Found', `${regNo} has a student record but no separate login account issue detected`, 'info');
    }
  };

  const toggleUserActive = (id: string) => {
    setUserList((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const active = !u.active;
          addToast('Account Status Changed', `${u.name} marked as ${active ? 'Active' : 'Inactive'}`, active ? 'success' : 'warning');
          return { ...u, active };
        }
        return u;
      })
    );
  };

  const resetUserPassword = (userName: string) => {
    addToast('Password Reset Link Sent', `Temporary password sent to ${userName}`, 'info');
  };

  const filtered = userList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            User Accounts & Authentication Governance
          </h2>

        </div>
      </div>

      {/* Student Search */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#1E40AF] dark:text-[#3B82F6]" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Student Search</h3>
          <span className="text-[10px] text-zinc-400 font-semibold">
            Quickly find a student account to identify & resolve account-related issues
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <GraduationCap className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setStudentQuery((e.target as HTMLInputElement).value);
              }}
              placeholder="Search student by name, Reg No, Roll No, or email..."
              className="w-full pl-10 pr-3 py-2 text-xs bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-[#232326] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
            />
          </div>
          <button
            onClick={() => setStudentQuery(studentQuery)}
            className="px-4 py-2 text-xs font-bold text-white bg-[#1E40AF] dark:bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#2563EB] rounded-xl transition-colors shrink-0"
          >
            Enter
          </button>
          <button
            onClick={() => setStudentQuery('')}
            className="px-3.5 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-[#232326]"
          >
            Clear
          </button>
        </div>

        <div className="overflow-x-auto border border-zinc-200 dark:border-[#232326] rounded-xl max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-[#0A0A0A]/80 border-b border-zinc-200 dark:border-[#232326] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px] sticky top-0 z-10">
              <tr>
                <th className="p-2.5 pl-3">Student</th>
                <th className="p-2.5">Reg No / Roll</th>
                <th className="p-2.5">Class</th>
                <th className="p-2.5">Attendance</th>
                <th className="p-2.5 text-right pr-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-5 text-center text-zinc-400">
                    No students match the search.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const account = userList.find((u) => u.role === 'student' && (u.regNo === s.regNo || u.email === s.email));
                  return (
                    <tr key={s.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="p-2.5 pl-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={s.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100'}
                            alt={s.name}
                            className="w-7 h-7 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                          />
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{s.name}</span>
                            <span className="text-[10px] text-zinc-400">{s.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <span className="font-mono font-bold text-[#1E40AF] dark:text-[#3B82F6] block">{s.regNo}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">Roll: {s.rollNo}</span>
                      </td>
                      <td className="p-2.5 text-zinc-600 dark:text-zinc-300">
                        {academicYearLabel(s.semester)}
                      </td>
                      <td className="p-2.5">
                        <span className={`font-bold ${s.overallAttendancePct < 75 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {s.overallAttendancePct}%
                        </span>
                      </td>
                      <td className="p-2.5 text-right pr-3">
                        <button
                          onClick={() => lookupStudentAccount(s.regNo)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#1E40AF] dark:text-[#3B82F6] hover:bg-[#1E40AF]/10 rounded-lg border border-[#1E40AF]/20 dark:border-[#3B82F6]/30 transition-colors flex items-center gap-1 ml-auto"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Check Account
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSearchTerm((e.target as HTMLInputElement).value);
            }}
            placeholder="Filter accounts by name, email, or role..."
            className="w-full pl-10 pr-3 py-2 text-xs bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-[#232326] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
          />
        </div>
        <button
          onClick={() => setSearchTerm(searchTerm)}
          className="px-4 py-2 text-xs font-bold text-white bg-[#1E40AF] dark:bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#2563EB] rounded-xl transition-colors shrink-0"
        >
          Enter
        </button>
      </div>

      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-[#0A0A0A]/80 border-b border-zinc-200 dark:border-[#232326] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3.5 pl-4">Account User</th>
              <th className="p-3.5">Assigned Role</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Last Active Login</th>
              <th className="p-3.5 text-right pr-4">Security Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                <td className="p-3.5 pl-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={u.name}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                    />
                    <div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{u.name}</span>
                      <span className="text-[10px] text-zinc-400">{u.email}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#1E40AF]/10 text-[#1E40AF] dark:bg-[#2563EB]/50 dark:text-[#3B82F6] rounded-md">
                    {u.role}
                  </span>
                </td>
                <td className="p-3.5">
                  <StatusBadge status={u.active ? 'active' : 'inactive'} size="sm" />
                </td>
                <td className="p-3.5 font-mono text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {u.lastLogin || 'Never'}
                  </span>
                </td>
                <td className="p-3.5 text-right pr-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => resetUserPassword(u.name)}
                      className="p-1.5 text-zinc-500 hover:text-[#1E40AF] dark:hover:text-[#3B82F6] hover:bg-[#1E40AF]/10 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                      title="Reset Password"
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Reset Pass
                    </button>
                    <button
                      onClick={() => toggleUserActive(u.id)}
                      className={`p-1.5 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 ${
                        u.active
                          ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                          : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" /> {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
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
