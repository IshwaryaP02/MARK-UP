import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../common/StatusBadge';
import {
  Search, KeyRound, Power, Clock, User as UserIcon,
  ShieldCheck, ShieldOff, Lock, RefreshCw, Loader2,
  BadgeCheck, AlertTriangle, ChevronDown, X
} from 'lucide-react';

interface UserRow {
  id: string;
  username: string | null;
  name: string;
  email: string | null;
  role: string;
  active: boolean;
  lastLogin: string | null;
  passwordResetEnabled: boolean;
  hasSetPassword: boolean;
  regNo?: string | null;
  employeeId?: string | null;
}

type ActionModal =
  | { type: 'set-password'; user: UserRow }
  | { type: 'enable-reset'; user: UserRow }
  | null;

export const UserAccounts: React.FC = () => {
  const { addToast, currentUser } = useApp();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [modal, setModal] = useState<ActionModal>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // userId being acted on

  // For set-password modal
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.users();
      setUsers(
        data.map((u: any) => ({
          id: u.id,
          username: u.username,
          name: u.name,
          email: u.email,
          role: u.role,
          active: u.active,
          lastLogin: u.lastLogin,
          passwordResetEnabled: u.passwordResetEnabled ?? false,
          hasSetPassword: u.hasSetPassword ?? false,
          regNo: u.regNo,
          employeeId: u.employeeId,
        }))
      );
    } catch {
      addToast('Error', 'Failed to load users', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.regNo || '').toLowerCase().includes(q) ||
      (u.employeeId || '').toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Toggle active / inactive
  const handleToggleActive = async (user: UserRow) => {
    setActionLoading(user.id + '-toggle');
    try {
      const res = await apiClient.adminToggleActive(user.id);
      setUsers((prev) =>
        prev.map((u) => u.id === user.id ? { ...u, active: res.isActive } : u)
      );
      addToast(
        res.isActive ? 'Account Activated' : 'Account Deactivated',
        `${user.name} (${user.username}) is now ${res.isActive ? 'active' : 'inactive'}`,
        res.isActive ? 'success' : 'warning'
      );
    } catch (err) {
      addToast('Error', err instanceof Error ? err.message : 'Action failed', 'danger');
    } finally {
      setActionLoading(null);
    }
  };

  // Enable / disable reset
  const handleToggleReset = async (user: UserRow) => {
    const enable = !user.passwordResetEnabled;
    setActionLoading(user.id + '-reset');
    try {
      await apiClient.adminEnableReset(user.id, enable);
      setUsers((prev) =>
        prev.map((u) => u.id === user.id ? { ...u, passwordResetEnabled: enable } : u)
      );
      addToast(
        enable ? 'Reset Enabled' : 'Reset Disabled',
        `Password reset ${enable ? 'enabled' : 'disabled'} for ${user.username}`,
        enable ? 'info' : 'warning'
      );
    } catch (err) {
      addToast('Error', err instanceof Error ? err.message : 'Action failed', 'danger');
    } finally {
      setActionLoading(null);
    }
  };

  // Set password directly
  const handleSetPassword = async () => {
    if (!modal || modal.type !== 'set-password') return;
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    if (newPw.length < 6) { setPwError('Minimum 6 characters required.'); return; }
    setPwError('');
    setActionLoading(modal.user.id + '-setpw');
    try {
      await apiClient.adminSetPassword(modal.user.id, newPw);
      addToast('Password Set', `Password updated for ${modal.user.username}`, 'success');
      setModal(null);
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case 'hod': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'faculty': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'student': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  const formatLoginTime = (ts: string | null) => {
    if (!ts) return 'Never';
    try {
      return new Date(ts).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    } catch { return ts; }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#313866] dark:text-[#8A92D0]" />
            User Access & Password Management
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Activate / deactivate accounts · Set passwords · Enable forgot-password reset per user
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#313866] dark:hover:text-[#8A92D0] border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Username format legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { role: 'Student', fmt: 'Reg. No. (22CS001)', color: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400' },
          { role: 'Faculty', fmt: 'Employee ID (GFCSE01)', color: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-400' },
          { role: 'HOD', fmt: 'Employee ID (GHCSE1)', color: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-400' },
          { role: 'Admin', fmt: 'ADISHWARYAP / ADRICHERD', color: 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-400' },
        ].map((item) => (
          <div key={item.role} className={`border rounded-xl px-3 py-2 ${item.color}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{item.role} Login</p>
            <p className="text-[11px] font-mono font-semibold mt-0.5">{item.fmt}</p>
            <p className="text-[10px] opacity-50 mt-0.5">Default pw = username</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, username, ID, email..."
            className="w-full pl-10 pr-3 py-2.5 text-xs bg-white dark:bg-[#21284C] border border-zinc-200 dark:border-[#2D376A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#313866]/40"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 text-xs bg-white dark:bg-[#21284C] border border-zinc-200 dark:border-[#2D376A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#313866]/40 text-zinc-700 dark:text-zinc-300"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="hod">HOD</option>
          <option value="faculty">Faculty</option>
          <option value="student">Student</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin text-[#313866]" />
            <span className="text-sm">Loading users…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-sm">
            No users found matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-[#161B33]/80 border-b border-zinc-200 dark:border-[#2D376A] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-4 min-w-[180px]">User</th>
                  <th className="p-3.5 min-w-[120px]">Username</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Password</th>
                  <th className="p-3.5 min-w-[120px]">Last Login</th>
                  <th className="p-3.5 text-right pr-4 min-w-[260px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors">
                    {/* User info */}
                    <td className="p-3.5 pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#313866] to-[#8A92D0] flex items-center justify-center text-white font-bold text-[11px] shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">{u.name}</span>
                          <span className="text-[10px] text-zinc-400">{u.email || '—'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="p-3.5">
                      <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-zinc-700 dark:text-zinc-300">
                        {u.username || <span className="text-zinc-400 italic">not set</span>}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${roleBadgeColor(u.role)}`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <StatusBadge status={u.active ? 'active' : 'inactive'} size="sm" />
                    </td>

                    {/* Password status */}
                    <td className="p-3.5">
                      <div className="flex flex-col gap-1">
                        <span className={`flex items-center gap-1 text-[10px] font-semibold ${u.hasSetPassword ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {u.hasSetPassword
                            ? <><BadgeCheck className="w-3 h-3" /> Custom set</>
                            : <><AlertTriangle className="w-3 h-3" /> Default (= username)</>
                          }
                        </span>
                        {u.passwordResetEnabled && (
                          <span className="flex items-center gap-1 text-[10px] text-blue-500 font-semibold">
                            <ShieldOff className="w-3 h-3" /> Reset enabled
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Last login */}
                    <td className="p-3.5 font-mono text-[11px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                        {formatLoginTime(u.lastLogin)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 pr-4">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">

                        {/* Enable / Disable reset */}
                        <button
                          onClick={() => handleToggleReset(u)}
                          disabled={actionLoading === u.id + '-reset'}
                          title={u.passwordResetEnabled ? 'Disable reset (user has already reset)' : 'Allow this user to reset forgot password'}
                          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            u.passwordResetEnabled
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {actionLoading === u.id + '-reset'
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : u.passwordResetEnabled
                              ? <><ShieldOff className="w-3 h-3" /> Disable Reset</>
                              : <><ShieldCheck className="w-3 h-3" /> Enable Reset</>
                          }
                        </button>

                        {/* Set password directly */}
                        <button
                          onClick={() => { setModal({ type: 'set-password', user: u }); setNewPw(''); setConfirmPw(''); setPwError(''); }}
                          title="Set a new password for this user (admin override)"
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-all"
                        >
                          <Lock className="w-3 h-3" /> Set Password
                        </button>

                        {/* Activate / Deactivate */}
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={actionLoading === u.id + '-toggle' || u.id === currentUser.id}
                          title={u.id === currentUser.id ? "Can't deactivate yourself" : u.active ? 'Deactivate account' : 'Activate account'}
                          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            u.id === currentUser.id
                              ? 'opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                              : u.active
                                ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/40'
                                : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40'
                          }`}
                        >
                          {actionLoading === u.id + '-toggle'
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <><Power className="w-3 h-3" /> {u.active ? 'Deactivate' : 'Activate'}</>
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count */}
      {!isLoading && (
        <p className="text-[11px] text-zinc-400 text-right">
          Showing {filtered.length} of {users.length} users
        </p>
      )}

      {/* Set Password Modal */}
      {modal?.type === 'set-password' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-white/5">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Set Password</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  For: <span className="font-mono font-semibold">{modal.user.username}</span> ({modal.user.name})
                </p>
              </div>
              <button onClick={() => setModal(null)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <input
                type="password"
                value={newPw}
                onChange={(e) => { setNewPw(e.target.value); setPwError(''); }}
                placeholder="New password (min. 6 chars)"
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#313866]/40"
              />
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => { setConfirmPw(e.target.value); setPwError(''); }}
                placeholder="Confirm password"
                className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#313866]/40"
              />
              {pwError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg px-3 py-2">
                  {pwError}
                </p>
              )}
              <p className="text-[10px] text-zinc-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/20 rounded-lg px-3 py-2">
                ⚠ The user will need to change this password on next login for security.
              </p>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setModal(null)} className="flex-1 py-2.5 text-xs font-semibold bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 rounded-xl transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleSetPassword}
                  disabled={actionLoading?.includes('-setpw')}
                  className="flex-1 py-2.5 text-xs font-bold bg-[#313866] hover:bg-[#8A92D0] disabled:opacity-60 text-white rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  {actionLoading?.includes('-setpw')
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <><Lock className="w-3.5 h-3.5" /> Set Password</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
