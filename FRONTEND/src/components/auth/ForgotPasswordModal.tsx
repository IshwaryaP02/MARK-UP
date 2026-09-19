import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Mail, KeyRound, CheckCircle2, ArrowRight, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

export const ForgotPasswordModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setStep(1);
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
        setStep(2);
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
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset Password"
      subtitle={
        step === 1
          ? 'Enter your username to check reset status'
          : step === 2
          ? 'Set your new password'
          : 'Password reset complete'
      }
      maxWidth="md"
    >
      {step === 1 && (
        <form onSubmit={handleCheckReset} className="space-y-4">
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Admin approval required</p>
              <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-1 leading-relaxed">
                Your administrator must enable password reset for your account before you can proceed.
                Contact them first, then come back here.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] dark:text-zinc-300 mb-1">
              Your Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="Enter your username"
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F9FC] dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2563EB] hover:bg-[#FFFFFF] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check Reset Status'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
            Reset enabled for <strong>{username}</strong>. Choose a new password below.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] dark:text-zinc-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
              <input
                type={showNew ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                placeholder="Min. 6 characters"
                className="w-full pl-9 pr-10 py-2 text-xs bg-[#F7F9FC] dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-2.5 text-[#64748B] hover:text-zinc-500">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] dark:text-zinc-300 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="Re-enter new password"
                className="w-full pl-9 pr-10 py-2 text-xs bg-[#F7F9FC] dark:bg-zinc-800 border border-[#E2E8F0] dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-2.5 text-[#64748B] hover:text-zinc-500">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <h3 className="text-sm font-bold text-[#1E293B] dark:text-zinc-100 mb-2">Password Reset!</h3>
          <p className="text-xs text-[#64748B] dark:text-zinc-400 mb-6">
            Your password has been updated. You can now log in with your new password.
          </p>
          <button
            onClick={handleClose}
            className="w-full py-2.5 bg-[#2563EB] hover:bg-[#FFFFFF] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            Back to Login
          </button>
        </div>
      )}
    </Modal>
  );
};