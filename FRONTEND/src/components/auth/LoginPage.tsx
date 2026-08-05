import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, User, GraduationCap, Users, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { UserRole } from '../../types';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedRole);
  };

  const demoAccounts: { role: UserRole; name: string; email: string; icon: React.ElementType }[] = [
    { role: 'admin', name: 'Dr. Robert Vance (Admin)', email: 'admin@university.edu', icon: Shield },
    { role: 'hod', name: 'Dr. Alan Turing (HOD - CSE)', email: 'hod.cs@university.edu', icon: Users },
    { role: 'faculty', name: 'Prof. Sarah Jenkins (Faculty)', email: 'sarah.jenkins@university.edu', icon: User },
    { role: 'student', name: 'Alex Mercer (Student)', email: 'alex.mercer@student.edu', icon: GraduationCap }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-br from-[#313866]/10 via-transparent to-[#313866]/20">
      <div className="w-full max-w-md bg-white dark:bg-[#21284C] border border-zinc-200 dark:border-[#2D376A] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#313866] dark:bg-[#8A92D0] text-white dark:text-[#0D1127] flex items-center justify-center font-black text-xl shadow-lg mx-auto mb-3">
            SA
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Smart Attendance SaaS
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Enterprise Portal for University & Institutional Tracking
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100 dark:bg-[#161B33] rounded-2xl mb-6">
          {(['admin', 'hod', 'faculty', 'student'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                setSelectedRole(r);
                setEmail(`${r}@university.edu`);
              }}
              className={`py-2 text-[11px] font-bold uppercase rounded-xl transition-all ${
                selectedRole === r
                  ? 'bg-[#313866] text-white dark:bg-[#8A92D0] dark:text-[#0D1127] shadow-md'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Account Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email || `${selectedRole}@university.edu`}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-xs bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#313866] font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-[11px] font-medium text-[#313866] dark:text-[#8A92D0] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password || 'password123'}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-xs bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#313866]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-all shadow-md"
          >
            Sign In to {selectedRole.toUpperCase()} Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Switcher */}
        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#313866] dark:text-[#8A92D0]" />
            Quick Demo Auto-Login
          </p>
          <div className="space-y-2">
            {demoAccounts.map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.role}
                  onClick={() => {
                    login(acc.role);
                  }}
                  className="w-full flex items-center justify-between p-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-[#161B33] hover:bg-[#F3F4F9] dark:hover:bg-[#313866]/40 border border-zinc-200/80 dark:border-zinc-700/60 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-[#313866] dark:text-[#8A92D0] shrink-0" />
                    <span>{acc.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#313866] dark:text-[#8A92D0] uppercase">
                    Auto Login
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
};
