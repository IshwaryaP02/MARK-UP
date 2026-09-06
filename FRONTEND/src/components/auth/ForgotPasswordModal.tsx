import React, { useState } from 'react';
import { X, AlertTriangle, User, Lock, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'check' | 'reset' | 'done';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<Step>('check');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('check');
    setUsername('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  const handleCheckReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await apiClient.checkResetStatus(username.trim());
      if (res.resetEnabled) {
        setStep('reset');
      } else {
        setError('Password reset is not enabled for this username. Please contact your administrator to enable it first.');
      }
    } catch {
      setError('Username not found. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await apiClient.resetPassword(username.trim(), newPassword);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#161B33] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-base font-bold text-white">Forgot Password</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {step === 'check' && 'Enter your username to check reset status'}
              {step === 'reset' && 'Set your new password'}
              {step === 'done' && 'Password reset complete'}
            </p>
          </div>
          <button onClick={handleClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Check if admin enabled reset */}
          {step === 'check' && (
            <>
              {/* Info notice */}
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 mb-5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-300">Admin approval required</p>
                  <p className="text-[11px] text-amber-400/70 mt-1 leading-relaxed">
                    Your administrator must enable password reset for your account before you can proceed.
                    Contact them first, then come back here.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCheckReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">
                    Your Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setError(''); }}
                      placeholder="Enter your username"
                      className="w-full pl-10 pr-4 py-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#8A92D0]/40 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#313866] hover:bg-[#8A92D0] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check Reset Status'}
                </button>
              </form>
            </>
          )}

          {/* Step 2: Set new password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2.5">
                ✓ Reset enabled for <span className="font-bold">{username}</span>. Choose a new password below.
              </p>

              {/* New password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-10 py-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#8A92D0]/40 transition-all"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-10 py-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#8A92D0]/40 transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#313866] hover:bg-[#8A92D0] disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Password Reset!</h3>
              <p className="text-sm text-zinc-400 mb-6">
                Your password has been updated. You can now log in with your new password.
              </p>
              <button
                onClick={handleClose}
                className="w-full py-3 bg-[#313866] hover:bg-[#8A92D0] text-white text-sm font-bold rounded-xl transition-all"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
