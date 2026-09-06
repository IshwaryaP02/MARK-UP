import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import './login.css';

const ROLES: Record<UserRole, { label: string; placeholder: string; autocomplete: string; pattern: RegExp; error: string }> = {
  admin: { label: 'Username :', placeholder: 'Enter your username', autocomplete: 'username', pattern: /^[a-zA-Z0-9._-]{3,32}$/, error: 'Enter a valid username (3-32 characters).' },
  hod: { label: 'Employee ID :', placeholder: 'Enter your employee ID', autocomplete: 'username', pattern: /^[a-zA-Z0-9-]{3,20}$/, error: 'Enter a valid employee ID.' },
  faculty: { label: 'Employee ID :', placeholder: 'Enter your employee ID', autocomplete: 'username', pattern: /^[a-zA-Z0-9-]{3,20}$/, error: 'Enter a valid employee ID.' },
  student: { label: 'Register Number :', placeholder: 'Enter your register number', autocomplete: 'username', pattern: /^[a-zA-Z0-9]{5,20}$/, error: 'Enter a valid register number.' },
};

const REMEMBER_KEY = 'college-login-remember';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0D1127] via-[#161B33] to-[#0D1127] p-4 relative overflow-hidden">

      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#313866]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8A92D0]/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#313866] to-[#8A92D0] flex items-center justify-center font-black text-2xl text-white shadow-2xl mx-auto mb-4">
            SA
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Smart Attendance
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            College Portal — Secure Sign In
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 mb-6">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2 tracking-wide uppercase">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-username"
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  placeholder="e.g. 22CS001 / GFCSE01 / ADISHWARYAP"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#8A92D0]/50 focus:border-[#8A92D0]/50 transition-all"
                />
              </div>
              <p className="text-[10px] text-zinc-600 mt-1.5 pl-1">
                Students: Reg. No. &nbsp;|&nbsp; Faculty/HOD: Employee ID &nbsp;|&nbsp; Admin: Your username
              </p>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-300 tracking-wide uppercase">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-[11px] text-[#8A92D0] hover:text-white transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#8A92D0]/50 focus:border-[#8A92D0]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#313866] to-[#8A92D0] hover:from-[#8A92D0] hover:to-[#313866] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#313866]/30 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Info footer */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Default password is your <span className="text-zinc-400">username</span>.<br />
              Contact your administrator if you cannot log in.
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-700 mt-6">
          Authorized access only · {new Date().getFullYear()}
        </p>
      </div>

      <ForgotPasswordModal isOpen={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
};
