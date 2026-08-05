import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Search, Shield, UserCheck, KeyRound, Power, Clock } from 'lucide-react';

export const UserAccounts: React.FC = () => {
  const { users, addToast } = useApp();
  const [userList, setUserList] = useState<User[]>(users);
  const [searchTerm, setSearchTerm] = useState('');

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            User Accounts & Authentication Governance
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Activate, deactivate, reset passwords, and inspect authentication logs across all roles
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter accounts by name, email, or role..."
          className="w-full pl-10 pr-3 py-2 text-xs bg-white dark:bg-[#21284C] border border-zinc-200 dark:border-[#2D376A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#313866]"
        />
      </div>

      <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-[#161B33]/80 border-b border-zinc-200 dark:border-[#2D376A] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
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
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#313866]/10 text-[#313866] dark:bg-[#313866]/50 dark:text-[#8A92D0] rounded-md">
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
                      className="p-1.5 text-zinc-500 hover:text-[#313866] dark:hover:text-[#8A92D0] hover:bg-[#313866]/10 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
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
  );
};
